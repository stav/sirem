import { supabase } from './supabase'

export interface IntegrityLead {
  leadsId: number
  prefix: string | null
  firstName: string
  lastName: string
  middleName: string | null
  suffix: string | null
  leadStatusId: number
  statusName: string
  notes: string | null
  medicareBeneficiaryID: string | null
  partA: string | null
  partB: string | null
  height: string | null
  weight: string | null
  gender: string | null
  maritalStatus: string | null
  hasMedicAid: number | null
  isTobaccoUser: boolean | null
  birthdate: string | null
  primaryCommunication: string
  reminders: IntegrityReminder[]
  activities: IntegrityActivityData[]
  addresses: IntegrityAddress[]
  emails: IntegrityEmail[]
  phones: IntegrityPhone[]
  leadSource: string
  contactRecordType: string
  inactive: number
  leadTags: IntegrityLeadTag[]
  createDate: string
  lifePolicyCount: number
  healthPolicyCount: number
  subsidyLevel: string | null
}

export interface IntegrityActivity {
  activityId: number
  activityType: string
  title: string
  description: string | null
  activityDate: string
  durationMinutes: number | null
  outcome: string | null
  metadata: Record<string, unknown> | null
}

// New interface for the actual activities data structure
export interface IntegrityActivityData {
  activityId: number
  createDate: string
  modifyDate: string
  activitySubject: string
  activityBody: string | null
  activityInteractionURL: string | null
  activityTypeName: string
  activityNote: string | null
  activitySourceId: number | null
  activitySource: string | null
  activityInteractionLabel: string | null
  activityInteractionIconUrl: string | null
  activityIconUrl: string | null
}

export interface IntegrityReminder {
  reminderId: number
  reminderDate: string
  reminderNote: string | null
  reminderTitle: string
  reminderSource: string
  isComplete: boolean
  createDate: string
  modifyDate: string | null
  reminderCompleteDate: string | null
  reminderType: string | null
}

export interface IntegrityAddress {
  leadAddressId: number
  address1: string | null
  address2: string | null
  city: string | null
  stateCode: string | null
  postalCode: string | null
  county: string | null
  countyFips: string | null
  latitude: number | null
  longitude: number | null
  createDate: string
  modifyDate: string | null
}

export interface IntegrityPhone {
  phoneId: number
  leadPhone: string
  phoneLabel: string | null
  createDate: string
  modifyDate: string | null
  inactive: boolean
  isSmsCompatible: boolean
  leadId: number
}

export interface IntegrityEmail {
  emailId: number
  leadEmail: string
  emailLabel: string | null
  createDate: string
  modifyDate: string | null
  inactive: boolean
  leadId: number
}

export interface IntegrityLeadTag {
  leadTagId: number
  metadata: Record<string, unknown> | null
  interactionUrl: string | null
  interactionUrlLabel: string | null
  tag: {
    tagCategory: {
      tagCategoryId: number
      parentCategoryId: number | null
      tagCategoryName: string
      parentCategoryName: string | null
      tagCategoryColor: string
      isActive: boolean
    }
    tagId: number
    tagLabel: string
    tagCategoryId: number
    tagIconUrl: string | null
    metadata: Record<string, unknown> | null
    isActive: boolean
    createDate: string
    modifyDate: string | null
  }
}

export interface IntegrityData {
  result: IntegrityLead[]
}

export class IntegrityImporter {
  private tagCategoryMap = new Map<number, string>()
  private tagMap = new Map<number, string>()
  private statusMap = new Map<number, string>()
  private contactMap = new Map<number, string>()

  async importData(data: IntegrityData) {
    console.log(`Starting import of ${data.result.length} leads...`)

    try {
      // First, ensure we have all the lookup data
      await this.setupLookupData(data.result)

      // Import leads
      for (const lead of data.result) {
        await this.importLead(lead)
      }

      console.log('Import completed successfully!')
    } catch (error) {
      console.error('Import failed:', error)
      throw error
    }
  }

