#!/usr/bin/env node

import { promises as fs } from 'fs'
import path from 'path'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

// Medical Mutual PDF directory
const PDF_DIR = '/home/stav/Desktop/Insurance/carriers/MedMutual'

/**
 * Read PDF file and extract text content using pdftotext
 */
async function readPdfContent(filePath) {
  try {
    const { stdout: pdfText } = await execAsync(`pdftotext "${filePath}" - 2>/dev/null`)
    return pdfText
  } catch (error) {
    console.error(`Error reading PDF ${filePath}:`, error.message)
    return null
  }
}

/**
 * Extract CMS ID from PDF content
 */
function extractCmsIdFromContent(pdfText) {
  if (!pdfText) return null

  // Look for full CMS ID pattern: H####-###-###
  const fullCmsIdPattern = /(H\d{4}-\d{3}-\d{3})/g
  const fullMatches = pdfText.match(fullCmsIdPattern)
  if (fullMatches && fullMatches.length > 0) {
    return fullMatches[0]
  }

  return null
}

/**
 * Extract plan name from PDF content
 */
function extractPlanNameFromContent(pdfText) {
  if (!pdfText) return null

  // Look for plan name patterns in the PDF
  const planNamePatterns = [
    /MedMutual Advantage ([^(]+) \(H\d{4}-\d{3}-\d{3}\)/, // "MedMutual Advantage Access PPO (H4497-005-003)"
    /Summary of Benefits \| ([^|]+)/,
    /Plan Name: ([^\n]+)/,
    /([A-Za-z\s]+) HMO/,
    /([A-Za-z\s]+) PPO/,
  ]

  for (const pattern of planNamePatterns) {
    const match = pdfText.match(pattern)
    if (match && match[1]) {
      let name = match[1].trim()

      // Remove plan type suffixes from the name
      name = name.replace(/\s+(HMO|PPO|POS)(\s*-\s*POS)?$/i, '')

      return name
    }
  }

  return null
}

/**
 * Extract plan year from PDF content
 */
function extractYearFromContent(pdfText) {
  if (!pdfText) return null

  // Look for year patterns
  const yearPatterns = [/(\d{4}) Summary of Benefits/, /Plan Year: (\d{4})/, /Effective: (\d{4})/]

  for (const pattern of yearPatterns) {
    const match = pdfText.match(pattern)
    if (match && match[1]) {
      return parseInt(match[1])
    }
  }

  return null
}

/**
 * Extract plan type from PDF content
 */
function extractPlanTypeFromContent(pdfText) {
  if (!pdfText) return null

  if (pdfText.includes('HMO')) return 'HMO'
  if (pdfText.includes('PPO')) return 'PPO'
  if (pdfText.includes('POS')) return 'POS'

  return null
}

/**
 * Extract all plan data from PDF content
 */
function extractPlanDataFromPdf(pdfText, filename) {
  if (!pdfText) return null

  // Remove Optional Benefits section to avoid extracting add-on benefits
  const optionalBenefitsIndex = pdfText.indexOf('Optional Benefits')
  if (optionalBenefitsIndex !== -1) {
    pdfText = pdfText.substring(0, optionalBenefitsIndex)
  }

  const data = {
    // Basic plan info
    name: extractPlanNameFromContent(pdfText),
    plan_type: extractPlanTypeFromContent(pdfText),
    carrier: 'MedMutual',
    plan_year: extractYearFromContent(pdfText),
    cms_id: extractCmsIdFromContent(pdfText),

    // Counties (default for Medical Mutual service area)
    counties: [
      'Ashland',
      'Cuyahoga',
      'Erie',
      'Geauga',
      'Lake',
      'Lorain',
      'Medina',
      'Portage',
      'Stark',
      'Summit',
      'Wayne',
    ],

    // Metadata with all benefits
    metadata: {},
  }

  // Extract premium information
  const premiumSection = pdfText.match(/Monthly Plan Premium[\s\S]*?\$(\d+) per month/)
  if (premiumSection) {
    data.metadata.premium_monthly = parseFloat(premiumSection[1])
  } else {
    data.metadata.premium_monthly = 0
  }

  // Extract medical deductible
  if (pdfText.includes('This plan does not have a deductible')) {
    data.metadata.medical_deductible = 0
  } else {
    const medicalDeductibleMatch = pdfText.match(/Deductible[\s\S]*?\$([\d,]+)/)
    if (medicalDeductibleMatch) {
      data.metadata.medical_deductible = parseFloat(medicalDeductibleMatch[1].replace(/,/g, ''))
    }
  }

  // Extract RX deductible - look for Part D prescription drug deductible
  const rxDeductibleMatch = pdfText.match(/\$(\d+) for Part D prescription drugs/)
  if (rxDeductibleMatch) {
    data.metadata.rx_deductible = parseFloat(rxDeductibleMatch[1])
  } else {
    data.metadata.rx_deductible = 0 // Default to 0 if not found
  }

  // Extract MOOP
  const moopSection = pdfText.match(
    /Maximum Out-of-Pocket Responsibility[\s\S]*?\$([\d,]+) annually for services you receive from[\s\S]*?in-network providers[\s\S]*?\$([\d,]+) annually for services you receive from[\s\S]*?any provider/
  )
  if (moopSection) {
    data.metadata.moop_in_network = parseFloat(moopSection[1].replace(/,/g, ''))
    data.metadata.moop_any_network = parseFloat(moopSection[2].replace(/,/g, ''))
  }

  // Extract hospital inpatient copays
  const hospitalMatch = pdfText.match(/\$(\d+) copay per day for days 1 through (\d+)/)
  if (hospitalMatch) {
    data.metadata.hospital_inpatient_per_day_copay = parseFloat(hospitalMatch[1])
    data.metadata.hospital_inpatient_days = parseInt(hospitalMatch[2])
  }

  // Extract primary care copay
  const pcpSection = pdfText.match(/Primary care physician visit:[\s\S]*?In-network: \$(\d+) copay/)
  if (pcpSection) {
    data.metadata.primary_care_copay = parseFloat(pcpSection[1])
  }

  // Extract specialist copay
  const specialistSection = pdfText.match(/Specialist visit:[\s\S]*?In-network: \$(\d+) copay/)
  if (specialistSection) {
    data.metadata.specialist_copay = parseFloat(specialistSection[1])
  }

  // Extract emergency room copay
  const erMatch = pdfText.match(/\$(\d+) copay for each covered emergency room visit/)
  if (erMatch) {
    data.metadata.emergency_room_copay = parseFloat(erMatch[1])
  }

  // Extract urgent care copay
  const urgentMatch = pdfText.match(/\$(\d+) copay for each covered urgent care center visit/)
  if (urgentMatch) {
    data.metadata.urgent_care_copay = parseFloat(urgentMatch[1])
  }

  // Extract ambulance copay
  const ambulanceSection = pdfText.match(/Ambulance[\s\S]*?\$(\d+) copay for each covered ground[\s\S]*?ambulance trip/)
  if (ambulanceSection) {
    data.metadata.ambulance_copay = parseFloat(ambulanceSection[1])
  }

  // Extract OTC benefit
  const otcMatch = pdfText.match(/\$(\d+) quarterly allowance/)
  if (otcMatch) {
    data.metadata.otc_benefit_quarterly = parseFloat(otcMatch[1])
  }

  // Extract dental benefit
  if (pdfText.includes('$1,000 per') && pdfText.includes('calendar year for select comprehensive and preventive')) {
    data.metadata.dental_benefit_yearly = 1000
  }

  // Extract vision benefit
  const visionMatch = pdfText.match(/\$(\d+) allowance/)
  if (visionMatch) {
    data.metadata.vision_benefit_yearly = parseFloat(visionMatch[1])
  }

  // Extract hearing benefit
  const hearingMatch = pdfText.match(/\$(\d+) copay for each covered Standard hearing aid/)
  if (hearingMatch) {
    data.metadata.hearing_benefit_yearly = parseFloat(hearingMatch[1])
  }

  // Extract skilled nursing facility copay
  const skilledNursingMatch = pdfText.match(/Skilled Nursing Facility[\s\S]*?In-network: \$(\d+) copay/)
  if (skilledNursingMatch) {
    data.metadata.skilled_nursing_copay = parseFloat(skilledNursingMatch[1])
  }

  // Extract physical therapy copay
  const physicalTherapyMatch = pdfText.match(
    /Physical therapy or speech\/ language therapy visit:[\s\S]*?In-network: \$(\d+) copay/
  )
  if (physicalTherapyMatch) {
    data.metadata.physical_therapy_copay = parseFloat(physicalTherapyMatch[1])
  }

  // Extract occupational therapy copay
  const occupationalTherapyMatch = pdfText.match(/Occupational therapy visit:[\s\S]*?In-network: \$(\d+) copay/)
  if (occupationalTherapyMatch) {
    data.metadata.occupational_therapy_copay = parseFloat(occupationalTherapyMatch[1])
  }

  // Extract speech therapy copay (same as physical therapy in this plan)
  const speechTherapyMatch = pdfText.match(
    /Physical therapy or speech\/ language therapy visit:[\s\S]*?In-network: \$(\d+) copay/
  )
  if (speechTherapyMatch) {
    data.metadata.speech_therapy_copay = parseFloat(speechTherapyMatch[1])
  }

  // Extract mental health copay (inpatient)
  const mentalHealthMatch = pdfText.match(
    /Mental Health Care[\s\S]*?In-network:[\s\S]*?\$(\d+) copay per day for days 1 through 5/
  )
  if (mentalHealthMatch) {
    data.metadata.mental_health_copay = parseFloat(mentalHealthMatch[1])
  }

  // Extract substance abuse copay
  const substanceAbuseMatch = pdfText.match(
    /Outpatient Substance Use Disorder Services[\s\S]*?In-network: \$(\d+) copay/
  )
  if (substanceAbuseMatch) {
    data.metadata.substance_abuse_copay = parseFloat(substanceAbuseMatch[1])
  }

  // Extract podiatry copay
  const podiatryMatch = pdfText.match(/Foot Care \(Podiatry services\)[\s\S]*?In-network: \$(\d+) copay/)
  if (podiatryMatch) {
    data.metadata.podiatry_copay = parseFloat(podiatryMatch[1])
  }

  // Extract chiropractor copays (in-network and out-of-network)
  const chiropractorSection = pdfText.match(
    /Chiropractic Care[\s\S]*?In-network: \$(\d+) copay[\s\S]*?Out-of-network: \$(\d+) copay/
  )
  if (chiropractorSection) {
    data.metadata.chiro_in_network_copay = parseFloat(chiropractorSection[1])
    data.metadata.chiro_out_network_copay = parseFloat(chiropractorSection[2])
  } else {
    // Check for single copay format (e.g., "$20 copay for each visit")
    const singleChiroMatch = pdfText.match(/Chiropractic Care[\s\S]*?\$(\d+) copay for each visit/)
    if (singleChiroMatch) {
      data.metadata.chiro_in_network_copay = parseFloat(singleChiroMatch[1])
      // For single copay plans, assume out-of-network is not covered or higher
      data.metadata.chiro_out_network_copay = null
    }
  }

  // Extract routine eye exam copay
  const eyeExamMatch = pdfText.match(/Routine eye exam[\s\S]*?In-network: \$(\d+) copay/)
  if (eyeExamMatch) {
    data.metadata.routine_eye_exam_copay = parseFloat(eyeExamMatch[1])
  }

  // Extract hearing exam copay
  const hearingExamMatch = pdfText.match(/Routine hearing exam[\s\S]*?\$(\d+) copay/)
  if (hearingExamMatch) {
    data.metadata.hearing_exam_copay = parseFloat(hearingExamMatch[1])
  } else if (pdfText.includes('Routine hearing exam') && pdfText.includes('$0 copay')) {
    data.metadata.hearing_exam_copay = 0
  }

  // Extract hearing aid fitting copay
  const hearingAidFittingMatch = pdfText.match(/Hearing aid fitting-evaluation visit: \$(\d+) copay/)
  if (hearingAidFittingMatch) {
    data.metadata.hearing_aid_fitting_copay = parseFloat(hearingAidFittingMatch[1])
  } else if (pdfText.includes('Hearing aid fitting-evaluation visit') && pdfText.includes('$0 copay')) {
    data.metadata.hearing_aid_fitting_copay = 0
  }

  // Extract effective dates
  data.metadata.effective_start = `${data.plan_year}-01-01`
  data.metadata.effective_end = `${data.plan_year}-12-31`

  // Extract additional benefits
  data.metadata.fitness_benefit = 'SilverSneakers Fitness Program'
  data.metadata.transportation_benefit = 24
  data.metadata.card_benefit = 0
  data.metadata.medicaid_eligibility = 'Not Required'

  // Add extraction metadata
  data.metadata.extraction_date = new Date().toISOString()
  data.metadata.extraction_method = 'PDF text extraction with pdftotext and regex parsing'
  data.metadata.source_file = filename

  return data
}

/**
 * Parse CMS ID into components
 */
function parseCmsId(cmsId) {
  if (!cmsId) return null

  const match = cmsId.match(/H(\d{4})-(\d{3})-(\d{3})/)
  if (match) {
    return {
      contractNumber: `H${match[1]}`,
      planNumber: match[2],
      geoSegment: match[3],
    }
  }

  return null
}

/**
 * Main function
 */
async function main() {
  console.log('🔄 Extracting Medical Mutual plans from PDFs...\n')

  // Get all PDF files
  const files = await fs.readdir(PDF_DIR)
  const pdfFiles = files.filter((file) => file.endsWith('.pdf'))

  console.log(`📄 Found ${pdfFiles.length} PDF files:`)
  pdfFiles.forEach((file) => console.log(`  - ${file}`))
  console.log()

  const extractedPlans = []

  // Process each PDF
  for (const filename of pdfFiles) {
    const filePath = path.join(PDF_DIR, filename)
    console.log(`🔍 Processing: ${filename}`)

    // Read PDF content
    const pdfText = await readPdfContent(filePath)
    if (!pdfText) {
      console.log(`❌ Could not read PDF: ${filename}`)
      continue
    }

    // Extract plan data
    const planData = extractPlanDataFromPdf(pdfText, filename)
    if (!planData) {
      console.log(`❌ Could not extract data from: ${filename}`)
      continue
    }

    // Parse CMS ID components
    const cmsComponents = parseCmsId(planData.cms_id)
    if (cmsComponents) {
      planData.cms_contract_number = cmsComponents.contractNumber
      planData.cms_plan_number = cmsComponents.planNumber
      planData.cms_geo_segment = cmsComponents.geoSegment
    }

    extractedPlans.push(planData)
    console.log(`✅ Extracted: ${planData.name} (${planData.cms_id})`)
  }

  // Save to JSON file with sorted keys
  const outputFile = 'medmutual-plans-extracted.json'

  // Function to recursively sort object keys with priority fields
  function sortObjectKeys(obj) {
    if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) {
      return obj
    }

    const sorted = {}

    // Priority fields for top-level plan objects
    const priorityFields = ['carrier', 'plan_year', 'name', 'plan_type']

    // Add priority fields first
    priorityFields.forEach((key) => {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        sorted[key] = sortObjectKeys(obj[key])
      }
    })

    // Add remaining fields alphabetically
    Object.keys(obj)
      .filter((key) => !priorityFields.includes(key))
      .sort()
      .forEach((key) => {
        sorted[key] = sortObjectKeys(obj[key])
      })

    return sorted
  }

  const sortedPlans = extractedPlans.map((plan) => sortObjectKeys(plan))
  await fs.writeFile(outputFile, JSON.stringify(sortedPlans, null, 2))

  console.log(`\n📊 Summary:`)
  console.log(`  - Processed: ${pdfFiles.length} PDFs`)
  console.log(`  - Successfully extracted: ${extractedPlans.length} plans`)
  console.log(`  - Output file: ${outputFile}`)

  // Display extracted plans
  console.log(`\n📋 Extracted Plans:`)
  extractedPlans.forEach((plan) => {
    console.log(`  - ${plan.name} (${plan.cms_id}) - ${plan.plan_year}`)
  })
}

// Run the extraction
main().catch(console.error)
