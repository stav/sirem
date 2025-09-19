import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/supabase'

type Enrollment = Database['public']['Tables']['enrollments']['Row']
type EnrollmentInsert = Database['public']['Tables']['enrollments']['Insert']
type EnrollmentUpdate = Database['public']['Tables']['enrollments']['Update']

export type EnrollmentForm = Omit<EnrollmentInsert, 'id' | 'created_at' | 'updated_at' | 'contact_id' | 'plan_id'>

export function usePlanEnrollments(contactId?: string) {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const fetchEnrollments = async (id: string) => {
    if (!id) {
      console.warn('fetchEnrollments called with empty contact ID')
      setEnrollments([])
      return
    }

    setLoading(true)
    setError(null)
    try {
      const { data, error } = await supabase
        .from('enrollments')
        .select(
          `
          *,
          plans:plan_id (*),
          contacts:contact_id (id, first_name, last_name)
        `
        )
        .eq('contact_id', id)
        .order('coverage_effective_date', { ascending: true })

      if (error) throw error
      setEnrollments((data as Enrollment[]) || [])
    } catch (err) {
      console.error('Error fetching enrollments:', {
        error: err,
        contactId: id,
        errorType: typeof err,
        errorMessage: err instanceof Error ? err.message : 'Unknown error',
        errorStack: err instanceof Error ? err.stack : undefined,
      })
      setError(err instanceof Error ? err.message : 'Failed to fetch enrollments')
    } finally {
      setLoading(false)
    }
  }

  const createEnrollment = async (id: string, planId: string, form: EnrollmentForm) => {
    try {
      const payload: EnrollmentInsert = {
        contact_id: id,
        plan_id: planId,
        ...form,
      }

      const { error } = await supabase.from('enrollments').insert(payload)
      if (error) throw error
      await fetchEnrollments(id)
      return true
    } catch (err) {
      console.error('Error creating enrollment:', err)
      setError(err instanceof Error ? err.message : 'Failed to create enrollment')
      return false
    }
  }

  const updateEnrollment = async (enrollmentId: string, form: EnrollmentForm) => {
    try {
      const updateData: EnrollmentUpdate = {
        ...form,
      }
      const { data, error } = await supabase
        .from('enrollments')
        .update(updateData)
        .eq('id', enrollmentId)
        .select('contact_id')
        .single()

      if (error) throw error
      const id = (data as { contact_id: string }).contact_id
      await fetchEnrollments(id)
      return true
    } catch (err) {
      console.error('Error updating enrollment:', err)
      setError(err instanceof Error ? err.message : 'Failed to update enrollment')
      return false
    }
  }

  const deleteEnrollment = async (enrollmentId: string) => {
    try {
      const { data, error } = await supabase
        .from('enrollments')
        .delete()
        .eq('id', enrollmentId)
        .select('contact_id')
        .single()
      if (error) throw error
      const id = (data as { contact_id: string }).contact_id
      await fetchEnrollments(id)
      return true
    } catch (err) {
      console.error('Error deleting enrollment:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete enrollment')
      return false
    }
  }

  useEffect(() => {
    if (contactId) {
      console.log('usePlanEnrollments: Fetching enrollments for contact:', contactId)
      fetchEnrollments(contactId)
    } else {
      console.log('usePlanEnrollments: No contactId provided, clearing enrollments')
      setEnrollments([])
    }
  }, [contactId])

  return { enrollments, loading, error, fetchEnrollments, createEnrollment, updateEnrollment, deleteEnrollment }
}
