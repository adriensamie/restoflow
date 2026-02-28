import { jsPDF } from 'jspdf'

interface RecetteAllergenes {
  nom: string
  allergenes: string[]
  ingredients: { nom: string; allergenes: string[] }[]
}

const ALLERGENE_LABELS: Record<string, string> = {
  gluten: 'Gluten',
  crustaces: 'Crustaces',
  oeufs: 'Oeufs',
  poisson: 'Poisson',
  arachides: 'Arachides',
  soja: 'Soja',
  lait: 'Lait',
  fruits_coques: 'Fruits a coques',
  celeri: 'Celeri',
  moutarde: 'Moutarde',
  sesame: 'Sesame',
  sulfites: 'Sulfites',
  lupin: 'Lupin',
  mollusques: 'Mollusques',
}

export function generateFicheAllergenesPDF(recettes: RecetteAllergenes[], orgNom: string): Uint8Array {
  const doc = new jsPDF()

  // Title
  doc.setFontSize(18)
  doc.setTextColor(29, 78, 216)
  doc.text('FICHE ALLERGENES', 105, 20, { align: 'center' })

  doc.setFontSize(10)
  doc.setTextColor(100)
  doc.text(`${orgNom} — Reglement UE 1169/2011`, 105, 27, { align: 'center' })
  doc.text(`Generee le ${new Date().toLocaleDateString('fr-FR')}`, 105, 32, { align: 'center' })

  let y = 45

  for (const recette of recettes) {
    if (y > 250) {
      doc.addPage()
      y = 20
    }

    // Recipe name
    doc.setFontSize(12)
    doc.setTextColor(0)
    doc.text(recette.nom, 20, y)
    y += 6

    // Allergenes
    if (recette.allergenes.length > 0) {
      doc.setFontSize(9)
      doc.setTextColor(200, 0, 0)
      const labels = recette.allergenes.map(a => ALLERGENE_LABELS[a] || a).join(', ')
      doc.text(`Allergenes : ${labels}`, 25, y)
    } else {
      doc.setFontSize(9)
      doc.setTextColor(0, 150, 0)
      doc.text('Aucun allergene declare', 25, y)
    }
    y += 8

    // Ingredients detail
    for (const ing of recette.ingredients) {
      if (ing.allergenes.length > 0) {
        doc.setFontSize(8)
        doc.setTextColor(100)
        const ingLabels = ing.allergenes.map(a => ALLERGENE_LABELS[a] || a).join(', ')
        doc.text(`  - ${ing.nom} : ${ingLabels}`, 28, y)
        y += 5
      }
    }

    y += 5
  }

  // Footer
  doc.setFontSize(7)
  doc.setTextColor(150)
  doc.text('Ce document est fourni a titre informatif. Consultez vos fournisseurs pour les informations definitives.', 105, 285, { align: 'center' })

  return doc.output('arraybuffer') as unknown as Uint8Array
}
