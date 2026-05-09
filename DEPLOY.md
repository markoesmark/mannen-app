# MANNEN APP — Deploy instructies
## Van code naar live app in ~20 minuten

---

## Stap 1 — Supabase opzetten (5 min)

1. Ga naar **supabase.com** en maak een gratis account
2. Klik "New project" — kies een naam (bv. "mannen-app") en een sterk wachtwoord
3. Wacht ~2 minuten tot het project klaar is
4. Ga naar **SQL Editor** (linkermenu)
5. Plak de volledige inhoud van `schema.sql` erin en klik **Run**
6. ✅ Database + tabellen + leden zijn aangemaakt

**Pincodes instellen:**
In de SQL editor, pas de seed data aan vóór je hem runt:
```sql
INSERT INTO members (name, pin_hash, phone) VALUES
  ('Mark',   '1234', '+31612345678'),  -- Verander 1234 naar jouw pincode
  ...
```

**API keys ophalen:**
- Ga naar **Settings → API**
- Kopieer **Project URL** en **anon public key**

**Realtime inschakelen:**
- Ga naar **Database → Replication**
- Zet aan: `activities`, `confirmations`, `availability`

---

## Stap 2 — Code klaarmaken (3 min)

1. Zet de projectmap ergens op je computer
2. Maak een bestand `.env.local` aan in de hoofdmap:
```
VITE_SUPABASE_URL=https://jouw-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
```
3. Maak een GitHub account als je die nog niet hebt
4. Maak een nieuw repository aan op github.com (bv. "mannen-app")
5. Upload de projectmap naar GitHub (drag & drop werkt in de browser)

---

## Stap 3 — Vercel deployen (5 min)

1. Ga naar **vercel.com** en log in met je GitHub account
2. Klik "Add New Project"
3. Kies je `mannen-app` repository
4. Onder **Environment Variables** voeg toe:
   - `VITE_SUPABASE_URL` → jouw Supabase URL
   - `VITE_SUPABASE_ANON_KEY` → jouw anon key
5. Klik **Deploy**
6. Vercel geeft je een URL: `mannen-app.vercel.app`

✅ De app is live!

---

## Stap 4 — WhatsApp links klaarmaken

De app bouwt WhatsApp links met de URL van je Vercel deployment.
Zolang de app draait op `mannen-app.vercel.app` werken de links automatisch.

De link die verstuurd wordt ziet er zo uit:
`https://mannen-app.vercel.app/bevestig/[activiteit-id]`

*(Deeplink routing is een volgende stap — voor nu opent de link de homepage)*

---

## Stap 5 — Eigen domein (optioneel, 5 min)

Wil je `mannen.app` of iets anders?
1. Koop een domein via Cloudflare of Namecheap (~€10/jaar)
2. Voeg het toe in Vercel onder **Settings → Domains**
3. Vercel geeft DNS-instellingen die je bij je registrar invoert

---

## Updates deployen

Na een aanpassing:
1. Upload de gewijzigde bestanden naar GitHub
2. Vercel detecteert dit automatisch en herdeployt

---

## Kosten

| Service  | Kosten        |
|----------|---------------|
| Supabase | Gratis (Free tier: 500MB, 50.000 rijen) |
| Vercel   | Gratis (Hobby plan) |
| Domein   | ~€10/jaar (optioneel) |

Voor jullie met 4 personen blijf je ruim binnen de gratis limieten.

---

## Problemen?

**App laadt niet:**
- Check of `.env.local` de juiste keys heeft
- Check de browser console (F12) voor foutmeldingen

**Database errors:**
- Check of het schema correct is gerund in Supabase
- Check of RLS policies aanstaan

**Realtime werkt niet:**
- Check Supabase Dashboard → Database → Replication
- Zorg dat de tabellen aangevinkt zijn
