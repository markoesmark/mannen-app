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

export async function verifyPin(memberId, pin) {
  const { data, error } = await supabase
    .from('members').select('id, pin_hash')
    .eq('id', memberId).single()
  if (error || !data) return false
  return data.pin_hash === pin
}

export async function setPin(memberId, pin) {
  const { data, error } = await supabase
    .from('members')
    .update({ pin_hash: pin, pin_set: true })
    .eq('id', memberId)
    .select('id')
  if (error) throw error
  if (!data || data.length === 0) throw new Error('Pincode opslaan mislukt — ontbrekende schrijfrechten in de database. Voer de RLS-fix uit in Supabase.')
}

export async function changePin(memberId, currentPin, newPin) {
  // Haal member op en vergelijk pin direct
  const { data, error } = await supabase
    .from('members').select('pin_hash').eq('id', memberId).single()
  if (error || !data) throw new Error('Gebruiker niet gevonden')
  if (data.pin_hash !== currentPin) throw new Error('Huidige pincode is onjuist')
  await setPin(memberId, newPin)
}

export async function registerMember(name, pin) {
  const { data: existing } = await supabase
    .from('members').select('id').eq('name', name).single()
  if (existing) throw new Error('Deze naam is al in gebruik')
  const { data, error } = await supabase
    .from('members').insert({ name, pin_hash: pin, pin_set: true }).select().single()
  if (error) throw error
  return data
}

export async function getMemberByName(name) {
  const { data, error } = await supabase
    .from('members').select('*').eq('name', name).single()
  if (error) throw error
  return data
}

// ─── GROUPS ──────────────────────────────────────────────────────────────────

export async function getGroupsForMember(memberId) {
  const { data, error } = await supabase
    .from('group_members')
    .select('rol, groups(*)')
    .eq('member_id', memberId)
  if (error) throw error
  return data.map(d => ({ ...d.groups, rol: d.rol }))
}

export async function getGroupWithMembers(groupId) {
  const { data, error } = await supabase
    .from('group_members')
    .select('rol, members(*)')
    .eq('group_id', groupId)
  if (error) throw error
  return data.map(d => ({ ...d.members, rol: d.rol }))
}

export async function createGroup(naam, creatorMemberId) {
  const { data: group, error } = await supabase
    .from('groups').insert({ naam, aangemaakt_door: creatorMemberId }).select().single()
  if (error) throw error
  await supabase.from('group_members').insert({
    group_id: group.id, member_id: creatorMemberId, rol: 'eigenaar',
  })
  return group
}

export async function updateGroupName(groupId, naam) {
  const { error } = await supabase.from('groups').update({ naam }).eq('id', groupId)
  if (error) throw error
}

export async function deleteGroup(groupId) {
  const { error } = await supabase.from('groups').delete().eq('id', groupId)
  if (error) throw error
}

export async function leaveGroup(groupId, memberId) {
  const { error } = await supabase
    .from('group_members').delete()
    .eq('group_id', groupId).eq('member_id', memberId)
  if (error) throw error

  // Als geen leden meer over → groep verwijderen
  const { data: remaining } = await supabase
    .from('group_members').select('id').eq('group_id', groupId)
  if (!remaining || remaining.length === 0) { await deleteGroup(groupId); return }

  // Als geen eigenaar meer → eerste lid wordt eigenaar
  const { data: owners } = await supabase
    .from('group_members').select('id').eq('group_id', groupId).eq('rol', 'eigenaar')
  if (!owners || owners.length === 0) {
    const { data: first } = await supabase
      .from('group_members').select('id').eq('group_id', groupId).limit(1).single()
    if (first) await supabase.from('group_members').update({ rol: 'eigenaar' }).eq('id', first.id)
  }
}

export async function removeMemberFromGroup(groupId, memberId) {
  const { error } = await supabase
    .from('group_members').delete()
    .eq('group_id', groupId).eq('member_id', memberId)
  if (error) throw error
}

// ─── INVITE TOKENS ───────────────────────────────────────────────────────────

export async function createInviteToken(groupId, creatorMemberId) {
  const token = Math.random().toString(36).slice(2, 8).toUpperCase()
  const verlooptOp = new Date()
  verlooptOp.setDate(verlooptOp.getDate() + 7)
  const { data, error } = await supabase
    .from('invite_tokens')
    .insert({ token, group_id: groupId, aangemaakt_door: creatorMemberId, max_gebruik: 10, verloopt_op: verlooptOp.toISOString() })
    .select().single()
  if (error) throw error
  return data
}

export async function getInviteTokensForGroup(groupId) {
  const { data, error } = await supabase
    .from('invite_tokens').select('*').eq('group_id', groupId)
    .order('aangemaakt_op', { ascending: false })
  if (error) throw error
  return data
}

export async function revokeInviteToken(tokenId) {
  const { error } = await supabase.from('invite_tokens').delete().eq('id', tokenId)
  if (error) throw error
}

