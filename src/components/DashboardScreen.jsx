import { T, formatDate, isExpired, daysUntilExpiry } from '../lib/helpers.js'

const AVATAR_COLORS = ['#0066ff', '#e67e22', '#2980b9', '#27ae60', '#8e44ad', '#e74c3c']

export default function DashboardScreen({ groups, availability, activities, currentMember, onOpenGroup, onNewGroup, onOpenAvailability, onProfiel }) {
  const myAvail = availability.find(a => a.member_id === currentMember?.id)
  const expired = !myAvail || isExpired(myAvail.expires_at)
  const expiring = myAvail && !expired && daysUntilExpiry(myAvail.expires_at) <= 4
  const daysLeft = myAvail ? daysUntilExpiry(myAvail.expires_at) : 0

  return (
    <div style={{ background: T.navBg, minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: "'Outfit',sans-serif" }}>

      {/* Header */}
      <div style={{ background: T.navBg, paddingTop: 'env(safe-area-inset-top, 0px)', position: 'sticky', top: 0, zIndex: 300 }}>
        <div style={{ padding: '0 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 52 }}>
          <div style={{ background: T.accent, borderRadius: 4, padding: '3px 9px', fontWeight: 900, fontSize: 15, color: T.white, letterSpacing: '-0.5px' }}>wanneer</div>
          <div onClick={onProfiel} style={{ width: 34, height: 34, borderRadius: '50%', background: T.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: T.white, cursor: 'pointer' }}>
            {currentMember?.name?.[0]}
          </div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', background: T.bg }}>
        <div style={{ padding: '16px 16px 4px' }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: T.text }}>Hey {currentMember?.name} 👋</div>
          <div style={{ fontSize: 13, color: T.textMuted, marginTop: 3 }}>Jouw groepen</div>
        </div>

        {/* Beschikbaarheid nudge */}
        {(expired || expiring) && (
          <div onClick={onOpenAvailability} style={{ margin: '10px 16px', background: expired ? T.redLight : T.amberBg, border: `1px solid ${expired ? T.redBorder : T.amberBorder}`, borderRadius: 8, padding: '11px 14px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 13, color: expired ? T.red : T.amber }}>
                {expired ? '⚠ Jouw beschikbaarheid is verlopen' : `⏱ Verloopt over ${daysLeft} dagen`}
              </div>
              <div style={{ fontSize: 12, color: T.textMuted, marginTop: 2 }}>Tik om bij te werken →</div>
            </div>
          </div>
        )}

        {/* Groepskaarten */}
        <div style={{ padding: '8px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {groups.map(group => {
            // Stats berekenen voor deze groep
            const groupActivities = activities.filter(a => a.group_id === group.id && a.status !== 'geweest')
            const pending = groupActivities.filter(a => a.status === 'bevestigen')
            const planned = groupActivities.filter(a => a.status === 'gepland')
            const myPending = pending.find(a => !(a.confirmations?.map(c => c.member_id) || []).includes(currentMember?.id))
            const eersteGepland = planned[0]

            // Overlap berekenen op basis van group.leden
            const groupLeden = group.leden || []
            const today = new Date().toISOString().split('T')[0]
            const allDates = new Set()
            groupLeden.forEach(lid => {
              const av = availability.find(a => a.member_id === lid.id)
              av?.days?.filter(d => d >= today).forEach(d => allDates.add(d))
            })
            const overlapDate = [...allDates].filter(date =>
              groupLeden.every(lid => {
                const av = availability.find(a => a.member_id === lid.id)
                return av?.days?.includes(date)
              })
            ).sort()[0]

            return (
              <div key={group.id} onClick={() => onOpenGroup(group)} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14, overflow: 'hidden', cursor: 'pointer' }}>
                {/* Groep header */}
                <div style={{ background: group.color || T.accent, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontWeight: 800, fontSize: 16, color: T.white }}>{group.naam}</div>
                  <div style={{ display: 'flex' }}>
                    {(group.leden || []).slice(0, 4).map((lid, i) => (
                      <div key={lid.id || i} style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(255,255,255,0.3)', border: '2px solid rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, color: T.white, marginLeft: i > 0 ? -6 : 0 }}>
                        {(lid.name || lid)[0]}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Stats */}
                <div style={{ display: 'flex', borderTop: `1px solid ${T.border}` }}>
                  {[
                    { label: 'Eerst vrij', value: overlapDate ? formatDate(overlapDate) : '—', color: overlapDate ? T.green : T.textMuted },
                    { label: 'Jouw actie', value: myPending ? myPending.title : '✓ niets', color: myPending ? T.amber : T.green },
                    { label: 'Volgende', value: eersteGepland ? eersteGepland.title : '—', color: eersteGepland ? T.green : T.textMuted },
                  ].map(({ label, value, color }, i) => (
                    <div key={label} style={{ flex: 1, padding: '9px 10px', borderRight: i < 2 ? `1px solid ${T.border}` : 'none' }}>
                      <div style={{ fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px', color: T.textMuted, marginBottom: 3 }}>{label}</div>
                      <div style={{ fontSize: 11, fontWeight: 800, color, lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{value}</div>
                    </div>
                  ))}
                </div>

                {/* Actie banner */}
                {myPending && (
                  <div style={{ padding: '8px 14px', background: T.amberBg, borderTop: `1px solid ${T.amberBorder}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 12, color: T.amber, fontWeight: 600 }}>⏳ {myPending.title} wacht op jouw bevestiging</span>
                    <span style={{ color: T.amber }}>›</span>
                  </div>
                )}
              </div>
            )
          })}

          {/* Nieuwe groep */}
          <button onClick={onNewGroup} style={{ width: '100%', padding: '14px', background: T.surface, border: `1px dashed ${T.borderDark}`, borderRadius: 14, color: T.textMuted, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'Outfit',sans-serif" }}>
            + Nieuwe groep aanmaken
          </button>
        </div>

        {/* Mijn beschikbaarheid */}
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '1.2px', textTransform: 'uppercase', color: T.textMuted, padding: '14px 16px 7px' }}>
          Mijn beschikbaarheid
        </div>
        <div onClick={onOpenAvailability} style={{ background: T.surface, borderTop: `1px solid ${T.border}`, borderBottom: `1px solid ${T.border}`, padding: '13px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: T.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: T.white }}>{currentMember?.name?.[0]}</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: T.text }}>{currentMember?.name} (jij)</div>
              <div style={{ fontSize: 11, color: T.textMuted }}>{myAvail?.days?.length || 0} vrije dagen · geldig voor alle groepen</div>
            </div>
          </div>
          {expired
            ? <span style={{ background: T.redLight, border: `1px solid ${T.redBorder}`, borderRadius: 4, padding: '3px 8px', fontSize: 11, fontWeight: 700, color: T.red }}>verlopen</span>
            : <span style={{ background: T.greenBg, border: `1px solid ${T.greenBorder}`, borderRadius: 4, padding: '3px 8px', fontSize: 11, fontWeight: 700, color: T.green }}>✓ actueel</span>
          }
        </div>
        <div style={{ height: 32 }} />
      </div>
    </div>
  )
}
