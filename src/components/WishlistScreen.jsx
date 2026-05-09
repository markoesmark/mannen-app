import { useState } from 'react'
import { T } from '../lib/helpers.js'
import { addWishlistItem, toggleWishlistVote, updateWishlistItem, deleteWishlistItem } from '../lib/supabase.js'
import { SectionTitle, Divider, MemberChip, Lbl, Inp, Btn } from './UI.jsx'

export default function WishlistScreen({ wishlist, members, currentMember, onUpdated }) {
  const [showAdd, setShowAdd] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newLoc, setNewLoc] = useState('')
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editTitle, setEditTitle] = useState('')
  const [editLoc, setEditLoc] = useState('')
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)

  const myVotes = wishlist
    .filter(w => w.wishlist_votes?.some(v => v.member_id === currentMember?.id))
    .map(w => w.id)

  const startEdit = (w) => {
    setEditingId(w.id)
    setEditTitle(w.title)
    setEditLoc(w.location || '')
    setConfirmDeleteId(null)
  }

  const handleSaveEdit = async (id) => {
    setSaving(true)
    try {
      await updateWishlistItem(id, { title: editTitle, location: editLoc })
      setEditingId(null)
      onUpdated()
    } catch (e) {
      alert('Opslaan mislukt: ' + e.message)
    }
    setSaving(false)
  }

  const handleDelete = async (id) => {
    try {
      await deleteWishlistItem(id)
      setConfirmDeleteId(null)
      onUpdated()
    } catch (e) {
      alert('Verwijderen mislukt: ' + e.message)
    }
  }

  const handleVote = async (wishId) => {
    try {
      await toggleWishlistVote(wishId, currentMember.id)
      onUpdated()
    } catch (e) {
      console.error(e)
    }
  }

  const handleAdd = async () => {
    if (!newTitle) return
    setSaving(true)
    try {
      await addWishlistItem({ title: newTitle, location: newLoc, addedByMemberId: currentMember.id })
      setNewTitle('')
      setNewLoc('')
      setShowAdd(false)
      onUpdated()
    } catch (e) {
      alert('Toevoegen mislukt: ' + e.message)
    }
    setSaving(false)
  }

  const sorted = [...wishlist].sort((a, b) => (b.wishlist_votes?.length || 0) - (a.wishlist_votes?.length || 0))

  return (
    <div style={{ flex: 1, overflowY: 'auto', background: T.bg }}>
      <SectionTitle>Ideeën van de groep</SectionTitle>
      <div style={{ background: T.surface, borderTop: `1px solid ${T.border}`, borderBottom: `1px solid ${T.border}` }}>
        {sorted.map((w, i, arr) => {
          const voted = myVotes.includes(w.id)
          const voteCount = w.wishlist_votes?.length || 0
          const voterIds = w.wishlist_votes?.map(v => v.member_id) || []
          const isEditing = editingId === w.id
          const isConfirmingDelete = confirmDeleteId === w.id

          return (
            <div key={w.id}>
              <div style={{ padding: '13px 16px' }}>

                {/* Edit form */}
                {isEditing ? (
                  <div>
                    <Lbl>Titel</Lbl>
                    <Inp value={editTitle} onChange={e => setEditTitle(e.target.value)} placeholder="Activiteit" />
                    <Lbl>Locatie</Lbl>
                    <Inp value={editLoc} onChange={e => setEditLoc(e.target.value)} placeholder="Locatie" />
                    <div style={{ display: 'flex', gap: 8 }}>
                      <Btn onClick={() => handleSaveEdit(w.id)} disabled={!editTitle || saving} small>
                        {saving ? 'Opslaan…' : 'Opslaan'}
                      </Btn>
                      <Btn variant="ghost" onClick={() => setEditingId(null)} small>Annuleren</Btn>
                    </div>
                  </div>

                ) : isConfirmingDelete ? (
                  /* Verwijder bevestiging */
                  <div style={{ background: T.redLight, border: `1px solid ${T.redBorder}`, borderRadius: 6, padding: '12px' }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: T.red, marginBottom: 3 }}>Weet je het zeker?</div>
                    <div style={{ fontSize: 12, color: T.textMuted, marginBottom: 12 }}>"{w.title}" wordt verwijderd voor iedereen.</div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => handleDelete(w.id)} style={{ flex: 1, padding: '9px', background: T.red, border: 'none', borderRadius: 4, color: T.white, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: "'Outfit',sans-serif" }}>
                        Ja, verwijder
                      </button>
                      <button onClick={() => setConfirmDeleteId(null)} style={{ flex: 1, padding: '9px', background: 'transparent', border: `1px solid ${T.border}`, borderRadius: 4, color: T.textMuted, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: "'Outfit',sans-serif" }}>
                        Annuleren
                      </button>
                    </div>
                  </div>

                ) : (
                  /* Normale weergave */
                  <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 800, fontSize: 15, color: T.text, marginBottom: 3, lineHeight: 1.25 }}>{w.title}</div>
                      <div style={{ fontSize: 12, color: T.textMuted, marginBottom: 8 }}>
                        {w.location && `📍 ${w.location} · `}{w.members?.name}
                      </div>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 10 }}>
                        {members.map(m => (
                          <MemberChip key={m.id} active={voterIds.includes(m.id)}>{m.name}</MemberChip>
                        ))}
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => startEdit(w)} style={{ background: 'none', border: `1px solid ${T.border}`, borderRadius: 4, padding: '5px 11px', fontSize: 12, fontWeight: 600, color: T.textMid, cursor: 'pointer', fontFamily: "'Outfit',sans-serif" }}>
                          ✏ Bewerken
                        </button>
                        <button onClick={() => { setConfirmDeleteId(w.id); setEditingId(null) }} style={{ background: 'none', border: `1px solid ${T.redBorder}`, borderRadius: 4, padding: '5px 11px', fontSize: 12, fontWeight: 600, color: T.red, cursor: 'pointer', fontFamily: "'Outfit',sans-serif" }}>
                          🗑 Verwijder
                        </button>
                      </div>
                    </div>

                    {/* Boks knop */}
                    <button onClick={() => handleVote(w.id)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, background: voted ? '#fff3e0' : T.surfaceAlt, border: `1px solid ${voted ? '#e67e22' : T.border}`, borderRadius: 4, padding: '8px 11px', cursor: 'pointer', color: voted ? '#e67e22' : T.textMuted, fontSize: 18, minWidth: 48, minHeight: 52, flexShrink: 0 }}>
                      👊
                      <span style={{ fontSize: 11, fontWeight: 700 }}>{voteCount}</span>
                    </button>
                  </div>
                )}
              </div>
              {i < arr.length - 1 && <Divider />}
            </div>
          )
        })}

        {sorted.length === 0 && (
          <div style={{ padding: '24px 16px', textAlign: 'center', color: T.textMuted, fontSize: 13 }}>
            Nog geen ideeën. Voeg het eerste toe!
          </div>
        )}
      </div>

      <div style={{ padding: '12px 16px' }}>
        {showAdd ? (
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: '14px' }}>
            <Lbl>Wat wil je doen?</Lbl>
            <Inp value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="bv. Skydiven" />
            <Lbl>Locatie (optioneel)</Lbl>
            <Inp value={newLoc} onChange={e => setNewLoc(e.target.value)} placeholder="bv. Teuge" />
            <div style={{ display: 'flex', gap: 8 }}>
              <Btn onClick={handleAdd} disabled={!newTitle || saving} small>{saving ? 'Toevoegen…' : 'Toevoegen'}</Btn>
              <Btn variant="ghost" onClick={() => setShowAdd(false)} small>Annuleren</Btn>
            </div>
          </div>
        ) : (
          <button onClick={() => setShowAdd(true)} style={{ width: '100%', padding: '12px', background: 'transparent', border: `1px dashed ${T.borderDark}`, borderRadius: 6, color: T.textMuted, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'Outfit',sans-serif" }}>
            + Idee toevoegen
          </button>
        )}
      </div>
    </div>
  )
}
