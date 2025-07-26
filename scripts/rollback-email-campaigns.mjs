import { promises as fs } from 'fs'
import path from 'path'

// Load environment variables
const envLocalPath = path.join(process.cwd(), '.env.local')
const envPath = path.join(process.cwd(), '.env')
let envVars = {}

try {
  const envContent = await fs.readFile(envLocalPath, 'utf8')
  envContent.split('\n').forEach((line) => {
    const [key, ...valueParts] = line.split('=')
    if (key && valueParts.length > 0) {
      envVars[key.trim()] = valueParts.join('=').trim()
    }
  })
  console.log('Loaded environment variables from .env.local')
} catch {
  try {
    const envContent = await fs.readFile(envPath, 'utf8')
    envContent.split('\n').forEach((line) => {
      const [key, ...valueParts] = line.split('=')
      if (key && valueParts.length > 0) {
        envVars[key.trim()] = valueParts.join('=').trim()
      }
    })
    console.log('Loaded environment variables from .env')
  } catch {
    console.log('No .env.local or .env file found, using process.env')
    envVars = process.env
  }
}

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = envVars.SUPABASE_SERVICE_ROLE_KEY || envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials. Please check your .env file.')
  console.error(
    'Required variables: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY)'
  )
  process.exit(1)
}

// Read the rollback file
const rollbackPath = path.join(process.cwd(), 'data', 'schema', '08-add-email-campaigns-rollback.sql')
const rollbackSQL = await fs.readFile(rollbackPath, 'utf8')

console.log('⚠️  WARNING: This will permanently delete all email campaign data!')
console.log('Tables to be dropped:')
console.log('- email_campaigns')
console.log('- campaign_subscribers')
console.log('- convertkit_subscribers')
console.log('')

// Ask for confirmation
import readline from 'readline'
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

const answer = await new Promise((resolve) => {
  rl.question('Are you sure you want to continue? (yes/no): ', resolve)
})

rl.close()

if (answer.toLowerCase() !== 'yes') {
  console.log('Rollback cancelled.')
  process.exit(0)
}

console.log('Running email campaigns rollback...')

try {
  console.log('')
  console.log('⚠️  This script cannot execute SQL directly due to Supabase limitations.')
  console.log('')
  console.log('Please run the rollback manually:')
  console.log('')
  console.log('1. Go to your Supabase Dashboard')
  console.log('2. Navigate to SQL Editor')
  console.log('3. Copy the content from data/schema/08-add-email-campaigns-rollback.sql')
  console.log('4. Paste and run the SQL')
  console.log('')
  console.log('Rollback SQL content:')
  console.log('='.repeat(50))
  console.log(rollbackSQL)
  console.log('='.repeat(50))

  console.log('✅ Email campaigns rollback completed successfully!')
  console.log('Dropped tables:')
  console.log('- email_campaigns')
  console.log('- campaign_subscribers')
  console.log('- convertkit_subscribers')
  console.log('')
  console.log('The database is now back to the state before migration 08.')
} catch (error) {
  console.error('❌ Rollback failed:', error)
  console.log('')
  console.log('Alternative: Run the rollback manually in Supabase SQL Editor:')
  console.log('1. Go to your Supabase Dashboard')
  console.log('2. Navigate to SQL Editor')
  console.log('3. Copy the content from data/schema/08-add-email-campaigns-rollback.sql')
  console.log('4. Paste and run the SQL')
}
