import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { getRetourDetail, envoyerRetour } from '@/lib/actions/retours'
import { generateBonRetourPDF } from '@/lib/pdf/bon-retour'
import { withRateLimit } from '@/lib/api-rate-limit'

function getResend() {
  return new Resend(process.env.RESEND_API_KEY)
}

export const POST = withRateLimit(async function POST(req: NextRequest) {
  try {
    const { retourId } = await req.json()
    if (!retourId) return NextResponse.json({ error: 'retourId manquant' }, { status: 400 })

    const retour = await getRetourDetail(retourId)
    if (!retour) return NextResponse.json({ error: 'Retour introuvable' }, { status: 404 })

    const email = retour.fournisseurs?.contact_email
    if (!email) return NextResponse.json({ error: 'Email fournisseur non renseigne' }, { status: 400 })

    const pdfData = generateBonRetourPDF({
      numero: retour.numero,
      date: new Date(retour.created_at).toLocaleDateString('fr-FR'),
      fournisseur: {
        nom: retour.fournisseurs?.nom ?? '',
        adresse: retour.fournisseurs?.adresse,
        contact_email: email,
      },
      organisation: { nom: 'RestoFlow', adresse: null },
      lignes: (retour.lignes_retour ?? []).map((l: any) => ({
        produit_nom: l.produits?.nom ?? 'Produit',
        unite: l.produits?.unite ?? '',
        quantite: l.quantite_retournee,
        prix_unitaire: l.prix_unitaire ?? 0,
        motif: l.motif,
      })),
      total_ht: retour.total_ht ?? 0,
    })

    const pdfBuffer = Buffer.from(pdfData)

    await getResend().emails.send({
      from: 'RestoFlow <noreply@restoflow.fr>',
      to: email,
      subject: `Bon de retour ${retour.numero}`,
      html: `<p>Bonjour,</p><p>Veuillez trouver ci-joint le bon de retour ${retour.numero}.</p><p>Cordialement,<br/>RestoFlow</p>`,
      attachments: [
        {
          filename: `${retour.numero}.pdf`,
          content: pdfBuffer,
        },
      ],
    })

    await envoyerRetour(retourId)

    return NextResponse.json({ success: true })
  } catch (e: any) {
    console.error('RETOUR EMAIL ERROR:', e)
    return NextResponse.json({ error: 'Erreur lors de l\'envoi de l\'email' }, { status: 500 })
  }
}, { maxRequests: 5, windowMs: 60 * 1000, prefix: 'retour-email' })
