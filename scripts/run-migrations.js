#!/usr/bin/env node
/**
 * Migration Runner for Couples Therapy App
 * 
 * This script runs SQL migrations in order and executes any associated
 * JavaScript handlers for complex migrations.
 */

require('dotenv').config({ path: '.env.local' });
const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');
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

/**
 * Get the list of all migrations ordered by version
 */
async function getAllMigrations() {
  try {
    const migrationInfoPath = path.join(META_DIR, 'migration-info.json');
    const data = await fs.readFile(migrationInfoPath, 'utf8');
    const { migrations } = JSON.parse(data);
    
    return migrations.sort((a, b) => {
      // Extract numeric part from version for proper ordering
      const aNum = parseInt(a.version.split('_')[0]);
      const bNum = parseInt(b.version.split('_')[0]);
      return aNum - bNum;
    });
  } catch (err) {
    console.error('Error loading migration metadata:', err);
    return [];
  }
}

/**
 * Get the list of migrations that have already been applied
 */
async function getAppliedMigrations() {
  try {
    // First check if the schema_migrations table exists
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'schema_migrations');
      
    if (tablesError) {
      console.error('Error checking for schema_migrations table:', tablesError.message);
      return [];
    }
    
    // If the table doesn't exist yet, no migrations have been applied
    if (!tables || tables.length === 0) {
      return [];
    }
    
    // Get the list of applied migrations
    const { data, error } = await supabase
      .from('schema_migrations')
      .select('version')
      .order('id', { ascending: true });
      
    if (error) {
      console.error('Error fetching applied migrations:', error.message);
      return [];
    }
    
    return data.map(row => row.version);
  } catch (err) {
    console.error('Error getting applied migrations:', err);
    return [];
  }
}

/**
 * Execute a SQL migration file
 */
async function executeSqlMigration(version) {
  try {
    const migrationPath = path.join(MIGRATIONS_DIR, `${version}.sql`);
    const sql = await fs.readFile(migrationPath, 'utf8');
    
    // Execute the SQL using Axios
    try {
      const response = await axios({
        method: 'POST',
        url: `${supabaseUrl}/rest/v1/`,
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Prefer': 'resolution=merge-duplicates'
        },
        data: {
          query: sql
        }
      });
      
      // Axios automatically throws for error status codes
    } catch (axiosErr) {
      const errorData = axiosErr.response ? axiosErr.response.data : axiosErr.message;
      throw new Error(`SQL execution failed: ${JSON.stringify(errorData)}`);
    }
    
    console.log(`✓ Executed SQL migration: ${version}`);
    return true;
  } catch (err) {
    console.error(`× Failed to execute SQL migration ${version}:`, err.message);
    throw err;
  }
}

/**
 * Execute a JavaScript post-migration handler
 */
async function executeJsHandler(version) {
  try {
    const handlerPath = path.join(META_DIR, `${version}.js`);
    
    // Check if handler exists
    try {
      await fs.access(handlerPath);
    } catch (err) {
      console.log(`No JS handler found for migration ${version}, skipping.`);
      return true;
    }
    
    // Load and execute the handler
    const handler = require(handlerPath);
    
    if (typeof handler !== 'function') {
      throw new Error(`Handler for ${version} is not a function`);
    }
    
    await handler(supabase);
    console.log(`✓ Executed JS handler for migration: ${version}`);
    return true;
  } catch (err) {
    console.error(`× Failed to execute JS handler for migration ${version}:`, err.message);
    throw err;
  }
}

/**
 * Run migrations that haven't been applied yet
 */
async function runMigrations() {
  try {
    console.log('Fetching migration data...');
    const allMigrations = await getAllMigrations();
    
    if (allMigrations.length === 0) {
      console.log('No migrations found.');
      return;
    }
    
    console.log(`Found ${allMigrations.length} total migrations.`);
    
    const appliedMigrations = await getAppliedMigrations();
    console.log(`${appliedMigrations.length} migrations already applied.`);
    
    // Find migrations that need to be applied
    const pendingMigrations = allMigrations.filter(
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
      
      // Execute SQL file
      await executeSqlMigration(migration.version);
      
      // Execute JS handler if required
      if (migration.requires_js) {
        await executeJsHandler(migration.version);
      }
      
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
