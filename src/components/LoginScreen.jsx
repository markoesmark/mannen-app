import { useState } from 'react'
import { T } from '../lib/helpers.js'
import { getMemberByName, verifyPin } from '../lib/supabase.js'
import { Btn, Lbl } from './UI.jsx'

export default function LoginScreen({ members, onLogin }) {
  const [selectedMember, setSelectedMember] = useState(null)
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const avatarColors = [T.red, '#e67e22', '#2980b9', '#27ae60']

  const handleLogin = async () => {
    if (!selectedMember || pin.length < 4) return
    setLoading(true)
    setError('')

    const ok = await verifyPin(selectedMember.id, pin)
    if (ok) {
      localStorage.setItem('mannen_member_id', selectedMember.id)
      localStorage.setItem('mannen_member_name', selectedMember.name)
      onLogin(selectedMember)
    } else {
      setError('Verkeerde pincode. Probeer opnieuw.')
      setPin('')
    }
    setLoading(false)
  }

  return (
    <div style={{ background: T.navBg, minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 24px', fontFamily: "'Outfit',sans-serif" }}>
      {/* Logo */}
      <div style={{ background: T.red, borderRadius: 8, padding: '6px 16px', fontWeight: 900, fontSize: 22, color: T.white, letterSpacing: '-0.5px', marginBottom: 40 }}>
        MANNEN
      </div>

      {!selectedMember ? (
        <>
          <div style={{ fontSize: 16, fontWeight: 700, color: T.white, marginBottom: 6 }}>Wie ben jij?</div>
          <div style={{ fontSize: 13, color: '#888', marginBottom: 24, textAlign: 'center' }}>Kies jouw naam om in te loggen</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 300 }}>
            {members.map((m, i) => (
              <button key={m.id} onClick={() => setSelectedMember(m)} style={{ display: 'flex', alignItems: 'center', gap: 14, background: '#2a2a2a', border: '1px solid #333', borderRadius: 12, padding: '14px 16px', cursor: 'pointer', transition: 'border-color 0.15s' }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: avatarColors[i % 4], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 800, color: T.white, flexShrink: 0 }}>
                  {m.name[0]}
                </div>
                <span style={{ fontSize: 15, fontWeight: 600, color: T.white }}>{m.name}</span>
              </button>
            ))}
          </div>
        </>
      ) : (
        <div style={{ width: '100%', maxWidth: 300 }}>
          <button onClick={() => { setSelectedMember(null); setPin('') }} style={{ background: 'none', border: 'none', color: '#888', fontSize: 13, cursor: 'pointer', marginBottom: 24, fontFamily: "'Outfit',sans-serif", display: 'flex', alignItems: 'center', gap: 4 }}>
            ‹ Andere naam
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: T.red, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800, color: T.white }}>
              {selectedMember.name[0]}
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: T.white }}>{selectedMember.name}</div>
          </div>

          <Lbl><span style={{ color: '#888' }}>Pincode</span></Lbl>
          <input
            type="password"
            inputMode="numeric"
            maxLength={4}
            value={pin}
            onChange={e => { setPin(e.target.value); setError('') }}
            placeholder="••••"
            autoFocus
            style={{ width: '100%', background: '#2a2a2a', border: `1px solid ${error ? T.red : '#333'}`, borderRadius: 8, padding: '14px', color: T.white, fontFamily: "'Outfit',sans-serif", fontSize: 24, outline: 'none', textAlign: 'center', letterSpacing: 8, marginBottom: 10, boxSizing: 'border-box' }}
          />
          {error && <div style={{ fontSize: 12, color: T.red, marginBottom: 10, textAlign: 'center' }}>{error}</div>}

          <button
            disabled={pin.length < 4 || loading}
            onClick={handleLogin}
            style={{ width: '100%', padding: '13px', borderRadius: 8, border: 'none', background: pin.length < 4 ? '#333' : T.red, color: pin.length < 4 ? '#666' : T.white, fontFamily: "'Outfit',sans-serif", fontSize: 15, fontWeight: 700, cursor: pin.length < 4 ? 'default' : 'pointer', marginTop: 4 }}
          >
            {loading ? 'Laden…' : 'Inloggen →'}
          </button>
        </div>
      )}
    </div>
  )
}
