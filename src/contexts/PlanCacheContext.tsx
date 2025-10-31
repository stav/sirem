'use client'

import React, { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react'
import type { Database } from '@/lib/supabase'

type Enrollment = Database['public']['Tables']['enrollments']['Row']
type Plan = Database['public']['Tables']['plans']['Row']

export type CachedEnrollment = Enrollment & {
  plans?: Plan | null
}

interface PlanCacheContextType {
  getCachedEnrollments: (contactId: string) => CachedEnrollment[] | null
  setCachedEnrollments: (contactId: string, enrollments: CachedEnrollment[]) => void
  clearCache: (contactId?: string) => void
  isCached: (contactId: string) => boolean
  refreshTrigger: number
}

const PlanCacheContext = createContext<PlanCacheContextType | undefined>(undefined)

interface PlanCacheProviderProps {
  children: ReactNode
}

export function PlanCacheProvider({ children }: PlanCacheProviderProps) {
  const [cache, setCache] = useState<Map<string, CachedEnrollment[]>>(new Map())
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const getCachedEnrollments = useCallback(
    (contactId: string): CachedEnrollment[] | null => {
      return cache.get(contactId) || null
    },
    [cache]
  )

  const setCachedEnrollments = useCallback((contactId: string, enrollments: CachedEnrollment[]) => {
    setCache((prev) => new Map(prev).set(contactId, enrollments))
  }, [])

  const clearCache = useCallback((contactId?: string) => {
    if (contactId) {
      setCache((prev) => {
        const newCache = new Map(prev)
        newCache.delete(contactId)
        return newCache
      })
    } else {
      setCache(new Map())
    }
    // Increment refresh trigger to force components to refetch
    setRefreshTrigger((prev) => prev + 1)
  }, [])

  const isCached = useCallback(
    (contactId: string): boolean => {
      return cache.has(contactId)
    },
    [cache]
  )

  const contextValue = useMemo(
    () => ({
      getCachedEnrollments,
      setCachedEnrollments,
      clearCache,
      isCached,
      refreshTrigger,
    }),
    [getCachedEnrollments, setCachedEnrollments, clearCache, isCached, refreshTrigger]
  )

  return <PlanCacheContext.Provider value={contextValue}>{children}</PlanCacheContext.Provider>
}

export function usePlanCache() {
  const context = useContext(PlanCacheContext)
  if (context === undefined) {
    throw new Error('usePlanCache must be used within a PlanCacheProvider')
  }
  return context
}
