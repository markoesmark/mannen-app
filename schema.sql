-- ============================================================
-- MANNEN APP — Supabase Database Schema
-- Plak dit in de Supabase SQL Editor en klik "Run"
-- ============================================================

-- Members (de vier gebruikers, handmatig aangemaakt)
CREATE TABLE members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  pin_hash TEXT NOT NULL,   -- Voor nu: sla de pincode direct op (4 cijfers)
                             -- In productie: gebruik pgcrypto voor hashing
  phone TEXT,               -- Optioneel: voor WhatsApp deeplinks
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Availability (beschikbaarheid per persoon)
CREATE TABLE availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  days TEXT[] NOT NULL DEFAULT '{}',  -- Array van ISO datums: ['2025-05-17', '2025-05-18']
  expires_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(member_id)  -- Één rij per persoon
);

-- Activities
CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  location TEXT NOT NULL DEFAULT '',
  best_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  from_member_id UUID REFERENCES members(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'bevestigen'
    CHECK (status IN ('bevestigen', 'gepland', 'geweest')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Confirmations (wie heeft bevestigd per activiteit)
CREATE TABLE confirmations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  confirmed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(activity_id, member_id)
);

-- Wishlist
CREATE TABLE wishlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  location TEXT DEFAULT '',
  added_by_member_id UUID REFERENCES members(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Wishlist votes (👊 stemmen)
CREATE TABLE wishlist_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wishlist_id UUID NOT NULL REFERENCES wishlist(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  UNIQUE(wishlist_id, member_id)
);

-- ============================================================
-- ROW LEVEL SECURITY
-- Iedereen die de app gebruikt (anon key) mag alles lezen en schrijven
-- ============================================================

ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE confirmations ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist_votes ENABLE ROW LEVEL SECURITY;

-- Lees-toegang voor iedereen
CREATE POLICY "Publiek leesbaar" ON members FOR SELECT USING (true);
CREATE POLICY "Publiek leesbaar" ON availability FOR SELECT USING (true);
CREATE POLICY "Publiek leesbaar" ON activities FOR SELECT USING (true);
CREATE POLICY "Publiek leesbaar" ON confirmations FOR SELECT USING (true);
CREATE POLICY "Publiek leesbaar" ON wishlist FOR SELECT USING (true);
CREATE POLICY "Publiek leesbaar" ON wishlist_votes FOR SELECT USING (true);

-- Schrijf-toegang voor iedereen (app valideert via pincode)
CREATE POLICY "Publiek schrijfbaar" ON availability FOR ALL USING (true);
CREATE POLICY "Publiek schrijfbaar" ON activities FOR ALL USING (true);
CREATE POLICY "Publiek schrijfbaar" ON confirmations FOR ALL USING (true);
CREATE POLICY "Publiek schrijfbaar" ON wishlist FOR ALL USING (true);
CREATE POLICY "Publiek schrijfbaar" ON wishlist_votes FOR ALL USING (true);

-- ============================================================
-- SEED DATA — Vul de vier leden in met hun pincodes
-- Vervang de pincodes door de echte codes die jullie afspreken
-- ============================================================

INSERT INTO members (name, pin_hash, phone) VALUES
  ('Mark',   '1234', '+31612345678'),  -- ← Verander naar echte pincode
  ('Pim',    '1234', '+31687654321'),  -- ← Verander naar echte pincode
  ('Robbie', '1234', '+31611223344'),  -- ← Verander naar echte pincode
  ('Elwin',  '1234', '+31644332211');  -- ← Verander naar echte pincode

-- ============================================================
-- VOORBEELD WISHLIST ITEMS (optioneel)
-- ============================================================

INSERT INTO wishlist (title, location, added_by_member_id)
SELECT 'Weekendje Ardennen', 'België', id FROM members WHERE name = 'Mark';

INSERT INTO wishlist (title, location, added_by_member_id)
SELECT 'Karting', 'Lelystad', id FROM members WHERE name = 'Pim';

INSERT INTO wishlist (title, location, added_by_member_id)
SELECT 'Whisky proeverij', 'Amsterdam', id FROM members WHERE name = 'Mark';

INSERT INTO wishlist (title, location, added_by_member_id)
SELECT 'Motorrit Eifel', 'Duitsland', id FROM members WHERE name = 'Mark';

-- ============================================================
-- REALTIME INSCHAKELEN
-- Ga naar Supabase Dashboard → Database → Replication
-- Zet de volgende tabellen aan voor realtime:
--   ✓ activities
--   ✓ confirmations
--   ✓ availability
-- ============================================================
