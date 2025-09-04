import React from 'react'
import { X, Clock } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { formatDateTimeForInput } from '@/lib/utils'

interface DateTimeInputProps {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  required?: boolean
  placeholder?: string
}

export default function DateTimeInput({
  id,
  label,
  value,
  onChange,
  required = false,
  placeholder,
}: DateTimeInputProps) {
  const handleClear = () => {
    onChange('')
  }

  const handleNow = () => {
    // Create local datetime-local format (YYYY-MM-DDTHH:MM)
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    const hours = String(now.getHours()).padStart(2, '0')
    const minutes = String(now.getMinutes()).padStart(2, '0')
    const datetimeLocal = `${year}-${month}-${day}T${hours}:${minutes}`

    // Treat local time as UTC
    const utcDate = new Date(datetimeLocal + 'Z')
    onChange(utcDate.toISOString())
  }

  // Convert ISO string to datetime-local format for the input
  const formatForInput = (isoString: string): string => {
    return formatDateTimeForInput(isoString)
  }

  // Convert datetime-local format to ISO string
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const datetimeLocal = e.target.value
    if (!datetimeLocal) {
      onChange('')
      return
    }

    // Convert to ISO string (UTC)
    const utcDate = new Date(datetimeLocal + 'Z')
    onChange(utcDate.toISOString())
  }

  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          type="datetime-local"
          value={formatForInput(value)}
          onChange={handleInputChange}
          required={required}
          placeholder={placeholder}
          className="pr-20"
        />
        <div className="absolute top-1/2 right-1 flex -translate-y-1/2 items-center space-x-1">
          {value && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="hover:bg-muted h-6 w-6 p-0"
              aria-label="Clear datetime"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleNow}
            className="hover:bg-muted h-6 w-6 p-0"
            aria-label="Set to now"
          >
            <Clock className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  )
}
