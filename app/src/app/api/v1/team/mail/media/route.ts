/**
 * Admin API: Media Library for Campaign Emails
 *
 * GET /api/v1/team/mail/media — List all active media, newest first
 *   Optional: ?filenames=a.jpg,b.jpg — filter by specific filenames (for draft restoration)
 */

import { NextRequest, NextResponse } from 'next/server'
import { isAdmin } from '@/app/api/_lib/admin'
import { createAdminClient } from '@/app/api/_lib/supabase-admin'

const BUCKET = 'email-images'

export async function GET(request: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Geen toegang' }, { status: 403 })
  }

  const supabase = createAdminClient()
  const filenames = request.nextUrl.searchParams.get('filenames')

  let query = supabase
    .from('email_media')
    .select('id, filename, original_name, mime_type, size_bytes, width, height, alt_text, created_at')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (filenames) {
    const names = filenames.split(',').map(f => f.trim()).filter(Boolean)
    if (names.length > 0) {
      query = query.in('filename', names)
    }
  }

  const { data, error } = await query.limit(200)

  if (error) {
    console.error('[Media] List error:', error)
    return NextResponse.json({ error: 'Laden mislukt' }, { status: 500 })
  }

  // Build public URLs for each media item
  const media = (data || []).map(row => {
    const { data: { publicUrl: url } } = supabase.storage.from(BUCKET).getPublicUrl(row.filename)
    // Thumbnail filename: replace .jpg with _thumb.jpg
    const thumbFilename = row.filename.replace(/\.jpg$/, '_thumb.jpg')
    const { data: { publicUrl: thumbnailUrl } } = supabase.storage.from(BUCKET).getPublicUrl(thumbFilename)

    return {
      id: row.id,
      url,
      thumbnailUrl,
      filename: row.filename,
      originalName: row.original_name,
      width: row.width,
      height: row.height,
      sizeBytes: row.size_bytes,
      altText: row.alt_text,
      createdAt: row.created_at,
    }
  })

  return NextResponse.json({ media })
}
