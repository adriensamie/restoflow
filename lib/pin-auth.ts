import bcrypt from 'bcryptjs'
import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'

const PIN_COOKIE = 'restoflow-pin-session'
const PIN_TTL_HOURS = 8

function getSecret() {
  const secret = process.env.PIN_SESSION_SECRET
  if (!secret) throw new Error('PIN_SESSION_SECRET non configure')
  return new TextEncoder().encode(secret)
}

export async function hashPin(pin: string): Promise<string> {
  return bcrypt.hash(pin, 12)
}

export async function verifyPin(pin: string, hash: string): Promise<boolean> {
  return bcrypt.compare(pin, hash)
}

export async function createPinSession(payload: {
  staffId: string
  orgId: string
  role: string
  nom: string
  prenom: string
  pinChangedAt?: string
}): Promise<string> {
  const token = await new SignJWT({
    staffId: payload.staffId,
    orgId: payload.orgId,
    role: payload.role,
    nom: payload.nom,
    prenom: payload.prenom,
    pinChangedAt: payload.pinChangedAt ?? null,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${PIN_TTL_HOURS}h`)
    .sign(getSecret())

  const cookieStore = await cookies()
  cookieStore.set(PIN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: PIN_TTL_HOURS * 3600,
    path: '/',
  })

  return token
}

export async function validatePinSession(): Promise<{
  staffId: string
  orgId: string
  role: string
  nom: string
  prenom: string
  pinChangedAt: string | null
} | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(PIN_COOKIE)?.value
    if (!token) return null

    const { payload } = await jwtVerify(token, getSecret())
    return {
      staffId: payload.staffId as string,
      orgId: payload.orgId as string,
      role: payload.role as string,
      nom: payload.nom as string,
      prenom: payload.prenom as string,
      pinChangedAt: (payload.pinChangedAt as string) ?? null,
    }
  } catch {
    return null
  }
}

export async function clearPinSession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(PIN_COOKIE)
}
