import { createServerSupabaseClient } from './supabase-server'
import type { Database } from './supabase-types'

/**
 * Server-side version of fetchAllRecords.
 * Fetches all records from a Supabase table using pagination to overcome the 1000 row limit.
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
  const supabase = await createServerSupabaseClient()
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
      break
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
}

