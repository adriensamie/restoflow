import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { auth } from '@clerk/nextjs/server'
import { checkAccess } from '@/lib/billing'
import { withRateLimit } from '@/lib/api-rate-limit'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export const POST = withRateLimit(async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const access = await checkAccess('import_bl')
  if (!access.allowed) return NextResponse.json({ error: 'Fonctionnalité réservée au plan Pro.' }, { status: 403 })

  try {
    const formData = await req.formData()
    const file = formData.get('image') as File
    if (!file) return NextResponse.json({ error: 'Image manquante' }, { status: 400 })

    const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!ALLOWED_MIME.includes(file.type)) {
      return NextResponse.json({ error: 'Type de fichier non supporte' }, { status: 400 })
    }
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'Image trop volumineuse (max 10 Mo)' }, { status: 413 })
    }

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

    const textBlock = response.content.find((b: any) => b.type === 'text')
    const text = (textBlock && 'text' in textBlock ? textBlock.text : '') || ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('Pas de JSON dans la réponse')
    const data = JSON.parse(jsonMatch[0])

    return NextResponse.json(data)
  } catch (e: any) {
    console.error('ANALYSER-PHOTO-PRODUIT ERROR:', e)
    return NextResponse.json({ error: 'Erreur lors de l\'analyse de la photo' }, { status: 500 })
  }
}, { maxRequests: 10, windowMs: 60 * 1000, prefix: 'ia-photo-produit' })