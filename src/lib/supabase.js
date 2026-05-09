import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseKey)

// ─── MEMBERS ─────────────────────────────────────────────────────────────────

export async function getMembers() {
  const { data, error } = await supabase.from('members').select('*').order('name')
  if (error) throw error
  return data
}

export async function getMemberByName(name) {
  const { data, error } = await supabase
    .from('members')
    .select('*')
    .eq('name', name)
    .single()
  if (error) throw error
  return data
}

export async function verifyPin(memberId, pin) {
  const { data, error } = await supabase
    .from('members')
    .select('id')
    .eq('id', memberId)
    .eq('pin_hash', pin) // In productie: gebruik bcrypt hashing
    .single()
  if (error) return false
  return !!data
}

// ─── AVAILABILITY ─────────────────────────────────────────────────────────────

export async function getAvailability() {
  const { data, error } = await supabase
    .from('availability')
    .select('*, members(name)')
    .gte('expires_at', new Date().toISOString())
  if (error) throw error
  return data
}

export async function getAvailabilityIncludingExpired() {
  // Optie B: verlopen telt mee maar met waarschuwing
  const { data, error } = await supabase
    .from('availability')
    .select('*, members(name)')
  if (error) throw error
  return data
}

export async function saveAvailability(memberId, days) {
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 14)

  const { error } = await supabase
    .from('availability')
    .upsert({
      member_id: memberId,
      days: days,
      expires_at: expiresAt.toISOString(),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'member_id' })

  if (error) throw error
}

// ─── ACTIVITIES ───────────────────────────────────────────────────────────────

export async function getActivities() {
  const { data, error } = await supabase
    .from('activities')
    .select('*, confirmations(member_id, members(name))')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function createActivity({ title, location, bestDate, startTime, endTime, fromMemberId }) {
  const { data, error } = await supabase
    .from('activities')
    .insert({
      title,
      location,
      best_date: bestDate,
      start_time: startTime,
      end_time: endTime || null,
      from_member_id: fromMemberId,
      status: 'bevestigen',
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateActivity(id, updates) {
  const { data, error } = await supabase
    .from('activities')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteActivity(id) {
  const { error } = await supabase.from('activities').delete().eq('id', id)
  if (error) throw error
}

export async function archiveExpiredActivities() {
  // Activiteiten met datum in het verleden → status 'geweest'
  // Dit roep je aan bij het laden van de app
  const today = new Date().toISOString().split('T')[0]
  const { error } = await supabase
    .from('activities')
    .update({ status: 'geweest' })
    .in('status', ['gepland', 'bevestigen'])
    .lt('best_date', today)
  if (error) console.error('Archive error:', error)
}

// ─── CONFIRMATIONS ────────────────────────────────────────────────────────────

export async function confirmActivity(activityId, memberId) {
  const { error } = await supabase
    .from('confirmations')
    .upsert({ activity_id: activityId, member_id: memberId }, { onConflict: 'activity_id,member_id' })
  if (error) throw error

  // Check of iedereen bevestigd heeft → zet op 'gepland'
  const { data: members } = await supabase.from('members').select('id')
  const { data: confirmations } = await supabase
    .from('confirmations')
    .select('member_id')
    .eq('activity_id', activityId)

  if (members && confirmations && confirmations.length >= members.length) {
    await supabase
      .from('activities')
      .update({ status: 'gepland' })
      .eq('id', activityId)
  }
}

// ─── WISHLIST ─────────────────────────────────────────────────────────────────

export async function getWishlist() {
  const { data, error } = await supabase
    .from('wishlist')
    .select('*, wishlist_votes(member_id, members(name)), members(name)')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function addWishlistItem({ title, location, addedByMemberId }) {
  const { data, error } = await supabase
    .from('wishlist')
    .insert({ title, location, added_by_member_id: addedByMemberId })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function toggleWishlistVote(wishlistId, memberId) {
  // Check of vote al bestaat
  const { data: existing } = await supabase
    .from('wishlist_votes')
    .select('id')
    .eq('wishlist_id', wishlistId)
    .eq('member_id', memberId)
    .single()

  if (existing) {
    await supabase.from('wishlist_votes').delete().eq('id', existing.id)
  } else {
    await supabase.from('wishlist_votes').insert({ wishlist_id: wishlistId, member_id: memberId })
  }
}

// ─── REALTIME ─────────────────────────────────────────────────────────────────

export function subscribeToActivities(callback) {
  return supabase
    .channel('activities')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'activities' }, callback)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'confirmations' }, callback)
    .subscribe()
}

export function subscribeToAvailability(callback) {
  return supabase
    .channel('availability')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'availability' }, callback)
    .subscribe()
}
