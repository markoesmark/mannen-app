import { T, formatDate, formatTijd, isExpired, daysUntilExpiry } from '../lib/helpers.js'
import { SectionTitle, Divider, StatusBadge, MemberChip } from './UI.jsx'

function ActivityRow({ activity, members, onClick }) {
  const confirmIds = activity.confirmations?.map(c => c.member_id) || []
  return (
    <div onClick={onClick} style={{ padding: '13px 16px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
      <div style={{ flex: 1 }}>
        <div style={{ marginBottom: 4 }}><StatusBadge status={activity.status} /></div>
        <div style={{ fontWeight: 800, fontSize: 15, color: T.text, marginBottom: 4, lineHeight: 1.25 }}>{activity.title}</div>
        <div style={{ fontSize: 12, color: T.textMuted, marginBottom: 6 }}>
          📅 {formatDate(activity.best_date)}
          {activity.start_time ? ` · 🕐 ${formatTijd(activity.start_time, activity.end_time)}` : ''}
          {' · '}📍 {activity.location}
        </div>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {members.map(m => <MemberChip key={m.id} active={confirmIds.includes(m.id)}>{m.name}</MemberChip>)}
        </div>
      </div>
      <span style={{ color: T.textMuted, fontSize: 18, marginTop: 2 }}>›</span>
    </div>
  )
}

export default function HomeScreen({ activities, availability, members, currentMember, onOpenActivity, onOpenAvailability, onNewActivity }) {
  const myAvail = availability.find(a => a.member_id === currentMember?.id)
  const expired = !myAvail || isExpired(myAvail.expires_at)
  const expiring = myAvail && !expired && daysUntilExpiry(myAvail.expires_at) <= 4
  const daysLeft = myAvail ? daysUntilExpiry(myAvail.expires_at) : 0

  const pending = activities.filter(a => a.status === 'bevestigen')
  const planned = activities.filter(a => a.status === 'gepland')

  // Bereken overlappende datums
  const overlapDays = calculateOverlap(availability, members)

  const avatarColors = [T.red, '#e67e22', '#2980b9', '#27ae60']

  return (
    <div style={{ flex: 1, overflowY: 'auto', background: T.bg }}>

      {/* Mijn beschikbaarheid */}
      <SectionTitle>Mijn beschikbaarheid</SectionTitle>
      <div onClick={onOpenAvailability} style={{ background: T.surface, borderTop: `1px solid ${T.border}`, borderBottom: `1px solid ${T.border}`, padding: '14px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: T.red, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: T.white }}>
              {currentMember?.name?.[0]}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: T.text }}>{currentMember?.name} (jij)</div>
              <div style={{ fontSize: 11, color: T.textMuted }}>{myAvail?.days?.length || 0} vrije dagen opgegeven</div>
            </div>
          </div>
          {expired && (
            <div style={{ background: T.redLight, border: `1px solid ${T.redBorder}`, borderRadius: 4, padding: '6px 10px', fontSize: 12, fontWeight: 700, color: T.red }}>
              ⚠ Verlopen — tik om bij te werken
            </div>
          )}
          {expiring && (
            <div style={{ background: T.amberBg, border: `1px solid ${T.amberBorder}`, borderRadius: 4, padding: '6px 10px', fontSize: 12, fontWeight: 700, color: T.amber }}>
              ⏱ Verloopt over {daysLeft} dagen — tik om bij te werken
            </div>
          )}
          {!expired && !expiring && (
            <div style={{ background: T.greenBg, border: `1px solid ${T.greenBorder}`, borderRadius: 4, padding: '6px 10px', fontSize: 12, fontWeight: 700, color: T.green }}>
              ✓ Actueel — nog {daysLeft} dagen geldig
            </div>
          )}
        </div>
        <div style={{ fontSize: 20, color: T.textMuted }}>›</div>
      </div>

      {/* Groep */}
      <SectionTitle>Groep</SectionTitle>
      <div style={{ background: T.surface, borderTop: `1px solid ${T.border}`, borderBottom: `1px solid ${T.border}` }}>
        {members.filter(m => m.id !== currentMember?.id).map((m, i, arr) => {
          const av = availability.find(a => a.member_id === m.id)
          const exp = !av || isExpired(av.expires_at)
          return (
            <div key={m.id}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 30, height: 30, borderRadius: '50%', background: avatarColors[(members.indexOf(m)) % 4], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: T.white }}>
                    {m.name[0]}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{m.name}</div>
                    <div style={{ fontSize: 11, color: T.textMuted }}>{av?.days?.length || 0} vrije dagen</div>
                  </div>
                </div>
                <StatusBadge status={exp ? 'verlopen' : 'actief'} />
              </div>
              {i < arr.length - 1 && <Divider />}
            </div>
          )
        })}
      </div>

      {/* Iedereen vrij */}
      {overlapDays.length > 0 && (
        <>
          <SectionTitle>Iedereen vrij{overlapDays.some(d => d.hasExpired) ? ' ⚠' : ''}</SectionTitle>
          {overlapDays.some(d => d.hasExpired) && (
            <div style={{ margin: '0 12px 8px', background: T.amberBg, border: `1px solid ${T.amberBorder}`, borderRadius: 6, padding: '8px 12px', fontSize: 12, color: T.amber, fontWeight: 600 }}>
              ⚠ Iemand heeft verlopen beschikbaarheid — datums zijn indicatief
            </div>
          )}
          <div style={{ background: T.surface, borderTop: `1px solid ${T.border}`, borderBottom: `1px solid ${T.border}` }}>
            <div style={{ padding: '10px 16px', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {overlapDays.slice(0, 5).map(({ date, hasExpired }) => (
                <span key={date} style={{ background: hasExpired ? T.amberBg : T.greenBg, border: `1px solid ${hasExpired ? T.amberBorder : T.greenBorder}`, borderRadius: 4, padding: '5px 10px', fontSize: 12, fontWeight: 700, color: hasExpired ? T.amber : T.green }}>
                  {hasExpired ? '⚠ ' : ''}{formatDate(date)}
                </span>
              ))}
              {overlapDays.length > 5 && <span style={{ fontSize: 12, color: T.textMuted, alignSelf: 'center' }}>+{overlapDays.length - 5} meer</span>}
            </div>
          </div>
        </>
      )}

      {/* Activiteiten */}
      {pending.length > 0 && (
        <>
          <SectionTitle>Wacht op bevestiging</SectionTitle>
          <div style={{ background: T.surface, borderTop: `1px solid ${T.border}`, borderBottom: `1px solid ${T.border}` }}>
            {pending.map((a, i) => (
              <div key={a.id}>
                <ActivityRow activity={a} members={members} onClick={() => onOpenActivity(a)} />
                {i < pending.length - 1 && <Divider />}
              </div>
            ))}
          </div>
        </>
      )}

      {planned.length > 0 && (
        <>
          <SectionTitle>Gepland</SectionTitle>
          <div style={{ background: T.surface, borderTop: `1px solid ${T.border}`, borderBottom: `1px solid ${T.border}` }}>
            {planned.map((a, i) => (
              <div key={a.id}>
                <ActivityRow activity={a} members={members} onClick={() => onOpenActivity(a)} />
                {i < planned.length - 1 && <Divider />}
              </div>
            ))}
          </div>
        </>
      )}

      <div style={{ padding: '16px 16px 32px' }}>
        <button onClick={onNewActivity} style={{ width: '100%', padding: '13px', borderRadius: 4, border: 'none', background: T.red, color: T.white, fontFamily: "'Outfit',sans-serif", fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
          + Activiteit plannen
        </button>
      </div>
    </div>
  )
}

function calculateOverlap(availability, members) {
  if (!availability.length || !members.length) return []

  // Verzamel alle unieke datums
  const allDates = new Set()
  availability.forEach(av => {
    if (av.days) av.days.forEach(d => allDates.add(d))
  })

  // Filter op datums waar iedereen vrij is (inclusief verlopen = indicatief)
  const today = new Date().toISOString().split('T')[0]
  const result = []

  allDates.forEach(date => {
    if (date < today) return // verleden overslaan
    const whoCanGo = members.filter(m => {
      const av = availability.find(a => a.member_id === m.id)
      return av?.days?.includes(date)
    })
    if (whoCanGo.length === members.length) {
      const hasExpired = members.some(m => {
        const av = availability.find(a => a.member_id === m.id)
        return !av || isExpired(av.expires_at)
      })
      result.push({ date, hasExpired })
    }
  })

  return result.sort((a, b) => a.date.localeCompare(b.date)).slice(0, 10)
}