  private async setupLookupData(leads: IntegrityLead[]) {
    // Collect all unique tag categories and tags
    const tagCategories = new Set<{ id: number; name: string; color: string }>()
    const tags = new Set<{ id: number; label: string; categoryId: number }>()
    const statuses = new Set<{ id: number; name: string }>()

    for (const lead of leads) {
      // Collect statuses
      statuses.add({ id: lead.leadStatusId, name: lead.statusName })

      // Collect tags and categories
      for (const leadTag of lead.leadTags) {
        const category = leadTag.tag.tagCategory
        tagCategories.add({
          id: category.tagCategoryId,
          name: category.tagCategoryName,
          color: category.tagCategoryColor,
        })

        tags.add({
          id: leadTag.tag.tagId,
          label: leadTag.tag.tagLabel,
          categoryId: category.tagCategoryId,
        })
      }
    }

    // Insert tag categories using upsert
    for (const category of tagCategories) {
      const { data, error } = await supabase
        .from('tag_categories')
        .upsert({ name: category.name, color: category.color }, { onConflict: 'name' })
        .select()
        .single()

      if (error) {
        console.warn(`Failed to upsert tag category ${category.name}:`, error)
      } else if (data) {
        this.tagCategoryMap.set(category.id, data.id)
      }
    }

    // Insert tags using upsert
    for (const tag of tags) {
      const categoryId = this.tagCategoryMap.get(tag.categoryId)
      if (categoryId) {
        const { data, error } = await supabase
          .from('tags')
          .upsert(
            {
              label: tag.label,
              category_id: categoryId,
            },
            { onConflict: 'label,category_id' }
          )
          .select()
          .single()

        if (error) {
          console.warn(`Failed to upsert tag ${tag.label}:`, error)
        } else if (data) {
          this.tagMap.set(tag.id, data.id)
        }
      }
    }

    // Insert lead statuses using upsert
    for (const status of statuses) {
      const { data, error } = await supabase
        .from('lead_statuses')
        .upsert({ name: status.name }, { onConflict: 'name' })
        .select()
        .single()

      if (error) {
        console.warn(`Failed to upsert status ${status.name}:`, error)
      } else if (data) {
        this.statusMap.set(status.id, data.id)
      }
    }
  }

