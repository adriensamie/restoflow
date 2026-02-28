import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { auth } from '@clerk/nextjs/server'
import { checkAccess } from '@/lib/billing'
import { withRateLimit } from '@/lib/api-rate-limit'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export const POST = withRateLimit(async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
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
    console.error('ANALYSER-PHOTO-RECETTE ERROR:', e)
    return NextResponse.json({ error: 'Erreur lors de l\'analyse de la recette' }, { status: 500 })
  }
}, { maxRequests: 10, windowMs: 60 * 1000, prefix: 'ia-photo-recette' })