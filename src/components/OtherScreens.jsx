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
    {
      icon: '👋',
      title: '1. Account aanmaken',
      text: 'Kies een naam en stel een pincode in van 4 cijfers. Je kunt daarna een nieuwe groep aanmaken of joinen via een uitnodigingslink van iemand anders.',
    },
    {
      icon: '👥',
      title: '2. Groepen',
      text: 'Je kunt lid zijn van meerdere groepen — bv. "Vrienden" en "Familie". Elke groep heeft zijn eigen activiteiten en wishlist. Op het dashboard zie je in één oogopslag wat er speelt per groep.',
    },
    {
      icon: '📲',
      title: '3. Iemand uitnodigen',
      text: 'Ga naar Groepsbeheer en genereer een uitnodigingslink. Die is 7 dagen geldig en maximaal 10 keer te gebruiken. Stuur de link via WhatsApp — de ontvanger kan meteen joinen, met een nieuw of bestaand account.',
    },
    {
      icon: '📅',
      title: '4. Beschikbaarheid opgeven',
      text: 'Tik op "Mijn beschikbaarheid" op het dashboard. Klik de dagen aan waarop jij vrij bent. Dit geldt automatisch voor al je groepen — je hoeft het maar één keer in te vullen. Na twee weken verloopt het en vraagt de app je het bij te werken.',
    },
    {
      icon: '👀',
      title: '5. Zie wanneer iedereen kan',
      text: 'De app laat per groep meteen zien op welke dagen iedereen vrij is. Groen = iedereen kan. De statistieken bovenaan tonen de eerstvolgende vrije datum, of er iets van jou gevraagd wordt, en wat de volgende geplande activiteit is.',
    },
    {
      icon: '🎯',
      title: '6. Activiteit plannen',
      text: 'Tik op "+ Activiteit plannen". Kies een idee van de wishlist of bedenk iets nieuws. De app toont de beste datums op basis van ieders beschikbaarheid. Kies datum en tijd, maak de activiteit aan en stuur een WhatsApp naar de groep.',
    },
    {
      icon: '✅',
      title: '7. Bevestigen',
      text: 'De anderen ontvangen een link via WhatsApp. Ze openen de app en bevestigen met één tik — je bent al ingelogd, dus geen pincode nodig. Zodra iedereen bevestigd heeft staat de activiteit officieel gepland.',
    },
    {
      icon: '🗺️',
      title: 'Wishlist',
      text: 'Ideeën die jullie ooit willen doen staan op de wishlist. Iedereen kan ideeën toevoegen, bewerken en met een 👊 aangeven dat hij het een goed idee vindt. Bij het plannen van een activiteit kun je direct een idee van de wishlist pakken — gesorteerd op meeste stemmen.',
    },
    {
      icon: '📦',
      title: 'Archief',
      text: 'Activiteiten worden automatisch gearchiveerd zodra de datum voorbij is. Je kunt ze altijd terugvinden in het Archief tabblad.',
    },
    {
      icon: '⚠️',
      title: 'Verlopen beschikbaarheid',
      text: 'Als iemands beschikbaarheid verloopt telt die nog steeds mee — maar je ziet een waarschuwing. De datums zijn dan indicatief. Stuur diegene een herinnering om zijn beschikbaarheid bij te werken.',
    },
    {
      icon: '🔐',
      title: 'Pincode',
      text: 'Je stelt zelf een 4-cijferige pincode in bij het registreren. Die kun je altijd wijzigen via je profiel (tik op jouw initiaal rechtsboven). Vergeten? Vraag de beheerder om je pin te resetten.',
    },
  ]

  return (
    <div style={{ flex: 1, overflowY: 'auto', background: T.bg }}>
      <div style={{ background: T.navBg, padding: '16px 16px 20px' }}>
        <div style={{ fontSize: 13, color: '#aaa', lineHeight: 1.6 }}>
          Wanneer maakt het makkelijk om samen iets af te spreken — zonder eindeloos appjes heen en weer. Iedereen geeft beschikbaarheid op, de app berekent wanneer het kan, en één iemand plant de activiteit.
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
