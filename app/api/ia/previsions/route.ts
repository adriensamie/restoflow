import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'

const client = new Anthropic()

export async function POST(req: NextRequest) {
  try {
    const { date, historique, meteo, estFerie, estVacances, evenementLocal, produitsStock } = await req.json()

    const prompt = `Tu es un expert en restauration. Analyse les données suivantes et génère des prévisions précises pour le ${date}.

HISTORIQUE 30 DERNIERS JOURS :
${JSON.stringify(historique, null, 2)}

CONTEXTE DU JOUR :
- Météo : ${meteo?.condition ?? 'inconnue'}, ${meteo?.temperature ?? '?'}°C
- Jour férié : ${estFerie ? 'OUI' : 'non'}
- Vacances scolaires : ${estVacances ? 'OUI' : 'non'}
- Événement local : ${evenementLocal || 'aucun'}

STOCKS ACTUELS :
${JSON.stringify(produitsStock?.slice(0, 20), null, 2)}

Retourne UNIQUEMENT un objet JSON brut, sans markdown, sans backticks, sans texte avant ou après :
{"couverts_midi":50,"couverts_soir":60,"ca_prevu":2500,"confiance":"moyenne","analyse":"Explication courte.","produits_prioritaires":[{"nom":"exemple","raison":"raison","urgence":"normale"}],"alertes":[]}`

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }]
    })

    const textBlock = response.content.find(b => b.type === 'text')
    const text = textBlock && 'text' in textBlock ? textBlock.text : ''
    
    // Extraire le JSON même s'il y a du texte autour
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('Pas de JSON dans la réponse: ' + text.slice(0, 200))
    
    const data = JSON.parse(jsonMatch[0])
    return NextResponse.json({ success: true, data })
  } catch (e: any) {
    console.error('PREVISIONS ERROR:', e.message)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}