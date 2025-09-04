import React, { useRef, useEffect, ReactNode } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'

interface ModalFormProps {
  isOpen: boolean
  title: string | ReactNode
  children: ReactNode
  onSubmit: (e: React.FormEvent) => void
  onCancel: () => void
  isLoading?: boolean
  submitText?: string
  editingInfo?: ReactNode
  zIndex?: number
}

export default function ModalForm({
  isOpen,
  title,
  children,
  onSubmit,
  onCancel,
  isLoading = false,
  submitText = 'Save',
  editingInfo,
  zIndex = 50,
}: ModalFormProps) {
  const modalRef = useRef<HTMLDivElement>(null)

  // Close modal on Escape key
  useEffect(() => {
    if (!isOpen) return
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onCancel()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onCancel])

  if (!isOpen) return null

  return (
    <div
      className={`fixed inset-0 flex items-center justify-center bg-black/50 p-4`}
      style={{ zIndex }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onCancel()
        }
      }}
    >
      <Card className="flex max-h-[90vh] w-full max-w-md flex-col" ref={modalRef}>
        <CardHeader className="relative flex-shrink-0">
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-2 right-2 h-12 w-12 cursor-pointer p-0"
            onClick={onCancel}
          >
            <X className="h-8 w-8" />
          </Button>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto">
          <form onSubmit={onSubmit} className="space-y-4 pb-4">
            {editingInfo}
            {children}
            {submitText && (
              <div className="flex space-x-2 pt-4">
                <Button type="submit" className="flex-1 cursor-pointer" disabled={isLoading}>
                  {isLoading ? 'Saving...' : submitText}
                </Button>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
