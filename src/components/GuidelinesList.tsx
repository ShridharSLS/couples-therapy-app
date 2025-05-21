import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

interface Guideline {
  id: string;
  title: string;
  content: string;
  display_order?: number;
}

// Define the structure of the Supabase response
interface StepGuidelineResponse {
  guideline_id: string;
  display_order: number;
  guidelines: {
    id: string;
    title: string;
    content: string;
  } | Array<{
    id: string;
    title: string;
    content: string;
  }>;
}

interface GuidelinesListProps {
  stepId: string;
  className?: string;
}

const GuidelinesList: React.FC<GuidelinesListProps> = ({ stepId, className = '' }) => {
  const [guidelines, setGuidelines] = useState<Guideline[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGuidelines = async () => {
      try {
        setLoading(true);
        setError(null);

        // Query to get guidelines associated with this step
        const { data, error } = await supabase
          .from('step_guidelines')
          .select(`
            guideline_id,
            display_order,
            guidelines:guideline_id (
              id,
              title,
              content
            )
          `)
          .eq('step_id', stepId)
          .order('display_order', { ascending: true });

        if (error) {
          throw new Error(error.message);
        }

        // Transform the data to get a clean guidelines array
        const formattedGuidelines = data.map(item => {
          // Handle case where guidelines is an array (take first item) or an object
          const guideline = Array.isArray(item.guidelines) ? item.guidelines[0] : item.guidelines;
          
          return {
            id: guideline.id,
            title: guideline.title,
            content: guideline.content,
            display_order: item.display_order
          };
        });

        setGuidelines(formattedGuidelines);
      } catch (err: any) {
        console.error('Error fetching guidelines:', err);
        setError('Failed to load guidelines');
      } finally {
        setLoading(false);
      }
    };

    if (stepId) {
      fetchGuidelines();
    }
  }, [stepId]);

  if (loading) {
    return <div className="text-gray-500">Loading guidelines...</div>;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  if (guidelines.length === 0) {
    return <div className="text-gray-500">No guidelines available for this step.</div>;
  }

  return (
    <div className={`guidelines-list ${className}`}>
      <h3 className="text-lg font-medium mb-3">Step Guidelines</h3>
      <div className="space-y-4">
        {guidelines.map((guideline) => (
          <div key={guideline.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <h4 className="font-medium text-primary-600 mb-1">{guideline.title}</h4>
            <p className="text-gray-700">{guideline.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GuidelinesList;
