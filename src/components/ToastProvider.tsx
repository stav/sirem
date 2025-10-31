'use client'

import React, { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { useToast } from '@/hooks/use-toast'
import { useLogger, type LogMessage } from '@/lib/logger'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { History, X, CheckCircle, AlertTriangle, Info, AlertCircle } from 'lucide-react'
import { Toast } from '@/components/Toast'

// Helper function to render message text with clickable contact names
function renderMessageWithLinks(message: LogMessage, onLinkClick: () => void) {
  const { message: text, details } = message
  const contactId = details?.contactId as string | undefined
  const contactName = details?.contactName as string | undefined
  const contactDetails = details?.contactDetails as Array<{ id: string; name: string }> | undefined

  // Handle multiple contacts (for plan deletion messages)
  if (contactDetails && contactDetails.length > 0) {
    const result = text
    const elements: React.ReactNode[] = []
    let lastIndex = 0

    // Replace each contact name with a clickable link
    contactDetails.forEach((contact, index) => {
      const nameIndex = result.indexOf(contact.name, lastIndex)
      if (nameIndex !== -1) {
        // Add text before the contact name
        if (nameIndex > lastIndex) {
          elements.push(result.slice(lastIndex, nameIndex))
        }

        // Add the clickable contact name
        elements.push(
          <Link
            key={`contact-${contact.id}-${index}`}
            href={`/manage?contact=${contact.id}`}
            className="text-primary font-semibold hover:underline"
            onClick={(e) => {
              e.stopPropagation()
              onLinkClick()
            }}
          >
            {contact.name}
          </Link>
        )

        lastIndex = nameIndex + contact.name.length
      }
    })

    // Add remaining text
    if (lastIndex < result.length) {
      elements.push(result.slice(lastIndex))
    }

    // If we found any links, return the elements, otherwise fall back to plain text
    if (elements.length > 0) {
      return <>{elements}</>
    }
  }

  // Handle single contact (existing logic)
  if (contactId && contactName && text.includes(contactName)) {
    const parts = text.split(contactName)
    return (
      <>
        {parts.map((part, index) => (
          <React.Fragment key={index}>
            {part}
            {index < parts.length - 1 && (
              <Link
                href={`/manage?contact=${contactId}`}
                className="text-primary font-semibold hover:underline"
                onClick={(e) => {
                  e.stopPropagation()
                  onLinkClick()
                }}
              >
                {contactName}
              </Link>
            )}
          </React.Fragment>
        ))}
      </>
    )
  }

  // Otherwise, just return the plain text
  return <>{text}</>
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const { toast, toasts, dismiss } = useToast()
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
        contactDetails: latestMessage.details?.contactDetails as Array<{ id: string; name: string }> | undefined,
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
      second: '2-digit',
    })
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  return (
    <>
      {children}

      {/* Toast Notifications */}
      <div className="fixed top-4 right-4 z-[9999] space-y-2">
        {toasts.map((toast) => (
          <div key={toast.id} className="relative">
            <Toast
              id={toast.id}
              title={toast.title}
              description={toast.description}
              variant={toast.variant}
              contactDetails={toast.contactDetails}
              onDismiss={dismiss}
            />
          </div>
        ))}
      </div>

      {/* Message History Button */}
      <div className="fixed right-4 bottom-4 z-50">
        <Button onClick={() => setShowHistory(true)} size="sm" className="cursor-pointer rounded-full shadow-lg">
          <History className="mr-2 h-4 w-4" />
          History ({messages.length})
        </Button>
      </div>

      {/* Message History Modal */}
      {showHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div ref={modalRef} className="max-h-[80vh] w-full max-w-2xl overflow-hidden">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <CardTitle className="flex items-center">
                  <History className="mr-2 h-5 w-5" />
                  Message History
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setShowHistory(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="max-h-[60vh] overflow-y-auto">
                {messages.length === 0 ? (
                  <div className="text-muted-foreground py-8 text-center">No messages yet</div>
                ) : (
                  <div className="space-y-3">
                    {messages.map((message) => (
                      <div key={message.id} className="bg-card flex items-start space-x-3 rounded-lg border p-3">
                        <div className="mt-1 flex-shrink-0">{getIcon(message.type)}</div>
                        <div className="min-w-0 flex-1">
                          <div className="mb-1 flex items-center space-x-2">
                            <p className="text-foreground text-sm font-medium">
                              {renderMessageWithLinks(message, () => setShowHistory(false))}
                            </p>
                            <Badge variant={getBadgeVariant(message.type)}>{message.type}</Badge>
                          </div>
                          <div className="text-muted-foreground flex items-center justify-between text-xs">
                            <span>
                              {formatDate(message.timestamp)} at {formatTime(message.timestamp)}
                            </span>
                            {message.action && (
                              <span className="bg-muted rounded px-2 py-1 font-mono">{message.action}</span>
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
