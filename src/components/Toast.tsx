'use client'

import React from 'react'
import { CheckCircle, AlertCircle, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ToastProps {
  id: number
  title: string
  description?: string
  variant?: 'default' | 'destructive'
  onDismiss: (id: number) => void
}

export function Toast({ id, title, description, variant = 'default', onDismiss }: ToastProps) {
  const getIcon = () => {
    if (variant === 'destructive') {
      return <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
    }
    return <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
  }

  const getBackgroundColor = () => {
    if (variant === 'destructive') {
      return 'bg-red-50 dark:bg-red-950/50 border-red-200 dark:border-red-800'
    }
    return 'bg-green-50 dark:bg-green-950/50 border-green-200 dark:border-green-800'
  }

  return (
    <div
      className={`fixed top-4 right-4 z-50 w-full max-w-sm rounded-lg border p-4 shadow-lg ${getBackgroundColor()} animate-in slide-in-from-right-full duration-300`}
    >
      <div className="flex items-start space-x-3">
        <div className="mt-0.5 flex-shrink-0">{getIcon()}</div>
        <div className="min-w-0 flex-1">
          <p className="text-foreground text-sm font-medium">{title}</p>
          {description && <p className="text-muted-foreground mt-1 text-sm">{description}</p>}
        </div>
        <Button variant="ghost" size="sm" onClick={() => onDismiss(id)} className="h-6 w-6 flex-shrink-0 p-0">
          <X className="h-3 w-3" />
        </Button>
      </div>
    </div>
  )
}
