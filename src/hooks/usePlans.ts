import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { logger } from '@/lib/logger'
import { calculateCmsId } from '@/lib/plan-utils'
import type { Database } from '@/lib/supabase'

type Plan = Database['public']['Tables']['plans']['Row']
type PlanInsert = Database['public']['Tables']['plans']['Insert']
type PlanUpdate = Database['public']['Tables']['plans']['Update']

export type PlanForm = Omit<PlanInsert, 'id' | 'created_at' | 'updated_at'>

type EnrollmentWithContact = {
  id: string
  enrollment_status: string | null
  contacts: {
    id: string
    first_name: string
    last_name: string
  } | null
}

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

  const deletePlan = async (
    planId: string
  ): Promise<boolean | { success: false; reason: string; enrollments?: EnrollmentWithContact[]; plan?: Plan }> => {
    try {
      // Get plan details before deletion for logging
      const planToDelete = plans.find((p) => p.id === planId)
      if (!planToDelete) {
        setError('Plan not found')
        return false
      }

      // Check for existing enrollments before attempting deletion
      const { data: enrollments, error: enrollmentsError } = await supabase
        .from('enrollments')
        .select('id, enrollment_status, contacts:contact_id(id, first_name, last_name)')
        .eq('plan_id', planId)

      if (enrollmentsError) {
        console.error('Error checking enrollments:', enrollmentsError)
        setError('Failed to check plan dependencies')
        return false
      }

      if (enrollments && enrollments.length > 0) {
        const enrollmentCount = enrollments.length
        const activeEnrollments = enrollments.filter((e) => e.enrollment_status === 'active').length
        const contactNames = enrollments
          .map((e) => (e.contacts ? `${e.contacts.first_name} ${e.contacts.last_name}` : 'Unknown'))
          .slice(0, 3) // Show first 3 contacts

        // Log to history with contact details for linking
        const contactDetails = enrollments
          .map((e) => ({
            id: e.contacts?.id || '',
            name: e.contacts ? `${e.contacts.first_name} ${e.contacts.last_name}` : 'Unknown',
          }))
          .filter((c) => c.id) // Only include contacts with valid IDs

        logger.planDeletionBlocked(
          planToDelete.name || 'Unnamed Plan',
          enrollmentCount,
          activeEnrollments,
          contactNames,
          planToDelete.id,
          contactDetails
        )

        // Don't set error state - let the UI handle the toast
        return { success: false, reason: 'enrollments_exist', enrollments, plan: planToDelete }
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
      // Check if it's a foreign key constraint error
      if (err instanceof Error && err.message.includes('violates foreign key constraint')) {
        setError(
          'Cannot delete plan: it is still referenced by existing enrollments. Please remove all enrollments first.'
        )
      } else {
        setError(err instanceof Error ? err.message : 'Failed to delete plan')
      }
      return false
    }
  }

  const deletePlans = async (
    planIds: string[]
  ): Promise<boolean | { success: false; reason: string; enrollments?: EnrollmentWithContact[]; plans?: Plan[] }> => {
    if (!planIds || planIds.length === 0) return true
    try {
      // Get plan details before deletion for logging
      const plansToDelete = plans.filter((p) => planIds.includes(p.id))
      if (plansToDelete.length === 0) {
        setError('No plans found to delete')
        return false
      }

      // Check for existing enrollments before attempting deletion
      const { data: enrollments, error: enrollmentsError } = await supabase
        .from('enrollments')
        .select('id, plan_id, enrollment_status, contacts:contact_id(id, first_name, last_name)')
        .in('plan_id', planIds)

      if (enrollmentsError) {
        console.error('Error checking enrollments:', enrollmentsError)
        setError('Failed to check plan dependencies')
        return false
      }

      if (enrollments && enrollments.length > 0) {
        // Group enrollments by plan
        const enrollmentsByPlan = enrollments.reduce(
          (acc, enrollment) => {
            if (!acc[enrollment.plan_id]) {
              acc[enrollment.plan_id] = []
            }
            acc[enrollment.plan_id].push(enrollment)
            return acc
          },
          {} as Record<string, typeof enrollments>
        )

        const plansWithEnrollments = plansToDelete.filter((plan) => enrollmentsByPlan[plan.id])

        if (plansWithEnrollments.length > 0) {
          const planNames = plansWithEnrollments.map((plan) => plan.name || 'Unnamed Plan')
          const totalEnrollments = enrollments.length
          const activeEnrollments = enrollments.filter((e) => e.enrollment_status === 'active').length

          // Log to history with contact details for linking
          const contactDetails = enrollments
            .map((e) => ({
              id: e.contacts?.id || '',
              name: e.contacts ? `${e.contacts.first_name} ${e.contacts.last_name}` : 'Unknown',
            }))
            .filter((c) => c.id) // Only include contacts with valid IDs

          logger.planDeletionBlocked(
            planNames.join(', '),
            totalEnrollments,
            activeEnrollments,
            [], // We don't show individual contact names for bulk operations
            undefined,
            contactDetails
          )

          // Don't set error state - let the UI handle the toast
          return { success: false, reason: 'enrollments_exist', enrollments, plans: plansWithEnrollments }
        }
      }

      const { error } = await supabase.from('plans').delete().in('id', planIds)
      if (error) throw error

      // Log the bulk deletion
      const planDetails = plansToDelete.map((plan) => ({
        name: plan.name || 'Unnamed Plan',
        carrier: plan.carrier || undefined,
        year: plan.plan_year || undefined,
        cmsId: calculateCmsId(plan) || undefined,
        id: plan.id,
      }))

      logger.plansDeleted(planDetails)

      await fetchPlans()
      return true
    } catch (err) {
      console.error('Error deleting plans:', err)
      // Check if it's a foreign key constraint error
      if (err instanceof Error && err.message.includes('violates foreign key constraint')) {
        setError(
          'Cannot delete plans: some are still referenced by existing enrollments. Please remove all enrollments first.'
        )
      } else {
        setError(err instanceof Error ? err.message : 'Failed to delete plans')
      }
      return false
    }
  }

  // Utility function to get enrollments for a specific plan
  const getPlanEnrollments = async (planId: string) => {
    try {
      const { data, error } = await supabase
        .from('enrollments')
        .select(
          `
          id,
          enrollment_status,
          coverage_effective_date,
          coverage_end_date,
          contacts:contact_id(id, first_name, last_name)
        `
        )
        .eq('plan_id', planId)
        .order('coverage_effective_date', { ascending: true })

      if (error) throw error
      return data || []
    } catch (err) {
      console.error('Error fetching plan enrollments:', err)
      return []
    }
  }

  useEffect(() => {
    fetchPlans()
  }, [])

  return { plans, loading, error, fetchPlans, createPlan, updatePlan, deletePlan, deletePlans, getPlanEnrollments }
}