  private async importLead(lead: IntegrityLead) {
    console.log(`Importing lead: ${lead.firstName} ${lead.lastName}`)

    // Get the first phone number to populate the contact.phone field
    const firstPhone = lead.phones.length > 0 ? lead.phones[0].leadPhone : null
    // Get the first email to populate the contact.email field
    const firstEmail = lead.emails.length > 0 ? lead.emails[0].leadEmail : null

    // Insert the main contact record
    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .insert({
        prefix: lead.prefix,
        first_name: lead.firstName,
        last_name: lead.lastName,
        middle_name: lead.middleName,
        suffix: lead.suffix,
        phone: firstPhone, // Populate with first phone number
        email: firstEmail, // Populate with first email
        lead_status_id: this.statusMap.get(lead.leadStatusId),
        notes: lead.notes,
        medicare_beneficiary_id: lead.medicareBeneficiaryID,
        part_a_status: lead.partA,
        part_b_status: lead.partB,
        height: lead.height,
        weight: lead.weight,
        gender: lead.gender,
        marital_status: lead.maritalStatus,
        has_medicaid: lead.hasMedicAid === 1,
        is_tobacco_user: lead.isTobaccoUser,
        birthdate: lead.birthdate ? new Date(lead.birthdate).toISOString().split('T')[0] : null,
        primary_communication: lead.primaryCommunication,
        lead_source: lead.leadSource,
        contact_record_type: lead.contactRecordType,
        inactive: lead.inactive === 1,
        life_policy_count: lead.lifePolicyCount,
        health_policy_count: lead.healthPolicyCount,
        subsidy_level: lead.subsidyLevel,
        created_at: lead.createDate,
        updated_at: lead.createDate,
      })
      .select()
      .single()

    if (contactError) {
      console.error(`Failed to insert contact ${lead.firstName} ${lead.lastName}:`, contactError)
      return
    }

    // Store the contact mapping
    this.contactMap.set(lead.leadsId, contact.id)

    // Import addresses
    for (const address of lead.addresses) {
      await supabase.from('addresses').insert({
        contact_id: contact.id,
        address1: address.address1,
        address2: address.address2,
        city: address.city,
        state_code: address.stateCode,
        postal_code: address.postalCode,
        county: address.county,
        county_fips: address.countyFips,
        latitude: address.latitude,
        longitude: address.longitude,
        created_at: address.createDate,
        updated_at: address.modifyDate || address.createDate,
      })
    }

    // Import phones
    for (const phone of lead.phones) {
      await supabase.from('phones').insert({
        contact_id: contact.id,
        phone_number: phone.leadPhone,
        phone_label: phone.phoneLabel,
        inactive: phone.inactive,
        is_sms_compatible: phone.isSmsCompatible,
        created_at: phone.createDate,
        updated_at: phone.modifyDate || phone.createDate,
      })
    }

    // Import emails
    for (const email of lead.emails) {
      await supabase.from('emails').insert({
        contact_id: contact.id,
        email_address: email.leadEmail,
        email_label: email.emailLabel,
        inactive: email.inactive,
        created_at: email.createDate,
        updated_at: email.modifyDate || email.createDate,
      })
    }

    // Import reminders
    for (const reminder of lead.reminders) {
      await supabase.from('reminders').insert({
        contact_id: contact.id,
        title: reminder.reminderTitle,
        description: reminder.reminderNote,
        reminder_date: reminder.reminderDate,
        reminder_source: reminder.reminderSource,
        reminder_type: reminder.reminderType,
        is_complete: reminder.isComplete,
        completed_date: reminder.reminderCompleteDate,
        created_at: reminder.createDate,
        updated_at: reminder.modifyDate || reminder.createDate,
      })
    }

    // Import tags using upsert to avoid duplicates
    for (const leadTag of lead.leadTags) {
      const tagId = this.tagMap.get(leadTag.tag.tagId)
      if (tagId) {
        await supabase.from('contact_tags').upsert(
          {
            contact_id: contact.id,
            tag_id: tagId,
            metadata: leadTag.metadata as import('./supabase-types').Json,
            interaction_url: leadTag.interactionUrl,
            interaction_url_label: leadTag.interactionUrlLabel,
          },
          { onConflict: 'contact_id,tag_id' }
        )
      }
    }
  }
}

