import React, { useState } from 'react';
import { ImageIcon, BarChart3, FileCode, FileText, Sparkles, ExternalLink, Table, Bot } from 'lucide-react';

interface UseCasesProps {
  onUseCaseSelect: (prompt: string) => void;
  router: any; // You might want to import the proper type from next/router
}

export const UseCases: React.FC<UseCasesProps> = ({ onUseCaseSelect, router }) => {
  const useCases = [
    {
      id: 'image',
      title: 'Image',
      prompt: 'Create a high-quality image of [describe the scene, object, or concept] in [style, e.g., minimalistic, realistic, 3D, cartoon] with [color theme or mood if needed]',
      icon: <ImageIcon className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
    },
    {
      id: 'analysis',
      title: 'Analysis',
      prompt: 'Analyze the following [data/text/report] and provide [insights, trends, or recommendations] in a structured format.',
      icon: <BarChart3 className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
    },
    {
      id: 'webpage',
      title: 'Webpage',
      prompt: 'Generate a responsive webpage for [business/product/event] using modern design principles. Include [sections, e.g., hero banner, about, contact form, testimonials] and ensure it\'s optimized for both desktop and mobile.',
      icon: <FileCode className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
    },
    {
      id: 'summarize-document',
      title: 'Summarize Document',
      prompt: 'Summarize the following [document/text/article/PDF] into [key points, bullet points, or an executive summary], highlighting the most important details.',
      icon: <FileText className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
    },
    {
      id: 'spreadsheet',
      title: 'Spreadsheet',
      prompt: 'Create a spreadsheet for [purpose, e.g., budget, inventory, schedule] with the following columns: [list columns]. Include [specific requirements, e.g., formulas, formatting, data validation].',
      icon: <Table className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
    },
    {
      id: 'my-agents',
      title: 'Agents',
      prompt: '',
      icon: <Bot className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />,
      isNavigation: true,
      navigateTo: '/agents?tab=my-agents'
    },
  ];

  // Split use cases into two rows of 3 items each
  const firstRow = useCases.slice(0, 3);
  const secondRow = useCases.slice(3);

  const renderUseCaseRow = (rowItems: typeof useCases) => (
    <div className="flex justify-center gap-2 w-full">
      {rowItems.map((useCase) => (
        <button
          key={useCase.id}
          onClick={() => {
            if (useCase.isNavigation) {
              router.push(useCase.navigateTo);
            } else {
              onUseCaseSelect(useCase.prompt);
            }
          }}
          className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-full border border-border hover:bg-muted/50 transition-colors focus:outline-none focus:ring-2 focus:ring-ring/50 focus:ring-offset-2"
        >
          {useCase.icon}
          {useCase.title}
        </button>
      ))}
    </div>
  );

  return (
    <div className="flex flex-col items-center gap-2 mt-6 w-full">
      {renderUseCaseRow(firstRow)}
      {secondRow.length > 0 && renderUseCaseRow(secondRow)}
    </div>
  );
};
