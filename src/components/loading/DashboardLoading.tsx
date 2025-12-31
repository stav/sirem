import Navigation from '@/components/Navigation'

export default function DashboardLoading() {
  return (
    <div className="bg-background min-h-screen">
      <Navigation />
      <div className="p-6">
        <div className="mx-auto">
          <div className="animate-pulse">
            <div className="bg-muted mb-8 h-8 w-1/4 rounded"></div>
            <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-card rounded-lg p-6 shadow">
                  <div className="bg-muted mb-2 h-4 w-1/2 rounded"></div>
                  <div className="bg-muted h-8 w-1/3 rounded"></div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
              <div className="space-y-8 lg:col-span-2">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="bg-card rounded-lg p-6 shadow">
                    <div className="bg-muted mb-4 h-6 w-1/3 rounded"></div>
                    <div className="space-y-3">
                      {[...Array(4)].map((_, j) => (
                        <div key={j} className="bg-muted h-4 rounded"></div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="space-y-6">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="bg-card rounded-lg p-6 shadow">
                    <div className="bg-muted mb-4 h-6 w-1/2 rounded"></div>
                    <div className="space-y-3">
                      {[...Array(3)].map((_, j) => (
                        <div key={j} className="bg-muted h-4 rounded"></div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