// Utility function to import activities for existing contacts
export async function importActivitiesData(jsonData: string) {
  try {
    const data: IntegrityData = JSON.parse(jsonData)
    console.log(`Starting activities import for ${data.result.length} contacts...`)

    let totalActivities = 0
    let importedActivities = 0
    let skippedActivities = 0
    let errors = 0

    for (const lead of data.result) {
      totalActivities += lead.activities.length

      // Find the contact by phone number or email
      let contactId: string | null = null

      // Try to find by phone number first
      if (lead.phones.length > 0) {
        const phoneNumbers = lead.phones.map((p) => p.leadPhone)
        const { data: contactByPhone } = await supabase
          .from('contacts')
          .select('id')
          .or(phoneNumbers.map((phone) => `phone.eq.${phone}`).join(','))
          .single()

        if (contactByPhone) {
          contactId = contactByPhone.id
        }
      }

      // If not found by phone, try by email
      if (!contactId && lead.emails.length > 0) {
        const emailAddresses = lead.emails.map((e) => e.leadEmail)
        const { data: contactByEmail } = await supabase
          .from('contacts')
          .select('id')
          .or(emailAddresses.map((email) => `email.eq.${email}`).join(','))
          .single()

        if (contactByEmail) {
          contactId = contactByEmail.id
        }
      }

      // If still not found, try by name (less reliable)
      if (!contactId) {
        const { data: contactByName } = await supabase
          .from('contacts')
          .select('id')
          .eq('first_name', lead.firstName)
          .eq('last_name', lead.lastName)
          .single()

        if (contactByName) {
          contactId = contactByName.id
        }
      }

      if (!contactId) {
        console.warn(`No matching contact found for ${lead.firstName} ${lead.lastName}`)
        skippedActivities += lead.activities.length
        continue
      }

      // Import activities for this contact
      for (const activity of lead.activities) {
        try {
          const { error } = await supabase.from('activities').insert({
            contact_id: contactId,
            activity_type: activity.activityTypeName,
            title: activity.activitySubject,
            description: activity.activityNote || activity.activityBody,
            activity_date: activity.createDate,
            duration_minutes: null, // Not available in the data
            outcome: null, // Not available in the data
            metadata: {
              activityId: activity.activityId,
              source: activity.activitySource,
              interactionUrl: activity.activityInteractionURL,
              interactionLabel: activity.activityInteractionLabel,
              interactionIconUrl: activity.activityInteractionIconUrl,
              iconUrl: activity.activityIconUrl,
              sourceId: activity.activitySourceId,
            } as import('./supabase-types').Json,
            created_at: activity.createDate,
            updated_at: activity.modifyDate || activity.createDate,
          })

          if (error) {
            console.error(`Failed to import activity ${activity.activityId}:`, error)
            errors++
          } else {
            importedActivities++
          }
        } catch (error) {
          console.error(`Error importing activity ${activity.activityId}:`, error)
          errors++
        }
      }
    }

    const message = `Activities import completed: ${importedActivities} imported, ${skippedActivities} skipped (no contact match), ${errors} errors out of ${totalActivities} total activities.`
    console.log(message)

    return {
      success: errors === 0,
      message,
      stats: {
        total: totalActivities,
        imported: importedActivities,
        skipped: skippedActivities,
        errors,
      },
    }
  } catch (error) {
    console.error('Activities import failed:', error)
    return { success: false, message: `Activities import failed: ${error}` }
  }
}

