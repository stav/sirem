import { Suspense } from 'react'
import { fetchAllRecordsServer } from '@/lib/database-server'
import { calculateDashboardData, type DashboardContact, type Action } from '@/lib/dashboard-utils'
import DashboardClient from '@/components/DashboardClient'
import DashboardLoading from '@/components/loading/DashboardLoading'

async function DashboardData() {
  // Data fetching happens inside Suspense boundary
  // This allows the fallback to show while data is being fetched
  try {
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
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('Dashboard data fetch error:', errorMessage)
    
    return (
      <div className="p-8">
        <div className="rounded-lg border border-red-200 bg-red-50 p-6">
          <h2 className="text-lg font-semibold text-red-900 mb-2">
            Database Connection Error
          </h2>
          <p className="text-red-700 mb-4">{errorMessage}</p>
          <div className="text-sm text-red-600 space-y-1">
            <p><strong>Common fixes:</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Check that your Supabase project is not paused (free tier projects pause after inactivity)</li>
              <li>Verify <code className="bg-red-100 px-1 rounded">NEXT_PUBLIC_SUPABASE_URL</code> and <code className="bg-red-100 px-1 rounded">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> in <code className="bg-red-100 px-1 rounded">.env.local</code></li>
              <li>Restart the dev server after updating <code className="bg-red-100 px-1 rounded">.env.local</code></li>
              <li>Check your network connection</li>
            </ul>
          </div>
        </div>
      </div>
    )
  }
}

export default function Home() {
  return (
    <Suspense fallback={<DashboardLoading />}>
      <DashboardData />
    </Suspense>
  )
}
