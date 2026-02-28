'use client'

import { X } from 'lucide-react'

// EU 14 allergens (Regulation 1169/2011)
export const ALLERGENES_EU = [
  { id: 'gluten', label: 'Gluten', emoji: '🌾' },
  { id: 'crustaces', label: 'Crustaces', emoji: '🦐' },
  { id: 'oeufs', label: 'Oeufs', emoji: '🥚' },
  { id: 'poisson', label: 'Poisson', emoji: '🐟' },
  { id: 'arachides', label: 'Arachides', emoji: '🥜' },
  { id: 'soja', label: 'Soja', emoji: '🫘' },
  { id: 'lait', label: 'Lait', emoji: '🥛' },
  { id: 'fruits_coques', label: 'Fruits a coques', emoji: '🌰' },
  { id: 'celeri', label: 'Celeri', emoji: '🥬' },
  { id: 'moutarde', label: 'Moutarde', emoji: '🟡' },
  { id: 'sesame', label: 'Sesame', emoji: '⚪' },
  { id: 'sulfites', label: 'Sulfites', emoji: '🍷' },
  { id: 'lupin', label: 'Lupin', emoji: '🌸' },
  { id: 'mollusques', label: 'Mollusques', emoji: '🐚' },
]

interface Props {
  selected: string[]
  onChange: (allergenes: string[]) => void
  readOnly?: boolean
}

export function AllergenesPicker({ selected, onChange, readOnly = false }: Props) {
  const toggle = (id: string) => {
    if (readOnly) return
    onChange(
      selected.includes(id)
        ? selected.filter(a => a !== id)
        : [...selected, id]
    )
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {ALLERGENES_EU.map(a => {
        const isSelected = selected.includes(a.id)
        return (
          <button key={a.id} onClick={() => toggle(a.id)} type="button"
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-all"
            style={{
              background: isSelected ? '#1a2d5a' : '#0a1120',
              border: `1px solid ${isSelected ? '#3b82f6' : '#1e2d4a'}`,
              color: isSelected ? '#60a5fa' : '#4a6fa5',
              cursor: readOnly ? 'default' : 'pointer',
            }}>
            <span>{a.emoji}</span>
            <span>{a.label}</span>
            {isSelected && !readOnly && <X size={10} />}
          </button>
        )
      })}
    </div>
  )
}

export function AllergenesDisplay({ allergenes }: { allergenes: string[] }) {
  if (!allergenes || allergenes.length === 0) return null
  return (
    <div className="flex flex-wrap gap-1">
      {allergenes.map(id => {
        const a = ALLERGENES_EU.find(x => x.id === id)
        if (!a) return null
        return (
          <span key={id} className="px-1.5 py-0.5 rounded text-xs"
            style={{ background: '#1a2d5a', color: '#60a5fa' }}
            title={a.label}>
            {a.emoji} {a.label}
          </span>
        )
      })}
    </div>
  )
}
