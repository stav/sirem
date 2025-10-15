import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { logger } from '@/lib/logger'
import { calculateCmsId } from '@/lib/plan-utils'
import type { Database } from '@/lib/supabase'

type Plan = Database['public']['Tables']['plans']['Row']
type PlanInsert = Database['public']['Tables']['plans']['Insert']
type PlanUpdate = Database['public']['Tables']['plans']['Update']

export type PlanForm = Omit<PlanInsert, 'id' | 'created_at' | 'updated_at'>

export function usePlans() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPlans = async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .order('plan_year', { ascending: false })
        .order('carrier', { ascending: true })
        .order('name', { ascending: true })

      if (error) throw error
      setPlans(data || [])
    } catch (err) {
      console.error('Error fetching plans:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch plans')
    } finally {
      setLoading(false)
    }
  }

  const createPlan = async (form: PlanForm) => {
    try {
      const { error } = await supabase.from('plans').insert({
        ...form,
      })
      if (error) throw new Error(error.message)
      await fetchPlans()
      return true
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error('Error creating plan:', msg)
      setError(msg || 'Failed to create plan')
      return false
    }
  }

  const updatePlan = async (planId: string, form: PlanForm) => {
    try {
      const updateData: PlanUpdate = {
        ...form,
      }
      const { error } = await supabase.from('plans').update(updateData).eq('id', planId)
      if (error) throw error
      await fetchPlans()
      return true
    } catch (err) {
      console.error('Error updating plan:', err)
      setError(err instanceof Error ? err.message : 'Failed to update plan')
      return false
    }
  }

  const deletePlan = async (planId: string) => {
    try {
      // Get plan details before deletion for logging
      const planToDelete = plans.find(p => p.id === planId)
      if (!planToDelete) {
        setError('Plan not found')
        return false
      }

      const { error } = await supabase.from('plans').delete().eq('id', planId)
      if (error) throw error
      
      // Log the deletion
      const cmsId = calculateCmsId(planToDelete)
      logger.planDeleted(
        planToDelete.name || 'Unnamed Plan',
        planToDelete.carrier || undefined,
        planToDelete.plan_year || undefined,
        cmsId || undefined,
        planToDelete.id
      )
      
      await fetchPlans()
      return true
    } catch (err) {
      console.error('Error deleting plan:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete plan')
      return false
    }
  }

  const deletePlans = async (planIds: string[]) => {
    if (!planIds || planIds.length === 0) return true
    try {
      // Get plan details before deletion for logging
      const plansToDelete = plans.filter(p => planIds.includes(p.id))
      if (plansToDelete.length === 0) {
        setError('No plans found to delete')
        return false
      }

      const { error } = await supabase.from('plans').delete().in('id', planIds)
      if (error) throw error
      
      // Log the bulk deletion
      const planDetails = plansToDelete.map(plan => ({
        name: plan.name || 'Unnamed Plan',
        carrier: plan.carrier || undefined,
        year: plan.plan_year || undefined,
        cmsId: calculateCmsId(plan) || undefined,
        id: plan.id
      }))
      
      logger.plansDeleted(planDetails)
      
      await fetchPlans()
      return true
    } catch (err) {
      console.error('Error deleting plans:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete plans')
      return false
    }
  }

  useEffect(() => {
    fetchPlans()
  }, [])

  return { plans, loading, error, fetchPlans, createPlan, updatePlan, deletePlan, deletePlans }
}
