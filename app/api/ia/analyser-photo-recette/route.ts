import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('image') as File
    if (!file) return NextResponse.json({ error: 'Image manquante' }, { status: 400 })

    const bytes = await file.arrayBuffer()
    const base64 = Buffer.from(bytes).toString('base64')
    const mediaType = (file.type || 'image/jpeg') as 'image/jpeg' | 'image/png' | 'image/webp'

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 3000,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: mediaType, data: base64 }
          },
          {
            type: 'text',
            text: `Analyse cette fiche recette et extrais toutes les informations.
Retourne un JSON avec cette structure exacte:
{
  "recette": {
    "nom": "nom de la recette",
    "categorie": "entree|plat|dessert|boisson|sauce|autre",
    "nb_portions": nombre,
    "temps_preparation": nombre en minutes ou null,
    "temps_cuisson": nombre en minutes ou null,
    "description": "description courte ou null"
  },
  "ingredients": [
    {
      "nom": "nom de l'ingrédient",
      "quantite": nombre,
      "unite": "kg|g|L|cl|piece|pincee|cuillere_soupe|cuillere_cafe"
    }
  ],
  "etapes": [
    "étape 1",
    "étape 2"
  ]
}
Retourne UNIQUEMENT le JSON, sans texte avant ou après.`
          }
        ]
      }]
    })

    const textBlock = response.content.find((b: any) => b.type === 'text')
    const text = (textBlock && 'text' in textBlock ? textBlock.text : '') || ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('Pas de JSON dans la réponse')
    const data = JSON.parse(jsonMatch[0])

    return NextResponse.json(data)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}