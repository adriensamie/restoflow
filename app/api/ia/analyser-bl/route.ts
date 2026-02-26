import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'

const client = new Anthropic()

export async function POST(req: NextRequest) {
  try {
    const { imageBase64, mimeType } = await req.json()

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: mimeType, data: imageBase64 }
          },
          {
            type: 'text',
            text: `Analyse ce bon de livraison et extrais les informations. Retourne UNIQUEMENT un objet JSON brut sans markdown ni backticks :
{"fournisseur":"nom","date":"YYYY-MM-DD","numero_bl":"ref","lignes":[{"designation":"nom produit","quantite":1,"unite":"kg","prix_unitaire":10,"prix_total":10}],"total_ht":100,"confiance":"haute"}`
          }
        ]
      }]
    })

    const textBlock = response.content.find(b => b.type === 'text')
    const text = textBlock && 'text' in textBlock ? textBlock.text : ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('Pas de JSON dans la réponse')
    const data = JSON.parse(jsonMatch[0])
    return NextResponse.json({ success: true, data })
  } catch (e: any) {
    console.error('ANALYSER-BL ERROR:', e.message)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
