import { useState } from 'react'
import { T } from '../lib/helpers.js'
import { getMemberByName, verifyPin } from '../lib/supabase.js'

export default function LoginScreen({ onLogin, onRegister }) {
  const [step, setStep] = useState(1)
  const [naam, setNaam] = useState('')
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleNaam = async () => {
    if (!naam.trim()) return
    setLoading(true); setError('')
    try {
      await getMemberByName(naam.trim())
      setStep(2)
    } catch {
      setError('Naam niet gevonden. Nieuw hier?')
    }
    setLoading(false)
  }

  const handlePin = async () => {
    if (pin.length < 4) return
    setLoading(true); setError('')
    try {
      const member = await getMemberByName(naam.trim())
      const ok = await verifyPin(member.id, pin)
      if (ok) {
        localStorage.setItem('wanneer_member_id', member.id)
        localStorage.setItem('wanneer_member_name', member.name)
        onLogin(member)
      } else {
        setError('Verkeerde pincode. Probeer opnieuw.')
        setPin('')
      }
    } catch { setError('Er ging iets mis. Probeer opnieuw.') }
    setLoading(false)
  }

  return (
    <div style={{ background: T.navBg, minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 24px', fontFamily: "'Outfit',sans-serif" }}>
      <div style={{ background: T.accent, borderRadius: 8, padding: '6px 16px', fontWeight: 900, fontSize: 22, color: T.white, letterSpacing: '-0.5px', marginBottom: 8 }}>wanneer</div>
      <div style={{ fontSize: 13, color: '#888', marginBottom: 40 }}>Plan samen, zonder gedoe</div>

      <div style={{ width: '100%', maxWidth: 300 }}>
        {step === 1 && (
          <>
            <div style={{ fontSize: 16, fontWeight: 700, color: T.white, marginBottom: 4, textAlign: 'center' }}>Welkom terug</div>
            <div style={{ fontSize: 13, color: '#888', marginBottom: 20, textAlign: 'center' }}>Voer je naam in om in te loggen</div>
            <input value={naam} onChange={e => { setNaam(e.target.value); setError('') }} placeholder="Jouw naam" autoFocus
              style={{ width: '100%', background: '#2a2a2a', border: '1px solid #333', borderRadius: 8, padding: '13px 14px', color: T.white, fontFamily: "'Outfit',sans-serif", fontSize: 15, outline: 'none', marginBottom: 10, boxSizing: 'border-box' }} />
            {error && <div style={{ fontSize: 12, color: T.red, marginBottom: 8 }}>{error}</div>}
            <button onClick={handleNaam} disabled={!naam.trim() || loading}
              style={{ width: '100%', padding: '13px', borderRadius: 8, border: 'none', background: naam.trim() ? T.accent : '#333', color: naam.trim() ? T.white : '#666', fontFamily: "'Outfit',sans-serif", fontSize: 15, fontWeight: 700, cursor: 'pointer', marginBottom: 12 }}>
              {loading ? 'Laden…' : 'Doorgaan →'}
            </button>
            <button onClick={onRegister}
              style={{ width: '100%', padding: '11px', borderRadius: 8, border: '1px solid #333', background: 'transparent', color: '#888', fontFamily: "'Outfit',sans-serif", fontSize: 13, cursor: 'pointer' }}>
              Nieuw account aanmaken
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <button onClick={() => { setStep(1); setPin(''); setError('') }}
              style={{ background: 'none', border: 'none', color: '#888', fontSize: 13, cursor: 'pointer', fontFamily: "'Outfit',sans-serif", marginBottom: 20, display: 'flex', alignItems: 'center', gap: 4 }}>
              ‹ Andere naam
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: T.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800, color: T.white }}>{naam[0]}</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: T.white }}>{naam}</div>
            </div>
            <div style={{ fontSize: 11, color: '#888', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>Pincode</div>
            <input type="password" inputMode="numeric" maxLength={4} value={pin}
              onChange={e => { setPin(e.target.value); setError('') }}
              placeholder="••••" autoFocus
              style={{ width: '100%', background: '#2a2a2a', border: `1px solid ${error ? T.red : '#333'}`, borderRadius: 8, padding: '14px', color: T.white, fontFamily: "'Outfit',sans-serif", fontSize: 24, outline: 'none', textAlign: 'center', letterSpacing: 8, marginBottom: 10, boxSizing: 'border-box' }} />
            {error && <div style={{ fontSize: 12, color: T.red, marginBottom: 8 }}>{error}</div>}
            <button onClick={handlePin} disabled={pin.length < 4 || loading}
              style={{ width: '100%', padding: '13px', borderRadius: 8, border: 'none', background: pin.length === 4 ? T.accent : '#333', color: pin.length === 4 ? T.white : '#666', fontFamily: "'Outfit',sans-serif", fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
              {loading ? 'Inloggen…' : 'Inloggen →'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
