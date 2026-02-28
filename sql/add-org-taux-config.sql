-- Ajout des taux configurables sur organizations
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS taux_tva numeric DEFAULT 10;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS taux_charges_salariales numeric DEFAULT 22;
