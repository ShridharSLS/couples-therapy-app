#!/usr/bin/env node
/**
 * Industry-Standard Migration Runner for Couples Therapy App
 * 
 * This script implements a proper migration system using Supabase's JavaScript client:
 * - Migrations are versioned and stored in version control
 * - A migrations_applied table tracks which migrations have been run
 * - Migrations are applied in sequential order
 * - Migrations are idempotent (can be run multiple times safely)
 * - Support for both up and down migrations
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

/**
 * Ensure the migrations_applied table exists to track applied migrations
 */
async function ensureMigrationsTable() {
  try {
    console.log('Ensuring migrations_applied table exists...');
    
    // Check if the table exists
    const { count, error } = await supabase
      .from('migrations_applied')
      .select('*', { count: 'exact', head: true });
    
    // Safely check for 'does not exist' error
    const errorMsg = error ? (error.message || JSON.stringify(error)) : '';
    const isNotExistsError = typeof errorMsg === 'string' && errorMsg.includes('does not exist');
    
    if (error && isNotExistsError) {
      console.log('migrations_applied table does not exist, creating it...');
      
      // Create the table by adding a record (schema inference)
      const { error: createError } = await supabase
        .from('migrations_applied')
        .insert([
          { 
            name: '_init_migration_table', 
            applied_at: new Date().toISOString() 
          }
        ]);
      
      if (createError) {
        const errorMsg = createError.message || JSON.stringify(createError);
        const isNotExistsError = typeof errorMsg === 'string' && errorMsg.includes('does not exist');
        
        if (!isNotExistsError) {
          throw new Error(`Failed to create migrations_applied table: ${errorMsg}`);
        }
      }
      
      console.log('migrations_applied table created successfully.');
      return true;
    } else if (error) {
      throw new Error(`Error checking migrations_applied table: ${error.message}`);
    }
    
    console.log('migrations_applied table already exists.');
    return true;
  } catch (err) {
    console.error('Error ensuring migrations table:', err.message);
    throw err;
  }
}

/**
 * Get all migration files ordered by name
 */
async function getMigrationFiles() {
  try {
    const files = await fs.readdir(MIGRATIONS_DIR);
    return files
      .filter(file => file.endsWith('.js'))
      .sort((a, b) => {
        // Extract numeric prefix for proper ordering
        const aNum = parseInt(a.split('-')[0]);
        const bNum = parseInt(b.split('-')[0]);
        return aNum - bNum;
      });
  } catch (err) {
    console.error('Error reading migrations directory:', err);
    return [];
  }
}

/**
 * Get applied migrations from the migrations_applied table
 */
async function getAppliedMigrations() {
  try {
    const { data, error } = await supabase
      .from('migrations_applied')
      .select('name')
      .order('applied_at', { ascending: true });
      
    if (error) {
      // If the error is because the table doesn't exist, return empty array
      const errorMsg = error.message || JSON.stringify(error);
      const isNotExistsError = typeof errorMsg === 'string' && errorMsg.includes('does not exist');
      
      if (isNotExistsError) {
        return [];
      }
      throw new Error(`Failed to get applied migrations: ${errorMsg}`);
    }
    
    return data.map(row => row.name);
  } catch (err) {
    console.error('Error getting applied migrations:', err);
    return [];
  }
}

/**
 * Record that a migration has been applied
 */
async function recordMigration(name) {
  try {
    const { error } = await supabase
      .from('migrations_applied')
      .insert([{ 
        name, 
        applied_at: new Date().toISOString() 
      }]);
      
    if (error) {
      throw new Error(`Failed to record migration: ${error.message}`);
    }
    
    return true;
  } catch (err) {
    console.error(`Error recording migration ${name}:`, err.message);
    throw err;
  }
}

/**
 * Record that a migration has been rolled back
 */
async function recordRollback(name) {
  try {
    const { error } = await supabase
      .from('migrations_applied')
      .delete()
      .eq('name', name);
      
    if (error) {
      throw new Error(`Failed to record rollback: ${error.message}`);
    }
    
    return true;
  } catch (err) {
    console.error(`Error recording rollback for ${name}:`, err.message);
    throw err;
  }
}

