import { Suspense } from 'react'
import ManageClient from '@/components/ManageClient'
import Navigation from '@/components/Navigation'
import { fetchAllRecordsServer } from '@/lib/database-server'
import { CONTACTS_SELECT_QUERY } from '@/lib/query-constants'
import type { ManageContact, ManageAction } from '@/types/manage'

async function fetchManageData() {
  const [contacts, actions] = await Promise.all([
    fetchAllRecordsServer<ManageContact>('contacts', CONTACTS_SELECT_QUERY, 'created_at', false),
    fetchAllRecordsServer<ManageAction>('actions', '*', 'created_at', false),
  ])

  return { contacts, actions }
}

function ManageFallback() {
  return (
    <div className="bg-background min-h-screen">
      <Navigation pageTitle="Manage" />
      <div className="p-6">
        <div className="mx-auto max-w-7xl">
          <div className="animate-pulse">
            <div className="bg-muted mb-8 h-8 w-1/4 rounded"></div>
            <div className="flex h-[calc(100vh-8rem)] flex-col gap-8 lg:flex-row">
              <div className="min-w-0 flex-1 lg:flex-1">
                <div className="bg-muted h-full rounded"></div>
              </div>
              <div className="min-w-0 flex-1 lg:flex-1">
                <div className="bg-muted h-full rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default async function ManagePage() {
  const { contacts, actions } = await fetchManageData()

  return (
    <Suspense fallback={<ManageFallback />}>
      <ManageClient initialContacts={contacts} initialActions={actions} />
    </Suspense>
  )
}

