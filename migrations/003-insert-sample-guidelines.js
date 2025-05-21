/**
 * Migration: 003-insert-sample-guidelines
 * Description: Inserts sample guidelines data
 */
module.exports = {
  name: '003-insert-sample-guidelines',
  
  async up(supabase) {
    try {
      console.log('Inserting sample guidelines data...');
      
      // Insert sample guideline data
      const guidelinesData = [
        { title: 'Soothing', content: 'test1' },
        { title: 'Observation', content: 'test2' },
        { title: 'Feelings', content: 'test3' }
      ];
      
      const { data: inserted, error } = await supabase
        .from('guidelines')
        .upsert(guidelinesData, { onConflict: 'title' })
        .select();
        
      if (error) {
        throw new Error(`Failed to insert guidelines: ${error.message}`);
      }
      
      console.log(`Inserted ${inserted.length} guidelines.`);
      return true;
    } catch (err) {
      console.error('Migration failed:', err.message);
      throw err;
    }
  },
  
  async down(supabase) {
    try {
      const { error } = await supabase
        .from('guidelines')
        .delete()
        .in('title', ['Soothing', 'Observation', 'Feelings']);
        
      if (error) {
        throw new Error(`Failed to remove guidelines: ${error.message}`);
      }
      
      return true;
    } catch (err) {
      console.error('Down migration failed:', err.message);
      throw err;
    }
  }
};
