import { createClient } from '@supabase/supabase-js'
import type { Database } from './supabase-types'

/**
 * Server-side version of fetchAllRecords.
 * Fetches all records from a Supabase table using pagination to overcome the 1000 row limit.
 *
 * Uses a simple client without cookies since all data has public read access.
 * This allows pages to be statically generated during build.
 *
 * @param tableName - Name of the table to query
 * @param selectQuery - SELECT query string (can include joins)
 * @param orderBy - Column to order by
 * @param ascending - Whether to sort ascending (default: false)
 * @param limit - Number of records per batch (default: 1000)
 * @returns Promise<T[]> Array of all records
 */
export async function fetchAllRecordsServer<T>(
  tableName: keyof Database['public']['Tables'],
  selectQuery: string,
  orderBy: string,
  ascending: boolean = false,
  limit: number = 1000
): Promise<T[]> {
  try {
    // Use a simple client without cookies for public data reads
    // This allows static generation during build
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || supabaseUrl.includes('your-project-id')) {
      throw new Error(
        `Supabase URL not configured. Please set NEXT_PUBLIC_SUPABASE_URL in .env.local. ` +
          `Current value: ${supabaseUrl ? 'invalid' : 'missing'}`
      )
    }

    if (!supabaseAnonKey) {
      throw new Error(`Supabase anon key not configured. Please set NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local.`)
    }

    const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

    let allRecords: T[] = []
    let offset = 0
    let hasMore = true

    while (hasMore) {
      const { data, error } = await supabase
        .from(tableName)
        .select(selectQuery)
        .order(orderBy, { ascending })
        .range(offset, offset + limit - 1)

      if (error) {
        console.error(`Error fetching ${tableName}:`, error)
        throw new Error(`Failed to fetch ${tableName}: ${error.message} (${error.code || 'unknown'})`)
      }

      if (data && data.length > 0) {
        allRecords = [...allRecords, ...(data as T[])]
        offset += limit

        // If we got less than the limit, we've reached the end
        if (data.length < limit) {
          hasMore = false
        }
      } else {
        hasMore = false
      }
    }

    return allRecords
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error(`Error in fetchAllRecordsServer for ${tableName}:`, errorMessage)

    // Re-throw with more context
    throw new Error(
      `Database fetch failed for ${tableName}. ` +
        `This usually means: 1) Supabase project is paused, 2) Invalid credentials in .env.local, ` +
        `or 3) Network connectivity issues. Error: ${errorMessage}`
    )
  }
}
