import { Suspense } from 'react'
import { fetchAllRecordsServer } from '@/lib/database-server'
import { calculateDashboardData, type DashboardContact, type Action } from '@/lib/dashboard-utils'
import DashboardClient from '@/components/DashboardClient'
import DashboardLoading from '@/components/loading/DashboardLoading'

async function DashboardData() {
  // Data fetching happens inside Suspense boundary
  // This allows the fallback to show while data is being fetched
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

export default function Home() {
  return (
    <Suspense fallback={<DashboardLoading />}>
      <DashboardData />
    </Suspense>
  )
}