export async function validateAndJoinViaToken(token, memberId) {
  const { data: tokenData, error } = await supabase
    .from('invite_tokens').select('*, groups(*)').eq('token', token).single()
  if (error || !tokenData) throw new Error('Uitnodigingscode niet gevonden')
  if (new Date(tokenData.verloopt_op) < new Date()) throw new Error('Deze uitnodigingslink is verlopen')
  if (tokenData.gebruik_count >= tokenData.max_gebruik) throw new Error('Deze uitnodigingslink is al 10 keer gebruikt')

  const { data: existing } = await supabase
    .from('group_members').select('id')
    .eq('group_id', tokenData.group_id).eq('member_id', memberId).single()

  if (!existing) {
    await supabase.from('group_members').insert({ group_id: tokenData.group_id, member_id: memberId, rol: 'lid' })
    await supabase.from('invite_tokens').update({ gebruik_count: tokenData.gebruik_count + 1 }).eq('id', tokenData.id)
  }

  return tokenData.groups
}

// ─── AVAILABILITY ─────────────────────────────────────────────────────────────

export async function getAvailabilityIncludingExpired() {
  const { data, error } = await supabase.from('availability').select('*, members(name)')
  if (error) throw error
  return data
}

export async function saveAvailability(memberId, days) {
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 14)
  const { error } = await supabase
    .from('availability')
    .upsert({ member_id: memberId, days, expires_at: expiresAt.toISOString(), updated_at: new Date().toISOString() }, { onConflict: 'member_id' })
  if (error) throw error
}

// ─── ACTIVITIES ───────────────────────────────────────────────────────────────

export async function getActivitiesForGroup(groupId) {
  const { data, error } = await supabase
    .from('activities')
    .select('*, confirmations(member_id, members(name))')
    .eq('group_id', groupId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function createActivity({ title, location, bestDate, startTime, endTime, fromMemberId, groupId }) {
  const { data, error } = await supabase
    .from('activities')
    .insert({ title, location, best_date: bestDate, start_time: startTime, end_time: endTime || null, from_member_id: fromMemberId, group_id: groupId, status: 'bevestigen' })
    .select().single()
  if (error) throw error
  return data
}

export async function updateActivity(id, updates) {
  const { data, error } = await supabase
    .from('activities').update(updates).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function deleteActivity(id) {
  const { error } = await supabase.from('activities').delete().eq('id', id)
  if (error) throw error
}

export async function archiveExpiredActivities(groupId) {
  const today = new Date().toISOString().split('T')[0]
  const { error } = await supabase
    .from('activities').update({ status: 'geweest' })
    .eq('group_id', groupId)
    .in('status', ['gepland', 'bevestigen'])
    .lt('best_date', today)
  if (error) console.error('Archive error:', error)
}

export async function confirmActivity(activityId, memberId, groupId) {
  const { error } = await supabase
    .from('confirmations')
    .upsert({ activity_id: activityId, member_id: memberId }, { onConflict: 'activity_id,member_id' })
  if (error) throw error

  // Check of alle groepsleden bevestigd hebben
  const groupMembers = await getGroupWithMembers(groupId)
  const { data: confirmations } = await supabase
    .from('confirmations').select('member_id').eq('activity_id', activityId)

  if (confirmations && confirmations.length >= groupMembers.length) {
    const { error: updateError } = await supabase
      .from('activities').update({ status: 'gepland' }).eq('id', activityId)
    if (updateError) throw new Error('Bevestiging opgeslagen maar status kon niet worden bijgewerkt.')
  }
}

// ─── WISHLIST ─────────────────────────────────────────────────────────────────

export async function getWishlistForGroup(groupId) {
  const { data, error } = await supabase
    .from('wishlist')
    .select('*, wishlist_votes(member_id, members(name)), members(name)')
    .eq('group_id', groupId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function addWishlistItem({ title, location, addedByMemberId, groupId }) {
  const { data, error } = await supabase
    .from('wishlist')
    .insert({ title, location, added_by_member_id: addedByMemberId, group_id: groupId })
    .select().single()
  if (error) throw error
  return data
}

export async function updateWishlistItem(id, { title, location }) {
  const { data, error } = await supabase
    .from('wishlist').update({ title, location }).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function deleteWishlistItem(id) {
  const { error } = await supabase.from('wishlist').delete().eq('id', id)
  if (error) throw error
}

export async function toggleWishlistVote(wishlistId, memberId) {
  const { data: existing } = await supabase
    .from('wishlist_votes').select('id')
    .eq('wishlist_id', wishlistId).eq('member_id', memberId).single()
  if (existing) {
    await supabase.from('wishlist_votes').delete().eq('id', existing.id)
  } else {
    await supabase.from('wishlist_votes').insert({ wishlist_id: wishlistId, member_id: memberId })
  }
}

// ─── REALTIME ─────────────────────────────────────────────────────────────────

export function subscribeToActivities(groupId, callback) {
  return supabase
    .channel(`activities-${groupId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'activities', filter: `group_id=eq.${groupId}` }, callback)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'confirmations' }, callback)
    .subscribe()
}

export function subscribeToAvailability(callback) {
  return supabase
    .channel('availability')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'availability' }, callback)
    .subscribe()
}

// ─── ADMIN ───────────────────────────────────────────────────────────────────

export async function adminGetAllGroups() {
  const { data, error } = await supabase
    .from('groups').select('*, group_members(count), activities(count)')
    .order('aangemaakt_op')
  if (error) throw error
  return data
}

export async function adminGetAllMembers() {
  const { data, error } = await supabase
    .from('members').select('*, group_members(count)').order('name')
  if (error) throw error
  return data
}

export async function adminResetPin(memberId, newPin) {
  const { error } = await supabase
    .from('members').update({ pin_hash: newPin }).eq('id', memberId)
  if (error) throw error
}
