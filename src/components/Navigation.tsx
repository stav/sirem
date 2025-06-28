import Link from 'next/link'
import { Users, BarChart3 } from 'lucide-react'

interface NavigationProps {
  pageTitle: string
}

// Define available pages with their routes and icons
const availablePages = [
  { title: 'Dashboard', path: '/', icon: BarChart3 },
  { title: 'Manage', path: '/manage', icon: Users }
]

export default function Navigation({ pageTitle }: NavigationProps) {
  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center space-x-6">
            <h1 className="text-xl font-semibold text-gray-900">Sirem CRM</h1>
            <span className="text-lg font-medium text-gray-700">{pageTitle}</span>
          </div>
          <div className="flex items-center space-x-4">
            {availablePages
              .filter(page => page.title !== pageTitle)
              .map(page => {
                const IconComponent = page.icon
                return (
                  <Link
                    key={page.path}
                    href={page.path}
                    className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md"
                  >
                    <IconComponent className="h-4 w-4 mr-2" />
                    {page.title === 'Manage' ? 'Manage Contacts' : page.title}
                  </Link>
                )
              })}
          </div>
        </div>
      </div>
    </nav>
  )
} 
