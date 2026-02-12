/**
 * Resend Audience Sync
 *
 * Syncs contacts to a Resend Audience for email broadcasts.
 * Graceful degradation: sync failures are logged but don't block operations.
 *
 * Required env vars:
 *   RESEND_API_KEY       — Resend API key
 *   RESEND_AUDIENCE_ID   — Resend Audience ID for contacts
 */

import { Resend } from 'resend'
import { createAdminClient } from './supabase-admin'

const RESEND_API_KEY = process.env.RESEND_API_KEY
const RESEND_AUDIENCE_ID = process.env.RESEND_AUDIENCE_ID

interface ContactRow {
  id: string
  email?: string
  first_name?: string | null
  last_name?: string | null
  resend_contact_id?: string | null
}

export async function syncContactToResend(
  action: 'create' | 'update' | 'delete',
  contact: ContactRow
): Promise<void> {
  if (!RESEND_API_KEY || !RESEND_AUDIENCE_ID) {
    console.warn('[Resend] Missing RESEND_API_KEY or RESEND_AUDIENCE_ID — skipping sync')
    return
  }

  const resend = new Resend(RESEND_API_KEY)

  if (action === 'create' && contact.email) {
    const { data, error } = await resend.contacts.create({
      audienceId: RESEND_AUDIENCE_ID,
      email: contact.email,
      firstName: contact.first_name || undefined,
      lastName: contact.last_name || undefined,
    })

    if (error) {
      console.error('[Resend] Create contact error:', error)
      return
    }

    // Store the Resend contact ID for future sync
    if (data?.id) {
      const supabase = createAdminClient()
      await supabase
        .from('contacts')
        .update({ resend_contact_id: data.id })
        .eq('id', contact.id)
    }
  }

  if (action === 'update' && contact.resend_contact_id) {
    const { error } = await resend.contacts.update({
      audienceId: RESEND_AUDIENCE_ID,
      id: contact.resend_contact_id,
      firstName: contact.first_name || undefined,
      lastName: contact.last_name || undefined,
    })

    if (error) {
      console.error('[Resend] Update contact error:', error)
    }
  }

  if (action === 'delete' && contact.resend_contact_id) {
    const { error } = await resend.contacts.remove({
      audienceId: RESEND_AUDIENCE_ID,
      id: contact.resend_contact_id,
    })

    if (error) {
      console.error('[Resend] Delete contact error:', error)
    }
  }
}
