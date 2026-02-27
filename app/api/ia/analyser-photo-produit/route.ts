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
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: mediaType, data: base64 }
          },
          {
            type: 'text',
            text: `Analyse cette image et extrais tous les produits/ingrédients visibles.
Pour chaque produit, retourne un JSON avec cette structure exacte:
{
  "produits": [
    {
      "nom": "nom du produit",
      "categorie": "viandes|poissons|legumes|fruits|produits_laitiers|epicerie|boissons|surgeles|autres",
      "unite": "kg|g|L|cl|piece|carton|boite",
      "prix_unitaire": nombre ou null,
      "stock_initial": nombre ou null
    }
  ]
}
Retourne UNIQUEMENT le JSON, sans texte avant ou après.`
          }
        ]
      }]
    })

    const text = response.content.find((b: any) => b.type === 'text')?.text || ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('Pas de JSON dans la réponse')
    const data = JSON.parse(jsonMatch[0])

    return NextResponse.json(data)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
