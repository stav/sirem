import { createClient } from '@supabase/supabase-js'
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

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Read the migration file
const migrationPath = path.join(process.cwd(), 'data', 'schema', '08-add-email-campaigns.sql')
const migrationSQL = await fs.readFile(migrationPath, 'utf8')

console.log('Running email campaigns migration...')

try {
  // Check if tables already exist
  const { data: existingTables, error: checkError } = await supabase
    .from('information_schema.tables')
    .select('table_name')
    .eq('table_schema', 'public')
    .in('table_name', ['email_campaigns', 'campaign_subscribers', 'convertkit_subscribers'])

  if (checkError) {
    console.log('Could not check existing tables, proceeding with migration...')
  } else if (existingTables && existingTables.length > 0) {
    console.log('⚠️  Some email campaign tables already exist:')
    existingTables.forEach((table) => console.log(`- ${table.table_name}`))
    console.log('')
    console.log('If you want to recreate them, please run the rollback first:')
    console.log('npm run rollback-campaigns')
    console.log('')
    console.log('Or run the migration manually in Supabase SQL Editor.')
    process.exit(1)
  }

  console.log('')
  console.log('⚠️  This script cannot execute SQL directly due to Supabase limitations.')
  console.log('')
  console.log('Please run the migration manually:')
  console.log('')
  console.log('1. Go to your Supabase Dashboard')
  console.log('2. Navigate to SQL Editor')
  console.log('3. Copy the content from data/schema/08-add-email-campaigns.sql')
  console.log('4. Paste and run the SQL')
  console.log('')
  console.log('Or use the Supabase CLI if you have it installed:')
  console.log('supabase db push --include-all')
  console.log('')
  console.log('Migration SQL content:')
  console.log('='.repeat(50))
  console.log(migrationSQL)
  console.log('='.repeat(50))
} catch (error) {
  console.error('❌ Migration check failed:', error)
  console.log('')
  console.log('Please run the migration manually in Supabase SQL Editor:')
  console.log('1. Go to your Supabase Dashboard')
  console.log('2. Navigate to SQL Editor')
  console.log('3. Copy the content from data/schema/08-add-email-campaigns.sql')
  console.log('4. Paste and run the SQL')
}
