import { useState, useEffect } from 'react'
import { T } from '../lib/helpers.js'
import { adminGetAllGroups, adminGetAllMembers, adminGetStats, adminResetPin, deleteGroup } from '../lib/supabase.js'
import { SectionTitle, Divider } from './UI.jsx'

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'wanneer-admin'

export default function AdminScreen() {
  const [unlocked, setUnlocked] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [groups, setGroups] = useState([])
  const [members, setMembers] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [resetPinFor, setResetPinFor] = useState(null)
  const [newPin, setNewPin] = useState('')
  const [resetSuccess, setResetSuccess] = useState(null)

  useEffect(() => { if (unlocked) loadData() }, [unlocked])

  async function loadData() {
    setLoading(true)
    try {
      const [g, m, s] = await Promise.all([adminGetAllGroups(), adminGetAllMembers(), adminGetStats()])
      setGroups(g)
      setMembers(m)
      setStats(s)
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  function formatDate(ts) {
    if (!ts) return '—'
    return new Date(ts).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  const handleUnlock = () => {
    if (password === ADMIN_PASSWORD) { setUnlocked(true); setError('') }
    else { setError('Verkeerd wachtwoord'); setPassword('') }
  }

  const handleDeleteGroup = async (groupId) => {
    try {
      await deleteGroup(groupId)
      setConfirmDelete(null)
      await loadData()
    } catch (e) { alert(e.message) }
  }

  const handleResetPin = async (memberId) => {
    if (newPin.length < 4) return
    try {
      await adminResetPin(memberId, newPin)
      setResetPinFor(null)
      setNewPin('')
      setResetSuccess(memberId)
      setTimeout(() => setResetSuccess(null), 3000)
    } catch (e) { alert(e.message) }
  }

  if (!unlocked) return (
    <div style={{ background: T.navBg, minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 24px', fontFamily: "'Outfit',sans-serif" }}>
      <div style={{ fontSize: 40, marginBottom: 16 }}>🔐</div>
      <div style={{ fontWeight: 800, fontSize: 22, color: T.white, marginBottom: 6 }}>App beheer</div>
      <div style={{ fontSize: 13, color: '#888', marginBottom: 32, textAlign: 'center' }}>Alleen toegankelijk voor de beheerder</div>
      <div style={{ width: '100%', maxWidth: 280 }}>
        <div style={{ fontSize: 11, color: '#888', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>Wachtwoord</div>
        <input
          type="password" value={password}
          onChange={e => { setPassword(e.target.value); setError('') }}
          onKeyDown={e => e.key === 'Enter' && handleUnlock()}
          placeholder="••••••••"
          style={{ width: '100%', background: '#2a2a2a', border: `1px solid ${error ? T.red : '#333'}`, borderRadius: 8, padding: '13px', color: T.white, fontFamily: "'Outfit',sans-serif", fontSize: 16, outline: 'none', marginBottom: 10, boxSizing: 'border-box' }}
        />
        {error && <div style={{ fontSize: 12, color: T.red, marginBottom: 8 }}>{error}</div>}
        <button onClick={handleUnlock}
          style={{ width: '100%', padding: '13px', borderRadius: 8, border: 'none', background: T.accent, color: T.white, fontFamily: "'Outfit',sans-serif", fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
          Inloggen →
        </button>
      </div>
    </div>
  )

  return (
    <div style={{ flex: 1, overflowY: 'auto', background: T.bg }}>

      {/* Statistieken */}
      <div style={{ padding: '16px 16px 4px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 8 }}>
          {[
            ['Groepen', groups.length, T.accent],
            ['Leden', members.length, T.green],
            ['Vrije dagen', stats?.totalFutureDays ?? '…', T.amber],
          ].map(([label, val, color]) => (
            <div key={label} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: '12px 14px' }}>
              <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: T.textMuted, marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: 24, fontWeight: 800, color }}>{val}</div>
            </div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8 }}>
          {[
            ['Totaal afspraken', stats?.totalActivities ?? '…', T.text],
            ['Gepland', stats?.gepland ?? '…', T.green],
            ['Te bevestigen', stats?.bevestigen ?? '…', T.amber],
            ['Geweest', stats?.geweest ?? '…', T.textMuted],
          ].map(([label, val, color]) => (
            <div key={label} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: '10px 12px' }}>
              <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: T.textMuted, marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: 20, fontWeight: 800, color }}>{val}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Alle groepen */}
      <SectionTitle>Alle groepen</SectionTitle>
      <div style={{ background: T.surface, borderTop: `1px solid ${T.border}`, borderBottom: `1px solid ${T.border}` }}>
        {loading ? (
          <div style={{ padding: '16px', textAlign: 'center', color: T.textMuted, fontSize: 13 }}>Laden…</div>
        ) : groups.map((g, i) => (
          <div key={g.id}>
            <div style={{ padding: '12px 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>{g.naam}</div>
                  <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>
                    {g.group_members?.[0]?.count || 0} leden · aangemaakt {new Date(g.aangemaakt_op).toLocaleDateString('nl-NL')}
                  </div>
                </div>
                {confirmDelete === g.id ? (
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => handleDeleteGroup(g.id)} style={{ background: T.redLight, border: `1px solid ${T.redBorder}`, borderRadius: 4, padding: '5px 10px', fontSize: 11, fontWeight: 700, color: T.red, cursor: 'pointer', fontFamily: "'Outfit',sans-serif" }}>Verwijder</button>
                    <button onClick={() => setConfirmDelete(null)} style={{ background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 4, padding: '5px 10px', fontSize: 11, color: T.textMuted, cursor: 'pointer', fontFamily: "'Outfit',sans-serif" }}>Annuleer</button>
                  </div>
                ) : (
                  <button onClick={() => setConfirmDelete(g.id)} style={{ background: 'none', border: `1px solid ${T.border}`, borderRadius: 4, padding: '5px 10px', fontSize: 11, color: T.textMuted, cursor: 'pointer', fontFamily: "'Outfit',sans-serif" }}>🗑</button>
                )}
              </div>
            </div>
            {i < groups.length - 1 && <Divider />}
          </div>
        ))}
      </div>

      {/* Alle leden */}
      <SectionTitle>Alle leden</SectionTitle>
      <div style={{ background: T.surface, borderTop: `1px solid ${T.border}`, borderBottom: `1px solid ${T.border}` }}>
        {members.map((m, i) => {
          const today = new Date().toISOString().split('T')[0]
          const avail = m.availability?.[0]
          const futureDays = (avail?.days || []).filter(d => d >= today).length
          return (
          <div key={m.id}>
            <div style={{ padding: '12px 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{m.name}</div>
                  <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>
                    {m.group_members?.[0]?.count || 0} groep(en) · lid sinds {formatDate(m.created_at)}
                  </div>
                  <div style={{ fontSize: 11, color: futureDays > 0 ? T.green : T.textMuted, marginTop: 1 }}>
                    {futureDays > 0 ? `${futureDays} vrije dagen opgegeven` : 'Geen beschikbaarheid'}
                    {avail?.updated_at ? ` · bijgewerkt ${formatDate(avail.updated_at)}` : ''}
                  </div>
                </div>
                {resetSuccess === m.id ? (
                  <span style={{ fontSize: 12, color: T.green, fontWeight: 600 }}>✓ Pin gereset</span>
                ) : resetPinFor === m.id ? (
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <input type="password" inputMode="numeric" maxLength={4} value={newPin}
                      onChange={e => setNewPin(e.target.value)} placeholder="••••"
                      style={{ width: 70, background: T.surfaceAlt, border: `1px solid ${T.borderDark}`, borderRadius: 6, padding: '6px 8px', color: T.text, fontFamily: "'Outfit',sans-serif", fontSize: 16, outline: 'none', textAlign: 'center', letterSpacing: 4 }} />
                    <button onClick={() => handleResetPin(m.id)} style={{ background: T.accent, border: 'none', borderRadius: 4, padding: '6px 10px', fontSize: 11, fontWeight: 700, color: T.white, cursor: 'pointer', fontFamily: "'Outfit',sans-serif" }}>Zet</button>
                    <button onClick={() => { setResetPinFor(null); setNewPin('') }} style={{ background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 4, padding: '6px 8px', fontSize: 11, color: T.textMuted, cursor: 'pointer', fontFamily: "'Outfit',sans-serif" }}>✕</button>
                  </div>
                ) : (
                  <button onClick={() => { setResetPinFor(m.id); setNewPin('') }}
                    style={{ background: 'none', border: `1px solid ${T.amberBorder}`, borderRadius: 4, padding: '5px 10px', fontSize: 11, fontWeight: 600, color: T.amber, cursor: 'pointer', fontFamily: "'Outfit',sans-serif" }}>
                    Reset pin
                  </button>
                )}
              </div>
            </div>
            {i < members.length - 1 && <Divider />}
          </div>
        )})}

      </div>

      {/* Uitloggen */}
      <div style={{ padding: '16px 16px 32px' }}>
        <button onClick={() => setUnlocked(false)}
          style={{ width: '100%', padding: '11px', background: 'transparent', border: `1px solid ${T.border}`, borderRadius: 4, color: T.textMuted, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: "'Outfit',sans-serif" }}>
          Beheer uitloggen
        </button>
      </div>
    </div>
  )
}
