#!/usr/bin/env node

import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'

console.log('🔍 Analyzing bundle size...')

try {
  // Run bundle analyzer
  execSync('npm run analyze', { stdio: 'inherit' })

  // Check if bundle analyzer output exists
  const analyzerPath = path.join(process.cwd(), '.next/analyze')
  if (fs.existsSync(analyzerPath)) {
    console.log('✅ Bundle analysis complete!')
    console.log('📊 Check the generated HTML files in .next/analyze/')
  }
} catch (error) {
  console.error('❌ Bundle analysis failed:', error.message)
  process.exit(1)
}
