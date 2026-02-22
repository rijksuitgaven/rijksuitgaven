/**
 * Admin API: Image Upload for Campaign Emails
 *
 * POST   /api/v1/team/mail/upload — Upload image to Supabase Storage
 * DELETE /api/v1/team/mail/upload?filename=xxx — Delete image from storage
 *
 * Uses `email-images` public bucket. Auto-creates bucket if missing.
 * Restricted to image MIME types, max 2MB.
 */

import { NextRequest, NextResponse } from 'next/server'
import { isAdmin } from '@/app/api/_lib/admin'
import { createAdminClient } from '@/app/api/_lib/supabase-admin'

const BUCKET = 'email-images'
const MAX_SIZE = 2 * 1024 * 1024 // 2MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

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

  // Generate unique filename to prevent collisions
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(safeName, file, {
      contentType: file.type,
      upsert: false,
    })

  if (uploadError) {
    console.error('[Upload] Storage error:', uploadError)
    return NextResponse.json({ error: 'Upload mislukt' }, { status: 500 })
  }

  const { data: { publicUrl } } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(safeName)

  return NextResponse.json({
    url: publicUrl,
    filename: safeName,
  })
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
  const { error } = await supabase.storage
    .from(BUCKET)
    .remove([filename])

  if (error) {
    console.error('[Upload] Delete error:', error)
    return NextResponse.json({ error: 'Verwijderen mislukt' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
