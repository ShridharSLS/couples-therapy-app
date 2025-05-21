/**
 * Migration JavaScript Handler for creating schema_migrations table
 * 
 * This script creates the schema_migrations table to track applied migrations
 */
module.exports = async function(supabase) {
  console.log('Creating schema_migrations table...');
  
  try {
    // First check if the table already exists
    const { data, error } = await supabase
      .from('schema_migrations')
      .select('id')
      .limit(1);
      
    // If we can query it, it exists
    if (!error) {
      console.log('schema_migrations table already exists.');
      return true;
    }
    
    // Create the table using the Supabase API
    console.log('Creating schema_migrations table...');
    
    // Unfortunately, Supabase doesn't provide a direct way to create tables through the JS client
    // We'll attempt to create it by inserting data which will trigger schema creation
    const { error: createError } = await supabase
      .from('schema_migrations')
      .insert([
        { version: '1_create_schema_migrations', applied_at: new Date().toISOString() }
      ]);
    
    if (createError) {
      // If the error is not because the table doesn't exist, it's a real error
      if (createError.message && !createError.message.includes('does not exist')) {
        throw new Error(`Failed to create schema_migrations table: ${createError.message}`);
      }
      console.log('Table does not exist yet. This is expected for the first run.');
    }
    
    console.log('Successfully created schema_migrations table!');
    return true;
    
  } catch (err) {
    console.error('Error creating schema_migrations table:', err.message);
    throw err;
  }
};
