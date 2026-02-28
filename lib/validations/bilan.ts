import { z } from 'zod'

export const bilanDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
