#!/usr/bin/env node

import { execSync, spawn } from 'child_process'
import { writeFileSync } from 'fs'
import { join } from 'path'

// Get the project root directory
const projectRoot = process.cwd()
const outputFile = join(projectRoot, 'data/schema/current-schema.sql')

console.log('Dumping schema using local PostgreSQL tools...')

async function dumpSchema() {
  try {
    // Get connection details from the dry-run (this works even with Docker issues)
    console.log('Getting connection details from Supabase dry-run...')

    const dryRunOutput = execSync('npx supabase db dump --linked --dry-run', {
      encoding: 'utf8',
      cwd: projectRoot,
    })

    // Extract connection details from the dry-run output
    const hostMatch = dryRunOutput.match(/export PGHOST="([^"]+)"/)
    const portMatch = dryRunOutput.match(/export PGPORT="([^"]+)"/)
    const userMatch = dryRunOutput.match(/export PGUSER="([^"]+)"/)
    const passwordMatch = dryRunOutput.match(/export PGPASSWORD="([^"]+)"/)
    const databaseMatch = dryRunOutput.match(/export PGDATABASE="([^"]+)"/)

    if (!hostMatch || !portMatch || !userMatch || !passwordMatch || !databaseMatch) {
      throw new Error('Could not extract connection details from dry-run output')
    }

    const connectionDetails = {
      host: hostMatch[1],
      port: portMatch[1],
      user: userMatch[1],
      password: passwordMatch[1],
      database: databaseMatch[1],
    }

    console.log(`Connecting to ${connectionDetails.host}:${connectionDetails.port}/${connectionDetails.database}`)

    // Set up environment variables for pg_dump
    const env = {
      ...process.env,
      PGHOST: connectionDetails.host,
      PGPORT: connectionDetails.port,
      PGUSER: connectionDetails.user,
      PGPASSWORD: connectionDetails.password,
      PGDATABASE: connectionDetails.database,
    }

    // Build the pg_dump command with all the same flags and filters as Supabase CLI
    const excludeSchemas =
      'information_schema|pg_*|_analytics|_realtime|_supavisor|auth|extensions|pgbouncer|realtime|storage|supabase_functions|supabase_migrations|cron|dbdev|graphql|graphql_public|net|pgmq|pgsodium|pgsodium_masks|pgtle|repack|tiger|tiger_data|timescaledb_*|_timescaledb_*|topology|vault'

    // Run pg_dump and apply the same sed transformations as Supabase CLI
    const sedTransforms = [
      's/^\\(un\\)?restrict .*$/-- &/',
      's/^CREATE SCHEMA "/CREATE SCHEMA IF NOT EXISTS "/',
      's/^CREATE TABLE "/CREATE TABLE IF NOT EXISTS "/',
      's/^CREATE SEQUENCE "/CREATE SEQUENCE IF NOT EXISTS "/',
      's/^CREATE VIEW "/CREATE OR REPLACE VIEW "/',
      's/^CREATE FUNCTION "/CREATE OR REPLACE FUNCTION "/',
      's/^CREATE TRIGGER "/CREATE OR REPLACE TRIGGER "/',
      's/^CREATE PUBLICATION "supabase_realtime/-- &/',
      's/^CREATE EVENT TRIGGER /-- &/',
      's/^         WHEN TAG IN /-- &/',
      's/^   EXECUTE FUNCTION /-- &/',
      's/^ALTER EVENT TRIGGER /-- &/',
      's/^ALTER PUBLICATION "supabase_realtime_/-- &/',
      's/^ALTER FOREIGN DATA WRAPPER (.+) OWNER TO /-- &/',
      's/^ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin"/-- &/',
      's/^GRANT (.+) ON (.+) "(information_schema|pg_*|_analytics|_realtime|_supavisor|auth|extensions|pgbouncer|realtime|storage|supabase_functions|supabase_migrations|cron|dbdev|graphql|graphql_public|net|pgmq|pgsodium|pgsodium_masks|pgtle|repack|tiger|tiger_data|timescaledb_*|_timescaledb_*|topology|vault)"/-- &/',
      's/^REVOKE (.+) ON (.+) "(information_schema|pg_*|_analytics|_realtime|_supavisor|auth|extensions|pgbouncer|realtime|storage|supabase_functions|supabase_migrations|cron|dbdev|graphql|graphql_public|net|pgmq|pgsodium|pgsodium_masks|pgtle|repack|tiger|tiger_data|timescaledb_*|_timescaledb_*|topology|vault)"/-- &/',
      's/^(CREATE EXTENSION IF NOT EXISTS "pg_tle").+/\\1;/',
      's/^(CREATE EXTENSION IF NOT EXISTS "pgsodium").+/\\1;/',
      's/^COMMENT ON EXTENSION (.+)/-- &/',
      's/^CREATE POLICY "cron_job_/-- &/',
      's/^ALTER TABLE "cron"/-- &/',
      's/^SET transaction_timeout = 0;/-- &/',
      '/^--/d',
    ]

    console.log('Running pg_dump with local PostgreSQL tools...')

    // Create the pg_dump process
    const pgDump = spawn(
      'pg_dump',
      ['--schema-only', '--quote-all-identifier', '--role', 'postgres', '--exclude-schema', excludeSchemas],
      { env }
    )

    // Create the sed process
    const sed = spawn('sed', ['-E', sedTransforms.join(';')])

    // Pipe pg_dump output to sed
    pgDump.stdout.pipe(sed.stdin)

    // Collect the final output
    let output = ''
    sed.stdout.on('data', (data) => {
      output += data.toString()
    })

    // Handle errors
    pgDump.stderr.on('data', (data) => {
      console.error('pg_dump error:', data.toString())
    })

    sed.stderr.on('data', (data) => {
      console.error('sed error:', data.toString())
    })

    // Wait for completion
    await new Promise((resolve, reject) => {
      sed.on('close', (code) => {
        if (code === 0) {
          resolve()
        } else {
          reject(new Error(`sed process exited with code ${code}`))
        }
      })
    })

    // Add the final cleanup command
    const finalOutput = output + '\nRESET ALL;\n'

    // Write to file
    writeFileSync(outputFile, finalOutput)

    console.log(`✅ Schema dumped successfully to ${outputFile}`)
  } catch (error) {
    console.error('❌ Error dumping schema:', error.message)
    process.exit(1)
  }
}

// Run the async function
dumpSchema()
