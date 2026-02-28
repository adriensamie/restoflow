import { jsPDF } from 'jspdf'

interface RetourData {
  numero: string
  date: string
  fournisseur: { nom: string; adresse?: string | null; contact_email?: string | null }
  organisation: { nom: string; adresse?: string | null }
  lignes: { produit_nom: string; unite: string; quantite: number; prix_unitaire: number; motif?: string }[]
  total_ht: number
}

export function generateBonRetourPDF(data: RetourData): Uint8Array {
  const doc = new jsPDF()

  // Header
  doc.setFontSize(20)
  doc.setTextColor(29, 78, 216)
  doc.text('BON DE RETOUR', 105, 25, { align: 'center' })

  doc.setFontSize(10)
  doc.setTextColor(100)
  doc.text(`N° ${data.numero}`, 105, 32, { align: 'center' })
  doc.text(`Date : ${data.date}`, 105, 37, { align: 'center' })

  // Organisation (left)
  doc.setFontSize(11)
  doc.setTextColor(0)
  doc.text(data.organisation.nom, 20, 55)
  if (data.organisation.adresse) {
    doc.setFontSize(9)
    doc.setTextColor(100)
    doc.text(data.organisation.adresse, 20, 61)
  }

  // Fournisseur (right)
  doc.setFontSize(11)
  doc.setTextColor(0)
  doc.text(`Fournisseur : ${data.fournisseur.nom}`, 120, 55)
  if (data.fournisseur.adresse) {
    doc.setFontSize(9)
    doc.setTextColor(100)
    doc.text(data.fournisseur.adresse, 120, 61)
  }
  if (data.fournisseur.contact_email) {
    doc.text(data.fournisseur.contact_email, 120, 67)
  }

  // Table header
  let y = 85
  doc.setFillColor(240, 240, 250)
  doc.rect(20, y - 5, 170, 8, 'F')
  doc.setFontSize(9)
  doc.setTextColor(50)
  doc.text('Produit', 22, y)
  doc.text('Qte', 100, y, { align: 'center' })
  doc.text('Unite', 120, y)
  doc.text('PU HT', 145, y, { align: 'right' })
  doc.text('Total HT', 185, y, { align: 'right' })

  // Lines
  y += 10
  doc.setTextColor(0)
  for (const ligne of data.lignes) {
    doc.setFontSize(10)
    doc.text(ligne.produit_nom, 22, y)
    doc.text(String(ligne.quantite), 100, y, { align: 'center' })
    doc.text(ligne.unite, 120, y)
    doc.text(`${ligne.prix_unitaire.toFixed(2)} €`, 145, y, { align: 'right' })
    doc.text(`${(ligne.quantite * ligne.prix_unitaire).toFixed(2)} €`, 185, y, { align: 'right' })

    if (ligne.motif) {
      y += 5
      doc.setFontSize(8)
      doc.setTextColor(150)
      doc.text(`Motif : ${ligne.motif}`, 25, y)
      doc.setTextColor(0)
    }
    y += 8

    if (y > 260) {
      doc.addPage()
      y = 20
    }
  }

  // Total
  y += 5
  doc.setDrawColor(200)
  doc.line(120, y, 190, y)
  y += 8
  doc.setFontSize(12)
  doc.setTextColor(29, 78, 216)
  doc.text(`Total HT : ${data.total_ht.toFixed(2)} €`, 185, y, { align: 'right' })

  // Footer
  y += 20
  doc.setFontSize(8)
  doc.setTextColor(150)
  doc.text('Document genere par RestoFlow', 105, y, { align: 'center' })

  return doc.output('arraybuffer') as unknown as Uint8Array
}
