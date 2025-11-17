import { Suspense } from 'react'
import ManageClient from '@/components/ManageClient'
import ManageLoading from '@/components/loading/ManageLoading'
import { fetchAllRecordsServer } from '@/lib/database-server'
import { CONTACTS_SELECT_QUERY } from '@/lib/query-constants'
import type { ManageContact, ManageAction } from '@/types/manage'

async function ManageData() {
  // Data fetching happens inside Suspense boundary
  // This allows the fallback to show while data is being fetched
  const [contacts, actions] = await Promise.all([
    fetchAllRecordsServer<ManageContact>('contacts', CONTACTS_SELECT_QUERY, 'created_at', false),
    fetchAllRecordsServer<ManageAction>('actions', '*', 'created_at', false),
  ])

  return <ManageClient initialContacts={contacts} initialActions={actions} />
}

export default function ManagePage() {
  return (
    <Suspense fallback={<ManageLoading />}>
      <ManageData />
    </Suspense>
  )
}

