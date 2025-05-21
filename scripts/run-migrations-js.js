#!/usr/bin/env node
/**
 * JavaScript-based Migration Runner for Couples Therapy App
 * 
 * This script runs migrations using JavaScript handlers instead of SQL files.
 */

require('dotenv').config({ path: '.env.local' });
const fs = require('fs').promises;
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Supabase client setup
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('ERROR: Missing Supabase environment variables.');
  console.error('Make sure you have NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY defined in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Paths
const MIGRATIONS_DIR = path.join(__dirname, '../migrations');
const META_DIR = path.join(MIGRATIONS_DIR, 'meta');

// Migrations in order - these should be JS handlers in the meta directory
const migrations = [
  {
    version: '1_create_schema_migrations',
    description: 'Creates a table to track applied migrations'
  },
  {
    version: '2_create_guidelines_tables',
    description: 'Creates guidelines and step_guidelines tables'
  },
  {
    version: '3_insert_guideline_data',
    description: 'Inserts initial guideline data and links them to exercise steps'
  }
];

/**
 * Get the list of migrations that have already been applied
 */
async function getAppliedMigrations() {
  try {
    // Try to query the schema_migrations table
    const { data, error } = await supabase
      .from('schema_migrations')
      .select('version')
      .order('id', { ascending: true });
      
    // If we get an error, the table probably doesn't exist yet
    if (error) {
      return [];
    }
    
    return data.map(row => row.version);
  } catch (err) {
    console.error('Error getting applied migrations:', err);
    return [];
  }
}

/**
 * Execute a JavaScript migration handler
 */
async function executeJsHandler(version) {
  try {
    const handlerPath = path.join(META_DIR, `${version}.js`);
    
    // Check if handler exists
    try {
      await fs.access(handlerPath);
    } catch (err) {
      console.error(`No JS handler found for migration ${version}.`);
      return false;
    }
    
    // Load and execute the handler
    const handler = require(handlerPath);
    
    if (typeof handler !== 'function') {
      throw new Error(`Handler for ${version} is not a function`);
    }
    
    await handler(supabase);
    console.log(`✓ Executed migration: ${version}`);
    return true;
  } catch (err) {
    console.error(`× Failed to execute migration ${version}:`, err.message);
    throw err;
  }
}

/**
 * Run migrations that haven't been applied yet
 */
async function runMigrations() {
  try {
    console.log('Checking for applied migrations...');
    
    const appliedMigrations = await getAppliedMigrations();
    console.log(`${appliedMigrations.length} migrations already applied.`);
    
    // Find migrations that need to be applied
    const pendingMigrations = migrations.filter(
      migration => !appliedMigrations.includes(migration.version)
    );
    
    if (pendingMigrations.length === 0) {
      console.log('✓ Database is up to date. No migrations to run.');
      return;
    }
    
    console.log(`Found ${pendingMigrations.length} pending migrations to apply.`);
    
    // Apply each pending migration in order
    for (const migration of pendingMigrations) {
      console.log(`\nApplying migration: ${migration.version} - ${migration.description}`);
      
      // Execute JS handler
      await executeJsHandler(migration.version);
      
      console.log(`✓ Migration ${migration.version} completed successfully.`);
    }
    
    console.log('\n✓ All migrations completed successfully.');
  } catch (err) {
    console.error('\n× Migration failed:', err.message);
    process.exit(1);
  }
}

// Execute migrations
console.log('===== Couples Therapy App Database Migration Runner =====');
runMigrations().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
