import React, { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

// Sample guideline data to insert
const sampleGuidelines = [
  { title: 'Feelings', content: 'Feelings.html', order_index: 0 },
  { title: 'Observation', content: 'Observation.html', order_index: 1 },
  { title: 'Soothing', content: 'Soothing.html', order_index: 2 },
  { title: 'Needs', content: 'Needs.html', order_index: 3 },
  { title: 'Silent Treatment', content: 'SilentTreatment.html', order_index: 4 },
];

const tableSchemas = [
  {
    name: 'guidelines',
    sql: `
      CREATE TABLE IF NOT EXISTS guidelines (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title TEXT NOT NULL UNIQUE,
        content TEXT,
        order_index INTEGER,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `,
  },
  {
    name: 'step_guidelines',
    sql: `
      CREATE TABLE IF NOT EXISTS step_guidelines (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        step_id UUID REFERENCES exercise_steps(id) ON DELETE CASCADE,
        guideline_id UUID REFERENCES guidelines(id) ON DELETE CASCADE,
        display_order INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE (step_id, guideline_id)
      );
    `,
  },
];

const SetupTablesPage: React.FC = () => {
  const [logs, setLogs] = useState<string[]>([]);
  const [isWorking, setIsWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const addLog = (message: string) => {
    setLogs(prevLogs => [...prevLogs, message]);
    console.log(message); // Also log to console for easier debugging during dev
  };

  const setupTables = async () => {
    setIsWorking(true);
    setError(null);
    setSuccess(null);
    setLogs([]); // Clear previous logs

    addLog('Starting database setup...');

    try {
      // Create tables
      addLog('Creating tables if they do not exist...');
      for (const table of tableSchemas) {
        addLog(`Processing schema for ${table.name}...`);
        const { error: tableError } = await supabase.rpc('execute_sql', { sql_query: table.sql });

        if (tableError) {
          addLog(`Error creating table ${table.name} via SQL: ${tableError.message}`);
          // Check if the error is because the table already exists, which might be okay depending on policy
          if (!tableError.message.includes('already exists')) {
            throw new Error(`Failed to create table ${table.name}: ${tableError.message}`);
          }
          addLog(`Table ${table.name} likely already exists, continuing...`);
        } else {
          addLog(`Created ${table.name} table successfully via SQL (or it already existed).`);
        }
      }
      
      // Insert sample data
      addLog('Inserting sample guidelines data...');
      const { data: guidelinesInserted, error: guidelineError } = await supabase
        .from('guidelines')
        .upsert(sampleGuidelines, { onConflict: 'title' })
        .select();
        
      if (guidelineError) {
        addLog(`Error inserting guidelines: ${guidelineError.message}`);
        throw new Error(`Failed to insert guidelines: ${guidelineError.message}`);
      }
      
      addLog(`Inserted/Upserted ${guidelinesInserted?.length || 0} guidelines.`);
      
      // Link guidelines to exercise steps
      addLog('Fetching exercise steps...');
      const { data: steps, error: stepsError } = await supabase
        .from('exercise_steps')
        .select('id, order_index')
        .order('order_index', { ascending: true });
        
      if (stepsError) {
        addLog(`Error fetching exercise steps: ${stepsError.message}`);
        throw new Error(`Failed to fetch exercise steps: ${stepsError.message}`);
      }
      
      if (!steps || steps.length === 0) {
        addLog('No exercise steps found in the database. Cannot link guidelines.');
        // Depending on requirements, this might not be a fatal error if guidelines can exist unlinked.
        // For now, we'll let it proceed but not attempt to link.
      } else {
        addLog(`Found ${steps.length} exercise steps.`);
      
        // Get first steps (or as many as we have)
        const step1 = steps[0];
        const step2 = steps.length > 1 ? steps[1] : null;
        const step4 = steps.length > 3 ? steps[3] : null; // Corresponds to order_index 3 if 0-indexed
        
        addLog('Fetching inserted guidelines to get their IDs...');
        const { data: guidelines, error: fetchGuidelineIdsError } = await supabase
          .from('guidelines')
          .select('id, title');
          
        if (fetchGuidelineIdsError) {
          addLog(`Error fetching guideline IDs: ${fetchGuidelineIdsError.message}`);
          throw new Error(`Failed to fetch guideline IDs: ${fetchGuidelineIdsError.message}`);
        }

        if (!guidelines || guidelines.length === 0) {
            addLog('No guidelines found after insertion. Cannot link.');
        } else {
            const soothingGuideline = guidelines.find(g => g.title === 'Soothing');
            const observationGuideline = guidelines.find(g => g.title === 'Observation');
            const feelingsGuideline = guidelines.find(g => g.title === 'Feelings');
            
            if (!soothingGuideline || !observationGuideline || !feelingsGuideline) {
              addLog('Could not find all required sample guideline pages by title after insertion.');
              // This might not be fatal if some are missing, but linking will be incomplete.
            } else {
              addLog('Creating step-guideline associations...');
              const stepGuidelinesToInsert = [];
              
              if (step1 && soothingGuideline) {
                stepGuidelinesToInsert.push({
                  step_id: step1.id,
                  guideline_id: soothingGuideline.id,
                  display_order: 0
                });
              }
              
              if (step2 && observationGuideline) {
                stepGuidelinesToInsert.push({
                  step_id: step2.id,
                  guideline_id: observationGuideline.id,
                  display_order: 0
                });
              }
              
              if (step4 && feelingsGuideline) { // step4 is steps[3]
                stepGuidelinesToInsert.push({
                  step_id: step4.id,
                  guideline_id: feelingsGuideline.id,
                  display_order: 0
                });
              }
              
              if (stepGuidelinesToInsert.length > 0) {
                const { data: relationshipsInserted, error: relationshipsError } = await supabase
                  .from('step_guidelines')
                  .upsert(stepGuidelinesToInsert, { onConflict: 'step_id,guideline_id' }) // Corrected onConflict
                  .select();
                  
                if (relationshipsError) {
                  addLog(`Error creating associations: ${relationshipsError.message}`);
                  throw new Error(`Failed to create associations: ${relationshipsError.message}`);
                }
                addLog(`Created/Upserted ${relationshipsInserted?.length || 0} step-guideline associations.`);
              } else {
                addLog('No step-guideline associations to create (either steps or guidelines missing).');
              }
            }
        }
      }
      setSuccess('Database setup completed successfully!');
      
    } catch (err: any) {
      setError(err.message || 'An unknown error occurred');
      addLog(`ERROR: ${err.message}`);
    } finally {
      setIsWorking(false);
      addLog('Setup process completed.');
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Database Setup</h1>
      
      <div className="mb-6">
        <p className="mb-4">
          This page will create the necessary tables for the guideline pages feature:
        </p>
        <ul className="list-disc pl-6 mb-4">
          <li><code>guidelines</code> - Stores the guideline content</li>
          <li><code>step_guidelines</code> - Links guidelines to exercise steps</li>
        </ul>
        <p>It will also insert sample guideline data and link them to the first, second, and fourth exercise steps (if available).</p>
      </div>
      
      <div className="mb-6">
        <button
          onClick={setupTables}
          disabled={isWorking}
          className={`px-4 py-2 rounded font-medium ${
            isWorking
              ? 'bg-neutral-400 cursor-not-allowed'
              : 'bg-primary-600 hover:bg-primary-700 text-white'
          }`}
        >
          {isWorking ? 'Setting up...' : 'Setup Database Tables'}
        </button>
      </div>
      
      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-300 text-red-800 rounded">
          <strong>Error:</strong> {error}
        </div>
      )}
      
      {success && (
        <div className="mb-6 p-4 bg-green-100 border border-green-300 text-green-800 rounded">
          <strong>Success:</strong> {success}
        </div>
      )}
      
      <div className="border rounded-md">
        <div className="bg-neutral-100 p-3 border-b font-medium">Setup Logs</div>
        <div className="p-4 bg-neutral-50 max-h-96 overflow-y-auto font-mono text-sm">
          {logs.length === 0 ? (
            <div className="text-neutral-500">No logs yet. Click the setup button to begin.</div>
          ) : (
            logs.map((log, index) => (
              <div key={index} className="mb-1">
                {log}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default SetupTablesPage;
