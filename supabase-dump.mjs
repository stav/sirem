import { createClient } from '@supabase/supabase-js';
import { promises as fs } from 'fs';
import path from 'path';

// Load environment variables from .env.local file (Next.js standard)
const envLocalPath = path.join(process.cwd(), '.env.local');
const envPath = path.join(process.cwd(), '.env');
let envVars = {};

try {
  const envContent = await fs.readFile(envLocalPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      envVars[key.trim()] = valueParts.join('=').trim();
    }
  });
  console.log('Loaded environment variables from .env.local');
} catch {
  try {
    const envContent = await fs.readFile(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        envVars[key.trim()] = valueParts.join('=').trim();
      }
    });
    console.log('Loaded environment variables from .env');
  } catch {
    console.log('No .env.local or .env file found, using process.env');
    envVars = process.env;
  }
}

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase credentials. Please check your .env file.');
  console.error('Required variables: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Define all tables to dump
const tables = [
  'tag_categories',
  'tags', 
  'lead_statuses',
  'contacts',
  'addresses',
  'phones',
  'emails',
  'contact_tags',
  'reminders',
  'activities'
];

async function dumpTable(tableName) {
  console.log(`Dumping table: ${tableName}`);
  
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*');
    
    if (error) {
      console.error(`Error dumping ${tableName}:`, error);
      return null;
    }
    
    console.log(`  - Found ${data.length} records`);
    return data;
  } catch (err) {
    console.error(`Exception dumping ${tableName}:`, err);
    return null;
  }
}

async function saveToFile(data, filename, outputDir) {
  // Create output directory if it doesn't exist
  try {
    await fs.mkdir(outputDir, { recursive: true });
  } catch (err) {
    if (err.code !== 'EEXIST') {
      throw err;
    }
  }
  
  const filepath = path.join(outputDir, filename);
  await fs.writeFile(filepath, JSON.stringify(data, null, 2));
  console.log(`  - Saved to: ${filepath}`);
}

async function createDumpSummary(allData, outputDir) {
  const summary = {
    dump_date: new Date().toISOString(),
    tables: {}
  };
  
  for (const [tableName, data] of Object.entries(allData)) {
    summary.tables[tableName] = {
      record_count: data ? data.length : 0,
      has_data: data && data.length > 0
    };
  }
  
  await saveToFile(summary, 'dump-summary.json', outputDir);
  console.log(`\nDump summary created: ${outputDir}/dump-summary.json`);
}

async function main() {
  console.log('Starting Supabase data dump...\n');
  
  // Create timestamped directory name
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const outputDir = `data/supabase-dump-${timestamp}`;
  
  console.log(`📁 Creating dump in: ${outputDir}\n`);
  
  const allData = {};
  
  // Dump each table
  for (const tableName of tables) {
    const data = await dumpTable(tableName);
    allData[tableName] = data;
    
    if (data) {
      await saveToFile(data, `${tableName}.json`, outputDir);
    }
    
    console.log(''); // Add spacing between tables
  }
  
  // Create summary
  await createDumpSummary(allData, outputDir);
  
  console.log('\n✅ Data dump completed!');
  console.log(`📁 Check the "${outputDir}" directory for your data files.`);
  console.log(`🕒 Dump timestamp: ${new Date().toISOString()}`);
}

// Run the dump
main().catch(console.error); 
