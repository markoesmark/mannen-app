# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Wat is het

Een webapp waarmee vriendengroepen makkelijk samen activiteiten kunnen plannen. Iedereen geeft beschikbaarheid op, de app berekent wanneer iedereen vrij is, en één persoon plant de activiteit.

## Commands

```bash
npm run dev      # Start lokale dev server op http://localhost:5173
npm run build    # Productie build
npm run preview  # Preview productie build lokaal
```

Vereist `.env.local` met:
```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
VITE_ADMIN_PASSWORD=...
```

## Deployment

- Live: https://mannen-app.vercel.app/ (doel: verhuizen naar wanneer.vercel.app)
- Admin: https://mannen-app.vercel.app/admin — beveiligd via `VITE_ADMIN_PASSWORD`
- Push naar `main` → Vercel deployt automatisch

Werk altijd op een feature branch, nooit direct op `main`. Test lokaal voor je merget.

## Tech stack

- React + Vite (JSX)
- Supabase (PostgreSQL, RLS, realtime)
- Vercel (hosting, gratis tier)

## Architectuur

**Single-page React app** zonder router. Navigatie werkt via state in `App.jsx`:
- `appState`: `loading | login | register | app | admin`
- `view`: `dashboard | group | profiel`
- `tab`: `home | wishlist | archief` (binnen groepsview)
- Subschermen (`showNew`, `showAvail`, `showBeheer`, `activeActivity`) zijn booleans/objecten bovenop de view

**Dataflow**: Alle data en laad-functies leven in `App.jsx` en worden als props doorgegeven aan schermen. Componenten roepen callbacks aan (`onCreated`, `onUpdated`, etc.) — ze muteren geen state zelf.

**Supabase** (`src/lib/supabase.js`): Alle database-interactie zit hier, geëxporteerd als losse async functies. Realtime via `subscribeToActivities` en `subscribeToAvailability` (Postgres changes).

**Auth**: Geen Supabase Auth. Login = naam selecteren + pincode vergelijken via `verifyPin()`. Sessie opgeslagen in `localStorage` (`wanneer_member_id`, `wanneer_member_name`). Pincodes staan als plaintext in `members.pin_hash` (naam misleidend — hashing nog niet geïmplementeerd).

## Database schema

| Tabel | Doel |
|-------|------|
| `members` | Gebruikers met naam, `pin_hash` (plaintext), `pin_set` boolean |
| `groups` | Groepen met eigenaar |
| `group_members` | Koppeltabel leden/groepen met rol (`eigenaar` / `lid`) |
| `invite_tokens` | Uitnodigingslinks: max 10 gebruik, 7 dagen geldig |
| `availability` | Persoonlijk per member (geldt voor álle groepen), array van ISO-datums, verloopt na 14 dagen |
| `activities` | Per groep (`group_id`), status: `bevestigen → gepland → geweest` |
| `confirmations` | Wie heeft een activiteit bevestigd |
| `wishlist` | Per groep (`group_id`) |
| `wishlist_votes` | Stemmen per wishlist-item |

RLS staat aan maar laat alles toe via de anon key — veilig genoeg voor privégebruik. Bestaande data is gemigreerd via `schema-migration.sql`; de originele groep heet "Mannen".

## Kernfunctionaliteit

- **Multi-groep** — beschikbaarheid is persoonlijk en geldt voor alle groepen; overlap wordt per groep berekend
- **Beschikbaarheid** — weekoverzicht, dagen aanklikken, verloopt na 14 dagen
- **Activiteit plannen** — 3 stappen: titel/locatie → datum (op basis van overlap) → tijd + WhatsApp
- **Bevestigen** — als iedereen bevestigd heeft wordt status automatisch `gepland`
- **Wishlist** — 👊 stemmen, gesorteerd op meeste stemmen bij activiteit plannen
- **Archief** — automatisch bij app start via `archiveExpiredActivities()`
- **Groepsbeheer** — iedereen mag groepsbeheer openen en groep aanmaken
- **Uitnodigen** — WhatsApp link met token, ontvanger kan joinen met nieuw of bestaand account

## Styling

Alle styling is inline via `style={}` props. Geen CSS-framework. Thema in `src/lib/helpers.js` als object `T` — gebruik altijd `T.*` voor kleuren, geen hardcoded hex. Accentkleur: blauw `#0066ff`.

Global CSS (reset + responsive layout) staat als template string `globalStyles` onderaan `App.jsx`.

Responsive: mobile-first met media query op `768px`. Mobiel: bottom nav + fullscreen. Desktop: sidebar links met groepsnaam en terugknop, statistieken als kaarten.

## Componenten

- `UI.jsx` — gedeelde UI: `NOSHeader`, `SubHeader`, `BottomNav`, `SidebarNav`
- `helpers.js` — thema `T`, datumhelpers, WhatsApp-linkbuilders, ICS-download
- `OtherScreens.jsx` — `ArchiefScreen` en `HelpScreen`
- Overige componenten zijn één scherm per bestand

## Bekende open punten

- Pincodes als plaintext opgeslagen — hashing via pgcrypto nog niet geïmplementeerd
- Rate limiting op login ontbreekt
- RLS policies zijn open (iedereen kan schrijven)
- Dashboard groepskaart klikbaarheid onduidelijk op desktop
