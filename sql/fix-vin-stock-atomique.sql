-- Fonction atomique pour incrémenter/décrémenter le stock de vins
-- Évite le race condition read-modify-write
CREATE OR REPLACE FUNCTION increment_vin_stock(
  p_vin_id uuid,
  p_org_id uuid,
  p_delta integer
)
RETURNS void
LANGUAGE sql
AS $$
  UPDATE vins
  SET stock_bouteilles = GREATEST(0, stock_bouteilles + p_delta),
      updated_at = now()
  WHERE id = p_vin_id
    AND organization_id = p_org_id;
$$;
