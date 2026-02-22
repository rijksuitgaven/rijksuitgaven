/**
 * Auto-enrollment helper for email sequences.
 *
 * Called after a person is invited — enrolls them in all active sequences.
 * Uses unique constraint (sequence_id, person_id) so duplicates are silently skipped.
 */

import { createAdminClient } from '@/app/api/_lib/supabase-admin'

export async function autoEnrollInSequences(personId: string): Promise<void> {
  const supabase = createAdminClient()

  // Get all active sequences
  const { data: sequences, error } = await supabase
    .from('email_sequences')
    .select('id')
    .eq('status', 'active')

  if (error || !sequences || sequences.length === 0) return

  // Insert enrollments — unique constraint prevents duplicates
  const enrollments = sequences.map(seq => ({
    sequence_id: seq.id,
    person_id: personId,
    current_step: 0,
    status: 'active' as const,
  }))

  // Use upsert with onConflict to silently skip duplicates
  await supabase
    .from('email_sequence_enrollments')
    .upsert(enrollments, { onConflict: 'sequence_id,person_id', ignoreDuplicates: true })
}