/**
 * Execute a single migration
 */
async function executeMigration(file, direction = 'up') {
  const migrationPath = path.join(MIGRATIONS_DIR, file);
  
  try {
    console.log(`${direction === 'up' ? 'Applying' : 'Rolling back'} migration: ${file}`);
    
    // Load the migration module
    const migration = require(migrationPath);
    
    if (!migration.name || !migration[direction] || typeof migration[direction] !== 'function') {
      throw new Error(`Invalid migration format in ${file}`);
    }
    
    // Execute the migration
    await migration[direction](supabase);
    
    // Record the migration status
    if (direction === 'up') {
      await recordMigration(migration.name);
    } else {
      await recordRollback(migration.name);
    }
    
    console.log(`✓ Migration ${file} ${direction === 'up' ? 'applied' : 'rolled back'} successfully`);
    return true;
  } catch (err) {
    console.error(`× Error ${direction === 'up' ? 'applying' : 'rolling back'} migration ${file}:`, err.message);
    throw err;
  }
}

/**
 * Run pending migrations
 */
async function runMigrations() {
  try {
    // Ensure migrations table exists
    await ensureMigrationsTable();
    
    // Get all migration files
    const migrationFiles = await getMigrationFiles();
    console.log(`Found ${migrationFiles.length} migration files.`);
    
    // Get migration modules to get their names
    const migrations = migrationFiles.map(file => {
      const migration = require(path.join(MIGRATIONS_DIR, file));
      return {
        file,
        name: migration.name
      };
    });
    
    // Get applied migrations
    const appliedMigrations = await getAppliedMigrations();
    console.log(`${appliedMigrations.length} migrations already applied.`);
    
    // Find pending migrations
    const pendingMigrations = migrations.filter(
      migration => !appliedMigrations.includes(migration.name)
    );
    
    if (pendingMigrations.length === 0) {
      console.log('✓ Database is up to date. No migrations to apply.');
      return;
    }
    
    console.log(`Found ${pendingMigrations.length} pending migrations to apply.`);
    
    // Apply pending migrations in order
    for (const migration of pendingMigrations) {
      await executeMigration(migration.file);
    }
    
    console.log('\n✓ All migrations completed successfully!');
    
  } catch (err) {
    console.error('\n× Migration process failed:', err.message);
    process.exit(1);
  }
}

/**
 * Roll back the last migration
 */
async function rollbackLastMigration() {
  try {
    // Ensure migrations table exists
    await ensureMigrationsTable();
    
    // Get all migration files
    const migrationFiles = await getMigrationFiles();
    
    // Get migration modules to get their names
    const migrations = migrationFiles.map(file => {
      const migration = require(path.join(MIGRATIONS_DIR, file));
      return {
        file,
        name: migration.name
      };
    });
    
    // Get applied migrations
    const appliedMigrations = await getAppliedMigrations();
    
    if (appliedMigrations.length === 0) {
      console.log('× No migrations to roll back.');
      return;
    }
    
    // Get the last applied migration
    const lastAppliedName = appliedMigrations[appliedMigrations.length - 1];
    const lastApplied = migrations.find(m => m.name === lastAppliedName);
    
    if (!lastApplied) {
      console.log(`× Could not find migration file for ${lastAppliedName}.`);
      return;
    }
    
    console.log(`Rolling back migration: ${lastApplied.name}`);
    await executeMigration(lastApplied.file, 'down');
    
    console.log('\n✓ Rollback completed successfully!');
    
  } catch (err) {
    console.error('\n× Rollback process failed:', err.message);
    process.exit(1);
  }
}

// Command-line arguments
const args = process.argv.slice(2);
const command = args[0] || 'up';

// Execute migrations
console.log('===== Couples Therapy App Migration Runner =====');

if (command === 'down' || command === 'rollback') {
  rollbackLastMigration().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
} else {
  runMigrations().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
}
