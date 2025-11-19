import Link from 'next/link'
import { Users, BarChart3, Upload, ClipboardList, Tags } from 'lucide-react'
import { ThemeToggle } from './ThemeToggle'

interface NavigationProps {
  pageTitle: string
}

// Define available pages with their routes and icons
const pages = [
  { title: 'Dashboard', path: '/', icon: BarChart3 },
  { title: 'Manage', path: '/manage', icon: Users },
  { title: 'Plans', path: '/plans', icon: ClipboardList },
  { title: 'Tags', path: '/tags', icon: Tags },
  { title: 'Import', path: '/import', icon: Upload },
]

export default function Navigation({ pageTitle }: NavigationProps) {
  return (
    <nav className="bg-background border-b shadow-sm">
      <div className="scrollbar-hide w-full overflow-x-auto">
        <div className="min-w-max px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between">
            <div className="flex items-center space-x-6">
              <h1 className="text-foreground text-xl font-semibold">Sirem CRM</h1>
            </div>
            <div className="flex items-center space-x-4">
              {pages.map((page) => {
                const IconComponent = page.icon
                const isActive = page.title === pageTitle

                return (
                  <Link
                    key={page.path}
                    href={page.path}
                    className={`flex items-center rounded-md px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
                      isActive
                        ? 'border-primary/20 bg-primary/10 text-primary border'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                    }`}
                  >
                    <IconComponent className="mr-2 h-4 w-4" />
                    {page.title}
                  </Link>
                )
              })}
              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
