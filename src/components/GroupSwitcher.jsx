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
        color: overlapDate ? '#34d399' : '#666',
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
        color: planned[0] ? '#34d399' : '#666',
      },
    ]
  }

  const multi = groups.length > 1

  return (
    <div style={{ background: T.navBg, padding: '4px 10px 8px', flexShrink: 0 }}>
      {groups.map((group, idx) => {
        const isActive = group.id === activeGroup?.id
        const stats = computeStats(group)
        return (
          <div key={group.id}>
            <div
              onClick={() => multi && !isActive && onSwitch(group)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 0,
                padding: '7px 8px',
                borderRadius: 7,
                cursor: multi && !isActive ? 'pointer' : 'default',
                background: isActive && multi ? 'rgba(255,255,255,0.09)' : 'transparent',
              }}
            >
              {/* Stip + naam */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: 100, flexShrink: 0 }}>
                {multi && (
                  <div style={{
                    width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
                    background: isActive ? T.accent : '#444',
                  }} />
                )}
                <div style={{
                  fontSize: 12, fontWeight: 700,
                  color: isActive || !multi ? T.white : '#666',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  {group.naam}
                </div>
              </div>

              {/* Stats */}
              <div style={{ display: 'flex', flex: 1 }}>
                {stats.map(({ label, value, sub, color }, i) => (
                  <div key={label} style={{
                    flex: 1, minWidth: 0,
                    paddingLeft: 10,
                    borderLeft: `1px solid rgba(255,255,255,${isActive ? '0.08' : '0.04'})`,
                  }}>
                    <div style={{ fontSize: 8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.7px', color: '#555', marginBottom: 3 }}>
                      {label}
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 800, color, lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {value}
                    </div>
                    <div style={{ fontSize: 9, color: '#555', marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {sub}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Dunne scheidingslijn tussen groepen */}
            {idx < groups.length - 1 && (
              <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', margin: '0 8px' }} />
            )}
          </div>
        )
      })}
    </div>
  )
}
