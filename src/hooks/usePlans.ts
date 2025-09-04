import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
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
      const { error } = await supabase.from('plans').delete().eq('id', planId)
      if (error) throw error
      await fetchPlans()
      return true
    } catch (err) {
      console.error('Error deleting plan:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete plan')
      return false
    }
  }

  useEffect(() => {
    fetchPlans()
  }, [])

  return { plans, loading, error, fetchPlans, createPlan, updatePlan, deletePlan }
}
