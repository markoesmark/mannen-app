import { useState } from 'react'
import { T } from '../lib/helpers.js'
import { registerMember, createGroup, validateAndJoinViaToken } from '../lib/supabase.js'

export default function RegisterScreen({ onDone, onBack, inviteToken = null, currentMember = null }) {
  const [step, setStep] = useState(currentMember ? 3 : 1)
  const [naam, setNaam] = useState('')
  const [pin, setPin] = useState('')
  const [pin2, setPin2] = useState('')
  const [groepNaam, setGroepNaam] = useState('')
  const [joinCode, setJoinCode] = useState(inviteToken || '')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleRegistreer = async (type) => {
    setLoading(true); setError('')
    try {
      let member = currentMember
      if (!member) {
        member = await registerMember(naam.trim(), pin)
        localStorage.setItem('wanneer_member_id', member.id)
        localStorage.setItem('wanneer_member_name', member.name)
      }

      if (type === 'nieuw') {
        const group = await createGroup(groepNaam.trim() || 'Mijn groep', member.id)
        onDone(member, group)
      } else {
        const group = await validateAndJoinViaToken(joinCode.trim().toUpperCase(), member.id)
        onDone(member, group)
      }
    } catch (e) {
      setError(e.message)
    }
    setLoading(false)
  }

  const pinMismatch = pin2.length === 4 && pin2 !== pin

  return (
    <div style={{ background: T.navBg, minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 24px', fontFamily: "'Outfit',sans-serif" }}>
      <div style={{ background: T.accent, borderRadius: 8, padding: '6px 16px', fontWeight: 900, fontSize: 22, color: T.white, letterSpacing: '-0.5px', marginBottom: 32 }}>wanneer</div>

      {/* Stap indicator */}
      {!currentMember && (
        <div style={{ display: 'flex', gap: 6, marginBottom: 28, width: '100%', maxWidth: 300 }}>
          {[1, 2, 3].map(n => (
            <div key={n} style={{ flex: 1, height: 3, borderRadius: 100, background: n <= step ? T.accent : '#333', transition: 'background 0.3s' }} />
          ))}
        </div>
      )}

      <div style={{ width: '100%', maxWidth: 300 }}>
        {/* Stap 1: Naam */}
        {step === 1 && (
          <>
            <div style={{ fontSize: 16, fontWeight: 700, color: T.white, marginBottom: 4 }}>Jouw naam</div>
            <div style={{ fontSize: 13, color: '#888', marginBottom: 20 }}>Zo herkennen de anderen jou</div>
            <input value={naam} onChange={e => { setNaam(e.target.value); setError('') }}
              placeholder="bv. Mark" autoFocus
              style={{ width: '100%', background: '#2a2a2a', border: '1px solid #333', borderRadius: 8, padding: '13px 14px', color: T.white, fontFamily: "'Outfit',sans-serif", fontSize: 15, outline: 'none', marginBottom: 10, boxSizing: 'border-box' }} />
            {error && <div style={{ fontSize: 12, color: T.red, marginBottom: 8 }}>{error}</div>}
            <button onClick={() => naam.trim() && setStep(2)} disabled={!naam.trim()}
              style={{ width: '100%', padding: '13px', borderRadius: 8, border: 'none', background: naam.trim() ? T.accent : '#333', color: naam.trim() ? T.white : '#666', fontFamily: "'Outfit',sans-serif", fontSize: 15, fontWeight: 700, cursor: 'pointer', marginBottom: 8 }}>
              Volgende →
            </button>
            <button onClick={onBack}
              style={{ width: '100%', padding: '11px', borderRadius: 8, border: '1px solid #333', background: 'transparent', color: '#888', fontFamily: "'Outfit',sans-serif", fontSize: 13, cursor: 'pointer' }}>
              ← Terug
            </button>
          </>
        )}

        {/* Stap 2: Pincode */}
        {step === 2 && (
          <>
            <div style={{ fontSize: 16, fontWeight: 700, color: T.white, marginBottom: 4 }}>Kies een pincode</div>
            <div style={{ fontSize: 13, color: '#888', marginBottom: 20 }}>4 cijfers — onthoud deze goed</div>

            <div style={{ fontSize: 11, color: '#888', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 5 }}>Pincode</div>
            <input type="password" inputMode="numeric" maxLength={4} value={pin}
              onChange={e => { setPin(e.target.value); setError('') }}
              placeholder="••••"
              style={{ width: '100%', background: '#2a2a2a', border: '1px solid #333', borderRadius: 8, padding: '12px', color: T.white, fontFamily: "'Outfit',sans-serif", fontSize: 22, outline: 'none', textAlign: 'center', letterSpacing: 6, marginBottom: 10, boxSizing: 'border-box' }} />

            <div style={{ fontSize: 11, color: '#888', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 5 }}>Herhaal pincode</div>
            <input type="password" inputMode="numeric" maxLength={4} value={pin2}
              onChange={e => { setPin2(e.target.value); setError('') }}
              placeholder="••••"
              style={{ width: '100%', background: '#2a2a2a', border: `1px solid ${pinMismatch ? T.red : '#333'}`, borderRadius: 8, padding: '12px', color: T.white, fontFamily: "'Outfit',sans-serif", fontSize: 22, outline: 'none', textAlign: 'center', letterSpacing: 6, marginBottom: pinMismatch ? 4 : 10, boxSizing: 'border-box' }} />
            {pinMismatch && <div style={{ fontSize: 11, color: T.red, fontWeight: 600, marginBottom: 10 }}>Pincodes komen niet overeen</div>}

            <button onClick={() => pin.length === 4 && pin === pin2 && setStep(3)}
              disabled={pin.length < 4 || pin !== pin2}
              style={{ width: '100%', padding: '13px', borderRadius: 8, border: 'none', background: pin.length === 4 && pin === pin2 ? T.accent : '#333', color: pin.length === 4 && pin === pin2 ? T.white : '#666', fontFamily: "'Outfit',sans-serif", fontSize: 15, fontWeight: 700, cursor: 'pointer', marginBottom: 8 }}>
              Volgende →
            </button>
            <button onClick={() => setStep(1)}
              style={{ width: '100%', padding: '11px', borderRadius: 8, border: '1px solid #333', background: 'transparent', color: '#888', fontFamily: "'Outfit',sans-serif", fontSize: 13, cursor: 'pointer' }}>
              ← Terug
            </button>
          </>
        )}

        {/* Stap 3: Groep */}
        {step === 3 && (
          <>
            <div style={{ fontSize: 16, fontWeight: 700, color: T.white, marginBottom: 4 }}>Groep</div>
            <div style={{ fontSize: 13, color: '#888', marginBottom: 20 }}>Maak een nieuwe groep aan of join via een uitnodigingscode</div>

            {/* Nieuwe groep */}
            <div style={{ fontSize: 11, color: '#888', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 5 }}>Groepsnaam</div>
            <input value={groepNaam} onChange={e => { setGroepNaam(e.target.value); setError('') }}
              placeholder="bv. Vrienden"
              style={{ width: '100%', background: '#2a2a2a', border: '1px solid #333', borderRadius: 8, padding: '13px 14px', color: T.white, fontFamily: "'Outfit',sans-serif", fontSize: 15, outline: 'none', marginBottom: 10, boxSizing: 'border-box' }} />
            <button onClick={() => handleRegistreer('nieuw')} disabled={!groepNaam.trim() || loading}
              style={{ width: '100%', padding: '13px', borderRadius: 8, border: 'none', background: groepNaam.trim() ? T.accent : '#333', color: groepNaam.trim() ? T.white : '#666', fontFamily: "'Outfit',sans-serif", fontSize: 14, fontWeight: 700, cursor: 'pointer', marginBottom: 16 }}>
              {loading ? 'Aanmaken…' : '+ Nieuwe groep aanmaken'}
            </button>

            <div style={{ textAlign: 'center', fontSize: 12, color: '#666', marginBottom: 16 }}>of join een bestaande groep</div>

            <div style={{ fontSize: 11, color: '#888', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 5 }}>Uitnodigingscode</div>
            <input value={joinCode} onChange={e => { setJoinCode(e.target.value.toUpperCase()); setError('') }}
              placeholder="bv. ABC123"
              style={{ width: '100%', background: '#2a2a2a', border: '1px solid #333', borderRadius: 8, padding: '13px 14px', color: T.white, fontFamily: "'Outfit',sans-serif", fontSize: 15, outline: 'none', marginBottom: 10, boxSizing: 'border-box', letterSpacing: 2 }} />
            <button onClick={() => handleRegistreer('join')} disabled={!joinCode.trim() || loading}
              style={{ width: '100%', padding: '13px', borderRadius: 8, border: `1px solid ${joinCode.trim() ? '#444' : '#2a2a2a'}`, background: 'transparent', color: joinCode.trim() ? T.white : '#555', fontFamily: "'Outfit',sans-serif", fontSize: 14, fontWeight: 700, cursor: 'pointer', marginBottom: 8 }}>
              {loading ? 'Joinen…' : 'Groep joinen →'}
            </button>

            {error && <div style={{ fontSize: 12, color: T.red, marginBottom: 8, textAlign: 'center' }}>{error}</div>}

            <button onClick={() => currentMember ? onBack() : setStep(2)}
              style={{ width: '100%', padding: '11px', borderRadius: 8, border: '1px solid #333', background: 'transparent', color: '#888', fontFamily: "'Outfit',sans-serif", fontSize: 13, cursor: 'pointer' }}>
              ← Terug
            </button>
          </>
        )}
      </div>
    </div>
  )
}
