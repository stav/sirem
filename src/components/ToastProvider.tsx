'use client'

import React, { useEffect, useState, useRef } from 'react'
import { useToast } from '@/hooks/use-toast'
import { useLogger, type LogMessage } from '@/lib/logger'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { History, X, CheckCircle, AlertTriangle, Info, AlertCircle } from 'lucide-react'
import { Toast } from '@/components/Toast'

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const { toast, toasts } = useToast()
  const { messages } = useLogger()
  const [showHistory, setShowHistory] = useState(false)
  const [lastMessageId, setLastMessageId] = useState<string | null>(null)
  const modalRef = useRef<HTMLDivElement>(null)

  // Show toast for new messages
  useEffect(() => {
    if (messages.length > 0 && messages[0].id !== lastMessageId) {
      const latestMessage = messages[0]
      setLastMessageId(latestMessage.id)
      
      toast({
        title: latestMessage.message,
        description: latestMessage.action ? `Action: ${latestMessage.action}` : undefined,
        variant: latestMessage.type === 'error' ? 'destructive' : 'default',
      })
    }
  }, [messages, toast, lastMessageId])

  // Handle escape key press
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && showHistory) {
        setShowHistory(false)
      }
    }

    if (showHistory) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [showHistory])

  // Handle click outside modal
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        setShowHistory(false)
      }
    }

    if (showHistory) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showHistory])

  const getIcon = (type: LogMessage['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      case 'info':
        return <Info className="h-4 w-4 text-blue-600" />
    }
  }

  const getBadgeVariant = (type: LogMessage['type']) => {
    switch (type) {
      case 'success':
        return 'default'
      case 'error':
        return 'destructive'
      case 'warning':
        return 'secondary'
      case 'info':
        return 'outline'
    }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  return (
    <>
      {children}
      
      {/* Toast Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((toast, index) => (
          <div key={toast.id} style={{ top: `${index * 80 + 16}px` }} className="absolute right-0">
            <Toast
              id={toast.id}
              title={toast.title}
              description={toast.description}
              variant={toast.variant}
              onDismiss={() => {
                // This will be handled by the auto-remove timeout
              }}
            />
          </div>
        ))}
      </div>
      
      {/* Message History Button */}
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setShowHistory(true)}
          size="sm"
          className="rounded-full shadow-lg"
        >
          <History className="h-4 w-4 mr-2" />
          History ({messages.length})
        </Button>
      </div>

      {/* Message History Modal */}
      {showHistory && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div ref={modalRef} className="w-full max-w-2xl max-h-[80vh] overflow-hidden">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <CardTitle className="flex items-center">
                  <History className="h-5 w-5 mr-2" />
                  Message History
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowHistory(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="overflow-y-auto max-h-[60vh]">
                {messages.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No messages yet
                  </div>
                ) : (
                  <div className="space-y-3">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className="flex items-start space-x-3 p-3 rounded-lg border bg-card"
                      >
                        <div className="flex-shrink-0 mt-1">
                          {getIcon(message.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <p className="text-sm font-medium text-foreground">
                              {message.message}
                            </p>
                            <Badge variant={getBadgeVariant(message.type)}>
                              {message.type}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>
                              {formatDate(message.timestamp)} at {formatTime(message.timestamp)}
                            </span>
                            {message.action && (
                              <span className="font-mono bg-muted px-2 py-1 rounded">
                                {message.action}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </>
  )
} 
