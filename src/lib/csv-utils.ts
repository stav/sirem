/**
 * Basic CSV utilities shared between import pipelines.
 *
 * These helpers intentionally avoid external dependencies while handling
 * quoted fields, escaped quotes, and different newline styles.
 */

/**
 * Parse a CSV string into a 2D array. Supports quoted fields and escaped quotes.
 */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let current: string[] = []
  let field = ''
  let inQuotes = false

  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    const next = text[i + 1]

    if (inQuotes) {
      if (char === '"' && next === '"') {
        field += '"'
        i++
      } else if (char === '"') {
        inQuotes = false
      } else {
        field += char
      }
    } else {
      if (char === '"') {
        inQuotes = true
      } else if (char === ',') {
        current.push(field)
        field = ''
      } else if (char === '\n') {
        current.push(field)
        rows.push(current)
        current = []
        field = ''
      } else if (char === '\r') {
        // Ignore CR to support CRLF line endings
      } else {
        field += char
      }
    }
  }

  // Push the final field and row
  current.push(field)
  rows.push(current)

  return rows
}

/**
 * Normalize a CSV header value for case-insensitive lookups.
 */
export function normalizeHeader(value: string): string {
  return value.trim().toLowerCase()
}
