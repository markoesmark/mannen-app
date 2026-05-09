import { useState } from 'react'
import { T, generateWeeks, formatDate, formatTijd, isExpired } from '../lib/helpers.js'
import { createActivity } from '../lib/supabase.js'
import { DayCell, SectionTitle, Lbl, Inp, Btn, MemberChip } from './UI.jsx'

export default function NewActivityScreen({ availability, members, wishlist, currentMember, onCreated, onBack }) {
  const [step, setStep] = useState(1)
  const [title, setTitle] = useState('')
  const [location, setLocation] = useState('')
  const [fromWish, setFromWish] = useState(null)
  const [chosenDate, setChosenDate] = useState(null)
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [saving, setSaving] = useState(false)
  const [weekOffset, setWeekOffset] = useState(0)

  const weeks = generateWeeks(8)
  const visibleWeeks = weeks.slice(weekOffset, weekOffset + 3)
  const today = new Date().toISOString().split('T')[0]

  const pickWish = (w) => { setTitle(w.title); setLocation(w.location || ''); setFromWish(w) }

  // Bereken overlappende datums
  const topDays = calculateTopDays(availability, members, today)
  const fullDays = topDays.filter(d => d.who.length === members.length)
  const partialDays = topDays.filter(d => d.who.length < members.length)

  const handleCreate = async () => {
    setSaving(true)
    try {
      const newActivity = await createActivity({
        title: title || fromWish?.title,
        location: location || fromWish?.location || '',
        bestDate: chosenDate,
        startTime,
        endTime: endTime || null,
        fromMemberId: currentMember.id,
      })
      onCreated(newActivity)
    } catch (e) {
      alert('Aanmaken mislukt: ' + e.message)
    }
    setSaving(false)
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', background: T.bg }}>
      {/* Stap indicator */}
      <div style={{ background: T.surface, borderBottom: `1px solid ${T.border}`, padding: '10px 16px', display: 'flex', gap: 6 }}>
        {[1, 2, 3].map(n => (
          <div key={n} style={{ flex: 1, height: 4, borderRadius: 2, background: n <= step ? T.red : T.border, transition: 'background 0.25s' }} />
        ))}
      </div>

      {/* Stap 1: Details */}
      {step === 1 && (
        <div style={{ padding: '14px 16px' }}>
          <SectionTitle style={{ padding: 0, marginBottom: 10 }}>Van de wishlist?</SectionTitle>
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 14 }}>
            {wishlist.map(w => (
              <div key={w.id} onClick={() => pickWish(w)} style={{ flexShrink: 0, minWidth: 130, background: fromWish?.id === w.id ? T.redLight : T.surface, border: `1px solid ${fromWish?.id === w.id ? T.red : T.border}`, borderRadius: 6, padding: '10px 12px', cursor: 'pointer' }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: T.text, marginBottom: 3 }}>{w.title}</div>
                <div style={{ fontSize: 11, color: T.textMuted }}>📍 {w.location}</div>
                <div style={{ fontSize: 11, color: '#e67e22', marginTop: 5, fontWeight: 700 }}>👊 {w.wishlist_votes?.length || 0}</div>
              </div>
            ))}
          </div>
          <div style={{ height: 1, background: T.border, margin: '4px 0 14px' }} />
          <SectionTitle style={{ padding: 0, marginBottom: 10 }}>Of zelf invullen</SectionTitle>
          <Lbl>Activiteit</Lbl>
          <Inp value={title} onChange={e => setTitle(e.target.value)} placeholder="bv. Karting" />
          <Lbl>Locatie</Lbl>
          <Inp value={location} onChange={e => setLocation(e.target.value)} placeholder="bv. Lelystad" />
          <Btn onClick={() => setStep(2)} disabled={!title && !fromWish}>Volgende →</Btn>
        </div>
      )}

      {/* Stap 2: Datum + tijd */}
      {step === 2 && (
        <div style={{ padding: '14px 16px' }}>
          <div style={{ fontSize: 13, color: T.textMuted, marginBottom: 14 }}>
            Op basis van ieders beschikbaarheid. Groen = iedereen vrij.
          </div>

          {fullDays.length > 0 && (
            <>
              <SectionTitle style={{ padding: 0, marginBottom: 10 }}>Iedereen vrij 🎉</SectionTitle>
              {fullDays.map(({ date, who, hasExpired }) => (
                <div key={date} onClick={() => setChosenDate(date)} style={{ background: chosenDate === date ? (hasExpired ? T.amberBg : T.greenBg) : T.surface, border: `1px solid ${chosenDate === date ? (hasExpired ? T.amberBorder : T.greenBorder) : T.border}`, borderRadius: 6, padding: '12px 14px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: chosenDate === date ? (hasExpired ? T.amber : T.green) : T.text }}>{formatDate(date)}</div>
                    <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>{hasExpired ? '⚠ indicatief — ' : ''}4/4 kunnen</div>
                  </div>
                  {chosenDate === date && <span style={{ color: hasExpired ? T.amber : T.green, fontWeight: 800 }}>✓</span>}
                </div>
              ))}
            </>
          )}

          {partialDays.length > 0 && (
            <>
              <SectionTitle style={{ padding: 0, marginTop: 14, marginBottom: 10 }}>Gedeeltelijk beschikbaar</SectionTitle>
              {partialDays.map(({ date, who }) => (
                <div key={date} onClick={() => setChosenDate(date)} style={{ background: chosenDate === date ? T.amberBg : T.surface, border: `1px solid ${chosenDate === date ? T.amberBorder : T.border}`, borderRadius: 6, padding: '12px 14px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: chosenDate === date ? T.amber : T.text }}>{formatDate(date)}</div>
                    <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>{who.map(m => m.name).join(', ')} kunnen</div>
                  </div>
                  <span style={{ fontSize: 12, color: T.amber, fontWeight: 800 }}>{who.length}/{members.length}</span>
                </div>
              ))}
            </>
          )}

          {fullDays.length === 0 && partialDays.length === 0 && (
            <div style={{ background: T.redLight, border: `1px solid ${T.redBorder}`, borderRadius: 6, padding: '14px', marginBottom: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: T.red }}>Geen overlappende beschikbaarheid</div>
              <div style={{ fontSize: 12, color: T.textMuted, marginTop: 3 }}>Vraag de groep hun beschikbaarheid bij te werken.</div>
            </div>
          )}

          {/* Tijdsvelden */}
          {chosenDate && (
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: '14px', marginBottom: 12, marginTop: 8 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>Hoe laat?</div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                <div>
                  <Lbl>Begintijd</Lbl>
                  <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)}
                    style={{ width: 110, background: T.surfaceAlt, border: `1px solid ${T.borderDark}`, borderRadius: 6, padding: '8px 10px', color: T.text, fontFamily: "'Outfit',sans-serif", fontSize: 14, outline: 'none', colorScheme: 'light' }} />
                </div>
                <div style={{ paddingBottom: 10, color: T.textMuted, fontWeight: 700, fontSize: 15, flexShrink: 0 }}>–</div>
                <div>
                  <Lbl>Eindtijd</Lbl>
                  <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)}
                    style={{ width: 110, background: T.surfaceAlt, border: `1px solid ${T.borderDark}`, borderRadius: 6, padding: '8px 10px', color: T.text, fontFamily: "'Outfit',sans-serif", fontSize: 14, outline: 'none', colorScheme: 'light' }} />
                </div>
                <div style={{ paddingBottom: 9, fontSize: 11, color: T.textMuted, flexShrink: 0 }}>optioneel</div>
              </div>
            </div>
          )}

          <div style={{ marginTop: 8 }}>
            <Btn onClick={() => setStep(3)} disabled={!chosenDate || !startTime}>Volgende →</Btn>
            <Btn variant="ghost" onClick={() => setStep(1)}>← Terug</Btn>
          </div>
        </div>
      )}

      {/* Stap 3: Bevestig + WhatsApp */}
      {step === 3 && (
        <div style={{ padding: '14px 16px' }}>
          <SectionTitle style={{ padding: 0, marginBottom: 10 }}>Overzicht</SectionTitle>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: '16px', marginBottom: 20 }}>
            <div style={{ fontWeight: 800, fontSize: 18, color: T.text, marginBottom: 10 }}>{title || fromWish?.title}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <div style={{ fontSize: 13, color: T.textMid }}>📍 {location || fromWish?.location}</div>
              <div style={{ fontSize: 13, color: T.textMid }}>📅 {formatDate(chosenDate)}</div>
              <div style={{ fontSize: 13, color: T.textMid }}>🕐 {formatTijd(startTime, endTime || null)}</div>
            </div>
            <div style={{ display: 'flex', gap: 4, marginTop: 12, flexWrap: 'wrap' }}>
              {members.map(m => {
                const av = availability.find(a => a.member_id === m.id)
                const canGo = av?.days?.includes(chosenDate)
                return <MemberChip key={m.id} active={!!canGo} warn={!canGo}>{m.name}</MemberChip>
              })}
            </div>
          </div>

          <SectionTitle style={{ padding: 0, marginBottom: 10 }}>Sturen via WhatsApp</SectionTitle>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, overflow: 'hidden', marginBottom: 20 }}>
            {members.filter(m => m.id !== currentMember?.id).map((m, i, arr) => (
              <div key={m.id}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 14px' }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{m.name}</span>
                  <span style={{ background: '#25D366', borderRadius: 4, padding: '8px 13px', color: T.white, fontSize: 12, fontWeight: 700 }}>📲 WhatsApp</span>
                </div>
                {i < arr.length - 1 && <div style={{ height: 1, background: T.border }} />}
              </div>
            ))}
            <div style={{ height: 1, background: T.border }} />
            <div style={{ padding: '11px 14px' }}>
              <button style={{ width: '100%', background: '#25D366', border: 'none', borderRadius: 4, padding: '11px', color: T.white, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: "'Outfit',sans-serif" }}>
                📲 Stuur naar iedereen
              </button>
            </div>
          </div>

          <Btn onClick={handleCreate} disabled={saving}>{saving ? 'Aanmaken…' : '✓ Activiteit aanmaken'}</Btn>
          <Btn variant="ghost" onClick={() => setStep(2)}>← Terug</Btn>
        </div>
      )}
    </div>
  )
}

function calculateTopDays(availability, members, today) {
  const allDates = new Set()
  availability.forEach(av => { if (av.days) av.days.forEach(d => allDates.add(d)) })

  const result = []
  allDates.forEach(date => {
    if (date <= today) return
    const who = members.filter(m => {
      const av = availability.find(a => a.member_id === m.id)
      return av?.days?.includes(date)
    })
    if (who.length > 0) {
      const hasExpired = who.some(m => {
        const av = availability.find(a => a.member_id === m.id)
        return !av || isExpired(av.expires_at)
      })
      result.push({ date, who, hasExpired })
    }
  })

  return result.sort((a, b) => b.who.length - a.who.length || a.date.localeCompare(b.date)).slice(0, 10)
}
