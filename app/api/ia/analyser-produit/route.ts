import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'

const client = new Anthropic()

export async function POST(req: NextRequest) {
  try {
    const { imageBase64, mimeType } = await req.json()

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1000,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: mimeType, data: imageBase64 }
          },
          {
            type: 'text',
            text: `Analyse cette étiquette produit et extrais les informations. Retourne UNIQUEMENT un objet JSON brut sans markdown ni backticks :
{"nom":"nom produit","marque":"marque","reference":"ref","categorie":"categorie","unite":"kg","contenance":1,"allergenes":["gluten"],"prix_achat_ht":10,"confiance":"haute"}`
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
    console.error('ANALYSER-PRODUIT ERROR:', e.message)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
