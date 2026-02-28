import { z } from 'zod'

export const updateRolePermissionsSchema = z.object({
  role: z.enum(['manager', 'employe', 'livreur']),
  allowed_routes: z.array(z.string().min(1).max(100)),
  allowed_actions: z.array(z.string().min(1).max(100)),
})
