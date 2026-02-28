import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { checkAccess } from '@/lib/billing'
import { withRateLimit } from '@/lib/api-rate-limit'

const client = new Anthropic()

export const POST = withRateLimit(async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  const access = await checkAccess('import_bl')
  if (!access.allowed) return NextResponse.json({ error: 'Fonctionnalité réservée au plan Pro.' }, { status: 403 })

  try {
    const { imageBase64, mimeType } = await req.json()

    const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!ALLOWED_MIME.includes(mimeType)) {
      return NextResponse.json({ error: 'Type de fichier non supporte' }, { status: 400 })
    }
    if (!imageBase64 || imageBase64.length > 10 * 1024 * 1024 * 1.37) {
      return NextResponse.json({ error: 'Image trop volumineuse (max 10 Mo)' }, { status: 413 })
    }

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
    console.error('ANALYSER-PRODUIT ERROR:', e)
    return NextResponse.json({ error: 'Erreur lors de l\'analyse du produit' }, { status: 500 })
  }
}, { maxRequests: 10, windowMs: 60 * 1000, prefix: 'ia-produit' })
