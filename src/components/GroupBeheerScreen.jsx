import { useState, useEffect } from 'react'
import { T } from '../lib/helpers.js'
import { getInviteTokensForGroup, createInviteToken, revokeInviteToken, removeMemberFromGroup, leaveGroup, deleteGroup, updateGroupName } from '../lib/supabase.js'
import { buildInviteWhatsApp } from '../lib/helpers.js'
import { SectionTitle, Divider, Btn, Lbl, Inp } from './UI.jsx'

export default function GroupBeheerScreen({ group, members, currentMember, onBack, onGroupDeleted, onGroupUpdated, onNewGroup }) {
  const [tokens, setTokens] = useState([])
  const [loadingToken, setLoadingToken] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [confirmLeave, setConfirmLeave] = useState(false)
  const [confirmDeleteGroup, setConfirmDeleteGroup] = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [newName, setNewName] = useState(group.naam)

  useEffect(() => { loadTokens() }, [])

  async function loadTokens() {
    try {
      const data = await getInviteTokensForGroup(group.id)
      setTokens(data)
    } catch (e) { console.error(e) }
  }

  const handleCreateToken = async () => {
    setLoadingToken(true)
    try {
      await createInviteToken(group.id, currentMember.id)
      await loadTokens()
    } catch (e) { alert(e.message) }
    setLoadingToken(false)
  }

  const handleRevoke = async (tokenId) => {
    try {
      await revokeInviteToken(tokenId)
      await loadTokens()
    } catch (e) { alert(e.message) }
  }

  const handleRemoveMember = async (memberId) => {
    try {
      await removeMemberFromGroup(group.id, memberId)
      setConfirmDelete(null)
      onGroupUpdated()
    } catch (e) { alert(e.message) }
  }

  const handleLeave = async () => {
    try {
      await leaveGroup(group.id, currentMember.id)
      onGroupDeleted()
    } catch (e) { alert(e.message) }
  }

  const handleDeleteGroup = async () => {
    try {
      await deleteGroup(group.id)
      onGroupDeleted()
    } catch (e) { alert(e.message) }
  }

  const handleSaveName = async () => {
    try {
      await updateGroupName(group.id, newName)
      setEditingName(false)
      onGroupUpdated()
    } catch (e) { alert(e.message) }
  }

  const activeTokens = tokens.filter(t => new Date(t.verloopt_op) > new Date() && t.gebruik_count < t.max_gebruik)
  const appBaseUrl = window.location.origin

  return (
    <div style={{ flex: 1, overflowY: 'auto', background: T.bg }}>

      {/* Groepsnaam */}
      <div style={{ background: T.surface, borderTop: `1px solid ${T.border}`, borderBottom: `1px solid ${T.border}`, padding: '14px 16px' }}>
        {editingName ? (
          <>
            <Lbl>Groepsnaam</Lbl>
            <Inp value={newName} onChange={e => setNewName(e.target.value)} placeholder="Groepsnaam" />
            <div style={{ display: 'flex', gap: 8 }}>
              <Btn onClick={handleSaveName} disabled={!newName.trim()} small>Opslaan</Btn>
              <Btn variant="ghost" onClick={() => { setEditingName(false); setNewName(group.naam) }} small>Annuleren</Btn>
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: T.text }}>{group.naam}</div>
            <button onClick={() => setEditingName(true)} style={{ background: 'none', border: `1px solid ${T.border}`, borderRadius: 4, padding: '6px 13px', fontSize: 12, fontWeight: 700, color: T.textMid, cursor: 'pointer', fontFamily: "'Outfit',sans-serif" }}>
              ✏ Naam wijzigen
            </button>
          </div>
        )}
      </div>

      {/* Leden */}
      <SectionTitle>Leden</SectionTitle>
      <div style={{ background: T.surface, borderTop: `1px solid ${T.border}`, borderBottom: `1px solid ${T.border}` }}>
        {members.map((m, i) => (
          <div key={m.id}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: '50%', background: T.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: T.white }}>{m.name[0]}</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{m.name}{m.id === currentMember?.id ? ' (jij)' : ''}</div>
                  <div style={{ fontSize: 11, color: T.textMuted }}>{m.rol}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {m.id !== currentMember?.id && (
                  confirmDelete === m.id ? (
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => handleRemoveMember(m.id)} style={{ background: T.redLight, border: `1px solid ${T.redBorder}`, borderRadius: 4, padding: '5px 10px', fontSize: 11, fontWeight: 700, color: T.red, cursor: 'pointer', fontFamily: "'Outfit',sans-serif" }}>Verwijder</button>
                      <button onClick={() => setConfirmDelete(null)} style={{ background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 4, padding: '5px 10px', fontSize: 11, color: T.textMuted, cursor: 'pointer', fontFamily: "'Outfit',sans-serif" }}>Annuleer</button>
                    </div>
                  ) : (
                    <button onClick={() => setConfirmDelete(m.id)} style={{ background: 'none', border: `1px solid ${T.border}`, borderRadius: 4, padding: '5px 10px', fontSize: 11, color: T.textMuted, cursor: 'pointer', fontFamily: "'Outfit',sans-serif" }}>✕</button>
                  )
                )}
              </div>
            </div>
            {i < members.length - 1 && <Divider />}
          </div>
        ))}
      </div>

      {/* Uitnodigen */}
      <SectionTitle>Uitnodigen</SectionTitle>
      <div style={{ background: T.surface, borderTop: `1px solid ${T.border}`, borderBottom: `1px solid ${T.border}`, padding: '14px 16px' }}>
        {activeTokens.length === 0 ? (
          <>
            <div style={{ fontSize: 13, color: T.textMuted, marginBottom: 12 }}>Genereer een uitnodigingslink. Geldig 7 dagen, maximaal 10 keer te gebruiken.</div>
            <Btn onClick={handleCreateToken} disabled={loadingToken}>
              {loadingToken ? 'Aanmaken…' : '+ Uitnodigingslink genereren'}
            </Btn>
          </>
        ) : (
          activeTokens.map(token => {
            const daysLeft = Math.ceil((new Date(token.verloopt_op) - new Date()) / (1000 * 60 * 60 * 24))
            return (
              <div key={token.id}>
                <div style={{ fontSize: 12, color: T.textMuted, marginBottom: 8 }}>Uitnodigingslink:</div>
                <div style={{ background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 8, padding: '10px 12px', marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <div style={{ fontSize: 13, color: T.textMid, fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {window.location.origin}/join/{token.token}
                  </div>
                  <button onClick={() => navigator.clipboard.writeText(`${window.location.origin}/join/${token.token}`)}
                    style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: '5px 10px', fontSize: 11, fontWeight: 700, color: T.textMid, cursor: 'pointer', fontFamily: "'Outfit',sans-serif", flexShrink: 0 }}>
                    Kopieer
                  </button>
                </div>
                <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                  <div style={{ fontSize: 12, color: T.textMuted }}>⏱ Nog {daysLeft} dagen geldig</div>
                  <div style={{ fontSize: 12, color: T.textMuted }}>👥 {token.gebruik_count}/{token.max_gebruik} gebruikt</div>
                </div>
                <a href={buildInviteWhatsApp(group.naam, token.token, appBaseUrl)} target="_blank" rel="noopener noreferrer"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', background: '#25D366', borderRadius: 6, padding: '11px', color: T.white, fontSize: 13, fontWeight: 700, textDecoration: 'none', marginBottom: 8, boxSizing: 'border-box' }}>
                  📲 Stuur via WhatsApp
                </a>
                <button onClick={() => handleRevoke(token.id)}
                  style={{ width: '100%', padding: '9px', background: 'transparent', border: `1px solid ${T.border}`, borderRadius: 4, color: T.textMuted, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: "'Outfit',sans-serif" }}>
                  Link intrekken
                </button>
              </div>
            )
          })
        )}
      </div>

      {/* Verlaten */}
      <SectionTitle>Verwijderen</SectionTitle>
      <div style={{ background: T.surface, borderTop: `1px solid ${T.border}`, borderBottom: `1px solid ${T.border}`, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {!confirmLeave ? (
          <button onClick={() => setConfirmLeave(true)} style={{ width: '100%', padding: '11px', background: 'transparent', border: `1px solid ${T.border}`, borderRadius: 4, color: T.textMuted, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: "'Outfit',sans-serif" }}>
            Groep verlaten
          </button>
        ) : (
          <div style={{ background: T.redLight, border: `1px solid ${T.redBorder}`, borderRadius: 6, padding: '12px' }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: T.red, marginBottom: 3 }}>Groep verlaten?</div>
            <div style={{ fontSize: 12, color: T.textMuted, marginBottom: 12 }}>Je verlaat "{group.naam}". Je kunt weer joinen via een uitnodigingslink.</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={handleLeave} style={{ flex: 1, padding: '9px', background: T.red, border: 'none', borderRadius: 4, color: T.white, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: "'Outfit',sans-serif" }}>Verlaten</button>
              <button onClick={() => setConfirmLeave(false)} style={{ flex: 1, padding: '9px', background: 'transparent', border: `1px solid ${T.border}`, borderRadius: 4, color: T.textMuted, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: "'Outfit',sans-serif" }}>Annuleren</button>
            </div>
          </div>
        )}

        {!confirmDeleteGroup ? (
          <button onClick={() => setConfirmDeleteGroup(true)} style={{ width: '100%', padding: '11px', background: 'transparent', border: `1px solid ${T.redBorder}`, borderRadius: 4, color: T.red, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: "'Outfit',sans-serif" }}>
            🗑 Groep verwijderen
          </button>
        ) : (
          <div style={{ background: T.redLight, border: `1px solid ${T.redBorder}`, borderRadius: 6, padding: '12px' }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: T.red, marginBottom: 3 }}>Weet je het zeker?</div>
            <div style={{ fontSize: 12, color: T.textMuted, marginBottom: 12 }}>"{group.naam}" en alle activiteiten en wishlist items worden permanent verwijderd.</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={handleDeleteGroup} style={{ flex: 1, padding: '9px', background: T.red, border: 'none', borderRadius: 4, color: T.white, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: "'Outfit',sans-serif" }}>Ja, verwijder</button>
              <button onClick={() => setConfirmDeleteGroup(false)} style={{ flex: 1, padding: '9px', background: 'transparent', border: `1px solid ${T.border}`, borderRadius: 4, color: T.textMuted, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: "'Outfit',sans-serif" }}>Annuleren</button>
            </div>
          </div>
        )}
      </div>
      {/* Nieuwe groep */}
      <SectionTitle>Andere groep</SectionTitle>
      <div style={{ background: T.surface, borderTop: `1px solid ${T.border}`, borderBottom: `1px solid ${T.border}`, padding: '14px 16px' }}>
        <button
          onClick={onNewGroup}
          style={{ width: '100%', padding: '11px', background: 'transparent', border: `1px dashed ${T.border}`, borderRadius: 4, color: T.textMuted, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: "'Outfit',sans-serif" }}
        >
          + Nieuwe groep aanmaken of joinen
        </button>
      </div>
      <div style={{ height: 32 }} />
    </div>
  )
}
