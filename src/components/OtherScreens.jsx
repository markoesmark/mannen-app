import { T, formatDate, formatTijd } from '../lib/helpers.js'
import { SectionTitle, Divider, StatusBadge } from './UI.jsx'

// ─── ARCHIEF ──────────────────────────────────────────────────────────────────
export function ArchiefScreen({ activities, onOpenActivity }) {
  const geweest = activities.filter(a => a.status === 'geweest')

  return (
    <div style={{ flex: 1, overflowY: 'auto', background: T.bg }}>
      <SectionTitle>Geweest</SectionTitle>
      {geweest.length === 0 ? (
        <div style={{ background: T.surface, borderTop: `1px solid ${T.border}`, borderBottom: `1px solid ${T.border}`, padding: '24px 16px', textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>📦</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 4 }}>Nog niets in het archief</div>
          <div style={{ fontSize: 13, color: T.textMuted }}>Activiteiten die voorbij zijn verschijnen hier automatisch.</div>
        </div>
      ) : (
        <div style={{ background: T.surface, borderTop: `1px solid ${T.border}`, borderBottom: `1px solid ${T.border}` }}>
          {geweest.map((a, i) => (
            <div key={a.id}>
              <div onClick={() => onOpenActivity(a)} style={{ padding: '13px 16px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, opacity: 0.75 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ marginBottom: 4 }}><StatusBadge status="geweest" /></div>
                  <div style={{ fontWeight: 800, fontSize: 15, color: T.text, marginBottom: 4, lineHeight: 1.25 }}>{a.title}</div>
                  <div style={{ fontSize: 12, color: T.textMuted }}>
                    📅 {formatDate(a.best_date)}
                    {a.start_time ? ` · 🕐 ${formatTijd(a.start_time, a.end_time)}` : ''}
                    {' · '}📍 {a.location}
                  </div>
                </div>
                <span style={{ color: T.textMuted, fontSize: 18, marginTop: 2 }}>›</span>
              </div>
              {i < geweest.length - 1 && <Divider />}
            </div>
          ))}
        </div>
      )}
      <div style={{ padding: '14px 16px' }}>
        <div style={{ fontSize: 12, color: T.textMuted, lineHeight: 1.6 }}>
          Activiteiten worden automatisch gearchiveerd zodra de datum voorbij is.
        </div>
      </div>
    </div>
  )
}

// ─── HELP ─────────────────────────────────────────────────────────────────────
export function HelpScreen() {
  const steps = [
    { icon: '📅', title: '1. Geef je beschikbaarheid op', text: 'Open de app en tik op de kaart "Mijn beschikbaarheid". Klik de dagen aan waarop jij vrij bent. Dit is twee weken geldig en verloopt daarna automatisch.' },
    { icon: '👀', title: '2. Zie wanneer iedereen kan', text: 'De app laat meteen zien op welke dagen iedereen vrij is. Groen = iedereen kan. Zo weet je in één oogopslag wanneer een afspraak mogelijk is.' },
    { icon: '🎯', title: '3. Stel een activiteit voor', text: 'Tik op "+ Activiteit plannen". Kies een idee van de wishlist of bedenk iets nieuws. De app toont de beste datums. Kies datum en tijd, en stuur een WhatsApp naar de groep.' },
    { icon: '✅', title: '4. Iedereen bevestigt', text: 'De anderen ontvangen een link via WhatsApp. Ze openen de app, voeren hun pincode in en bevestigen. Zodra iedereen bevestigd heeft staat de activiteit gepland.' },
    { icon: '🗺️', title: 'Wishlist', text: 'Ideeën die jullie ooit willen doen staan op de wishlist. Iedereen kan ideeën toevoegen en met een 👊 aangeven dat hij het een goed idee vindt.' },
    { icon: '⚠️', title: 'Verlopen beschikbaarheid', text: 'Als iemands beschikbaarheid verloopt telt die nog mee, maar je ziet een waarschuwing. De datums zijn dan indicatief.' },
    { icon: '🔐', title: 'Pincode', text: 'Iedereen heeft een eigen 4-cijferige pincode. Die zorgt ervoor dat alleen jij jouw bevestiging kunt geven — zonder gedoe van een account.' },
  ]

  return (
    <div style={{ flex: 1, overflowY: 'auto', background: T.bg }}>
      <div style={{ background: T.navBg, padding: '16px 16px 20px' }}>
        <div style={{ fontSize: 13, color: '#aaa', lineHeight: 1.6 }}>
          Mannen maakt het makkelijk om met z'n vieren iets af te spreken — zonder eindeloos appjes. Iedereen geeft beschikbaarheid op, de app berekent wanneer het kan, en één iemand plant de activiteit.
        </div>
      </div>
      {steps.map((s, i) => (
        <div key={i}>
          <div style={{ background: T.surface, borderTop: i === 0 ? `1px solid ${T.border}` : 'none', borderBottom: i === steps.length - 1 ? `1px solid ${T.border}` : 'none', padding: '16px' }}>
            <div style={{ display: 'flex', gap: 13, alignItems: 'flex-start' }}>
              <div style={{ fontSize: 22, flexShrink: 0, marginTop: 1 }}>{s.icon}</div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 14, color: T.text, marginBottom: 5 }}>{s.title}</div>
                <div style={{ fontSize: 13, color: T.textMid, lineHeight: 1.6 }}>{s.text}</div>
              </div>
            </div>
          </div>
          {i < steps.length - 1 && <Divider />}
        </div>
      ))}
      <div style={{ height: 32 }} />
    </div>
  )
}
