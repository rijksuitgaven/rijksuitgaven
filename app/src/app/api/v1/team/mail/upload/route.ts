/**
 * Admin API: Image Upload for Campaign Emails
 *
 * POST   /api/v1/team/mail/upload — Upload image + process with Sharp + DB insert
 * DELETE /api/v1/team/mail/upload?filename=xxx — Soft delete (set deleted_at)
 *
 * Uses `email-images` public bucket. Auto-creates bucket if missing.
 * Restricted to image MIME types, max 2MB.
 *
 * Processing pipeline (Sharp):
 * 1. Optimized version — max 1200px wide, JPEG quality 85, strip EXIF
 * 2. Thumbnail — 200×200 cover crop for media library grid
 */

import { NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'
import { isAdmin } from '@/app/api/_lib/admin'
import { createAdminClient } from '@/app/api/_lib/supabase-admin'
import { createClient } from '@/lib/supabase/server'

const BUCKET = 'email-images'
const MAX_SIZE = 2 * 1024 * 1024 // 2MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
const MAX_WIDTH = 960 // 2× retina for 480px email content area
const THUMB_SIZE = 200

function forbiddenResponse() {
  return NextResponse.json({ error: 'Geen toegang' }, { status: 403 })
}

async function ensureBucket(supabase: ReturnType<typeof createAdminClient>) {
  const { error } = await supabase.storage.createBucket(BUCKET, {
    public: true,
    fileSizeLimit: MAX_SIZE,
    allowedMimeTypes: ALLOWED_TYPES,
  })
  // Ignore "already exists" error
  if (error && !error.message?.includes('already exists')) {
    console.error('[Upload] Bucket creation error:', error)
  }
}

export async function POST(request: NextRequest) {
  if (!(await isAdmin())) return forbiddenResponse()

  const supabase = createAdminClient()
  await ensureBucket(supabase)

  const formData = await request.formData()
  const file = formData.get('file') as File | null

  if (!file) {
    return NextResponse.json({ error: 'Geen bestand geüpload' }, { status: 400 })
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'Alleen afbeeldingen (JPEG, PNG, GIF, WebP)' }, { status: 400 })
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'Bestand te groot (max 2MB)' }, { status: 400 })
  }

  // Read file buffer for Sharp processing
  const buffer = Buffer.from(await file.arrayBuffer())
  const baseName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

  try {
    // 1. Read metadata
    const metadata = await sharp(buffer).metadata()
    const originalWidth = metadata.width || 0
    const originalHeight = metadata.height || 0

    // 2. Generate optimized version — max 1200px wide, JPEG, strip EXIF
    let optimizedPipeline = sharp(buffer).rotate() // auto-orient from EXIF

    if (originalWidth > MAX_WIDTH) {
      optimizedPipeline = optimizedPipeline.resize(MAX_WIDTH, null, { withoutEnlargement: true })
    }

    const optimizedBuffer = await optimizedPipeline
      .jpeg({ quality: 85, mozjpeg: true })
      .toBuffer()

    // Get final dimensions after resize
    const optimizedMeta = await sharp(optimizedBuffer).metadata()
    const finalWidth = optimizedMeta.width || originalWidth
    const finalHeight = optimizedMeta.height || originalHeight

    // 3. Generate thumbnail — 200×200 cover crop
    const thumbBuffer = await sharp(buffer)
      .rotate()
      .resize(THUMB_SIZE, THUMB_SIZE, { fit: 'cover' })
      .jpeg({ quality: 80 })
      .toBuffer()

    // 4. Upload both to storage
    const optimizedName = `${baseName}.jpg`
    const thumbName = `${baseName}_thumb.jpg`

    const [optimizedUpload, thumbUpload] = await Promise.all([
      supabase.storage.from(BUCKET).upload(optimizedName, optimizedBuffer, {
        contentType: 'image/jpeg',
        upsert: false,
      }),
      supabase.storage.from(BUCKET).upload(thumbName, thumbBuffer, {
        contentType: 'image/jpeg',
        upsert: false,
      }),
    ])

    if (optimizedUpload.error) {
      console.error('[Upload] Optimized storage error:', optimizedUpload.error)
      return NextResponse.json({ error: 'Upload mislukt' }, { status: 500 })
    }

    if (thumbUpload.error) {
      console.error('[Upload] Thumbnail storage error:', thumbUpload.error)
      // Non-critical — continue without thumbnail
    }

    const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(optimizedName)
    const { data: { publicUrl: thumbUrl } } = supabase.storage.from(BUCKET).getPublicUrl(thumbName)

    // 5. Get current user ID for uploaded_by
    const userClient = await createClient()
    const { data: { session } } = await userClient.auth.getSession()
    const userId = session?.user?.id || null

    // 6. Insert row in email_media
    const { data: mediaRow, error: dbError } = await supabase
      .from('email_media')
      .insert({
        filename: optimizedName,
        original_name: file.name,
        mime_type: 'image/jpeg',
        size_bytes: optimizedBuffer.length,
        width: finalWidth,
        height: finalHeight,
        uploaded_by: userId,
      })
      .select('id')
      .single()

    if (dbError) {
      console.error('[Upload] DB insert error:', dbError)
      // Non-critical — image is uploaded but not tracked
    }

    return NextResponse.json({
      id: mediaRow?.id || null,
      url: publicUrl,
      thumbnailUrl: thumbUrl,
      filename: optimizedName,
      originalName: file.name,
      width: finalWidth,
      height: finalHeight,
      sizeBytes: optimizedBuffer.length,
    })
  } catch (err) {
    console.error('[Upload] Processing error:', err)
    return NextResponse.json({ error: 'Afbeelding verwerken mislukt' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  if (!(await isAdmin())) return forbiddenResponse()

  const filename = request.nextUrl.searchParams.get('filename')
  if (!filename) {
    return NextResponse.json({ error: 'Bestandsnaam ontbreekt' }, { status: 400 })
  }

  // Sanitize: only allow safe filenames
  if (!/^[\w.-]+$/.test(filename)) {
    return NextResponse.json({ error: 'Ongeldige bestandsnaam' }, { status: 400 })
  }

  const supabase = createAdminClient()

  // Soft delete: set deleted_at instead of removing from storage
  const { error: dbError } = await supabase
    .from('email_media')
    .update({ deleted_at: new Date().toISOString() })
    .eq('filename', filename)

  if (dbError) {
    console.error('[Upload] Soft delete error:', dbError)
    // Fall through — still return ok if the file doesn't have a DB row (legacy uploads)
  }

  return NextResponse.json({ ok: true })
}