// Utility function to import tags for existing contacts
export async function importTagsData(jsonData: string) {
  try {
    const data: IntegrityData = JSON.parse(jsonData)
    console.log(`Starting tags import for ${data.result.length} contacts...`)

    let totalTags = 0
    let importedTags = 0
    let skippedTags = 0
    let errors = 0

    // First, set up lookup data for tags and categories
    const tagCategoryMap = new Map<number, string>()
    const tagMap = new Map<number, string>()

    // Collect all unique tag categories and tags
    const tagCategories = new Set<{ id: number; name: string; color: string }>()
    const tags = new Set<{ id: number; label: string; categoryId: number }>()

    for (const lead of data.result) {
      totalTags += lead.leadTags.length

      // Collect tags and categories
      for (const leadTag of lead.leadTags) {
        const category = leadTag.tag.tagCategory
        tagCategories.add({
          id: category.tagCategoryId,
          name: category.tagCategoryName,
          color: category.tagCategoryColor,
        })

        tags.add({
          id: leadTag.tag.tagId,
          label: leadTag.tag.tagLabel,
          categoryId: category.tagCategoryId,
        })
      }
    }

    // Insert tag categories using upsert
    for (const category of tagCategories) {
      const { data: categoryData, error } = await supabase
        .from('tag_categories')
        .upsert(
          {
            name: category.name,
            color: category.color,
          },
          { onConflict: 'name' }
        )
        .select()
        .single()

      if (error) {
        console.error(`Failed to insert tag category ${category.name}:`, error)
        errors++
      } else if (categoryData) {
        tagCategoryMap.set(category.id, categoryData.id)
      }
    }

    // Insert tags - check if exists first, then insert if needed
    for (const tag of tags) {
      const categoryId = tagCategoryMap.get(tag.categoryId)
      if (categoryId) {
        // First check if tag already exists
        const { data: existingTag } = await supabase
          .from('tags')
          .select('id')
          .eq('label', tag.label)
          .eq('category_id', categoryId)
          .single()

        if (existingTag) {
          // Tag already exists, just map it
          tagMap.set(tag.id, existingTag.id)
        } else {
          // Tag doesn't exist, insert it
          const { data: newTag, error } = await supabase
            .from('tags')
            .insert({
              label: tag.label,
              category_id: categoryId,
            })
            .select()
            .single()

          if (error) {
            console.error(`Failed to insert tag ${tag.label}:`, error)
            errors++
          } else if (newTag) {
            tagMap.set(tag.id, newTag.id)
          }
        }
      }
    }

    // Now import tags for each contact
    for (const lead of data.result) {
      // Find the contact by phone number or email
      let contactId: string | null = null

      // Try to find by phone number first
      if (lead.phones.length > 0) {
        const phoneNumbers = lead.phones.map((p) => p.leadPhone)
        const { data: contactByPhone } = await supabase
          .from('contacts')
          .select('id')
          .or(phoneNumbers.map((phone) => `phone.eq.${phone}`).join(','))
          .single()

        if (contactByPhone) {
          contactId = contactByPhone.id
        }
      }

      // If not found by phone, try by email
      if (!contactId && lead.emails.length > 0) {
        const emailAddresses = lead.emails.map((e) => e.leadEmail)
        const { data: contactByEmail } = await supabase
          .from('contacts')
          .select('id')
          .or(emailAddresses.map((email) => `email.eq.${email}`).join(','))
          .single()

        if (contactByEmail) {
          contactId = contactByEmail.id
        }
      }

      // If still not found, try by name (less reliable)
      if (!contactId) {
        const { data: contactByName } = await supabase
          .from('contacts')
          .select('id')
          .eq('first_name', lead.firstName)
          .eq('last_name', lead.lastName)
          .single()

        if (contactByName) {
          contactId = contactByName.id
        }
      }

      if (!contactId) {
        console.warn(`No matching contact found for ${lead.firstName} ${lead.lastName}`)
        skippedTags += lead.leadTags.length
        continue
      }

      // Import tags for this contact
      for (const leadTag of lead.leadTags) {
        try {
          const tagId = tagMap.get(leadTag.tag.tagId)
          if (tagId) {
            const { error } = await supabase.from('contact_tags').upsert(
              {
                contact_id: contactId,
                tag_id: tagId,
                metadata: leadTag.metadata as import('./supabase-types').Json,
                interaction_url: leadTag.interactionUrl,
                interaction_url_label: leadTag.interactionUrlLabel,
              },
              { onConflict: 'contact_id,tag_id' }
            )

            if (error) {
              console.error(`Failed to import tag ${leadTag.tag.tagLabel} for contact ${contactId}:`, error)
              errors++
            } else {
              importedTags++
            }
          } else {
            console.warn(`Tag ID not found for tag ${leadTag.tag.tagLabel}`)
            skippedTags++
          }
        } catch (error) {
          console.error(`Error importing tag ${leadTag.tag.tagLabel}:`, error)
          errors++
        }
      }
    }

    const message = `Tags import completed: ${importedTags} imported, ${skippedTags} skipped (no contact match or tag ID), ${errors} errors out of ${totalTags} total tags.`
    console.log(message)

    return {
      success: errors === 0,
      message,
      stats: {
        total: totalTags,
        imported: importedTags,
        skipped: skippedTags,
        errors,
      },
    }
  } catch (error) {
    console.error('Tags import failed:', error)
    return { success: false, message: `Tags import failed: ${error}` }
  }
}

// Utility function to import Integrity data
export async function importIntegrityData(jsonData: string) {
  try {
    const data: IntegrityData = JSON.parse(jsonData)
    const importer = new IntegrityImporter()
    await importer.importData(data)
    return { success: true, message: 'Import completed successfully' }
  } catch (error) {
    console.error('Import failed:', error)
    return { success: false, message: `Import failed: ${error}` }
  }
}
