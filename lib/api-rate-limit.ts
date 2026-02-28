// API route rate limiting wrapper
import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/rate-limit'
import { auth } from '@clerk/nextjs/server'

type Handler = (req: NextRequest) => Promise<Response | NextResponse>

/**
 * Wraps an API route handler with rate limiting.
 * Uses userId (authenticated) or IP as the rate limit key.
 */
export function withRateLimit(
  handler: Handler,
  opts: { maxRequests: number; windowMs: number; prefix: string }
): Handler {
  return async (req: NextRequest) => {
    let key: string
    try {
      const { userId } = await auth()
      key = userId ?? req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? 'anonymous'
    } catch {
      key = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? 'anonymous'
    }

    const result = checkRateLimit(`${opts.prefix}:${key}`, opts.maxRequests, opts.windowMs)

    if (!result.allowed) {
      return NextResponse.json(
        { error: 'Trop de requetes. Veuillez patienter.' },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((result.resetAt - Date.now()) / 1000)),
          },
        }
      )
    }

    return handler(req)
  }
}
