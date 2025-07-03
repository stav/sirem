#!/usr/bin/env node

import { promises as fs } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function runMigrations() {
  console.log('🔄 Running database migrations...\n')

  try {
    // Get all SQL files in the schema directory
    const schemaDir = path.join(__dirname)
    const files = await fs.readdir(schemaDir)

    // Filter for SQL files and sort by name (numerical order)
    const sqlFiles = files.filter((file) => file.endsWith('.sql') && !file.includes('README')).sort()

    console.log(`Found ${sqlFiles.length} migration files:`)
    sqlFiles.forEach((file) => console.log(`  - ${file}`))
    console.log('')

    // Display migration instructions
    console.log('📋 Migration Instructions:')
    console.log('1. Copy each SQL file content below')
    console.log('2. Paste into your Supabase SQL editor')
    console.log('3. Execute in order (01, 02, 03, etc.)')
    console.log('4. Verify each migration completes successfully\n')

    // Display each migration file content
    for (const file of sqlFiles) {
      console.log(`\n${'='.repeat(60)}`)
      console.log(`📄 ${file}`)
      console.log(`${'='.repeat(60)}`)

      const filePath = path.join(schemaDir, file)
      const content = await fs.readFile(filePath, 'utf8')
      console.log(content)

      console.log(`\n${'='.repeat(60)}`)
      console.log(`✅ End of ${file}`)
      console.log(`${'='.repeat(60)}\n`)
    }

    console.log('🎉 All migrations displayed successfully!')
    console.log('💡 Remember to run these in your Supabase SQL editor in order.')
  } catch (error) {
    console.error('❌ Error running migrations:', error)
    process.exit(1)
  }
}

// Run migrations
runMigrations()
