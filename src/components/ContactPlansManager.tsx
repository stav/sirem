import React, { useMemo, useState } from 'react'
import type { Database } from '@/lib/supabase'
import { type EnrollmentStatus } from '@/lib/plan-constants'
import { usePlanEnrollments } from '@/hooks/usePlanEnrollments'
import { usePlans } from '@/hooks/usePlans'
import { usePlanCache } from '@/contexts/PlanCacheContext'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import DateInput from '@/components/ui/date-input'
import { formatDateTime } from '@/lib/utils'
import { formatPlanDisplayName } from '@/lib/plan-utils'
import { logger } from '@/lib/logger'
import { Edit, Trash2, Plus, X } from 'lucide-react'

type Contact = Database['public']['Tables']['contacts']['Row']
type Plan = Database['public']['Tables']['plans']['Row']

interface ContactPlansManagerProps {
  contact: Contact
  onRefresh?: () => void
}

export default function ContactPlansManager({ contact, onRefresh }: ContactPlansManagerProps) {
  const { enrollments, loading, createEnrollment, updateEnrollment, deleteEnrollment } = usePlanEnrollments(contact.id)
  const { plans } = usePlans()
  const { clearCache } = usePlanCache()

  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({
    plan_id: '' as string,
    enrollment_status: 'active' as EnrollmentStatus,
    signed_up_at: '' as string,
    coverage_effective_date: '' as string,
    coverage_end_date: '' as string,
    premium_monthly_at_enrollment: '' as string,
    pcp_name: '' as string,
    pcp_id: '' as string,
    agent_notes: '' as string,
  })

  const planOptions = useMemo(() => {
    const sorted = [...plans].sort((a, b) => {
      const an = `${a.carrier ?? ''} ${a.name} ${a.plan_year ?? ''}`.toLowerCase()
      const bn = `${b.carrier ?? ''} ${b.name} ${b.plan_year ?? ''}`.toLowerCase()
      return an.localeCompare(bn)
    })
    return sorted
  }, [plans])

  const renderPlanLabel = (plan: Plan) => {
    return formatPlanDisplayName(plan)
  }

  const resetForm = () => {
    setForm({
      plan_id: '',
      enrollment_status: 'active',
      signed_up_at: '',
      coverage_effective_date: '',
      coverage_end_date: '',
      premium_monthly_at_enrollment: '',
      pcp_name: '',
      pcp_id: '',
      agent_notes: '',
    })
    setIsAdding(false)
    setEditingId(null)
  }

  const handleAdd = async () => {
    if (!form.plan_id) return
    const selectedPlan = plans.find(p => p.id === form.plan_id)
    const ok = await createEnrollment(contact.id, form.plan_id, {
      enrollment_status: form.enrollment_status,
      signed_up_at: form.signed_up_at || null,
      coverage_effective_date: form.coverage_effective_date || null,
      coverage_end_date: form.coverage_end_date || null,
      premium_monthly_at_enrollment: form.premium_monthly_at_enrollment
        ? Number(form.premium_monthly_at_enrollment)
        : null,
      pcp_name: form.pcp_name || null,
      pcp_id: form.pcp_id || null,
      agent_notes: form.agent_notes || null,
      application_id: null,
      metadata: null,
    })
    if (ok) {
      // Clear cache so contact card refreshes
      clearCache(contact.id)
      
      // Log the enrollment creation
      if (selectedPlan) {
        const contactName = `${contact.first_name} ${contact.last_name}`
        logger.enrollmentCreated(
          contactName,
          selectedPlan.name,
          selectedPlan.carrier || undefined,
          selectedPlan.plan_year || undefined,
          contact.id,
          selectedPlan.id
        )
      }
      resetForm()
      onRefresh?.()
    }
  }

  const handleEdit = (enrollment: Database['public']['Tables']['enrollments']['Row']) => {
    setEditingId(enrollment.id)
    setForm({
      plan_id: enrollment.plan_id,
      enrollment_status: (enrollment.enrollment_status as EnrollmentStatus) || 'active',
      signed_up_at: enrollment.signed_up_at ? enrollment.signed_up_at.split('T')[0] : '',
      coverage_effective_date: enrollment.coverage_effective_date ? enrollment.coverage_effective_date.split('T')[0] : '',
      coverage_end_date: enrollment.coverage_end_date ? enrollment.coverage_end_date.split('T')[0] : '',
      premium_monthly_at_enrollment: enrollment.premium_monthly_at_enrollment?.toString() || '',
      pcp_name: enrollment.pcp_name || '',
      pcp_id: enrollment.pcp_id || '',
      agent_notes: enrollment.agent_notes || '',
    })
    setIsAdding(true)
  }

  const handleUpdate = async () => {
    if (!editingId || !form.plan_id) return
    const selectedPlan = plans.find(p => p.id === form.plan_id)
    const ok = await updateEnrollment(editingId, {
      plan_id: form.plan_id,
      enrollment_status: form.enrollment_status,
      signed_up_at: form.signed_up_at || null,
      coverage_effective_date: form.coverage_effective_date || null,
      coverage_end_date: form.coverage_end_date || null,
      premium_monthly_at_enrollment: form.premium_monthly_at_enrollment
        ? Number(form.premium_monthly_at_enrollment)
        : null,
      pcp_name: form.pcp_name || null,
      pcp_id: form.pcp_id || null,
      agent_notes: form.agent_notes || null,
      application_id: null,
      metadata: null,
    })
    if (ok) {
      // Clear cache so contact card refreshes
      clearCache(contact.id)
      
      // Log the enrollment update
      if (selectedPlan) {
        const contactName = `${contact.first_name} ${contact.last_name}`
        logger.enrollmentUpdated(
          contactName,
          selectedPlan.name,
          selectedPlan.carrier || undefined,
          selectedPlan.plan_year || undefined,
          contact.id,
          selectedPlan.id
        )
      }
      resetForm()
      onRefresh?.()
    }
  }

  const handleDelete = async (enrollmentId: string) => {
    if (confirm('Remove this enrollment?')) {
      // Find the enrollment and plan details for logging
      const enrollment = enrollments.find(e => e.id === enrollmentId)
      const plan = enrollment ? plans.find(p => p.id === enrollment.plan_id) : null
      
      const ok = await deleteEnrollment(enrollmentId)
      if (ok) {
        // Clear cache so contact card refreshes
        clearCache(contact.id)
        
        // Log the enrollment deletion
        if (plan) {
          const contactName = `${contact.first_name} ${contact.last_name}`
          logger.enrollmentDeleted(
            contactName,
            plan.name,
            plan.carrier || undefined,
            plan.plan_year || undefined,
            contact.id,
            plan.id
          )
        }
      }
      onRefresh?.()
    }
  }

  return (
    <div className="space-y-3">
      <Label className="text-muted-foreground text-sm font-medium">Plans & Enrollments</Label>

      {/* List existing enrollments */}
      <div className="space-y-3">
        {loading && <div className="text-muted-foreground text-sm">Loading enrollments…</div>}
        {!loading && enrollments.length === 0 && (
          <div className="text-muted-foreground text-sm">No enrollments found</div>
        )}
        {!loading && enrollments.length > 0 && (
          <div className="divide-y rounded border">
            {enrollments.map((enr) => {
              const plan = plans.find((p) => p.id === enr.plan_id)
              return (
                <div key={enr.id} className="p-3 md:p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="text-sm font-medium">{plan ? renderPlanLabel(plan) : 'Plan'}</div>
                      <div className="text-muted-foreground text-xs">Status: {enr.enrollment_status || '—'}</div>
                      {plan?.plan_year && (
                        <div className="text-muted-foreground text-xs">Plan Year: {plan.plan_year}</div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(enr)}
                        className="h-6 w-6 p-0"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(enr.id)}
                        className="h-6 w-6 p-0 text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="mt-2 grid grid-cols-1 gap-2 text-xs md:grid-cols-2">
                    <div>
                      <span className="text-muted-foreground">Signed up:</span>{' '}
                      {enr.signed_up_at ? formatDateTime(enr.signed_up_at).split(' ')[0] : '—'}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Effective:</span>{' '}
                      {enr.coverage_effective_date ? formatDateTime(enr.coverage_effective_date).split(' ')[0] : '—'}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Ends:</span>{' '}
                      {enr.coverage_end_date ? formatDateTime(enr.coverage_end_date).split(' ')[0] : '—'}
                    </div>
                    {enr.premium_monthly_at_enrollment != null && (
                      <div>
                        <span className="text-muted-foreground">Premium at enrollment:</span> $
                        {enr.premium_monthly_at_enrollment % 1 === 0 
                          ? enr.premium_monthly_at_enrollment.toFixed(0)
                          : enr.premium_monthly_at_enrollment.toFixed(2)}
                      </div>
                    )}
                    {enr.pcp_name && (
                      <div>
                        <span className="text-muted-foreground">PCP:</span> {enr.pcp_name}
                      </div>
                    )}
                    {enr.agent_notes && (
                      <div className="md:col-span-2">
                        <span className="text-muted-foreground">Notes:</span> {enr.agent_notes}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Add/Edit enrollment form */}
      {!isAdding ? (
        <div>
          <Button type="button" size="sm" variant="outline" onClick={() => setIsAdding(true)}>
            <Plus className="h-3 w-3 mr-1" />
            Add Enrollment
          </Button>
        </div>
      ) : (
        <div className="rounded border p-3 md:p-4">
          <div className="mb-3 flex items-center justify-between">
            <h4 className="text-sm font-medium">
              {editingId ? 'Edit Enrollment' : 'Add New Enrollment'}
            </h4>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={resetForm}
              className="h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
          
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="space-y-1 md:col-span-2">
              <Label className="text-xs">Plan</Label>
              <select
                className="bg-background w-full rounded border p-2 text-sm"
                value={form.plan_id}
                onChange={(e) => setForm((f) => ({ ...f, plan_id: e.target.value }))}
              >
                <option value="">Select a plan…</option>
                {planOptions.map((p) => (
                  <option key={p.id} value={p.id}>
                    {renderPlanLabel(p)}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Status</Label>
              <select
                className="bg-background w-full rounded border p-2 text-sm"
                value={form.enrollment_status}
                onChange={(e) => setForm((f) => ({ ...f, enrollment_status: e.target.value as EnrollmentStatus }))}
              >
                {(['pending', 'active', 'cancelled', 'terminated', 'declined'] as EnrollmentStatus[]).map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1 md:col-span-2">
              <DateInput
                id="signed_up_at"
                label="Signed up at"
                value={form.signed_up_at}
                onChange={(v) => setForm((f) => ({ ...f, signed_up_at: v || '' }))}
              />
            </div>

            <div className="space-y-1 md:col-span-2">
              <DateInput
                id="coverage_effective_date"
                label="Coverage effective"
                value={form.coverage_effective_date}
                onChange={(v) => setForm((f) => ({ ...f, coverage_effective_date: v || '' }))}
              />
            </div>

            <div className="space-y-1 md:col-span-2">
              <DateInput
                id="coverage_end_date"
                label="Coverage end"
                value={form.coverage_end_date}
                onChange={(v) => setForm((f) => ({ ...f, coverage_end_date: v || '' }))}
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Premium at enrollment ($)</Label>
              <Input
                type="number"
                step="0.01"
                value={form.premium_monthly_at_enrollment}
                onChange={(e) => setForm((f) => ({ ...f, premium_monthly_at_enrollment: e.target.value }))}
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">PCP name</Label>
              <Input value={form.pcp_name} onChange={(e) => setForm((f) => ({ ...f, pcp_name: e.target.value }))} />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">PCP ID</Label>
              <Input value={form.pcp_id} onChange={(e) => setForm((f) => ({ ...f, pcp_id: e.target.value }))} />
            </div>

            <div className="space-y-1 md:col-span-2">
              <Label className="text-xs">Agent notes</Label>
              <Input
                value={form.agent_notes}
                onChange={(e) => setForm((f) => ({ ...f, agent_notes: e.target.value }))}
              />
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2">
            <Button 
              type="button"
              size="sm" 
              onClick={editingId ? handleUpdate : handleAdd} 
              disabled={!form.plan_id}
            >
              {editingId ? 'Update Enrollment' : 'Save Enrollment'}
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={resetForm}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
