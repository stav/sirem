import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/supabase'
import type { Json } from '@/lib/supabase-types'
import { parseCsv, normalizeHeader } from '@/lib/csv-utils'

type ActionInsert = Database['public']['Tables']['actions']['Insert']
type ContactRow = Database['public']['Tables']['contacts']['Row']

export interface BulkActionTemplate {
  title: string
  description?: string
  tags?: string
  status?: string
  priority?: string
  start_date?: string | null
  completed_date?: string | null
  source?: string
}

interface ImportStats {
  total: number
  imported: number
  skipped: number
  errors: number
}

interface CsvContactRow {
  email: string
  firstName?: string
  lastName?: string
  fullName?: string
}

/**
 * Parse Kit.com export format:
 * K
 * 
 * Kenneth (keallen@prodigy.net)
 * 
 * K
 * 
 * Karen (karenekdavis@gmail.com)
 */
export function parseKitTextFormat(text: string): CsvContactRow[] {
  const contacts: CsvContactRow[] = []
  const lines = text.split('\n').map((line) => line.trim())
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    // Skip empty lines and single-letter lines (section headers)
    if (!line || line.length === 1) continue
    
    // Look for pattern: "Name (email@domain.com)"
    const match = line.match(/^(.+?)\s*\(([^\s]+@[^)]+)\)$/)
    if (match) {
      const fullName = match[1].trim()
      const email = match[2].trim().toLowerCase()
      
      // Try to split name into first/last
      const nameParts = fullName.split(/\s+/)
      const firstName = nameParts[0] || undefined
      const lastName = nameParts.slice(1).join(' ') || undefined
      
      contacts.push({
        email,
        firstName,
        lastName,
        fullName,
      })
    }
  }
  
  return contacts
}

/**
 * Detect if text is Kit.com format (has lines like "Name (email@domain.com)")
 */
export function isKitTextFormat(text: string): boolean {
  const lines = text.split('\n').map((line) => line.trim()).filter((line) => line.length > 1)
  // Check if at least one line matches the Kit format pattern
  return lines.some((line) => /^.+?\s*\([^\s]+@[^)]+\)$/.test(line))
}

const chunk = <T,>(arr: T[], size: number): T[][] => {
  const result: T[][] = []
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size))
  }
  return result
}

function normalizeIso(value?: string | null): string | null {
  if (!value) return null
  const trimmed = value.trim()
  if (!trimmed) return null
  // Ensure ISO string by round-tripping through Date
  const date = new Date(trimmed)
  if (Number.isNaN(date.getTime())) return null
  return date.toISOString()
}

