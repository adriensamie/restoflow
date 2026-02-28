import { jsPDF } from 'jspdf'
import type { BilanJournee } from '@/lib/actions/bilan'

export function generateBilanJourneePDF(bilan: BilanJournee, orgNom: string): Uint8Array {
  const doc = new jsPDF()

  // Header
  doc.setFontSize(18)
  doc.setTextColor(29, 78, 216)
  doc.text('BILAN DE JOURNEE', 105, 20, { align: 'center' })

  doc.setFontSize(10)
  doc.setTextColor(100)
  doc.text(`${orgNom} — ${new Date(bilan.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}`, 105, 27, { align: 'center' })

  let y = 45

  const addSection = (title: string, items: [string, string][]) => {
    doc.setFontSize(13)
    doc.setTextColor(29, 78, 216)
    doc.text(title, 20, y)
    y += 8

    for (const [label, value] of items) {
      doc.setFontSize(10)
      doc.setTextColor(80)
      doc.text(label, 25, y)
      doc.setTextColor(0)
      doc.text(value, 180, y, { align: 'right' })
      y += 6
    }
    y += 5
  }

  addSection('Chiffre d\'affaires', [
    ['CA Total', `${bilan.ca_total.toFixed(2)} EUR`],
    ['Nombre de tickets', String(bilan.nb_tickets)],
    ['Nombre de couverts', String(bilan.nb_couverts)],
    ['Ticket moyen', `${bilan.ticket_moyen.toFixed(2)} EUR`],
  ])

  addSection('Couts', [
    ['Cout matieres', `${bilan.food_cost_montant.toFixed(2)} EUR`],
    ['Food cost', `${bilan.food_cost_pct.toFixed(1)} %`],
    ['Pertes', `${bilan.pertes_montant.toFixed(2)} EUR`],
  ])

  addSection('Equipe', [
    ['Heures travaillees', `${bilan.heures_equipe.toFixed(1)} h`],
    ['Cout equipe', `${bilan.cout_equipe.toFixed(2)} EUR`],
  ])

  addSection('HACCP', [
    ['Releves effectues', String(bilan.nb_releves_haccp)],
    ['Non-conformites', String(bilan.nb_non_conformes)],
  ])

  // Summary
  y += 5
  doc.setDrawColor(200)
  doc.line(20, y, 190, y)
  y += 10
  const margeBrute = bilan.ca_total - bilan.food_cost_montant
  doc.setFontSize(12)
  doc.setTextColor(0)
  doc.text(`Marge brute : ${margeBrute.toFixed(2)} EUR`, 105, y, { align: 'center' })

  // Footer
  doc.setFontSize(7)
  doc.setTextColor(150)
  doc.text('Genere par RestoFlow', 105, 285, { align: 'center' })

  return doc.output('arraybuffer') as unknown as Uint8Array
}
