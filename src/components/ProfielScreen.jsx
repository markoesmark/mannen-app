import { useState } from 'react'
import { T } from '../lib/helpers.js'
import { changePin } from '../lib/supabase.js'
import { Btn, Lbl, SectionTitle, Divider } from './UI.jsx'

export default function ProfielScreen({ currentMember, groups, onLogout }) {
  const [step, setStep] = useState(1) // 1=overzicht, 2=pin wijzigen
  const [huidig, setHuidig] = useState('')
  const [nieuw, setNieuw] = useState('')
  const [nieuw2, setNieuw2] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [saving, setSaving] = useState(false)

  const handleChangePin = async () => {
    if (nieuw !== nieuw2) { setError('Pincodes komen niet overeen'); return }
    setSaving(true); setError('')
    try {
      await changePin(currentMember.id, huidig, nieuw)
      setSuccess(true)
      setStep(1)
      setHuidig(''); setNieuw(''); setNieuw2('')
    } catch (e) {
      setError(e.message)
    }
    setSaving(false)
  }

  const pinMismatch = nieuw2.length === 4 && nieuw2 !== nieuw

  return (
    <div style={{ flex: 1, overflowY: 'auto', background: T.bg }}>

      {/* Profiel kaart */}
      <div style={{ background: T.surface, borderTop: `1px solid ${T.border}`, borderBottom: `1px solid ${T.border}`, padding: '20px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ width: 52, height: 52, borderRadius: '50%', background: T.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 800, color: T.white }}>
          {currentMember?.name?.[0]}
        </div>
        <div>
          <div style={{ fontWeight: 800, fontSize: 18, color: T.text }}>{currentMember?.name}</div>
          <div style={{ fontSize: 12, color: T.textMuted, marginTop: 2 }}>Lid van {groups.length} groep{groups.length !== 1 ? 'en' : ''}</div>
        </div>
      </div>

      {/* Groepen */}
      <SectionTitle>Mijn groepen</SectionTitle>
      <div style={{ background: T.surface, borderTop: `1px solid ${T.border}`, borderBottom: `1px solid ${T.border}` }}>
        {groups.map((g, i) => (
          <div key={g.id}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px' }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: g.color || T.accent, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{g.naam}</div>
                <div style={{ fontSize: 11, color: T.textMuted }}>{g.rol}</div>
              </div>
            </div>
            {i < groups.length - 1 && <Divider />}
          </div>
        ))}
        {groups.length === 0 && (
          <div style={{ padding: '16px', fontSize: 13, color: T.textMuted, textAlign: 'center' }}>
            Nog geen groepen
          </div>
        )}
      </div>

      {/* Pincode wijzigen */}
      <SectionTitle>Beveiliging</SectionTitle>
      <div style={{ background: T.surface, borderTop: `1px solid ${T.border}`, borderBottom: `1px solid ${T.border}`, padding: '14px 16px' }}>
        {success && step === 1 && (
          <div style={{ background: T.greenBg, border: `1px solid ${T.greenBorder}`, borderRadius: 6, padding: '10px 12px', marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.green }}>✓ Pincode gewijzigd</div>
          </div>
        )}

        {step === 1 && (
          <Btn onClick={() => { setStep(2); setSuccess(false) }}>🔐 Pincode wijzigen</Btn>
        )}

        {step === 2 && (
          <>
            <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 14 }}>Pincode wijzigen</div>
            {[
              ['Huidige pincode', huidig, setHuidig],
              ['Nieuwe pincode', nieuw, setNieuw],
              ['Herhaal nieuwe pincode', nieuw2, setNieuw2],
            ].map(([label, val, setter]) => (
              <div key={label}>
                <Lbl>{label}</Lbl>
                <input
                  type="password" inputMode="numeric" maxLength={4}
                  value={val} onChange={e => { setter(e.target.value); setError('') }}
                  placeholder="••••"
                  style={{ width: '100%', background: T.surfaceAlt, border: `1px solid ${T.borderDark}`, borderRadius: 6, padding: '10px', color: T.text, fontFamily: "'Outfit',sans-serif", fontSize: 20, outline: 'none', textAlign: 'center', letterSpacing: 6, marginBottom: 10, boxSizing: 'border-box' }}
                />
              </div>
            ))}
            {pinMismatch && <div style={{ fontSize: 11, color: T.red, fontWeight: 600, marginBottom: 8 }}>Pincodes komen niet overeen</div>}
            {error && <div style={{ fontSize: 11, color: T.red, fontWeight: 600, marginBottom: 8 }}>{error}</div>}
            <div style={{ display: 'flex', gap: 8 }}>
              <Btn onClick={handleChangePin} disabled={huidig.length < 4 || nieuw.length < 4 || nieuw !== nieuw2 || saving} small>
                {saving ? 'Opslaan…' : 'Opslaan'}
              </Btn>
              <Btn variant="ghost" onClick={() => { setStep(1); setHuidig(''); setNieuw(''); setNieuw2(''); setError('') }} small>
                Annuleren
              </Btn>
            </div>
          </>
        )}
      </div>

      {/* Uitloggen */}
      <SectionTitle>Account</SectionTitle>
      <div style={{ background: T.surface, borderTop: `1px solid ${T.border}`, borderBottom: `1px solid ${T.border}`, padding: '14px 16px' }}>
        <button onClick={onLogout} style={{ width: '100%', padding: '11px', background: 'transparent', border: `1px solid ${T.border}`, borderRadius: 4, color: T.textMuted, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: "'Outfit',sans-serif" }}>
          Uitloggen
        </button>
      </div>
      <div style={{ height: 32 }} />
    </div>
  )
}
