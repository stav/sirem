import Navigation from '@/components/Navigation'

export default function ManageLoading() {
  return (
    <div className="bg-background min-h-screen">
      <Navigation />
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

