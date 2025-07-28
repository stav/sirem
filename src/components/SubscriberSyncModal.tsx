'use client'

import React, { useState, useEffect } from 'react'
import ModalForm from './ui/modal-form'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Badge } from './ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Search, Users, Mail, X, Check, AlertCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface Contact {
  id: string
  first_name: string
  last_name: string
  email: string
  lead_status_id?: string
  tags?: string[]
}

interface ConvertKitSubscriber {
  id: number
  email_address: string
  first_name?: string
  last_name?: string
  state: 'active' | 'inactive' | 'unsubscribed'
  tags?: { id: number; name: string }[]
}

interface SubscriberSyncModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (selectedContacts: Contact[], selectedSubscribers: ConvertKitSubscriber[]) => void
}

export function SubscriberSyncModal({ isOpen, onClose, onConfirm }: SubscriberSyncModalProps) {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [subscribers, setSubscribers] = useState<ConvertKitSubscriber[]>([])
  const [selectedContacts, setSelectedContacts] = useState<Contact[]>([])
  const [selectedSubscribers, setSelectedSubscribers] = useState<ConvertKitSubscriber[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [contactSearch, setContactSearch] = useState('')
  const [subscriberSearch, setSubscriberSearch] = useState('')
  const [contactStatusFilter, setContactStatusFilter] = useState<string>('all')
  const [contactTagFilter, setContactTagFilter] = useState<string>('all')
  const [subscriberStatusFilter, setSubscriberStatusFilter] = useState<string>('all')
  const [subscriberTagFilter, setSubscriberTagFilter] = useState<string>('all')

  // Available filters
  const [leadStatuses, setLeadStatuses] = useState<{ id: string; name: string }[]>([])
  const [contactTags, setContactTags] = useState<string[]>([])
  const [subscriberTags, setSubscriberTags] = useState<string[]>([])

  useEffect(() => {
    if (isOpen) {
      loadData()
    }
  }, [isOpen])

  const loadData = async () => {
    setLoading(true)
    setError(null)

    try {
      // Load contacts
      const { data: contactsData, error: contactsError } = await supabase
        .from('contacts')
        .select(
          `
          id,
          first_name,
          last_name,
          email,
          lead_status_id,
          contact_tags(tags(label))
        `
        )
        .not('email', 'is', null)
        .not('email', 'eq', '')

      if (contactsError) throw contactsError

      const formattedContacts =
        contactsData?.map((contact) => ({
          id: contact.id,
          first_name: contact.first_name,
          last_name: contact.last_name,
          email: contact.email || '',
          lead_status_id: contact.lead_status_id || undefined,
          tags: contact.contact_tags?.map((ct: { tags: { label: string } }) => ct.tags.label) || [],
        })) || []

      setContacts(formattedContacts)

      // Load ConvertKit subscribers
      const subscribersResponse = await fetch('/api/convertkit/subscribers?page=1&limit=100')
      if (subscribersResponse.ok) {
        const subscribersData = await subscribersResponse.json()
        setSubscribers(subscribersData.subscribers || [])
      } else {
        console.error('Failed to fetch ConvertKit subscribers')
        setSubscribers([])
      }

      // Load lead statuses for filter
      const { data: statusesData } = await supabase.from('lead_statuses').select('id, name').order('name')

      setLeadStatuses(statusesData || [])

      // Extract unique tags
      const allContactTags = new Set<string>()
      formattedContacts.forEach((contact) => {
        contact.tags?.forEach((tag) => allContactTags.add(tag))
      })
      setContactTags(Array.from(allContactTags))

      const allSubscriberTags = new Set<string>()
      subscribers.forEach((subscriber) => {
        subscriber.tags?.forEach((tag: { name: string }) => allSubscriberTags.add(tag.name))
      })
      setSubscriberTags(Array.from(allSubscriberTags))
    } catch (err) {
      console.error('Error loading data:', err)
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const filteredContacts = contacts.filter((contact) => {
    const matchesSearch =
      contact.first_name?.toLowerCase().includes(contactSearch.toLowerCase()) ||
      contact.last_name?.toLowerCase().includes(contactSearch.toLowerCase()) ||
      contact.email?.toLowerCase().includes(contactSearch.toLowerCase())

    const matchesStatus = contactStatusFilter === 'all' || contact.lead_status_id === contactStatusFilter
    const matchesTag = contactTagFilter === 'all' || contact.tags?.includes(contactTagFilter)

    return matchesSearch && matchesStatus && matchesTag
  })

  const filteredSubscribers = subscribers.filter((subscriber) => {
    const matchesSearch =
      subscriber.first_name?.toLowerCase().includes(subscriberSearch.toLowerCase()) ||
      subscriber.last_name?.toLowerCase().includes(subscriberSearch.toLowerCase()) ||
      subscriber.email_address?.toLowerCase().includes(subscriberSearch.toLowerCase())

    const matchesStatus = subscriberStatusFilter === 'all' || subscriber.state === subscriberStatusFilter
    const matchesTag = subscriberTagFilter === 'all' || subscriber.tags?.some((tag) => tag.name === subscriberTagFilter)

    return matchesSearch && matchesStatus && matchesTag
  })

  const addContactToCampaign = (contact: Contact) => {
    if (!selectedContacts.find((c) => c.id === contact.id)) {
      setSelectedContacts([...selectedContacts, contact])
    }
  }

  const removeContactFromCampaign = (contactId: string) => {
    setSelectedContacts(selectedContacts.filter((c) => c.id !== contactId))
  }

  const addSubscriberToCampaign = (subscriber: ConvertKitSubscriber) => {
    if (!selectedSubscribers.find((s) => s.id === subscriber.id)) {
      setSelectedSubscribers([...selectedSubscribers, subscriber])
    }
  }

  const removeSubscriberFromCampaign = (subscriberId: number) => {
    setSelectedSubscribers(selectedSubscribers.filter((s) => s.id !== subscriberId))
  }

  const handleConfirm = () => {
    onConfirm(selectedContacts, selectedSubscribers)
    onClose()
  }

  const getLeadStatusName = (statusId: string) => {
    return leadStatuses.find((status) => status.id === statusId)?.name || 'Unknown'
  }

  if (loading) {
    return (
      <ModalForm isOpen={isOpen} title="Loading..." onSubmit={() => {}} onCancel={onClose} submitText="" size="xl">
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900"></div>
            <p className="mt-2 text-sm text-gray-600">Loading contacts and subscribers...</p>
          </div>
        </div>
      </ModalForm>
    )
  }

  return (
    <ModalForm
      isOpen={isOpen}
      title={
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Sync Campaign Subscribers
        </div>
      }
      onSubmit={(e) => {
        e.preventDefault()
        handleConfirm()
      }}
      onCancel={onClose}
      submitText={`Confirm Recipients (${selectedContacts.length + selectedSubscribers.length})`}
      size="xl"
    >
      {error && (
        <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-3">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <span className="text-sm text-red-600">{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* CRM Contacts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              CRM Contacts ({filteredContacts.length})
            </CardTitle>

            {/* Contact Filters */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search contacts..."
                  value={contactSearch}
                  onChange={(e) => setContactSearch(e.target.value)}
                  className="pl-8"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Select value={contactStatusFilter} onValueChange={setContactStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Lead Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    {leadStatuses.map((status) => (
                      <SelectItem key={status.id} value={status.id}>
                        {status.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={contactTagFilter} onValueChange={setContactTagFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tags" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Tags</SelectItem>
                    {contactTags.map((tag) => (
                      <SelectItem key={tag} value={tag}>
                        {tag}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>

          <CardContent className="max-h-96 overflow-y-auto">
            <div className="space-y-2">
              {filteredContacts.map((contact) => (
                <div
                  key={contact.id}
                  className={`cursor-pointer rounded-lg border p-3 transition-colors ${
                    selectedContacts.find((c) => c.id === contact.id)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => addContactToCampaign(contact)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-medium">
                        {contact.first_name} {contact.last_name}
                      </div>
                      <div className="text-sm text-gray-600">{contact.email}</div>
                      {contact.lead_status_id && (
                        <Badge variant="outline" className="mt-1 text-xs">
                          {getLeadStatusName(contact.lead_status_id)}
                        </Badge>
                      )}
                    </div>
                    {selectedContacts.find((c) => c.id === contact.id) && <Check className="h-4 w-4 text-blue-600" />}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* ConvertKit Subscribers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              ConvertKit Subscribers ({filteredSubscribers.length})
            </CardTitle>

            {/* Subscriber Filters */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search subscribers..."
                  value={subscriberSearch}
                  onChange={(e) => setSubscriberSearch(e.target.value)}
                  className="pl-8"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Select value={subscriberStatusFilter} onValueChange={setSubscriberStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="unsubscribed">Unsubscribed</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={subscriberTagFilter} onValueChange={setSubscriberTagFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tags" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Tags</SelectItem>
                    {subscriberTags.map((tag) => (
                      <SelectItem key={tag} value={tag}>
                        {tag}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>

          <CardContent className="max-h-96 overflow-y-auto">
            <div className="space-y-2">
              {filteredSubscribers.map((subscriber) => (
                <div
                  key={subscriber.id}
                  className={`cursor-pointer rounded-lg border p-3 transition-colors ${
                    selectedSubscribers.find((s) => s.id === subscriber.id)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => addSubscriberToCampaign(subscriber)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-medium">
                        {subscriber.first_name} {subscriber.last_name}
                      </div>
                      <div className="text-sm text-gray-600">{subscriber.email_address}</div>
                      <Badge variant={subscriber.state === 'active' ? 'default' : 'secondary'} className="mt-1 text-xs">
                        {subscriber.state}
                      </Badge>
                    </div>
                    {selectedSubscribers.find((s) => s.id === subscriber.id) && (
                      <Check className="h-4 w-4 text-blue-600" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Selected Recipients Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Campaign Recipients ({selectedContacts.length + selectedSubscribers.length} total)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <h4 className="mb-2 font-medium">CRM Contacts ({selectedContacts.length})</h4>
              <div className="space-y-1">
                {selectedContacts.map((contact) => (
                  <div key={contact.id} className="flex items-center justify-between rounded bg-gray-50 p-2">
                    <span className="text-sm">
                      {contact.first_name} {contact.last_name} ({contact.email})
                    </span>
                    <Button size="sm" variant="ghost" onClick={() => removeContactFromCampaign(contact.id)}>
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="mb-2 font-medium">ConvertKit Subscribers ({selectedSubscribers.length})</h4>
              <div className="space-y-1">
                {selectedSubscribers.map((subscriber) => (
                  <div key={subscriber.id} className="flex items-center justify-between rounded bg-gray-50 p-2">
                    <span className="text-sm">
                      {subscriber.first_name} {subscriber.last_name} ({subscriber.email_address})
                    </span>
                    <Button size="sm" variant="ghost" onClick={() => removeSubscriberFromCampaign(subscriber.id)}>
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </ModalForm>
  )
}
