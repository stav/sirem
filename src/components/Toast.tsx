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
      return <AlertCircle className="h-4 w-4 text-red-600" />
    }
    return <CheckCircle className="h-4 w-4 text-green-600" />
  }

  const getBackgroundColor = () => {
    if (variant === 'destructive') {
      return 'bg-red-50 border-red-200'
    }
    return 'bg-green-50 border-green-200'
  }

  return (
    <div className={`fixed top-4 right-4 z-50 max-w-sm w-full p-4 rounded-lg border shadow-lg ${getBackgroundColor()} animate-in slide-in-from-right-full duration-300`}>
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0 mt-0.5">
          {getIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900">{title}</p>
          {description && (
            <p className="text-sm text-gray-600 mt-1">{description}</p>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDismiss(id)}
          className="flex-shrink-0 h-6 w-6 p-0"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    </div>
  )
} 
