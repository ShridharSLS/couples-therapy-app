import React, { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

// Sample guideline data to insert
const sampleGuidelines = [
  { title: 'Soothing', content: 'Techniques for calming yourself during difficult moments.' },
  { title: 'Observation', content: 'How to observe your partner without judgment.' },
  { title: 'Feelings', content: 'Understanding and communicating your emotions effectively.' }
];

const SetupTablesFresh: React.FC = () => {
  const [logs, setLogs] = useState<string[]>([]);
  const [isWorking, setIsWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const addLog = (message: string) => {
    setLogs(prevLogs => [...prevLogs, `[${new Date().toISOString()}] ${message}`]);
  };

  const createGuidelinesTable = async () => {
    addLog('Creating guidelines table...');
    try {
      // Insert a sample record to create the table via schema inference
      const { error: createError } = await supabase
        .from('guidelines')
        .insert([
          { title: 'Setup Guideline', content: 'Initial guideline to create the table' }
        ]);
      
      if (createError) {
        const errorMsg = createError.message || JSON.stringify(createError);
        // If the error is about a duplicate key, the table likely exists
        if (errorMsg.includes('duplicate key')) {
          addLog('Guidelines table appears to already exist.');
          return true;
        } else {
          addLog(`Error details: ${errorMsg}`);
          return false;
        }
      } else {
        addLog('Guidelines table created successfully.');
        return true;
      }
    } catch (err: any) {
      const errMsg = err.message || 'Unknown error';
      addLog(`Exception creating guidelines table: ${errMsg}`);
      return false;
    }
  };

  const insertSampleGuidelines = async () => {
    addLog('Inserting sample guidelines data...');
    try {
      // Upsert sample guidelines
      const { error: insertError } = await supabase
        .from('guidelines')
        .upsert(sampleGuidelines, { onConflict: 'title' });
        
      if (insertError) {
        const errorMsg = insertError.message || JSON.stringify(insertError);
        addLog(`Error inserting guidelines: ${errorMsg}`);
        return false;
      } else {
        addLog('Sample guidelines inserted successfully.');
        return true;
      }
    } catch (err: any) {
      const errMsg = err.message || 'Unknown error';
      addLog(`Error inserting guidelines: ${errMsg}`);
      return false;
    }
  };

  const createStepGuidelinesTable = async () => {
    addLog('Setting up step_guidelines associations...');
    try {
      // First, find exercise steps
      const { data: steps, error: stepsError } = await supabase
        .from('exercise_steps')
        .select('id, order_index')
        .limit(1);
        
      if (stepsError || !steps || steps.length === 0) {
        const errorMsg = stepsError ? (stepsError.message || JSON.stringify(stepsError)) : 'No steps found';
        addLog(`Could not find exercise steps: ${errorMsg}`);
        return false;
      }
      
      // Get guidelines
      const { data: guidelines, error: guidelinesError } = await supabase
        .from('guidelines')
        .select('id, title')
        .limit(1);
        
      if (guidelinesError || !guidelines || guidelines.length === 0) {
        const errorMsg = guidelinesError ? (guidelinesError.message || JSON.stringify(guidelinesError)) : 'No guidelines found';
        addLog(`Could not find guidelines: ${errorMsg}`);
        return false;
      }
      
      // Create step_guidelines table
      const { error: createError } = await supabase
        .from('step_guidelines')
        .insert([
          {
            step_id: steps[0].id,
            guideline_id: guidelines[0].id,
            display_order: 0
          }
        ]);
        
      if (createError) {
        const errorMsg = createError.message || JSON.stringify(createError);
        // If it's a foreign key error or the table exists, note it
        if (errorMsg.includes('duplicate key') || errorMsg.includes('already exists')) {
          addLog('Step-guidelines table appears to already exist.');
          return true;
        } else {
          addLog(`Error creating step_guidelines table: ${errorMsg}`);
          return false;
        }
      } else {
        addLog('Step-guidelines table created successfully.');
        return true;
      }
    } catch (err: any) {
      const errMsg = err.message || 'Unknown error';
      addLog(`Error creating step_guidelines table: ${errMsg}`);
      return false;
    }
  };

  const linkGuidelinesToSteps = async () => {
    addLog('Linking guidelines to steps...');
    try {
      // Get guidelines
      const { data: guidelines, error: guidelinesError } = await supabase
        .from('guidelines')
        .select('id, title');
        
      if (guidelinesError || !guidelines || guidelines.length === 0) {
        const errorMsg = guidelinesError ? (guidelinesError.message || JSON.stringify(guidelinesError)) : 'No guidelines found';
        addLog(`Could not find guidelines: ${errorMsg}`);
        return false;
      }
      
      // Get steps
      const { data: steps, error: stepsError } = await supabase
        .from('exercise_steps')
        .select('id, order_index')
        .order('order_index', { ascending: true });
        
      if (stepsError || !steps || steps.length === 0) {
        const errorMsg = stepsError ? (stepsError.message || JSON.stringify(stepsError)) : 'No steps found';
        addLog(`Could not find exercise steps: ${errorMsg}`);
        return false;
      }
      
      // Find specific guidelines
      const soothingGuideline = guidelines.find(g => g.title === 'Soothing');
      const observationGuideline = guidelines.find(g => g.title === 'Observation');
      const feelingsGuideline = guidelines.find(g => g.title === 'Feelings');
      
      if (!soothingGuideline || !observationGuideline || !feelingsGuideline) {
        addLog('Could not find all required guidelines.');
        return false;
      }
      
      // Find specific steps
      const step1 = steps[0];
      const step2 = steps.length > 1 ? steps[1] : null;
      const step4 = steps.length > 3 ? steps[3] : null;
      
      if (!step1) {
        addLog('Could not find exercise steps.');
        return false;
      }
      
      // Prepare link data
      const linkData = [];
      
      // Link soothing to step 1
      linkData.push({
        step_id: step1.id,
        guideline_id: soothingGuideline.id,
        display_order: 0
      });
      
      // Link observation to step 2 if available
      if (step2) {
        linkData.push({
          step_id: step2.id,
          guideline_id: observationGuideline.id,
          display_order: 0
        });
      }
      
      // Link feelings to step 4 if available
      if (step4) {
        linkData.push({
          step_id: step4.id,
          guideline_id: feelingsGuideline.id,
          display_order: 0
        });
      }
      
      // Insert links
      const { error: linkError } = await supabase
        .from('step_guidelines')
        .upsert(linkData, { onConflict: 'step_id,guideline_id' });
        
      if (linkError) {
        const errorMsg = linkError.message || JSON.stringify(linkError);
        addLog(`Error linking guidelines to steps: ${errorMsg}`);
        return false;
      } else {
        addLog(`Successfully linked ${linkData.length} guidelines to steps.`);
        return true;
      }
    } catch (err: any) {
      const errMsg = err.message || 'Unknown error';
      addLog(`Error linking guidelines to steps: ${errMsg}`);
      return false;
    }
  };

  const setupTables = async () => {
    setIsWorking(true);
    setError(null);
    setSuccess(null);
    setLogs([]);
    
    addLog('Starting database setup...');
    
    try {
      // Step 1: Create guidelines table
      const guidelinesCreated = await createGuidelinesTable();
      
      // Step 2: Insert sample guidelines
      if (guidelinesCreated) {
        await insertSampleGuidelines();
      }
      
      // Step 3: Create step_guidelines table
      const stepGuidelinesCreated = await createStepGuidelinesTable();
      
      // Step 4: Link guidelines to steps
      if (stepGuidelinesCreated) {
        await linkGuidelinesToSteps();
      }
      
      addLog('Database setup process completed.');
      setSuccess('Database setup completed successfully!');
    } catch (err: any) {
      const errMsg = err.message || 'Unknown error';
      setError(errMsg);
      addLog(`ERROR: ${errMsg}`);
    } finally {
      setIsWorking(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Database Setup (Free Tier Optimized)</h1>
      
      <div className="mb-6">
        <p className="mb-4">
          This page will create the necessary tables for the guideline pages feature:
        </p>
        <ul className="list-disc pl-6 mb-4">
          <li><code>guidelines</code> - Stores the guideline content</li>
          <li><code>step_guidelines</code> - Links guidelines to exercise steps</li>
        </ul>
        <p>It will also insert sample guideline data and link them to the first, second, and fourth exercise steps.</p>
        
        <div className="p-4 mt-4 bg-yellow-50 border border-yellow-200 rounded">
          <h3 className="font-medium text-yellow-800">Supabase Free Tier Notes</h3>
          <p className="mt-2 text-yellow-700">
            This page is optimized for the 250 KB message size limit on the Supabase free tier. It uses table inference 
            rather than raw SQL execution. You may need to set up Row Level Security (RLS) policies manually through 
            the Supabase dashboard after tables are created.
          </p>
        </div>
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

export default SetupTablesFresh;
