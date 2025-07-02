import React from 'react'
import { X, Calendar } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

interface DateInputProps {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  required?: boolean
  placeholder?: string
}

export default function DateInput({
  id,
  label,
  value,
  onChange,
  required = false,
  placeholder
}: DateInputProps) {
  const handleClear = () => {
    onChange('')
  }

  const handleToday = () => {
    const today = new Date().toISOString().split('T')[0]
    onChange(today)
  }

  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          placeholder={placeholder}
          className="pr-20"
        />
        <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center space-x-1">
          {value && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="h-6 w-6 p-0 hover:bg-muted"
              aria-label="Clear date"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleToday}
            className="h-6 w-6 p-0 hover:bg-muted"
            aria-label="Set to today"
          >
            <Calendar className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  )
} 
