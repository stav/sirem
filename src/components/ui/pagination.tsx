import React from 'react'
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface PaginationProps {
  currentPage: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
  startIndex: number
  endIndex: number
  onPageChange: (page: number) => void
  onItemsPerPageChange: (itemsPerPage: number) => void
  pageSizeOptions?: number[]
  showItemsPerPage?: boolean
  showItemCount?: boolean
  className?: string
  isLoading?: boolean
}

export default function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  startIndex,
  endIndex,
  onPageChange,
  onItemsPerPageChange,
  pageSizeOptions = [25, 50, 100, 500],
  showItemsPerPage = true,
  showItemCount = true,
  className = '',
  isLoading = false,
}: PaginationProps) {
  // Only hide if there are no items to paginate
  if (totalItems === 0) return null

  return (
    <div className={`flex items-center justify-between ${className}`}>
      {showItemCount && (
        <div className="flex items-center space-x-2">
          <span className="text-muted-foreground text-sm">
            Showing {startIndex + 1}-{Math.min(endIndex, totalItems)} of {totalItems} items
          </span>
          {showItemsPerPage && (
            <div className="flex items-center space-x-2">
              <Select
                value={itemsPerPage === totalItems ? 'all' : itemsPerPage.toString()}
                onValueChange={(value) => onItemsPerPageChange(value === 'all' ? totalItems : parseInt(value))}
              >
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {pageSizeOptions.map((size) => (
                    <SelectItem key={size} value={size.toString()}>
                      {size}
                    </SelectItem>
                  ))}
                  <SelectItem value="all">All</SelectItem>
                </SelectContent>
              </Select>
              {isLoading && <Loader2 className="text-primary h-4 w-4 animate-spin" />}
            </div>
          )}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="cursor-pointer"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <span className="text-muted-foreground text-sm">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="cursor-pointer"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
