import { Suspense } from 'react'
import PlansClient from '@/components/PlansClient'
import PlansLoading from '@/components/loading/PlansLoading'
import { fetchAllRecordsServer } from '@/lib/database-server'
import type { Database } from '@/lib/supabase-types'

type Plan = Database['public']['Tables']['plans']['Row']

async function PlansData() {
  // Data fetching happens inside Suspense boundary
  // This allows the fallback to show while data is being fetched
  const plans = await fetchAllRecordsServer<Plan>(
    'plans',
    '*',
    'plan_year',
    false // descending order
  )

  // Sort plans: plan_year (desc), carrier (asc), name (asc)
  // This matches the sorting logic in usePlans hook
  const sortedPlans = [...plans].sort((a, b) => {
    const ay = a.plan_year ?? 0
    const by = b.plan_year ?? 0
    if (ay !== by) return by - ay
    const ac = (a.carrier ?? '').toString().toLowerCase()
    const bc = (b.carrier ?? '').toString().toLowerCase()
    const c = ac.localeCompare(bc)
    if (c !== 0) return c
    return a.name.localeCompare(b.name)
  })

  return <PlansClient initialPlans={sortedPlans} />
}

export default function PlansPage() {
  return (
    <Suspense fallback={<PlansLoading />}>
      <PlansData />
    </Suspense>
  )
}
