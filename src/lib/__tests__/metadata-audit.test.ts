import { readdirSync, readFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import { describe, expect, it } from 'vitest'

const projectRoot = process.cwd()
const srcRoot = join(projectRoot, 'src')

const allowList = new Set([
  'src/lib/plan-field-resolution.ts',
  'src/lib/plan-metadata-utils.ts',
])

function collectSourceFiles(dir: string): string[] {
  const entries = readdirSync(dir, { withFileTypes: true })
  const files: string[] = []

  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue

    const fullPath = join(dir, entry.name)

    if (entry.isDirectory()) {
      if (entry.name === '__tests__' || entry.name === 'node_modules') continue
      files.push(...collectSourceFiles(fullPath))
    } else if (entry.isFile()) {
      if (/\.(ts|tsx|mts|cts)$/.test(entry.name)) {
        files.push(fullPath)
      }
    }
  }

  return files
}

describe('plan metadata access audit', () => {
  it('keeps direct plan.metadata reads centralized in resolver utilities', () => {
    const files = collectSourceFiles(srcRoot)
    const violations: string[] = []

    for (const file of files) {
      const content = readFileSync(file, 'utf8')
      if (!content.includes('plan.metadata')) continue

      const relativePath = relative(projectRoot, file).replace(/\\/g, '/')
      if (!allowList.has(relativePath)) {
        violations.push(relativePath)
      }
    }

    expect(violations).toEqual([])
  })
})

