import { T, formatDate } from '../lib/helpers.js'

export default function GroupSwitcher({ groups, availability, activeGroup, onSwitch, currentMember }) {
  function computeStats(group) {
    const acts = (group.activities || []).filter(a => a.status !== 'geweest')
    const pending = acts.filter(a => a.status === 'bevestigen')
    const planned = acts.filter(a => a.status === 'gepland')
    const myPending = pending.find(a =>
      !(a.confirmations?.map(c => c.member_id) || []).includes(currentMember?.id)
    )
    const today = new Date().toISOString().split('T')[0]
    const leden = group.leden || []
    const allDates = [...new Set(
      leden.flatMap(lid => {
        const av = availability.find(a => a.member_id === lid.id)
        return (av?.days || []).filter(d => d >= today)
      })
    )]
    const overlapDate = allDates.filter(date =>
      leden.every(lid => {
        const av = availability.find(a => a.member_id === lid.id)
        return av?.days?.includes(date)
      })
    ).sort()[0] || null

    return [
      {
        label: 'Eerst vrij',
        value: overlapDate ? formatDate(overlapDate) : '—',
        sub: overlapDate ? 'iedereen kan' : 'geen overlap',
        color: overlapDate ? '#34d399' : '#888',
      },
      {
        label: 'Jouw actie',
        value: myPending ? myPending.title : '✓ niets',
        sub: myPending ? 'bevestig aanwezigheid' : 'alles up-to-date',
        color: myPending ? '#fbbf24' : '#34d399',
      },
      {
        label: 'Volgende',
        value: planned[0]?.title || '—',
        sub: planned[0] ? formatDate(planned[0].best_date) : 'niets gepland',
        color: planned[0] ? '#34d399' : '#888',
      },
    ]
  }

  const multi = groups.length > 1

  return (
    <>
      {/* Mobiel — donkere strip */}
      <div className="stats-mobile" style={{ background: T.navBg, padding: '0 12px 12px', gap: 8, overflowX: 'auto', flexShrink: 0 }}>
        {groups.map(group => {
          const isActive = group.id === activeGroup?.id
          const stats = computeStats(group)
          return (
            <div
              key={group.id}
              onClick={() => multi && !isActive && onSwitch(group)}
              style={{
                flex: 1,
                minWidth: multi ? 140 : 0,
                background: isActive && multi ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.06)',
                border: `1px solid ${isActive && multi ? 'rgba(255,255,255,0.2)' : 'transparent'}`,
                borderRadius: 8,
                padding: '9px 10px',
                cursor: multi && !isActive ? 'pointer' : 'default',
              }}
            >
              {multi && (
                <div style={{ fontSize: 10, fontWeight: 800, color: isActive ? T.white : '#777', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {group.naam}
                </div>
              )}
              <div style={{ display: 'flex', gap: 6 }}>
                {stats.map(({ label, value, sub, color }) => (
                  <div key={label} style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 9, color: '#888', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 4 }}>{label}</div>
                    <div style={{ fontSize: 12, fontWeight: 800, color, lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{value}</div>
                    <div style={{ fontSize: 9, color: '#888', marginTop: 2 }}>{sub}</div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Desktop — witte kaarten */}
      <div className="desktop-stats" style={{ padding: '20px 20px 4px', gap: 12, flexShrink: 0 }}>
        {groups.map(group => {
          const isActive = group.id === activeGroup?.id
          const stats = computeStats(group)
          return (
            <div
              key={group.id}
              onClick={() => multi && !isActive && onSwitch(group)}
              style={{
                background: T.surface,
                border: `1px solid ${isActive && multi ? T.accent : T.border}`,
                borderRadius: 8,
                padding: '14px 16px',
                flex: 1,
                cursor: multi && !isActive ? 'pointer' : 'default',
              }}
            >
              {multi && (
                <div style={{ fontSize: 11, fontWeight: 800, color: isActive ? T.accent : T.textMuted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {group.naam}
                </div>
              )}
              <div style={{ display: 'flex', gap: 12 }}>
                {stats.map(({ label, value, color }, i) => (
                  <div key={label} style={{ flex: 1, minWidth: 0, borderLeft: i > 0 ? `1px solid ${T.border}` : 'none', paddingLeft: i > 0 ? 12 : 0 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase', color: T.textMuted, marginBottom: 6 }}>{label}</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{value}</div>
                    <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>{stats[i].sub}</div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}
