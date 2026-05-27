-- ============================================================
--  OGOTEL PRESTIGE — Migration v2 → v3 (CORRIGÉE)
-- ============================================================
--  ⚠️  IMPORTANT : L'ordre compte !
--  On met d'abord à jour les données (UPDATE),
--  PUIS on renomme la valeur d'enum (ALTER TYPE).
--
--  Exécuter dans Supabase → SQL Editor → Run
-- ============================================================


-- ═══════════════════════════════════════════════════════════════
--  1. METTRE À JOUR LES PLANS (avant de renommer l'enum)
-- ═══════════════════════════════════════════════════════════════

-- Plan Essentiel → Starter : 0 FCFA → 20 000 FCFA
UPDATE plans
SET name          = 'Starter',
    price_monthly = 20000
WHERE tier = 'essentiel';

-- Plan Prestige : 150 000 FCFA → 90 000 FCFA
UPDATE plans
SET price_monthly = 90000
WHERE tier = 'prestige';


-- ═══════════════════════════════════════════════════════════════
--  2. RENOMMER LA VALEUR D'ENUM  'essentiel' → 'starter'
-- ═══════════════════════════════════════════════════════════════
-- APRÈS les UPDATE, sinon WHERE tier = 'essentiel' échoue !

ALTER TYPE plan_tier RENAME VALUE 'essentiel' TO 'starter';


-- ═══════════════════════════════════════════════════════════════
--  3. METTRE À JOUR LA COLONNE tier DANS plans
-- ═══════════════════════════════════════════════════════════════
-- L'ALTER TYPE renomme l'enum mais la valeur dans la colonne
-- est mise à jour automatiquement par PostgreSQL.
-- On met juste à jour le nom pour cohérence :

UPDATE plans
SET tier = 'starter'
WHERE name = 'Starter';


-- ═══════════════════════════════════════════════════════════════
--  4. METTRE À JOUR LA VALEUR PAR DÉFAUT
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE subscription_requests
  ALTER COLUMN desired_plan SET DEFAULT 'starter';


-- ═══════════════════════════════════════════════════════════════
--  5. VÉRIFICATION
-- ═══════════════════════════════════════════════════════════════

SELECT name, tier, price_monthly, max_rooms, max_users
FROM plans
ORDER BY price_monthly ASC;
