#!/usr/bin/env node

import { promises as fs } from 'fs'
import path from 'path'
import https from 'https'
import http from 'http'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

// Aetna PDF directory
const PDF_DIR = '/home/stav/Desktop/Insurance/carriers/Aetna'

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
 * Extract CMS ID from PDF content or filename
 */
function extractCmsIdFromContent(pdfText, filename) {
  if (!pdfText) {
    // Try to extract from filename: Y0001_H0628_005_HP14_SB2026_M.pdf
    const filenameMatch = filename.match(/H(\d{4})[_-](\d{3})/)
    if (filenameMatch) {
      return `H${filenameMatch[1]}-${filenameMatch[2]}`
    }
    return null
  }

  // Look for full CMS ID pattern: H####-### or H####-###-###
  const fullCmsIdPattern = /(H\d{4}-\d{3}(?:-\d{3})?)/g
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

  // Look for plan name patterns in Aetna PDFs
  // Pattern 1: "Aetna Medicare Signature Care (HMO‑POS)" at the beginning
  const fullNameMatch = pdfText.match(/^Aetna Medicare ([^(]+)\s*\([^)]+\)/)
  if (fullNameMatch && fullNameMatch[1]) {
    return fullNameMatch[1].trim()
  }

  // Pattern 2: "Aetna Medicare [Name] (HMO-POS) | H0628-005"
  const nameWithCmsMatch = pdfText.match(/Aetna Medicare ([^(]+)\s*\([^)]+\)\s*\|/)
  if (nameWithCmsMatch && nameWithCmsMatch[1]) {
    return nameWithCmsMatch[1].trim()
  }

  // Pattern 3: Look for plan name in various formats
  const planNamePatterns = [
    /Aetna Medicare ([A-Za-z\s]+?)\s*\(HMO/i,
    /Aetna Medicare ([A-Za-z\s]+?)\s*\(PPO/i,
    /Plan Name: ([^\n]+)/,
    /([A-Za-z\s]+) \(HMO[-\s]?POS?\)/,
  ]

  for (const pattern of planNamePatterns) {
    const match = pdfText.match(pattern)
    if (match && match[1]) {
      let name = match[1].trim()
      // Clean up the name
      name = name.replace(/^Aetna Medicare\s+/i, '')
      name = name.replace(/\s+(HMO|PPO|POS)(\s*-\s*POS)?$/i, '')
      if (name && name.length > 2) {
        return name
      }
    }
  }

  return null
}

/**
 * Extract plan year from PDF content or filename
 */
function extractYearFromContent(pdfText, filename) {
  if (pdfText) {
    // Look for year patterns
    const yearPatterns = [/(\d{4}) Summary of Benefits/, /Plan Year: (\d{4})/, /Effective: (\d{4})/]

    for (const pattern of yearPatterns) {
      const match = pdfText.match(pattern)
      if (match && match[1]) {
        return parseInt(match[1])
      }
    }
  }

  // Try filename: Y0001_H0628_005_HP14_SB2026_M.pdf
  const filenameMatch = filename.match(/SB(\d{4})/)
  if (filenameMatch) {
    return parseInt(filenameMatch[1])
  }

  return 2026 // Default to 2026
}

/**
 * Extract plan type from PDF content
 */
function extractPlanTypeFromContent(pdfText) {
  if (!pdfText) return null

  const text = pdfText.toUpperCase()

  // Check for SNP types first
  if (text.includes('D-SNP') || text.includes('DUAL ELIGIBLE'))
    return { type_network: 'HMO', type_snp: 'D', type_program: 'SNP' }
  if (text.includes('C-SNP') || text.includes('CHRONIC'))
    return { type_network: 'HMO', type_snp: 'C', type_program: 'SNP' }
  if (text.includes('I-SNP') || text.includes('INSTITUTIONAL'))
    return { type_network: 'HMO', type_snp: 'I', type_program: 'SNP' }

  // Check for network types
  if (text.includes('PPO')) {
    return { type_network: 'PPO', type_extension: null, type_snp: null, type_program: 'MAPD' }
  }
  if (text.includes('POS')) {
    return { type_network: 'HMO', type_extension: 'POS', type_snp: null, type_program: 'MAPD' }
  }
  if (text.includes('HMO')) {
    return { type_network: 'HMO', type_extension: null, type_snp: null, type_program: 'MAPD' }
  }
  if (text.includes('PFFS')) {
    return { type_network: 'PFFS', type_extension: null, type_snp: null, type_program: 'MA' }
  }

  return { type_network: 'HMO', type_extension: null, type_snp: null, type_program: 'MAPD' } // Default
}

/**
 * Extract counties from PDF content
 */
function extractCountiesFromContent(pdfText) {
  if (!pdfText) return []

  // Look for county lists in Aetna PDFs
  // Pattern: "which includes the following counties:\nOhio: Ashland, Belmont, Carroll..."
  const countySectionMatch = pdfText.match(
    /which includes the following counties:[\s\S]{0,500}?([A-Z][a-z]+(?:\s*,\s*[A-Z][a-z]+){2,})/
  )
  if (countySectionMatch && countySectionMatch[1]) {
    const countyText = countySectionMatch[1]
    // Remove state prefix if present
    const cleaned = countyText.replace(/^(Ohio|State|County):\s*/i, '')
    const counties = cleaned
      .split(',')
      .map((c) => c.trim())
      .filter((c) => c.length > 0 && !c.match(/^(Ohio|State|County)$/i))
    if (counties.length > 0) {
      return counties
    }
  }

  // Alternative pattern: Look for multi-line county lists
  const multiLineMatch = pdfText.match(/counties?:[\s\S]{0,500}?([A-Z][a-z]+(?:\s*,\s*[A-Z][a-z]+){2,})/i)
  if (multiLineMatch && multiLineMatch[1]) {
    const counties = multiLineMatch[1]
      .split(',')
      .map((c) => c.trim())
      .filter((c) => c.length > 0 && !c.match(/^(Ohio|State|County)$/i))
    if (counties.length > 0) {
      return counties
    }
  }

  return []
}

/**
 * Extract all plan data from PDF content
 */
function extractPlanDataFromPdf(pdfText, filename) {
  if (!pdfText) return null

  const cmsId = extractCmsIdFromContent(pdfText, filename)
  if (!cmsId) {
    console.log(`  ⚠️  Could not extract CMS ID from ${filename}`)
    return null
  }

  // Parse CMS ID into components
  const cmsMatch = cmsId.match(/H(\d{4})-(\d{3})(?:-(\d{3}))?/)
  if (!cmsMatch) return null

  const contractNumber = `H${cmsMatch[1]}`
  const planNumber = cmsMatch[2]
  const geoSegment = cmsMatch[3] || '001'

  const planTypeInfo = extractPlanTypeFromContent(pdfText)
  const counties = extractCountiesFromContent(pdfText)

  const data = {
    carrier: 'Aetna',
    plan_year: extractYearFromContent(pdfText, filename),
    name: extractPlanNameFromContent(pdfText) || `Aetna Plan ${cmsId}`,
    cms_contract_number: contractNumber,
    cms_plan_number: planNumber,
    cms_geo_segment: geoSegment,
    cms_id: cmsId,
    type_network: planTypeInfo.type_network,
    type_extension: planTypeInfo.type_extension,
    type_snp: planTypeInfo.type_snp,
    type_program: planTypeInfo.type_program,
    counties: counties.length > 0 ? counties : [],
    metadata: {},
  }

  // Extract premium information
  const premiumMatch = pdfText.match(/\$(\d+)\s+Plan Premium/i) || pdfText.match(/Monthly plan premium[\s\S]*?\$(\d+)/i)
  if (premiumMatch) {
    data.metadata.premium_monthly = parseFloat(premiumMatch[1])
  } else if (pdfText.includes('$0 Plan Premium') || pdfText.includes('$0 premium')) {
    data.metadata.premium_monthly = 0
  } else {
    data.metadata.premium_monthly = 0
  }

  // Extract deductible
  const deductibleMatch =
    pdfText.match(/Plan deductible[\s\S]*?\$([\d,]+)/i) || pdfText.match(/Deductible:[\s\S]*?\$([\d,]+)/i)
  if (deductibleMatch) {
    data.metadata.medical_deductible = parseFloat(deductibleMatch[1].replace(/,/g, ''))
  } else if (pdfText.includes('$0') && pdfText.includes('deductible')) {
    data.metadata.medical_deductible = 0
  } else {
    data.metadata.medical_deductible = 0
  }

  // Extract MOOP
  const moopMatch = pdfText.match(/\$([\d,]+)\s+for in[-\s]?network/i) || pdfText.match(/MOOP[\s\S]*?\$([\d,]+)/i)
  if (moopMatch) {
    data.metadata.moop_in_network = parseFloat(moopMatch[1].replace(/,/g, ''))
  }

  // Extract prescription drug deductible
  const rxDeductibleMatch =
    pdfText.match(/\$(\d+)\s+for Part D/i) || pdfText.match(/prescription drug deductible[\s\S]*?\$([\d,]+)/i)
  if (rxDeductibleMatch) {
    data.metadata.rx_deductible = parseFloat(rxDeductibleMatch[1].replace(/,/g, ''))
  } else {
    data.metadata.rx_deductible = 0
  }

  // Extract copays (similar patterns to MedMutual)
  // Primary care - be more specific to avoid false matches
  const pcpMatch =
    pdfText.match(/Primary care[\s\S]{0,200}?\$(\d+)\s+copay/i) ||
    pdfText.match(/Primary care physician[\s\S]{0,200}?\$(\d+)\s+copay/i)
  if (pcpMatch && parseFloat(pcpMatch[1]) < 500) {
    // Sanity check - copays shouldn't be > $500
    data.metadata.primary_care_copay = parseFloat(pcpMatch[1])
  }

  const specialistMatch =
    pdfText.match(/Specialist[\s\S]{0,200}?\$(\d+)\s+copay/i) ||
    pdfText.match(/Specialist visit[\s\S]{0,200}?\$(\d+)\s+copay/i)
  if (specialistMatch && parseFloat(specialistMatch[1]) < 500) {
    data.metadata.specialist_copay = parseFloat(specialistMatch[1])
  }

  const erMatch = pdfText.match(/Emergency room[\s\S]*?\$(\d+)\s+copay/i)
  if (erMatch) {
    data.metadata.emergency_room_copay = parseFloat(erMatch[1])
  }

  const urgentMatch = pdfText.match(/Urgent care[\s\S]*?\$(\d+)\s+copay/i)
  if (urgentMatch) {
    data.metadata.urgent_care_copay = parseFloat(urgentMatch[1])
  }

  // Extract benefits
  const otcMatch = pdfText.match(/\$(\d+)\s+quarterly/i) || pdfText.match(/\$(\d+)\s+per quarter/i)
  if (otcMatch) {
    data.metadata.otc_benefit_quarterly = parseFloat(otcMatch[1])
  }

  const dentalMatch = pdfText.match(/\$([\d,]+)\s+per.*?year.*?dental/i) || pdfText.match(/dental[\s\S]*?\$([\d,]+)/i)
  if (dentalMatch) {
    data.metadata.dental_benefit_yearly = parseFloat(dentalMatch[1].replace(/,/g, ''))
  }

  const visionMatch = pdfText.match(/vision[\s\S]*?\$([\d,]+)/i)
  if (visionMatch) {
    data.metadata.vision_benefit_yearly = parseFloat(visionMatch[1].replace(/,/g, ''))
  }

  const hearingMatch = pdfText.match(/hearing[\s\S]*?\$([\d,]+)/i)
  if (hearingMatch) {
    data.metadata.hearing_benefit_yearly = parseFloat(hearingMatch[1].replace(/,/g, ''))
  }

  // Add extraction metadata
  data.metadata.effective_start = `${data.plan_year}-01-01`
  data.metadata.effective_end = `${data.plan_year}-12-31`
  data.metadata.extraction_date = new Date().toISOString()
  data.metadata.extraction_method = 'PDF text extraction with pdftotext and regex parsing'
  data.metadata.source_file = filename

  return data
}

/**
 * Fetch data from a URL
 */
async function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http
    protocol
      .get(url, (res) => {
        let data = ''
        res.on('data', (chunk) => {
          data += chunk
        })
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(data)
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`))
          }
        })
      })
      .on('error', reject)
  })
}

/**
 * Extract plan type from plan name or description
 */
function extractPlanType(planName, description = '') {
  const text = `${planName} ${description}`.toUpperCase()

  // Determine network type
  let type_network = 'HMO' // default
  if (text.includes('PPO')) type_network = 'PPO'
  else if (text.includes('PFFS')) type_network = 'PFFS'
  else if (text.includes('MSA')) type_network = 'MSA'

  // Determine extension
  let type_extension = null
  if (text.includes('POS')) type_extension = 'POS'

  // Determine SNP
  let type_snp = null
  if (text.includes('D-SNP') || text.includes('DSNP') || text.includes('DUAL')) type_snp = 'D'
  else if (text.includes('C-SNP') || text.includes('CSNP')) type_snp = 'C'
  else if (text.includes('I-SNP') || text.includes('ISNP')) type_snp = 'I'

  // Determine program
  let type_program = 'MA' // default
  if (type_snp) type_program = 'SNP'
  else if (text.includes('MAPD') || text.includes('PRESCRIPTION')) type_program = 'MAPD'
  else if (text.includes('PDP')) type_program = 'PDP'

  return {
    type_network,
    type_extension,
    type_snp,
    type_program,
  }
}

/**
 * Try to fetch from CMS data.cms.gov API
 * CMS publishes MA Landscape Source Files annually
 */
async function fetchFromCmsApi() {
  console.log('🔍 Attempting to fetch from CMS data sources...')

  // CMS typically publishes data at data.cms.gov or cms.gov
  // The exact URLs change each year, but the pattern is consistent
  const possibleEndpoints = [
    // Data.cms.gov API endpoints (if available)
    'https://data.cms.gov/data-api/v1/dataset/medicare-advantage-landscape-source-files-2026/data',
    'https://data.cms.gov/api/views/xxxx-xxxx/rows.csv', // Placeholder - actual view ID needed
    // Direct file downloads (common patterns)
    'https://www.cms.gov/files/zip/ma-landscape-source-files-2026.zip',
    'https://www.cms.gov/files/zip/2026-ma-landscape-source-files.zip',
    'https://www.cms.gov/medicare/prescription-drug-coverage/prescriptiondrugcovgenin/downloads/2026-ma-landscape-source-files.zip',
  ]

  for (const endpoint of possibleEndpoints) {
    try {
      console.log(`  Trying: ${endpoint}`)
      const data = await fetchUrl(endpoint)
      console.log(`  ✅ Successfully fetched data from ${endpoint}`)
      return data
    } catch (error) {
      console.log(`  ❌ Failed: ${error.message}`)
      continue
    }
  }

  return null
}

/**
 * Try to read from local file if user has downloaded it
 */
async function readLocalFile() {
  console.log('🔍 Checking for locally downloaded CMS files...')

  const possibleFiles = [
    'MA_Landscape_Source_Files_2026.csv',
    '2026-ma-landscape-source-files.csv',
    'ma-landscape-2026.csv',
    'aetna-plans-2026.csv',
    'aetna-plans-2026.json',
  ]

  for (const filename of possibleFiles) {
    try {
      const data = await fs.readFile(filename, 'utf-8')
      console.log(`  ✅ Found local file: ${filename}`)
      return { data, filename }
    } catch {
      // File doesn't exist, continue
      continue
    }
  }

  return null
}

/**
 * Try to fetch from Aetna's enrollment website
 * The page uses JavaScript to load data, so we'll try to extract what we can
 */
async function fetchFromAetnaEnrollmentSite(zipCode, countyFips, planYear = 2026) {
  console.log('🔍 Attempting to fetch from Aetna enrollment site...')

  const url = `https://enrollmedicare.aetna.com/s/shop?ZipCode=${zipCode}&CountyFIPS=${countyFips}&PlanYear=${planYear}&entry=SelectYear&step=PlanList`

  try {
    console.log(`  Fetching: ${url}`)
    const html = await fetchUrl(url)
    console.log(`  ✅ Successfully fetched HTML`)

    // Try to extract any embedded JSON data
    const jsonMatches = html.match(/<script[^>]*>[\s\S]*?({[\s\S]*?"plan[s]?":[\s\S]*?})[\s\S]*?<\/script>/gi)
    if (jsonMatches && jsonMatches.length > 0) {
      console.log(`  Found ${jsonMatches.length} potential JSON data blocks`)
      for (const match of jsonMatches) {
        try {
          const jsonStr = match.match(/{[\s\S]*}/)?.[0]
          if (jsonStr) {
            const parsed = JSON.parse(jsonStr)
            if (parsed.plans || parsed.plan || Array.isArray(parsed)) {
              return parsed
            }
          }
        } catch {
          // Not valid JSON, continue
        }
      }
    }

    return html
  } catch (error) {
    console.log(`  ❌ Failed: ${error.message}`)
    return null
  }
}

/**
 * Parse HTML from Aetna enrollment site
 * This is a basic parser - the site uses JavaScript to load data dynamically
 */
function parseAetnaEnrollmentHtml(html) {
  if (!html || typeof html !== 'string') return []

  const plans = []

  // Try to find plan information in the HTML
  // The page structure may vary, so we'll look for common patterns

  // Look for data attributes or script tags with plan data
  // Note: The Aetna enrollment site loads data dynamically via JavaScript/API
  // This HTML parser is a placeholder - actual data extraction requires
  // either capturing the API response or using a headless browser

  // Future enhancement: Could use regex patterns to extract embedded data
  // const planPatterns = [
  //   /data-plan-id="([^"]+)"/gi,
  //   /plan[_-]?id["\s:=]+([H\d-]+)/gi,
  //   /contract[_-]?number["\s:=]+([H\d]+)/gi,
  // ]

  return plans
}

/**
 * Parse CSV data (if CMS provides CSV format)
 */
function parseCsvData(csvText) {
  const lines = csvText.split('\n').filter((line) => line.trim())
  if (lines.length === 0) return []

  const headers = lines[0].split(',').map((h) => h.trim().replace(/"/g, ''))
  const plans = []

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map((v) => v.trim().replace(/"/g, ''))
    if (values.length !== headers.length) continue

    const row = {}
    headers.forEach((header, index) => {
      row[header] = values[index]
    })

    // Filter for Aetna plans only
    const organizationName = row['Organization Name'] || row['Contract Name'] || row['Organization'] || ''
    if (!organizationName.toUpperCase().includes('AETNA') && !organizationName.toUpperCase().includes('CVS')) {
      continue // Skip non-Aetna plans
    }

    // Extract plan information
    const planName = row['Plan Name'] || row['Plan'] || ''
    const contractNumber = row['Contract ID'] || row['Contract Number'] || row['Contract'] || ''
    const planNumber = row['Plan ID'] || row['Plan Number'] || row['Plan ID (HPP)'] || ''
    const segmentId = row['Segment ID'] || row['Segment'] || row['Geo Segment'] || '001'
    const planType = row['Plan Type'] || row['Type'] || ''
    const county = row['County'] || row['County Name'] || ''
    const state = row['State'] || row['State Code'] || ''

    if (!planName || !contractNumber || !planNumber) continue

    const cmsId = `${contractNumber}-${planNumber}-${segmentId}`
    const planTypeInfo = extractPlanType(planName, planType)

    const plan = {
      carrier: 'Aetna',
      plan_year: 2026,
      name: planName,
      cms_contract_number: contractNumber,
      cms_plan_number: planNumber,
      cms_geo_segment: segmentId,
      cms_id: cmsId,
      type_network: planTypeInfo.type_network,
      type_extension: planTypeInfo.type_extension,
      type_snp: planTypeInfo.type_snp,
      type_program: planTypeInfo.type_program,
      counties: county ? [county] : [],
      metadata: {
        state: state,
        extraction_date: new Date().toISOString(),
        extraction_method: 'CMS CSV data',
        source_file: 'CMS Landscape Files 2026',
        // Additional fields from CSV can be added here
        premium_monthly: parseFloat(row['Premium'] || row['Monthly Premium'] || '0') || 0,
        effective_start: '2026-01-01',
        effective_end: '2026-12-31',
      },
    }

    plans.push(plan)
  }

  return plans
}

/**
 * Parse JSON data (if CMS provides JSON format)
 */
function parseJsonData(jsonText) {
  try {
    const data = JSON.parse(jsonText)
    const plans = []

    // Handle different possible JSON structures
    const records = Array.isArray(data) ? data : data.records || data.data || []

    for (const record of records) {
      // Filter for Aetna plans
      const orgName = record.OrganizationName || record.organization_name || record.contract_name || ''
      if (!orgName.toUpperCase().includes('AETNA') && !orgName.toUpperCase().includes('CVS')) {
        continue
      }

      const planName = record.PlanName || record.plan_name || record.plan || ''
      const contractNumber = record.ContractID || record.contract_id || record.contract_number || ''
      const planNumber = record.PlanID || record.plan_id || record.plan_number || ''
      const segmentId = record.SegmentID || record.segment_id || record.geo_segment || '001'

      if (!planName || !contractNumber || !planNumber) continue

      const cmsId = `${contractNumber}-${planNumber}-${segmentId}`
      const planTypeInfo = extractPlanType(planName, record.PlanType || record.plan_type || '')

      const plan = {
        carrier: 'Aetna',
        plan_year: 2026,
        name: planName,
        cms_contract_number: contractNumber,
        cms_plan_number: planNumber,
        cms_geo_segment: segmentId,
        cms_id: cmsId,
        type_network: planTypeInfo.type_network,
        type_extension: planTypeInfo.type_extension,
        type_snp: planTypeInfo.type_snp,
        type_program: planTypeInfo.type_program,
        counties: record.County ? [record.County] : record.counties || [],
        metadata: {
          extraction_date: new Date().toISOString(),
          extraction_method: 'CMS JSON data',
          source_file: 'CMS API 2026',
          effective_start: '2026-01-01',
          effective_end: '2026-12-31',
          ...record, // Include all other fields in metadata
        },
      }

      plans.push(plan)
    }

    return plans
  } catch (error) {
    console.error('Error parsing JSON:', error.message)
    return []
  }
}

/**
 * Main extraction function
 */
async function main() {
  console.log('🔄 Extracting Aetna 2026 plans from web sources...\n')

  // Check for command line arguments
  const args = process.argv.slice(2)
  let zipCode = null
  let countyFips = null

  // Parse arguments: --zip=44035 --county=39093
  for (const arg of args) {
    if (arg.startsWith('--zip=')) {
      zipCode = arg.split('=')[1]
    } else if (arg.startsWith('--county=')) {
      countyFips = arg.split('=')[1]
    }
  }

  let extractedPlans = []

  // Try reading PDFs from Aetna directory first
  try {
    const files = await fs.readdir(PDF_DIR)
    const pdfFiles = files.filter((file) => file.endsWith('.pdf'))

    if (pdfFiles.length > 0) {
      console.log(`📄 Found ${pdfFiles.length} PDF files in ${PDF_DIR}:`)
      pdfFiles.forEach((file) => console.log(`  - ${file}`))
      console.log()

      for (const filename of pdfFiles) {
        const filePath = path.join(PDF_DIR, filename)
        console.log(`🔍 Processing: ${filename}`)

        const pdfText = await readPdfContent(filePath)
        if (!pdfText) {
          console.log(`❌ Could not read PDF: ${filename}`)
          continue
        }

        const planData = extractPlanDataFromPdf(pdfText, filename)
        if (!planData) {
          console.log(`❌ Could not extract data from: ${filename}`)
          continue
        }

        extractedPlans.push(planData)
        console.log(`✅ Extracted: ${planData.name} (${planData.cms_id})`)
      }

      if (extractedPlans.length > 0) {
        console.log(`\n✅ Successfully extracted ${extractedPlans.length} plans from PDFs\n`)
      }
    }
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.log(`⚠️  Could not read PDF directory: ${error.message}`)
    }
  }

  // Try reading local file (if user downloaded CSV/JSON)
  const localFile = await readLocalFile()
  if (localFile) {
    console.log('📊 Parsing local file...')

    // Try parsing as CSV
    if (localFile.data.includes(',') && localFile.data.split('\n').length > 1) {
      const csvPlans = parseCsvData(localFile.data)
      if (csvPlans.length > 0) {
        console.log(`  ✅ Extracted ${csvPlans.length} plans from CSV`)
        extractedPlans = csvPlans
      }
    }

    // Try parsing as JSON
    if (extractedPlans.length === 0) {
      try {
        const jsonPlans = parseJsonData(localFile.data)
        if (jsonPlans.length > 0) {
          console.log(`  ✅ Extracted ${jsonPlans.length} plans from JSON`)
          extractedPlans = jsonPlans
        }
      } catch {
        // Not JSON, continue
      }
    }
  }

  // Try CMS API if no local file
  if (extractedPlans.length === 0) {
    const cmsData = await fetchFromCmsApi()
    if (cmsData) {
      console.log('📊 Parsing CMS data...')

      // Try parsing as CSV
      if (cmsData.includes(',') && cmsData.split('\n').length > 1) {
        const csvPlans = parseCsvData(cmsData)
        if (csvPlans.length > 0) {
          console.log(`  ✅ Extracted ${csvPlans.length} plans from CSV`)
          extractedPlans = csvPlans
        }
      }

      // Try parsing as JSON
      if (extractedPlans.length === 0) {
        try {
          const jsonPlans = parseJsonData(cmsData)
          if (jsonPlans.length > 0) {
            console.log(`  ✅ Extracted ${jsonPlans.length} plans from JSON`)
            extractedPlans = jsonPlans
          }
        } catch {
          // Not JSON, continue
        }
      }
    }
  }

  // If CMS API didn't work, try Aetna enrollment site
  if (extractedPlans.length === 0 && zipCode && countyFips) {
    console.log(`\n🔍 Trying Aetna enrollment site for ZIP ${zipCode}, County FIPS ${countyFips}...`)
    const aetnaData = await fetchFromAetnaEnrollmentSite(zipCode, countyFips, 2026)
    if (aetnaData) {
      console.log('📊 Parsing Aetna enrollment site data...')

      // Try parsing as JSON first
      if (typeof aetnaData === 'object') {
        const jsonPlans = parseJsonData(JSON.stringify(aetnaData))
        if (jsonPlans.length > 0) {
          console.log(`  ✅ Extracted ${jsonPlans.length} plans from JSON`)
          extractedPlans = jsonPlans
        }
      }

      // Try parsing as HTML
      if (extractedPlans.length === 0 && typeof aetnaData === 'string') {
        const htmlPlans = parseAetnaEnrollmentHtml(aetnaData)
        if (htmlPlans.length > 0) {
          console.log(`  ✅ Extracted ${htmlPlans.length} plans from HTML`)
          extractedPlans = htmlPlans
        } else {
          console.log('  ⚠️  Could not extract plan data from HTML')
          console.log('  💡 The page uses JavaScript to load data dynamically.')
          console.log('  💡 To get the data:')
          console.log('     1. Open the URL in a browser')
          console.log('     2. Open Developer Tools (F12)')
          console.log('     3. Go to Network tab and filter by XHR/Fetch')
          console.log('     4. Reload the page and look for API calls')
          console.log('     5. Copy the API endpoint URL and response')
          console.log('     6. Save the JSON response to a file and run this script with --file=filename.json')
        }
      }
    }
  }

  // If no data was extracted, provide instructions
  if (extractedPlans.length === 0) {
    console.log('\n⚠️  Could not automatically fetch plan data from web sources.')
    console.log('\n📋 How to Get Aetna 2026 Plan Data:')
    console.log('\n1. Use Aetna Enrollment Site (For specific ZIP/County):')
    console.log('   - Run: node scripts/extract-aetna-plans.mjs --zip=44035 --county=39093')
    console.log('   - Or visit: https://enrollmedicare.aetna.com/s/shop?ZipCode=44035&CountyFIPS=39093&PlanYear=2026')
    console.log('   - Open browser DevTools (F12) → Network tab')
    console.log('   - Filter by XHR/Fetch and reload page')
    console.log('   - Find the API call that returns plan data (usually JSON)')
    console.log('   - Copy the response and save as JSON file')
    console.log('   - Run: node scripts/extract-aetna-plans.mjs (it will auto-detect the JSON file)')
    console.log('\n2. CMS MA Landscape Source Files (Recommended for all plans):')
    console.log('   - Visit: https://www.cms.gov/medicare/prescription-drug-coverage/prescriptiondrugcovgenin')
    console.log('   - Look for "MA Landscape Source Files" for 2026')
    console.log('   - Download the ZIP file and extract the CSV')
    console.log('   - Place the CSV file in the project root directory')
    console.log('   - Common filenames: MA_Landscape_Source_Files_2026.csv')
    console.log('\n3. CMS Data.CMS.Gov:')
    console.log('   - Visit: https://data.cms.gov/')
    console.log('   - Search for "Medicare Advantage Landscape" 2026')
    console.log('   - Download as CSV or use the API')
    console.log('\n💡 Once you have the data file:')
    console.log('  - Place it in the project root directory')
    console.log('  - Run this script again: node scripts/extract-aetna-plans.mjs')
    console.log('  - The script will automatically detect and parse CSV/JSON files')
    console.log('  - Or manually create a JSON file following the template format')

    // Create a template JSON file
    const template = [
      {
        carrier: 'Aetna',
        plan_year: 2026,
        name: 'Example Plan Name',
        plan_type: 'HMO',
        cms_contract_number: 'H1234',
        cms_plan_number: '001',
        cms_geo_segment: '001',
        cms_id: 'H1234-001-001',
        counties: ['Example County'],
        metadata: {
          premium_monthly: 0,
          effective_start: '2026-01-01',
          effective_end: '2026-12-31',
          extraction_date: new Date().toISOString(),
          extraction_method: 'Manual entry',
        },
      },
    ]

    const templateFile = 'aetna-plans-template.json'
    await fs.writeFile(templateFile, JSON.stringify(template, null, 2))
    console.log(`\n📄 Created template file: ${templateFile}`)
    console.log('   You can use this as a starting point for manual data entry.')

    process.exit(0)
  }

  // Remove duplicates based on CMS ID
  const uniquePlans = []
  const seenIds = new Set()
  for (const plan of extractedPlans) {
    const id = plan.cms_id
    if (!seenIds.has(id)) {
      seenIds.add(id)
      uniquePlans.push(plan)
    }
  }

  // Sort plans
  function sortObjectKeys(obj) {
    if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) {
      return obj
    }

    const sorted = {}
    const priorityFields = ['carrier', 'plan_year', 'name', 'type_network', 'type_program']

    priorityFields.forEach((key) => {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        sorted[key] = sortObjectKeys(obj[key])
      }
    })

    Object.keys(obj)
      .filter((key) => !priorityFields.includes(key))
      .sort()
      .forEach((key) => {
        sorted[key] = sortObjectKeys(obj[key])
      })

    return sorted
  }

  const sortedPlans = uniquePlans.map((plan) => sortObjectKeys(plan))

  // Save to JSON file
  const outputFile = 'aetna-plans-extracted.json'
  await fs.writeFile(outputFile, JSON.stringify(sortedPlans, null, 2))

  console.log(`\n📊 Summary:`)
  console.log(`  - Successfully extracted: ${uniquePlans.length} unique plans`)
  console.log(`  - Output file: ${outputFile}`)

  // Display extracted plans summary
  console.log(`\n📋 Extracted Plans (first 10):`)
  uniquePlans.slice(0, 10).forEach((plan) => {
    console.log(`  - ${plan.name} (${plan.cms_id}) - ${plan.type_network} ${plan.type_program}`)
  })
  if (uniquePlans.length > 10) {
    console.log(`  ... and ${uniquePlans.length - 10} more`)
  }
}

// Run the extraction
main().catch(console.error)
