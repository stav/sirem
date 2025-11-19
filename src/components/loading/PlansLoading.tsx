import Navigation from '@/components/Navigation'

export default function PlansLoading() {
  return (
    <div className="bg-background min-h-screen">
      <Navigation />
      <div className="flex h-[calc(100vh-4rem)] flex-col">
        <div className="flex flex-1 flex-col">
          <div className="bg-muted/20 border-b p-4">
            <div className="animate-pulse">
              <div className="bg-muted h-8 w-48 rounded"></div>
            </div>
          </div>
          <div className="flex flex-1 flex-col p-6">
            <div className="animate-pulse">
              <div className="bg-muted h-full rounded"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

