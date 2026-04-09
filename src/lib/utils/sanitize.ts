const DANGEROUS_PATTERNS = [
  /<script[\s\S]*?>[\s\S]*?<\/script>/gi,
  /<iframe[\s\S]*?>[\s\S]*?<\/iframe>/gi,
  /<object[\s\S]*?>[\s\S]*?<\/object>/gi,
  /<embed[\s\S]*?>/gi,
  /<link[\s\S]*?>/gi,
  /javascript:/gi,
  /vbscript:/gi,
  /on\w+\s*=/gi,
  /data:text\/html/gi,
  /&#/gi,
]

const HTML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
}

export function sanitizeText(input: unknown): string {
  if (input === null || input === undefined) return ''
  const str = String(input).trim()
  if (str.length === 0) return ''

  // Remove dangerous patterns first
  let cleaned = str
  for (const pattern of DANGEROUS_PATTERNS) {
    cleaned = cleaned.replace(pattern, '')
  }

  // Escape HTML entities
  return cleaned.replace(
    /[&<>"'/]/g,
    (char) => HTML_ENTITIES[char] ?? char
  )
}

export function sanitizeRichText(input: unknown): string {
  if (input === null || input === undefined) return ''
  const str = String(input).trim()
  if (str.length === 0) return ''

  let cleaned = str
  for (const pattern of DANGEROUS_PATTERNS) {
    cleaned = cleaned.replace(pattern, '')
  }
  return cleaned
}

export function sanitizeUrl(input: unknown): string {
  if (input === null || input === undefined) return ''
  const str = String(input).trim()
  if (/^(javascript|vbscript|data):/i.test(str)) return ''
  return str
}

// Default export for backward compatibility
export default sanitizeText
