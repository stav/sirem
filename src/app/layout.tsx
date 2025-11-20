import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { ToastProvider } from '@/components/ToastProvider'
import { TooltipProvider } from '@/components/ui/tooltip'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { PlanCacheProvider } from '@/contexts/PlanCacheContext'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: {
    template: '%s | Sirem',
    default: 'Sirem',
  },
  description: 'A modern CRM system for managing contacts and actions',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ThemeProvider>
          <PlanCacheProvider>
            <TooltipProvider>
              <ToastProvider>{children}</ToastProvider>
            </TooltipProvider>
          </PlanCacheProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
