import Link from 'next/link'
import { Users, BarChart3, Table, Upload } from 'lucide-react'

interface NavigationProps {
  pageTitle: string
}

// Define available pages with their routes and icons
const pages = [
  { title: 'Dashboard', path: '/', icon: BarChart3 },
  { title: 'Manage', path: '/manage', icon: Users },
  { title: 'Sheets', path: '/sheets', icon: Table },
  { title: 'Import', path: '/import', icon: Upload },
]

export default function Navigation({ pageTitle }: NavigationProps) {
  return (
    <nav className="border-b bg-white shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between">
          <div className="flex items-center space-x-6">
            <h1 className="text-xl font-semibold text-gray-900">Sirem CRM</h1>
            <span className="text-lg font-medium text-gray-700">{pageTitle}</span>
          </div>
          <div className="flex items-center space-x-4">
            {pages.map((page) => {
              const IconComponent = page.icon
              const isActive = page.title === pageTitle

              return (
                <Link
                  key={page.path}
                  href={page.path}
                  className={`flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'border border-blue-200 bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <IconComponent className="mr-2 h-4 w-4" />
                  {page.title}
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </nav>
  )
}
