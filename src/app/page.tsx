import { fetchAllRecordsServer } from '@/lib/database-server'
import { calculateDashboardData, type DashboardContact, type Action } from '@/lib/dashboard-utils'
import DashboardClient from '@/components/DashboardClient'

export default async function Home() {
  // Fetch data on the server - this runs before the page is sent to the browser
  const [allContacts, allActions] = await Promise.all([
    // Optimized contacts query - only fetch essential fields for dashboard
    fetchAllRecordsServer<DashboardContact>(
      'contacts',
      `
        id,
        first_name,
        last_name,
        birthdate,
        phone,
        email,
        status,
        created_at,
        updated_at,
        addresses(
          address1,
          city,
          address_type
        )
      `,
      'created_at',
      false
    ),
    // Fetch all actions with pagination to overcome 1000 row limit
    fetchAllRecordsServer<Action>(
      'actions',
      `
        *,
        contact:contacts (
          id,
          first_name,
          last_name
        )
      `,
      'start_date',
      true
    ),
  ])

  // Calculate dashboard data on the server
  const dashboardData = calculateDashboardData(allContacts, allActions)

  // Pass pre-calculated data to client component
  return <DashboardClient data={dashboardData} />
}
