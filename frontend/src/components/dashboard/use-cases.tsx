import React from 'react';
import { ImageIcon, BarChart3, FileCode, FileText, Sparkles } from 'lucide-react';

interface UseCasesProps {
  onUseCaseSelect: (prompt: string) => void;
}

export const UseCases: React.FC<UseCasesProps> = ({ onUseCaseSelect }) => {
  const useCases = [
    {
      id: 'create-image',
      title: 'Create Image',
      prompt: 'Create a high-quality image of [describe the scene, object, or concept] in [style, e.g., minimalistic, realistic, 3D, cartoon] with [color theme or mood if needed]',
      icon: <ImageIcon className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
    },
    {
      id: 'create-analysis',
      title: 'Create Analysis',
      prompt: 'Analyze the following [data/text/report] and provide [insights, trends, or recommendations] in a structured format.',
      icon: <BarChart3 className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
    },
    {
      id: 'create-webpage',
      title: 'Create Webpage',
      prompt: 'Generate a responsive webpage for [business/product/event] using modern design principles. Include [sections, e.g., hero banner, about, contact form, testimonials] and ensure it\'s optimized for both desktop and mobile.',
      icon: <FileCode className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
    },
    {
      id: 'summarize-document',
      title: 'Summarize Document',
      prompt: 'Summarize the following [document/text/article/PDF] into [key points, bullet points, or an executive summary], highlighting the most important details.',
      icon: <FileText className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
    }
  ];

  return (
    <div className="flex flex-wrap items-center justify-center gap-2 mt-6">
      {useCases.map((useCase) => (
        <button
          key={useCase.id}
          onClick={() => onUseCaseSelect(useCase.prompt)}
          className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-full border border-border hover:bg-muted/50 transition-colors focus:outline-none focus:ring-2 focus:ring-ring/50 focus:ring-offset-2"
        >
          {useCase.icon}
          {useCase.title}
        </button>
      ))}
    </div>
  );
};