function nullIfEmpty(value?: string | null): string | null {
  if (!value) return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

export async function importActionsCsv(
  text: string,
  template: BulkActionTemplate
): Promise<{ success: boolean; message: string; stats: ImportStats }> {
  // Detect format and parse accordingly
  let csvContacts: CsvContactRow[]
  
  if (isKitTextFormat(text)) {
    // Parse Kit.com text format
    csvContacts = parseKitTextFormat(text)
  } else {
    // Parse CSV format
    const rows = parseCsv(text)
    if (rows.length === 0) {
      return { success: false, message: 'Empty file – nothing to import.', stats: { total: 0, imported: 0, skipped: 0, errors: 0 } }
    }

    const header = rows[0].map(normalizeHeader)
    const dataRows = rows
      .slice(1)
      .map((r) => r.map((value) => value?.trim() ?? ''))
      .filter((r) => r.some((value) => value !== ''))

    const emailIdx = header.findIndex((h) => h === 'email')
    if (emailIdx === -1) {
      return {
        success: false,
        message: 'File does not contain an "Email" column. Expected CSV with Email column or Kit.com export format.',
        stats: { total: 0, imported: 0, skipped: 0, errors: 0 },
      }
    }

    const firstNameIdx = header.findIndex((h) => h === 'first name')
    const lastNameIdx = header.findIndex((h) => h === 'last name')
    const fullNameIdx = header.findIndex((h) => h === 'full name')

    csvContacts = dataRows.map((row) => ({
      email: row[emailIdx]?.toLowerCase() ?? '',
      firstName: firstNameIdx >= 0 ? row[firstNameIdx] : undefined,
      lastName: lastNameIdx >= 0 ? row[lastNameIdx] : undefined,
      fullName: fullNameIdx >= 0 ? row[fullNameIdx] : undefined,
    }))
  }

  const validContacts = csvContacts.filter((row) => row.email)
  const uniqueContactRows = new Map<string, CsvContactRow>()
  validContacts.forEach((row) => {
    if (!uniqueContactRows.has(row.email)) {
      uniqueContactRows.set(row.email, row)
    }
  })
  const uniqueEmails = Array.from(uniqueContactRows.keys())
  const total = uniqueContactRows.size

  if (uniqueEmails.length === 0) {
    return {
      success: false,
      message: 'CSV does not contain any email addresses.',
      stats: { total: 0, imported: 0, skipped: 0, errors: 0 },
    }
  }

  const foundContacts = new Map<string, Pick<ContactRow, 'id' | 'email' | 'first_name' | 'last_name'>>()
  const lookupErrors: string[] = []

  // Use case-insensitive matching
  // Supabase's .in() is case-sensitive, so we use .or() with ilike for case-insensitive matching
  // Format: email.ilike.value1,email.ilike.value2,...
  for (const emailChunk of chunk(uniqueEmails, 50)) {
    // Build case-insensitive query using ilike with or
    const orConditions = emailChunk.map((email) => `email.ilike.${email}`).join(',')
    
    const { data, error } = await supabase
      .from('contacts')
      .select('id,email,first_name,last_name')
      .or(orConditions)

    if (error) {
      lookupErrors.push(error.message)
      continue
    }

    data?.forEach((contact) => {
      if (contact.email) {
        // Store with lowercase key for consistent lookup
        foundContacts.set(contact.email.toLowerCase(), contact)
      }
    })
  }

  if (lookupErrors.length > 0) {
    return {
      success: false,
      message: `Failed to look up contacts: ${lookupErrors.join('; ')}`,
      stats: { total, imported: 0, skipped: total, errors: total },
    }
  }

  const actionsToInsert: ActionInsert[] = []
  const missingEmails: string[] = []

  uniqueContactRows.forEach((row, email) => {
    const contact = foundContacts.get(row.email)
    if (!contact) {
      missingEmails.push(email)
      return
    }

    const derivedName =
      (row.fullName && row.fullName.trim()) ||
      `${row.firstName ?? ''} ${row.lastName ?? ''}`.trim()

    const metadata: Json = {
      import_type: 'kit_email_blast',
      matched_email: contact.email ?? null,
      csv_name: derivedName || null,
    }

    actionsToInsert.push({
      contact_id: contact.id,
      title: template.title,
      description: nullIfEmpty(template.description),
      tags: nullIfEmpty(template.tags),
      start_date: normalizeIso(template.start_date),
      end_date: null,
      completed_date: normalizeIso(template.completed_date),
      status: nullIfEmpty(template.status) ?? 'completed',
      priority: nullIfEmpty(template.priority),
      outcome: null,
      duration: null,
      source: nullIfEmpty(template.source) ?? 'Kit Import',
      metadata,
    })
  })

  if (actionsToInsert.length === 0) {
    return {
      success: false,
      message: 'No matching contacts were found for the provided email addresses.',
      stats: { total, imported: 0, skipped: total, errors: missingEmails.length },
    }
  }

  let inserted = 0
  let errors = 0
  for (const batch of chunk(actionsToInsert, 50)) {
    const { error } = await supabase.from('actions').insert(batch)
    if (error) {
      errors += batch.length
    } else {
      inserted += batch.length
    }
  }

  const skipped = Math.max(total - inserted - errors, 0)

  const baseMessage = `Created ${inserted} actions from ${total} CSV contacts.`
  const missingMessage =
    missingEmails.length > 0
      ? ` Skipped ${missingEmails.length} contacts with no CRM match: ${missingEmails.slice(0, 5).join(', ')}${
          missingEmails.length > 5 ? '…' : ''
        }.`
      : ''
  const errorMessage = errors > 0 ? ` ${errors} actions failed to insert.` : ''

  return {
    success: errors === 0,
    message: `${baseMessage}${missingMessage}${errorMessage}`.trim(),
    stats: {
      total,
      imported: inserted,
      skipped,
      errors,
    },
  }
}

