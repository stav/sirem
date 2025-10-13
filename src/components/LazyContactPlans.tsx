'use client'

import React, { useState, useEffect, useRef } from 'react'
import { usePlanEnrollments } from '@/hooks/usePlanEnrollments'
import { usePlanCache } from '@/contexts/PlanCacheContext'
import { formatDateTime } from '@/lib/utils'
import { calculateCmsId } from '@/lib/plan-utils'
import type { Database } from '@/lib/supabase'

type Enrollment = Database['public']['Tables']['enrollments']['Row']
type Plan = Database['public']['Tables']['plans']['Row']

type EnrollmentWithPlan = Enrollment & { plans?: Plan | null }

interface LazyContactPlansProps {
  contactId: string
  className?: string
}

export default function LazyContactPlans({ contactId, className = '' }: LazyContactPlansProps) {
  const [shouldLoad, setShouldLoad] = useState(false)
  const [hasBeenVisible, setHasBeenVisible] = useState(false)
  const elementRef = useRef<HTMLDivElement>(null)
  const { getCachedEnrollments, setCachedEnrollments, isCached } = usePlanCache()
  const { enrollments, loading } = usePlanEnrollments(shouldLoad ? contactId : undefined)

  // Check cache first
  const cachedEnrollments = getCachedEnrollments(contactId)
  const isDataCached = isCached(contactId)

  // Update cache when new data is loaded
  useEffect(() => {
    if (shouldLoad && enrollments.length > 0 && !isDataCached) {
      const enrollmentItems: EnrollmentWithPlan[] = enrollments.map(enrollment => ({
        ...enrollment,
        plans: (enrollment as Enrollment & { plans?: Plan | null }).plans || null
      }))
      setCachedEnrollments(contactId, enrollmentItems)
    }
  }, [enrollments, shouldLoad, contactId, setCachedEnrollments, isDataCached])

  // Intersection Observer for lazy loading
  useEffect(() => {
    const currentElement = elementRef.current
    if (!currentElement) return

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries
        if (entry.isIntersecting && !hasBeenVisible) {
          setHasBeenVisible(true)
          setShouldLoad(true)
        }
      },
      {
        threshold: 0.1,
        rootMargin: '50px' // Start loading when element is 50px away from viewport
      }
    )

    observer.observe(currentElement)

    return () => {
      observer.unobserve(currentElement)
    }
  }, [hasBeenVisible])

  // Use cached data if available, otherwise use loading state
  const enrollmentItems = cachedEnrollments || (shouldLoad ? enrollments.map(enrollment => ({
    ...enrollment,
    plans: (enrollment as Enrollment & { plans?: Plan | null }).plans || null
  })) : [])

  const isLoading = shouldLoad && loading && !cachedEnrollments

  if (!hasBeenVisible) {
    return <div ref={elementRef} className={className} />
  }

  if (enrollmentItems.length === 0 && !isLoading) {
    return null
  }

  return (
    <div className={className}>
      {isLoading ? (
        <div className="text-muted-foreground mt-2 text-sm">Loading plans...</div>
      ) : (
        <ol className="text-muted-foreground mt-2 list-decimal space-y-1 pl-5 text-sm">
          {enrollmentItems.map((enr) => {
            const plan = enr.plans
            const effectiveDateOnly = enr.coverage_effective_date
              ? formatDateTime(enr.coverage_effective_date).split(' ')[0]
              : ''
            const parts = [
              plan?.carrier,
              plan?.name,
              plan ? calculateCmsId(plan) ? `(${calculateCmsId(plan)})` : '' : '',
              plan?.plan_type,
              effectiveDateOnly,
              `(${enr.enrollment_status})`,
            ].filter(Boolean)
            return (
              <li key={enr.id} className="whitespace-nowrap">
                {parts.join(' ')}
              </li>
            )
          })}
        </ol>
      )}
    </div>
  )
}
