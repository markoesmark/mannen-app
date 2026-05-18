-- ============================================================
-- WANNEER APP — Database Migratie
-- Van: single-groep (Mannen app)
-- Naar: multi-groep (Wanneer app)
--
-- VEILIG: bestaande data blijft volledig intact
-- Voer stap voor stap uit in Supabase SQL Editor
-- ============================================================

-- ── STAP 0: Backup check ─────────────────────────────────────
-- Controleer eerst of je een backup hebt gemaakt via
-- Supabase Dashboard → Settings → Database → Backups

-- ── STAP 1: Nieuwe tabellen aanmaken ─────────────────────────

CREATE TABLE IF NOT EXISTS groups (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  naam          TEXT NOT NULL,
  aangemaakt_door UUID REFERENCES members(id) ON DELETE SET NULL,
  aangemaakt_op TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS group_members (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id   UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  member_id  UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  rol        TEXT NOT NULL DEFAULT 'lid' CHECK (rol IN ('eigenaar','lid')),
  joined_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(group_id, member_id)
);

CREATE TABLE IF NOT EXISTS invite_tokens (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token       TEXT NOT NULL UNIQUE DEFAULT substring(gen_random_uuid()::text, 1, 8),
  group_id    UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  aangemaakt_door UUID REFERENCES members(id) ON DELETE SET NULL,
  gebruik_count INT NOT NULL DEFAULT 0,
  max_gebruik   INT NOT NULL DEFAULT 10,
  verloopt_op TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '7 days',
  aangemaakt_op TIMESTAMPTZ DEFAULT NOW()
);

-- ── STAP 2: Bestaande tabellen uitbreiden ────────────────────

-- members: pin_set boolean toevoegen
ALTER TABLE members ADD COLUMN IF NOT EXISTS pin_set BOOLEAN NOT NULL DEFAULT true;
-- Bestaande leden hebben al een pin ingesteld
UPDATE members SET pin_set = true WHERE pin_hash IS NOT NULL AND pin_hash != '';

-- activities: group_id toevoegen
ALTER TABLE activities ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES groups(id) ON DELETE CASCADE;

-- wishlist: group_id toevoegen
ALTER TABLE wishlist ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES groups(id) ON DELETE CASCADE;

-- ── STAP 3: Standaardgroep aanmaken ──────────────────────────
-- Naam = "Mannen" zodat bestaande gebruikers hun groep herkennen

DO $$
DECLARE
  eerste_member_id UUID;
  nieuwe_groep_id UUID;
BEGIN
  -- Pak de eerste member als eigenaar
  SELECT id INTO eerste_member_id FROM members ORDER BY created_at LIMIT 1;

  -- Maak de groep aan
  INSERT INTO groups (naam, aangemaakt_door)
  VALUES ('Mannen', eerste_member_id)
  RETURNING id INTO nieuwe_groep_id;

  -- Voeg alle bestaande members toe aan de groep
  INSERT INTO group_members (group_id, member_id, rol)
  SELECT nieuwe_groep_id, id,
    CASE WHEN id = eerste_member_id THEN 'eigenaar' ELSE 'lid' END
  FROM members;

  -- Koppel alle bestaande activiteiten aan de groep
  UPDATE activities SET group_id = nieuwe_groep_id WHERE group_id IS NULL;

  -- Koppel alle bestaande wishlist items aan de groep
  UPDATE wishlist SET group_id = nieuwe_groep_id WHERE group_id IS NULL;

  RAISE NOTICE 'Groep "Mannen" aangemaakt met id: %', nieuwe_groep_id;
END $$;

-- ── STAP 4: group_id verplicht maken (na migratie) ───────────
-- Pas dit uit NADAT stap 3 succesvol was

-- ALTER TABLE activities ALTER COLUMN group_id SET NOT NULL;
-- ALTER TABLE wishlist ALTER COLUMN group_id SET NOT NULL;

-- ── STAP 5: RLS policies uitbreiden ──────────────────────────

ALTER TABLE groups        ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE invite_tokens ENABLE ROW LEVEL SECURITY;

-- Lees-toegang voor iedereen
CREATE POLICY "Publiek leesbaar" ON groups        FOR SELECT USING (true);
CREATE POLICY "Publiek leesbaar" ON group_members FOR SELECT USING (true);
CREATE POLICY "Publiek leesbaar" ON invite_tokens FOR SELECT USING (true);

-- Schrijf-toegang voor iedereen (app valideert via pincode)
CREATE POLICY "Publiek schrijfbaar" ON groups        FOR ALL USING (true);
CREATE POLICY "Publiek schrijfbaar" ON group_members FOR ALL USING (true);
CREATE POLICY "Publiek schrijfbaar" ON invite_tokens FOR ALL USING (true);

-- ── STAP 6: Verificatie ───────────────────────────────────────
-- Controleer of alles goed gegaan is

SELECT
  'members'    AS tabel, COUNT(*) AS rijen FROM members
UNION ALL SELECT
  'groups',    COUNT(*) FROM groups
UNION ALL SELECT
  'group_members', COUNT(*) FROM group_members
UNION ALL SELECT
  'activities (met group_id)', COUNT(*) FROM activities WHERE group_id IS NOT NULL
UNION ALL SELECT
  'wishlist (met group_id)', COUNT(*) FROM wishlist WHERE group_id IS NOT NULL;

-- Verwacht resultaat:
-- members:    4 (of hoeveel je er hebt)
-- groups:     1 (de nieuwe "Mannen" groep)
-- group_members: 4 (alle members in de groep)
-- activities: alle bestaande activiteiten gekoppeld
-- wishlist:   alle bestaande items gekoppeld
