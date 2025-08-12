import React, { useMemo, useState } from 'react'
import type { Database } from '@/lib/supabase'
import { Enums } from '@/lib/supabase-types'
import { usePlanEnrollments } from '@/hooks/usePlanEnrollments'
import { usePlans } from '@/hooks/usePlans'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import DateInput from '@/components/ui/date-input'
import { formatDateTime } from '@/lib/utils'

type Contact = Database['public']['Tables']['contacts']['Row']
type Plan = Database['public']['Tables']['plans']['Row']
type EnrollmentStatus = Enums<'enrollment_status'>

interface ContactPlansProps {
  contact: Contact
  onRefresh?: () => void
}

export default function ContactPlans({ contact, onRefresh }: ContactPlansProps) {
  const { enrollments, loading, createEnrollment, deleteEnrollment } = usePlanEnrollments(contact.id)
  const { plans } = usePlans()

  const [isAdding, setIsAdding] = useState(false)
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

  const handleAdd = async () => {
    if (!form.plan_id) return
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
      onRefresh?.()
    }
  }

  const renderPlanLabel = (plan: Plan) => {
    const parts = [plan.carrier, plan.name, plan.cms_id ? `(${plan.cms_id})` : ''].filter(Boolean)
    return parts.join(' ')
  }

  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium text-muted-foreground">Plans & Enrollments</Label>

      {/* List existing enrollments */}
      <div className="space-y-3">
        {loading && <div className="text-sm text-muted-foreground">Loading enrollments…</div>}
        {!loading && enrollments.length === 0 && (
          <div className="text-sm text-muted-foreground">No enrollments found</div>
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
                      <div className="text-xs text-muted-foreground">Status: {enr.enrollment_status || '—'}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={async () => {
                          if (confirm('Remove this enrollment?')) {
                            await deleteEnrollment(enr.id)
                            onRefresh?.()
                          }
                        }}
                      >
                        Delete
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
                        {enr.premium_monthly_at_enrollment.toFixed(2)}
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

      {/* Add enrollment */}
      {!isAdding ? (
        <div>
          <Button size="sm" variant="outline" onClick={() => setIsAdding(true)}>
            Add Enrollment
          </Button>
        </div>
      ) : (
        <div className="rounded border p-3 md:p-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="space-y-1 md:col-span-2">
              <Label className="text-xs">Plan</Label>
              <select
                className="w-full rounded border bg-background p-2 text-sm"
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
                className="w-full rounded border bg-background p-2 text-sm"
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
                value={form.signed_up_at ? form.signed_up_at.split('T')[0] : ''}
                onChange={(v) => setForm((f) => ({ ...f, signed_up_at: v ? `${v}T00:00:00.000Z` : '' }))}
              />
            </div>

            <div className="space-y-1 md:col-span-2">
              <DateInput
                id="coverage_effective_date"
                label="Coverage effective"
                value={form.coverage_effective_date ? form.coverage_effective_date.split('T')[0] : ''}
                onChange={(v) => setForm((f) => ({ ...f, coverage_effective_date: v ? `${v}T00:00:00.000Z` : '' }))}
              />
            </div>

            <div className="space-y-1 md:col-span-2">
              <DateInput
                id="coverage_end_date"
                label="Coverage end"
                value={form.coverage_end_date ? form.coverage_end_date.split('T')[0] : ''}
                onChange={(v) => setForm((f) => ({ ...f, coverage_end_date: v ? `${v}T00:00:00.000Z` : '' }))}
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
            <Button size="sm" onClick={handleAdd} disabled={!form.plan_id}>
              Save Enrollment
            </Button>
            <Button size="sm" variant="outline" onClick={() => setIsAdding(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
