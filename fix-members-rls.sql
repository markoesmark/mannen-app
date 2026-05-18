-- Fix: schrijfrechten voor de members tabel ontbraken.
-- Dit verklaart waarom pincode wijzigen niet werkte en nieuwe registraties mogelijk faalden.
--
-- Uitvoeren in: Supabase Dashboard → SQL Editor → Run

CREATE POLICY "Publiek schrijfbaar" ON members FOR ALL USING (true);
