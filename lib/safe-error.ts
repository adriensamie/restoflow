// Safe error handling: never leak internal details to the client

export class UserError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'UserError'
  }
}

/**
 * Returns a safe error message for the client.
 * Only UserError messages are forwarded; everything else becomes generic.
 */
export function safeErrorMessage(error: unknown): string {
  if (error instanceof UserError) return error.message
  return 'Une erreur est survenue. Veuillez reessayer.'
}

/**
 * Escape HTML special characters to prevent XSS in email templates.
 */
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
