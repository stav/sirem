#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import { promises as fs } from 'fs'
import path from 'path'

// Load environment variables manually (following project pattern)
let supabaseUrl, supabaseKey
try {
  const envContent = await fs.readFile(path.join(process.cwd(), '.env.local'), 'utf-8')
  const lines = envContent.split('\n')
  for (const line of lines) {
    if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) {
      supabaseUrl = line.split('=')[1].trim()
    }
    if (line.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) {
      supabaseKey = line.split('=')[1].trim()
    }
  }
} catch {
  console.error('Could not load .env.local file')
  process.exit(1)
}

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// JSON file with extracted plans
const JSON_FILE = 'medmutual-plans-extracted.json'

/**
 * Find existing plan in database by CMS ID and year
 */
async function findExistingPlan(planData) {
  const { data, error } = await supabase
    .from('plans')
    .select('id, name, cms_contract_number, cms_plan_number, cms_geo_segment, plan_year, carrier')
    .eq('plan_year', planData.plan_year)
    .eq('cms_contract_number', planData.cms_contract_number)
    .eq('cms_plan_number', planData.cms_plan_number)
    .eq('cms_geo_segment', planData.cms_geo_segment)
    .eq('carrier', 'MedMutual')
    .single()

  if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
    console.error('Database query error:', error)
    return null
  }

  return data
}

/**
 * Update existing plan in database
 */
async function updatePlan(planId, planData) {
  console.log(`  🔄 Updating existing plan: ${planData.name} (${planData.cms_id})`)
  
  const { error } = await supabase
    .from('plans')
    .update({
      name: planData.name,
      plan_type: planData.plan_type,
      carrier: planData.carrier,
      plan_year: planData.plan_year,
      cms_contract_number: planData.cms_contract_number,
      cms_plan_number: planData.cms_plan_number,
      cms_geo_segment: planData.cms_geo_segment,
      counties: planData.counties,
      metadata: planData.metadata
    })
    .eq('id', planId)
    .select()

  if (error) {
    console.error(`  ❌ Error updating plan:`, error)
    return false
  }

  console.log(`  ✅ Plan updated successfully!`)
  return true
}

/**
 * Create new plan in database
 */
async function createPlan(planData) {
  console.log(`  ➕ Creating new plan: ${planData.name} (${planData.cms_id})`)
  
  const { error } = await supabase
    .from('plans')
    .insert({
      name: planData.name,
      plan_type: planData.plan_type,
      carrier: planData.carrier,
      plan_year: planData.plan_year,
      cms_contract_number: planData.cms_contract_number,
      cms_plan_number: planData.cms_plan_number,
      cms_geo_segment: planData.cms_geo_segment,
      counties: planData.counties,
      metadata: planData.metadata
    })
    .select()

  if (error) {
    console.error(`  ❌ Error creating plan:`, error)
    return false
  }

  console.log(`  ✅ Plan created successfully!`)
  return true
}

/**
 * Process a single plan
 */
async function processPlan(planData) {
  console.log(`\n🔍 Processing: ${planData.name} (${planData.cms_id})`)
  
  // Find existing plan
  const existingPlan = await findExistingPlan(planData)
  
  if (existingPlan) {
    // Update existing plan
    return await updatePlan(existingPlan.id, planData)
  } else {
    // Create new plan
    return await createPlan(planData)
  }
}

/**
 * Main function
 */
async function main() {
  console.log('🔄 Ingesting Medical Mutual plans into database...\n')

  // Read JSON file
  console.log(`📄 Reading extracted plans from: ${JSON_FILE}`)
  const jsonContent = await fs.readFile(JSON_FILE, 'utf-8')
  const extractedPlans = JSON.parse(jsonContent)
  
  console.log(`📊 Found ${extractedPlans.length} extracted plans\n`)

  let successCount = 0
  let errorCount = 0

  // Process each plan
  for (const planData of extractedPlans) {
    try {
      const success = await processPlan(planData)
      if (success) {
        successCount++
      } else {
        errorCount++
      }
    } catch (error) {
      console.error(`❌ Error processing plan ${planData.name}:`, error.message)
      errorCount++
    }
  }

  // Summary
  console.log(`\n📊 Ingestion Summary:`)
  console.log(`  ✅ Successfully processed: ${successCount} plans`)
  console.log(`  ❌ Errors: ${errorCount} plans`)
  console.log(`  📄 Total plans: ${extractedPlans.length}`)
  
  if (errorCount === 0) {
    console.log(`\n🎉 All plans processed successfully!`)
  } else {
    console.log(`\n⚠️  Some plans had errors. Check the logs above.`)
  }
}

// Run the ingestion
main().catch(console.error)
