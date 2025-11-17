import Navigation from '@/components/Navigation'

export default function TagsLoading() {
  return (
    <div className="bg-background min-h-screen">
      <Navigation />
      <div className="p-6">
        <div className="mx-auto max-w-6xl">
          <div className="animate-pulse">
            <div className="bg-muted mb-8 h-8 w-1/4 rounded"></div>
            <div className="space-y-4">
              <div className="bg-muted h-48 rounded"></div>
              <div className="bg-muted h-48 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

