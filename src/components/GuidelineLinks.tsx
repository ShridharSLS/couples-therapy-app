import React from 'react';

export interface Guideline {
  id: string;
  title: string;
  content: string;
}

interface GuidelineLinksProps {
  guidelines: Guideline[];
  onGuidelineClick: (guideline: Guideline) => void;
}

const GuidelineLinks: React.FC<GuidelineLinksProps> = ({
  guidelines,
  onGuidelineClick,
}) => {
  if (!guidelines || guidelines.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {guidelines.map((guideline) => (
        <button
          key={guideline.id}
          onClick={() => onGuidelineClick(guideline)}
          className="px-3 py-1 text-sm bg-primary-100 text-primary-800 hover:bg-primary-200 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          {guideline.title}
        </button>
      ))}
    </div>
  );
};

export default GuidelineLinks;
