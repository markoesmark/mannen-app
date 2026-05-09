import { useState } from 'react'
import { T, generateWeeks, isExpired } from '../lib/helpers.js'
import { saveAvailability } from '../lib/supabase.js'
import { DayCell, Btn, SectionTitle } from './UI.jsx'

export default function AvailabilityScreen({ availability, members, currentMember, onSaved }) {
  const myAvail = availability.find(a => a.member_id === currentMember?.id)
  const [selected, setSelected] = useState(new Set(myAvail?.days || []))
  const [weekOffset, setWeekOffset] = useState(0)
  const [saving, setSaving] = useState(false)

  const weeks = generateWeeks(8)
  const visibleWeeks = weeks.slice(weekOffset, weekOffset + 3)
  const today = new Date().toISOString().split('T')[0]

  const toggle = (date) => setSelected(prev => {
    const n = new Set(prev)
    n.has(date) ? n.delete(date) : n.add(date)
    return n
  })

  const handleSave = async () => {
    setSaving(true)
    try {
      await saveAvailability(currentMember.id, [...selected])
      onSaved()
    } catch (e) {
      alert('Opslaan mislukt: ' + e.message)
    }
    setSaving(false)
  }

  // Wie is er vrij op een bepaalde dag (anderen dan jijzelf)
  const othersOnDay = (date) => members.filter(m => {
    if (m.id === currentMember?.id) return false
    const av = availability.find(a => a.member_id === m.id)
    return av?.days?.includes(date)
  })

  return (
    <div style={{ flex: 1, overflowY: 'auto', background: T.bg }}>
      <div style={{ background: T.surface, borderBottom: `1px solid ${T.border}`, padding: '12px 16px' }}>
        <div style={{ fontSize: 13, color: T.textMuted, marginBottom: 10 }}>
          Klik de dagen aan waarop jij vrij bent. Verloopt automatisch na 2 weken.
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button onClick={() => setWeekOffset(Math.max(0, weekOffset - 1))} disabled={weekOffset === 0}
            style={{ background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 4, padding: '8px 14px', cursor: 'pointer', fontSize: 13, fontFamily: "'Outfit',sans-serif", color: T.text, fontWeight: 600, opacity: weekOffset === 0 ? 0.35 : 1 }}>
            ‹ Eerder
          </button>
          <span style={{ fontSize: 12, color: T.textMuted, fontWeight: 600 }}>
            {visibleWeeks[0]?.label} – {visibleWeeks[2]?.label}
          </span>
          <button onClick={() => setWeekOffset(Math.min(weeks.length - 3, weekOffset + 1))} disabled={weekOffset >= weeks.length - 3}
            style={{ background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 4, padding: '8px 14px', cursor: 'pointer', fontSize: 13, fontFamily: "'Outfit',sans-serif", color: T.text, fontWeight: 600, opacity: weekOffset >= weeks.length - 3 ? 0.35 : 1 }}>
            Later ›
          </button>
        </div>
      </div>

      <div style={{ padding: '12px 16px' }}>
        {visibleWeeks.map(week => (
          <div key={week.key} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: '12px', marginBottom: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 8 }}>
              {week.label} — {week.month}
            </div>
            <div style={{ display: 'flex', gap: 3, marginBottom: 4 }}>
              {week.days.map(d => (
                <div key={d.k} style={{ flex: 1, textAlign: 'center', fontSize: 10, color: T.textMuted, fontWeight: 600, paddingBottom: 3 }}>{d.k}</div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 3, marginBottom: 5 }}>
              {week.days.map(d => {
                const sel = selected.has(d.fullDate)
                const others = othersOnDay(d.fullDate)
                const isPast = d.fullDate < today
                return (
                  <DayCell
                    key={d.fullDate}
                    selected={sel}
                    count={sel ? others.length + 1 : others.length}
                    total={members.length}
                    past={isPast}
                    onClick={() => !isPast && toggle(d.fullDate)}
                  >
                    {d.n}
                  </DayCell>
                )
              })}
            </div>
            {/* Initialen andere leden */}
            <div style={{ display: 'flex', gap: 3 }}>
              {week.days.map(d => {
                const others = othersOnDay(d.fullDate)
                return (
                  <div key={d.fullDate} style={{ flex: 1, textAlign: 'center', fontSize: 9, color: T.textMuted, lineHeight: 1.4 }}>
                    {others.map(m => m.name[0]).join('')}
                  </div>
                )
              })}
            </div>
          </div>
        ))}

        {/* Legenda */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
          {[['Jij', T.red], ['Iedereen vrij', T.green], ['Gedeeltelijk', T.amber]].map(([label, color]) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, background: color }} />
              <span style={{ fontSize: 11, color: T.textMuted }}>{label}</span>
            </div>
          ))}
        </div>

        <div style={{ fontSize: 12, color: T.red, fontWeight: 700, marginBottom: 16 }}>
          {selected.size} dagen geselecteerd
        </div>
        <Btn disabled={selected.size === 0 || saving} onClick={handleSave}>
          {saving ? 'Opslaan…' : '✓ Opslaan'}
        </Btn>
      </div>
    </div>
  )
}
