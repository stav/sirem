import React from 'react'
import type { Database } from '@/lib/supabase'
import { usePlanEnrollments } from '@/hooks/usePlanEnrollments'
import { usePlans } from '@/hooks/usePlans'
import { Label } from '@/components/ui/label'
import { formatDateTime } from '@/lib/utils'

type Contact = Database['public']['Tables']['contacts']['Row']
type Plan = Database['public']['Tables']['plans']['Row']

interface ContactPlansDisplayProps {
  contact: Contact
}

export default function ContactPlansDisplay({ contact }: ContactPlansDisplayProps) {
  const { enrollments, loading } = usePlanEnrollments(contact.id)
  const { plans } = usePlans()

  const renderPlanLabel = (plan: Plan) => {
    const parts = [plan.carrier, plan.name, plan.cms_id ? `(${plan.cms_id})` : ''].filter(Boolean)
    return parts.join(' ')
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
                  <div className="space-y-1">
                    <div className="text-sm font-medium">{plan ? renderPlanLabel(plan) : 'Plan'}</div>
                    <div className="text-muted-foreground text-xs">Status: {enr.enrollment_status || '—'}</div>
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
    </div>
  )
}
