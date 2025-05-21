#!/usr/bin/env node
/**
 * Database Migration Runner for Couples Therapy App
 * 
 * This script follows industry standards for database migrations:
 * - Migrations are versioned and tracked in version control
 * - Each migration is idempotent (can be run multiple times safely)
 * - Migrations are tracked in a schema_migrations table
 * - Migrations are applied in sequential order
 */

require('dotenv').config({ path: '.env.local' });
const fs = require('fs').promises;
const path = require('path');
const { Client } = require('pg');

// Database connection configuration
const connectionString = "postgresql://postgres:Shridharlifeschool@2018@db.oobnwldoptmqqbdjiljk.supabase.co:5432/postgres";

// Create a client with individual connection parameters to handle special characters in password correctly
const config = {
  user: 'postgres',
  password: 'Shridharlifeschool@2018',
  host: 'db.oobnwldoptmqqbdjiljk.supabase.co',
  port: 5432,
  database: 'postgres',
  ssl: { rejectUnauthorized: false }
};

// Paths
const MIGRATIONS_DIR = path.join(__dirname, '../db/migrations');

/**
 * Get all migration files ordered by name
 */
async function getMigrationFiles() {
  try {
    const files = await fs.readdir(MIGRATIONS_DIR);
    return files
      .filter(file => file.endsWith('.sql'))
      .sort((a, b) => {
        // Extract numeric prefix for proper ordering
        const aNum = parseInt(a.split('_')[0]);
        const bNum = parseInt(b.split('_')[0]);
        return aNum - bNum;
      });
  } catch (err) {
    console.error('Error reading migrations directory:', err);
    return [];
  }
}

/**
 * Get applied migrations from the schema_migrations table
 */
async function getAppliedMigrations(client) {
  try {
    // Check if schema_migrations table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM pg_tables
        WHERE schemaname = 'public'
        AND tablename = 'schema_migrations'
      );
    `);
    
    const tableExists = tableCheck.rows[0].exists;
    
    if (!tableExists) {
      return [];
    }
    
    // Get list of applied migrations
    const result = await client.query('SELECT name FROM public.schema_migrations ORDER BY id ASC');
    return result.rows.map(row => row.name);
  } catch (err) {
    // If the table doesn't exist, it means no migrations have been applied
    console.log('Migration tracking table does not exist yet. Will be created by the first migration.');
    return [];
  }
}

/**
 * Execute a single migration file
 */
async function executeMigration(client, filename) {
  const migrationPath = path.join(MIGRATIONS_DIR, filename);
  
  try {
    console.log(`Applying migration: ${filename}`);
    
    // Read the migration file content
    const sql = await fs.readFile(migrationPath, 'utf8');
    
    // Start transaction
    await client.query('BEGIN');
    
    // Execute the migration
    await client.query(sql);
    
    // Commit the transaction
    await client.query('COMMIT');
    
    console.log(`✓ Migration ${filename} applied successfully`);
    return true;
  } catch (err) {
    // Rollback on error
    await client.query('ROLLBACK');
    console.error(`× Error applying migration ${filename}:`, err.message);
    throw err;
  }
}

/**
 * Run pending migrations
 */
async function runMigrations() {
  const client = new Client(config);
  
  try {
    console.log('Connecting to database...');
    await client.connect();
    console.log('Connected to database.');
    
    // Get all migration files
    const migrationFiles = await getMigrationFiles();
    console.log(`Found ${migrationFiles.length} migration files.`);
    
    // Get applied migrations
    const appliedMigrations = await getAppliedMigrations(client);
    console.log(`${appliedMigrations.length} migrations already applied.`);
    
    // Find pending migrations
    const pendingMigrations = migrationFiles.filter(file => {
      const migrationName = file.replace('.sql', '');
      return !appliedMigrations.includes(migrationName);
    });
    
    if (pendingMigrations.length === 0) {
      console.log('✓ Database is up to date. No migrations to apply.');
      return;
    }
    
    console.log(`Found ${pendingMigrations.length} pending migrations to apply.`);
    
    // Apply pending migrations in order
    for (const file of pendingMigrations) {
      await executeMigration(client, file);
    }
    
    console.log('\n✓ All migrations completed successfully!');
    
  } catch (err) {
    console.error('\n× Migration process failed:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Execute migrations
console.log('===== Couples Therapy App Database Migration Runner =====');
runMigrations().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
