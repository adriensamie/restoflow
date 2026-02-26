// app/api/ia/analyser-bl/route.ts
// Analyse une photo de bon de livraison avec Claude Vision
// Extrait automatiquement : fournisseur, produits, quantités, prix

import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(req: NextRequest) {
  try {
    const { imageBase64, mimeType } = await req.json()

    if (!imageBase64) {
      return NextResponse.json({ error: 'Image manquante' }, { status: 400 })
    }

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mimeType ?? 'image/jpeg',
                data: imageBase64,
              },
            },
            {
              type: 'text',
              text: `Tu es un assistant spécialisé dans la lecture de bons de livraison de restaurant.
              
Analyse ce bon de livraison et extrait TOUTES les informations disponibles.
Réponds UNIQUEMENT en JSON valide, sans aucun texte avant ou après.

Format attendu :
{
  "fournisseur": {
    "nom": "string",
    "telephone": "string ou null",
    "email": "string ou null"
  },
  "numero_bl": "string ou null",
  "date": "string YYYY-MM-DD ou null",
  "lignes": [
    {
      "designation": "string — nom exact sur le BL",
      "nom_normalise": "string — nom simplifié (ex: 'Tomates rondes 1kg' → 'Tomates')",
      "quantite": number,
      "unite": "kg | L | pièce | boîte | carton | sachet | bouteille",
      "prix_unitaire_ht": number ou null,
      "reference": "string ou null"
    }
  ],
  "total_ht": number ou null,
  "confiance": "haute | moyenne | basse"
}

Si tu n'es pas sûr d'une valeur, mets null. Ne devine pas les prix.`,
            },
          ],
        },
      ],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''

    // Nettoyer les éventuels backticks markdown
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()

    let parsed
    try {
      parsed = JSON.parse(cleaned)
    } catch {
      return NextResponse.json(
        { error: 'Impossible de parser la réponse IA', raw: text },
        { status: 422 }
      )
    }

    return NextResponse.json(parsed)
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erreur inconnue'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
