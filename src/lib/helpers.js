// ─── THEME ────────────────────────────────────────────────────────────────────
export const T = {
  bg: '#f4f4f2', surface: '#ffffff', surfaceAlt: '#f0f0ee',
  navBg: '#1a1a1a',
  text: '#111111', textMid: '#444444', textMuted: '#888888', white: '#ffffff',
  red: '#cc0000', redDark: '#a50000', redLight: '#fff0f0', redBorder: '#ffcccc',
  green: '#1a7a3c', greenBg: '#edf7f1', greenBorder: '#b3dfc4',
  amber: '#8a5c00', amberBg: '#fff8e6', amberBorder: '#ffd97a',
  border: '#e0e0de', borderDark: '#c8c8c5',
}

// ─── WEEK GENERATOR ───────────────────────────────────────────────────────────
// Genereer 8 weken vooruit vanaf vandaag
export function generateWeeks(count = 8) {
  const weeks = []
  const today = new Date()
  // Naar maandag van huidige week
  const monday = new Date(today)
  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7))

  const dayNames = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo']
  const monthNames = ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec']

  for (let w = 0; w < count; w++) {
    const weekStart = new Date(monday)
    weekStart.setDate(monday.getDate() + w * 7)
    const year = weekStart.getFullYear()
    const weekNum = getWeekNumber(weekStart)
    const key = `${year}-W${String(weekNum).padStart(2, '0')}`

    const days = []
    for (let d = 0; d < 7; d++) {
      const date = new Date(weekStart)
      date.setDate(weekStart.getDate() + d)
      days.push({
        k: dayNames[d],
        n: date.getDate(),
        month: monthNames[date.getMonth()],
        fullDate: date.toISOString().split('T')[0], // YYYY-MM-DD voor Supabase
      })
    }

    weeks.push({
      key,
      label: `Week ${weekNum}`,
      month: monthNames[weekStart.getMonth()],
      days,
    })
  }
  return weeks
}

function getWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7)
}

// ─── DATE HELPERS ─────────────────────────────────────────────────────────────
export function formatDate(isoDate) {
  if (!isoDate) return ''
  const d = new Date(isoDate)
  const dayNames = ['Zo', 'Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za']
  const monthNames = ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec']
  return `${dayNames[d.getDay()]} ${d.getDate()} ${monthNames[d.getMonth()]}`
}

export function formatTijd(startTime, endTime) {
  if (!startTime) return null
  const trim = (t) => t ? t.slice(0, 5) : null  // "20:00:00" → "20:00"
  if (!endTime) return trim(startTime)
  return `${trim(startTime)} – ${trim(endTime)}`
}

export function isExpired(expiresAt) {
  if (!expiresAt) return true
  return new Date(expiresAt) < new Date()
}

export function daysUntilExpiry(expiresAt) {
  if (!expiresAt) return 0
  const diff = new Date(expiresAt) - new Date()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

// ─── WHATSAPP ─────────────────────────────────────────────────────────────────
export function buildWhatsAppUrl(phoneNumber, activity, appBaseUrl) {
  const datum = formatDate(activity.best_date)
  const tijd = formatTijd(activity.start_time, activity.end_time)
  const tijdStr = tijd ? `, ${tijd}` : ''
  const link = `${appBaseUrl}/bevestig/${activity.id}`

  const message = `Hey! Er staat een activiteit klaar: *${activity.title}* op *${datum}${tijdStr}* in ${activity.location}. Bevestig je aanwezigheid via: ${link}`
  return `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`
}

export function buildNudgeWhatsApp(activityTitle, members, currentMember, appBaseUrl) {
  const title = activityTitle ? ` voor *${activityTitle}*` : ''
  const message = `Hey mannen! Ik wil iets plannen${title} maar er is nog geen beschikbaarheid opgegeven. Kunnen jullie even jullie beschikbaarheid invullen? ${appBaseUrl}`
  return `https://wa.me/?text=${encodeURIComponent(message)}`
}

export function buildDateNudgeWhatsApp(activityTitle, chosenDate, appBaseUrl) {
  const datum = formatDate(chosenDate)
  const title = activityTitle ? `*${activityTitle}*` : 'een activiteit'
  const message = `Hey mannen, ik wil ${title} plannen maar die datum vind ik niet top. Kunnen jullie meer beschikbaarheid opgeven? ${appBaseUrl}`
  return `https://wa.me/?text=${encodeURIComponent(message)}`
}

export function buildGroupWhatsAppMessage(activity, members, confirmations, appBaseUrl) {
  const datum = formatDate(activity.best_date)
  const tijd = formatTijd(activity.start_time, activity.end_time)
  const tijdStr = tijd ? `, ${tijd}` : ''
  const link = `${appBaseUrl}/bevestig/${activity.id}`
  const statusLines = members.map(m => {
    const confirmed = confirmations.some(c => c.member_id === m.id)
    return `${confirmed ? '✅' : '⏳'} ${m.name}`
  }).join('\n')
  const message = `📅 *${activity.title}* — ${datum}${tijdStr}\n📍 ${activity.location}\n\n${statusLines}\n\nBevestig via: ${link}`
  return `https://wa.me/?text=${encodeURIComponent(message)}`
}

export function downloadICS(activity) {
  const title = activity.title
  const location = activity.location || ''
  const date = activity.best_date?.replace(/-/g, '') // "2025-05-17" → "20250517"

  // Bouw start en eindtijd op
  const startTime = activity.start_time?.slice(0, 5).replace(':', '') || '090000'
  const endTime = activity.end_time?.slice(0, 5).replace(':', '') || '180000'
  const dtStart = `${date}T${startTime}00`
  const dtEnd = `${date}T${endTime}00`

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Mannen App//NL',
    'BEGIN:VEVENT',
    `UID:${activity.id}@mannen-app`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:.]/g, '').slice(0, 15)}Z`,
    `DTSTART;TZID=Europe/Amsterdam:${dtStart}`,
    `DTEND;TZID=Europe/Amsterdam:${dtEnd}`,
    `SUMMARY:${title}`,
    `LOCATION:${location}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')

  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${title.replace(/\s+/g, '-').toLowerCase()}.ics`
  a.click()
  URL.revokeObjectURL(url)
}
