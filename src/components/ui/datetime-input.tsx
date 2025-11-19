import React from 'react'
import { X, Clock, Calendar } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { formatDateTimeForInput, getLocalTimeAsUTC, estDateTimeLocalToUTC } from '@/lib/utils'

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
    // Use the shared utility function to get current local time as UTC
    onChange(getLocalTimeAsUTC())
  }

  // Convert ISO string to datetime-local format for the input
  const formatForInput = (isoString: string): string => {
    return formatDateTimeForInput(isoString)
  }

  // Convert datetime-local format (EST) to UTC ISO string for storage
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const datetimeLocal = e.target.value
    if (!datetimeLocal) {
      onChange('')
      return
    }

    // Convert EST datetime-local to UTC ISO string
    const utcIsoString = estDateTimeLocalToUTC(datetimeLocal)
    onChange(utcIsoString)
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
          className="datetime-input [&::-webkit-datetime-edit]:text-foreground [&::-webkit-datetime-edit-fields-wrapper]:text-foreground [&::-webkit-datetime-edit-text]:text-foreground [&::-webkit-datetime-edit-month-field]:text-foreground [&::-webkit-datetime-edit-day-field]:text-foreground [&::-webkit-datetime-edit-year-field]:text-foreground [&::-webkit-datetime-edit-hour-field]:text-foreground [&::-webkit-datetime-edit-minute-field]:text-foreground [&::-webkit-datetime-edit-second-field]:text-foreground [&::-webkit-datetime-edit-millisecond-field]:text-foreground [&::-webkit-datetime-edit-ampm-field]:text-foreground pr-24 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-100"
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
            onClick={() => (document.getElementById(id) as HTMLInputElement)?.showPicker?.()}
            className="hover:bg-muted h-6 w-6 p-0"
            aria-label="Open calendar"
          >
            <Calendar className="h-3 w-3" />
          </Button>
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
