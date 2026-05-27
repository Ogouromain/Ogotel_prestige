-- ============================================================
--  OGOTEL PRESTIGE — Migration v4
--  Ajout de colonnes à subscription_requests
--  Exécuter dans Supabase → SQL Editor → Run
-- ============================================================

ALTER TABLE subscription_requests
  ADD COLUMN IF NOT EXISTS whatsapp   TEXT,
  ADD COLUMN IF NOT EXISTS city       TEXT,
  ADD COLUMN IF NOT EXISTS room_count INTEGER;

-- Commentaires
COMMENT ON COLUMN subscription_requests.whatsapp   IS 'Numéro WhatsApp du demandeur';
COMMENT ON COLUMN subscription_requests.city       IS 'Ville de l''établissement';
COMMENT ON COLUMN subscription_requests.room_count IS 'Nombre de chambres de l''établissement';
