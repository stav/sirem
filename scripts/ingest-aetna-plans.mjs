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
const JSON_FILE = 'aetna-plans-extracted.json'

/**
 * Find existing plan in database by CMS ID components and year
 */
async function findExistingPlan(planData) {
  const { data, error } = await supabase
    .from('plans')
    .select('id, name, cms_contract_number, cms_plan_number, cms_geo_segment, plan_year, carrier')
    .eq('plan_year', planData.plan_year)
    .eq('cms_contract_number', planData.cms_contract_number)
    .eq('cms_plan_number', planData.cms_plan_number)
    .eq('cms_geo_segment', planData.cms_geo_segment)
    .eq('carrier', 'Aetna')
    .single()

  if (error && error.code !== 'PGRST116') {
    // PGRST116 = no rows returned
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

  const updateData = {
    name: planData.name,
    carrier: planData.carrier,
    plan_year: planData.plan_year,
    cms_contract_number: planData.cms_contract_number,
    cms_plan_number: planData.cms_plan_number,
    cms_geo_segment: planData.cms_geo_segment,
    counties: planData.counties || [],
    metadata: planData.metadata || {},
  }

  // Add normalized plan type fields if present
  if (planData.type_network) updateData.type_network = planData.type_network
  if (planData.type_extension !== undefined) updateData.type_extension = planData.type_extension
  if (planData.type_snp !== undefined) updateData.type_snp = planData.type_snp
  if (planData.type_program) updateData.type_program = planData.type_program

  const { error } = await supabase.from('plans').update(updateData).eq('id', planId).select()

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

  const insertData = {
    name: planData.name,
    carrier: planData.carrier,
    plan_year: planData.plan_year,
    cms_contract_number: planData.cms_contract_number,
    cms_plan_number: planData.cms_plan_number,
    cms_geo_segment: planData.cms_geo_segment,
    counties: planData.counties || [],
    metadata: planData.metadata || {},
  }

  // Add normalized plan type fields if present
  if (planData.type_network) insertData.type_network = planData.type_network
  if (planData.type_extension !== undefined) insertData.type_extension = planData.type_extension
  if (planData.type_snp !== undefined) insertData.type_snp = planData.type_snp
  if (planData.type_program) insertData.type_program = planData.type_program

  const { error } = await supabase.from('plans').insert(insertData).select()

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
  console.log('🔄 Ingesting Aetna 2026 plans into database...\n')

  // Read JSON file
  console.log(`📄 Reading extracted plans from: ${JSON_FILE}`)
  let extractedPlans
  try {
    const jsonContent = await fs.readFile(JSON_FILE, 'utf-8')
    extractedPlans = JSON.parse(jsonContent)
  } catch (error) {
    console.error(`❌ Error reading ${JSON_FILE}:`, error.message)
    console.error('\n💡 Make sure you have run the extraction script first:')
    console.error('   node scripts/extract-aetna-plans.mjs')
    process.exit(1)
  }

  if (!Array.isArray(extractedPlans) || extractedPlans.length === 0) {
    console.error(`❌ No plans found in ${JSON_FILE}`)
    console.error('   The file should contain an array of plan objects.')
    process.exit(1)
  }

  console.log(`📊 Found ${extractedPlans.length} extracted plans\n`)

  let successCount = 0
  let errorCount = 0

  // Process each plan
  for (const planData of extractedPlans) {
    try {
      // Validate required fields
      if (!planData.name || !planData.cms_contract_number || !planData.cms_plan_number) {
        console.log(`  ⚠️  Skipping plan with missing required fields:`, planData)
        errorCount++
        continue
      }

      // Ensure plan_year is set
      if (!planData.plan_year) {
        planData.plan_year = 2026
      }

      // Ensure carrier is set
      if (!planData.carrier) {
        planData.carrier = 'Aetna'
      }

      // Ensure cms_geo_segment is set
      if (!planData.cms_geo_segment) {
        planData.cms_geo_segment = '001'
      }

      // Construct cms_id if not present
      if (!planData.cms_id) {
        planData.cms_id = `${planData.cms_contract_number}-${planData.cms_plan_number}-${planData.cms_geo_segment}`
      }

      const success = await processPlan(planData)
      if (success) {
        successCount++
      } else {
        errorCount++
      }
    } catch (error) {
      console.error(`❌ Error processing plan ${planData.name || 'unknown'}:`, error.message)
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
