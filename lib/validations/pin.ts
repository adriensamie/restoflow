import { z } from 'zod'

export const pinSchema = z.string().regex(/^\d{4,6}$/, 'Le PIN doit contenir 4 a 6 chiffres')

export const setPinSchema = z.object({
  staff_id: z.string().uuid(),
  pin: pinSchema,
})

export const authenticatePinSchema = z.object({
  organization_id: z.string().uuid(),
  staff_id: z.string().uuid(),
  pin: pinSchema,
})
