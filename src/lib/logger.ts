import { create } from 'zustand'
import { generateUUID } from '@/lib/utils'

export interface LogMessage {
  id: string
  message: string
  type: 'success' | 'error' | 'info' | 'warning'
  timestamp: Date
  action?: string
  details?: Record<string, unknown>
}

interface LoggerStore {
  messages: LogMessage[]
  addMessage: (message: string, type?: LogMessage['type'], action?: string, details?: Record<string, unknown>) => void
  clearMessages: () => void
  getRecentMessages: (count?: number) => LogMessage[]
}

export const useLogger = create<LoggerStore>((set, get) => ({
  messages: [],

  addMessage: (
    message: string,
    type: 'success' | 'error' | 'info' | 'warning' = 'info',
    action?: string,
    details?: Record<string, unknown>
  ) => {
    const newMessage: LogMessage = {
      id: generateUUID(),
      message,
      type,
      timestamp: new Date(),
      action,
      details,
    }

    set((state: LoggerStore) => ({
      messages: [newMessage, ...state.messages].slice(0, 100), // Keep last 100 messages
    }))
  },

  clearMessages: () => {
    set({ messages: [] })
  },

  getRecentMessages: (count = 10) => {
    return get().messages.slice(0, count)
  },
}))

// Helper functions for common actions
export const logger = {
  contactUpdated: (contactName: string, contactId?: string) => {
    useLogger
      .getState()
      .addMessage(`Contact record updated for ${contactName}`, 'success', 'contact_update', { contactName, contactId })
  },

  contactCreated: (contactName: string, contactId?: string) => {
    useLogger
      .getState()
      .addMessage(`New contact created: ${contactName}`, 'success', 'contact_create', { contactName, contactId })
  },

  contactDeleted: (contactName: string, contactId?: string) => {
    useLogger
      .getState()
      .addMessage(`Contact deleted: ${contactName}`, 'warning', 'contact_delete', { contactName, contactId })
  },

  actionCreated: (actionTitle: string, contactId?: string) => {
    useLogger
      .getState()
      .addMessage(`Action created: ${actionTitle}`, 'success', 'action_create', { actionTitle, contactId })
  },

  actionCompleted: (actionTitle: string, contactId?: string) => {
    useLogger
      .getState()
      .addMessage(`Action completed: ${actionTitle}`, 'success', 'action_complete', { actionTitle, contactId })
  },

  contactSelected: (contactName: string, contactId?: string) => {
    useLogger
      .getState()
      .addMessage(`Contact selected: ${contactName}`, 'info', 'contact_select', { contactName, contactId })
  },

  error: (message: string, action?: string, contactId?: string) => {
    useLogger.getState().addMessage(message, 'error', action, contactId ? { contactId } : undefined)
  },

  info: (message: string, action?: string, contactId?: string) => {
    useLogger.getState().addMessage(message, 'info', action, contactId ? { contactId } : undefined)
  },

  tagAdded: (contactName: string, tagName: string, contactId?: string) => {
    useLogger
      .getState()
      .addMessage(`Tag "${tagName}" added to ${contactName}`, 'success', 'tag_add', { contactName, tagName, contactId })
  },

  tagRemoved: (contactName: string, tagName: string, contactId?: string) => {
    useLogger
      .getState()
      .addMessage(`Tag "${tagName}" removed from ${contactName}`, 'info', 'tag_remove', {
        contactName,
        tagName,
        contactId,
      })
  },

  planDeleted: (planName: string, carrier?: string, year?: number, cmsId?: string, planId?: string) => {
    const details: Record<string, unknown> = { planName, planId }
    if (carrier) details.carrier = carrier
    if (year) details.year = year
    if (cmsId) details.cmsId = cmsId

    const message = `Plan deleted: ${planName}${carrier ? ` (${carrier})` : ''}${year ? ` ${year}` : ''}${cmsId ? ` [${cmsId}]` : ''}`
    useLogger.getState().addMessage(message, 'warning', 'plan_delete', details)
  },

  plansDeleted: (plans: Array<{ name: string; carrier?: string; year?: number; cmsId?: string; id?: string }>) => {
    const planDetails = plans.map((p) => ({
      name: p.name,
      carrier: p.carrier,
      year: p.year,
      cmsId: p.cmsId,
      id: p.id,
    }))

    const message = `Deleted ${plans.length} plans: ${plans
      .map(
        (p) =>
          `${p.name}${p.carrier ? ` (${p.carrier})` : ''}${p.year ? ` ${p.year}` : ''}${p.cmsId ? ` [${p.cmsId}]` : ''}`
      )
      .join(', ')}`

    useLogger.getState().addMessage(message, 'warning', 'plans_delete', {
      count: plans.length,
      plans: planDetails,
    })
  },

  planDeletionBlocked: (
    planName: string,
    enrollmentCount: number,
    activeEnrollments: number,
    contactNames: string[],
    planId?: string,
    contactDetails?: Array<{ id: string; name: string }>
  ) => {
    const message = `Cannot delete plan "${planName}". It has ${enrollmentCount} enrollment(s) (${activeEnrollments} active). Contact(s): ${contactNames.join(', ')}. Please remove all enrollments first.`
    useLogger.getState().addMessage(message, 'error', 'plan_delete_blocked', {
      planName,
      planId,
      enrollmentCount,
      activeEnrollments,
      contactNames,
      contactDetails,
    })
  },

  enrollmentCreated: (
    contactName: string,
    planName: string,
    carrier?: string,
    year?: number,
    contactId?: string,
    planId?: string
  ) => {
    const message = `Enrollment created: ${contactName} enrolled in ${planName}${carrier ? ` (${carrier})` : ''}${year ? ` ${year}` : ''}`
    useLogger.getState().addMessage(message, 'success', 'enrollment_create', {
      contactName,
      planName,
      carrier,
      year,
      contactId,
      planId,
    })
  },

  enrollmentUpdated: (
    contactName: string,
    planName: string,
    carrier?: string,
    year?: number,
    contactId?: string,
    planId?: string
  ) => {
    const message = `Enrollment updated: ${contactName}'s enrollment in ${planName}${carrier ? ` (${carrier})` : ''}${year ? ` ${year}` : ''}`
    useLogger.getState().addMessage(message, 'success', 'enrollment_update', {
      contactName,
      planName,
      carrier,
      year,
      contactId,
      planId,
    })
  },

  enrollmentDeleted: (
    contactName: string,
    planName: string,
    carrier?: string,
    year?: number,
    contactId?: string,
    planId?: string
  ) => {
    const message = `Enrollment deleted: ${contactName} removed from ${planName}${carrier ? ` (${carrier})` : ''}${year ? ` ${year}` : ''}`
    useLogger.getState().addMessage(message, 'warning', 'enrollment_delete', {
      contactName,
      planName,
      carrier,
      year,
      contactId,
      planId,
    })
  },
}
