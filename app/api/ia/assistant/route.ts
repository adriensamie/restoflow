// app/api/ia/assistant/route.ts
// Streaming AI chat assistant for RestoFlow restaurant management

import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { checkAccess } from '@/lib/billing'
import { withRateLimit } from '@/lib/api-rate-limit'

const client = new Anthropic()

const SYSTEM_PROMPT = `Tu es l'assistant IA de RestoFlow, une application de gestion de restaurant.
Tu es un expert en restauration, gestion des stocks, food cost, HACCP, planning d'équipe et optimisation de la rentabilité.

Règles :
- Réponds toujours en français.
- Sois concis et actionnable : donne des conseils pratiques, pas de la théorie.
- Utilise les données contextuelles fournies pour personnaliser tes réponses.
- Si des chiffres sont disponibles dans le contexte, utilise-les pour appuyer tes recommandations.
- Formate tes réponses avec du markdown simple (gras, listes à puces) pour la lisibilité.
- Si tu ne connais pas une information, dis-le clairement au lieu d'inventer.
- Tu peux utiliser des emojis avec modération pour structurer tes réponses.
- Ne parle jamais de toi-même en tant qu'IA ou modèle de langage sauf si on te le demande.`

export const POST = withRateLimit(async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const access = await checkAccess('assistant_ia')
  if (!access.allowed) {
    return NextResponse.json({ error: 'Fonctionnalité réservée au plan Pro. Mettez à niveau votre abonnement.' }, { status: 403 })
  }

  try {
    const { messages, contexte } = await req.json()

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Messages manquants' }, { status: 400 })
    }

    // Build the system prompt with injected context
    const contextBlock = contexte
      ? `\n\nVoici les données temps réel du restaurant "${contexte.restaurant ?? 'inconnu'}" (${contexte.date ?? 'date inconnue'}) :\n${JSON.stringify(contexte, null, 2)}`
      : ''

    const systemPrompt = SYSTEM_PROMPT + contextBlock

    // Filter to only valid roles and ensure alternation starts with user
    const apiMessages = messages
      .filter((m: { role: string; content: string }) =>
        (m.role === 'user' || m.role === 'assistant') && m.content?.trim()
      )
      .map((m: { role: string; content: string }) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }))

    // Stream the response using Anthropic SDK
    const stream = await client.messages.stream({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4096,
      system: systemPrompt,
      messages: apiMessages,
    })

    // Return a streaming Response with text chunks
    const encoder = new TextEncoder()
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (
              event.type === 'content_block_delta' &&
              event.delta.type === 'text_delta'
            ) {
              controller.enqueue(encoder.encode(event.delta.text))
            }
          }
          controller.close()
        } catch (err) {
          controller.error(err)
        }
      },
    })

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Transfer-Encoding': 'chunked',
      },
    })
  } catch (error: unknown) {
    console.error('ASSISTANT ERROR:', error)
    return NextResponse.json({ error: 'Erreur lors de la generation de la reponse' }, { status: 500 })
  }
}, { maxRequests: 10, windowMs: 60 * 1000, prefix: 'ia-assistant' })
