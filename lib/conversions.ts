// Unit conversion system for restaurant ingredients
// Supports: weight (kg, g), volume (L, cl, ml), pieces (carton, piece, unite)

type UnitCategory = 'poids' | 'volume' | 'piece'

interface UnitDef {
  category: UnitCategory
  toBase: number // conversion factor to base unit (g, ml, piece)
  label: string
}

const UNITS: Record<string, UnitDef> = {
  // Weight (base: g)
  kg: { category: 'poids', toBase: 1000, label: 'Kilogramme' },
  g: { category: 'poids', toBase: 1, label: 'Gramme' },
  mg: { category: 'poids', toBase: 0.001, label: 'Milligramme' },
  // Volume (base: ml)
  L: { category: 'volume', toBase: 1000, label: 'Litre' },
  cl: { category: 'volume', toBase: 10, label: 'Centilitre' },
  ml: { category: 'volume', toBase: 1, label: 'Millilitre' },
  // Pieces (base: piece)
  carton: { category: 'piece', toBase: 1, label: 'Carton' },
  piece: { category: 'piece', toBase: 1, label: 'Piece' },
  unite: { category: 'piece', toBase: 1, label: 'Unite' },
  botte: { category: 'piece', toBase: 1, label: 'Botte' },
  barquette: { category: 'piece', toBase: 1, label: 'Barquette' },
}

export function convertUnits(
  value: number,
  fromUnit: string,
  toUnit: string,
  facteurConversion?: number | null
): number | null {
  const from = UNITS[fromUnit]
  const to = UNITS[toUnit]

  if (!from || !to) return null

  // Same unit
  if (fromUnit === toUnit) return value

  // Same category: direct conversion
  if (from.category === to.category && from.category !== 'piece') {
    const baseValue = value * from.toBase
    return baseValue / to.toBase
  }

  // Cross-category or piece-to-piece with factor
  if (facteurConversion && facteurConversion > 0) {
    return value * facteurConversion
  }

  return null
}

export function getAvailableUnits(category?: UnitCategory): { value: string; label: string }[] {
  return Object.entries(UNITS)
    .filter(([, def]) => !category || def.category === category)
    .map(([key, def]) => ({ value: key, label: `${def.label} (${key})` }))
}

export function getUnitCategory(unit: string): UnitCategory | null {
  return UNITS[unit]?.category ?? null
}

export function formatConversion(value: number, fromUnit: string, toUnit: string, facteur?: number | null): string {
  const result = convertUnits(value, fromUnit, toUnit, facteur)
  if (result === null) return `${value} ${fromUnit}`
  return `${result % 1 === 0 ? result : result.toFixed(2)} ${toUnit}`
}
