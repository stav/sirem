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
    useLogger.getState().addMessage(`New contact created: ${contactName}`, 'success', 'contact_create', { contactName, contactId })
  },

  contactDeleted: (contactName: string, contactId?: string) => {
    useLogger.getState().addMessage(`Contact deleted: ${contactName}`, 'warning', 'contact_delete', { contactName, contactId })
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
}
