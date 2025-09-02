import React, { useState } from 'react';

interface UseCase {
  id: string;
  title: string;
  description: string;
  prompt: string;
}

interface Category {
  id: string;
  name: string;
  useCases: UseCase[];
}

const categoriesData: Category[] = [
  {
    id: 'legal',
    name: 'Legal',
    useCases: [
      {
        id: 'legal-1',
        title: 'Draft an NDA',
        description: 'Create a non-disclosure agreement',
        prompt: 'Draft a comprehensive NDA between [Party A] and [Party B] that includes [specific terms, duration, jurisdiction]. Include standard confidentiality clauses and any industry-specific requirements.',
      },
      {
        id: 'legal-2',
        title: 'Employment Contract',
        description: 'Create an employment agreement',
        prompt: 'Draft an employment contract for a [position] at [company name] with the following details: [salary, benefits, job responsibilities, non-compete terms, and termination conditions].'
      },
      {
        id: 'legal-3',
        title: 'Privacy Policy',
        description: 'Generate a privacy policy',
        prompt: 'Create a GDPR-compliant privacy policy for [company name] that covers [types of data collected, how it\'s used, stored, and shared], and includes user rights and contact information for data protection inquiries.'
      }
    ],
  },
  {
    id: 'finance',
    name: 'Finance',
    useCases: [
      {
        id: 'finance-1',
        title: 'Financial Report Analysis',
        description: 'Analyze quarterly financials',
        prompt: 'Analyze the attached financial statements for [company name] Q[1-4] [year]. Highlight key financial ratios, trends, and any red flags. Compare with industry benchmarks and provide recommendations for improvement.'
      },
      {
        id: 'finance-2',
        title: 'Investment Portfolio Review',
        description: 'Analyze and optimize investments',
        prompt: 'Review the following investment portfolio: [list assets and allocations]. Analyze performance, risk exposure, and diversification. Suggest rebalancing strategies considering [risk tolerance] and [investment goals].',
      },
      {
        id: 'finance-3',
        title: 'Startup Valuation',
        description: 'Estimate company worth',
        prompt: 'Estimate the valuation of [startup name] using [DCF/Comparables/VC method]. Consider [revenue, growth rate, market size, competitors]. Provide a valuation range and key assumptions.'
      },
    ],
  },
  {
    id: 'healthcare',
    name: 'Healthcare',
    useCases: [
      {
        id: 'healthcare-1',
        title: 'Clinical Trial Protocol',
        description: 'Design a research study',
        prompt: 'Create a clinical trial protocol for [drug/treatment name] targeting [condition]. Include study objectives, inclusion/exclusion criteria, treatment arms, endpoints, and statistical analysis plan.',
      },
      {
        id: 'healthcare-2',
        title: 'Patient Education Materials',
        description: 'Create healthcare content',
        prompt: 'Develop a patient education brochure about [condition/treatment] at an 8th-grade reading level. Include symptoms, treatment options, self-care tips, and when to seek medical attention.'
      },
      {
        id: 'healthcare-3',
        title: 'Medical Billing Codes',
        description: 'Find appropriate CPT/ICD codes',
        prompt: 'What are the appropriate CPT and ICD-10 codes for a patient visit involving [procedure] with [diagnosis]? Include any necessary modifiers and documentation requirements.'
      }
    ],
  },
  {
    id: 'telecom',
    name: 'Telecom',
    useCases: [
      {
        id: 'telecom-1',
        title: '5G Network Planning',
        description: 'Design 5G infrastructure',
        prompt: 'Create a 5G network deployment plan for [city/region] considering population density, existing infrastructure, and spectrum availability. Include site locations, backhaul requirements, and estimated costs.',
      },
      {
        id: 'telecom-2',
        title: 'VoIP Implementation',
        description: 'Plan business phone system',
        prompt: 'Outline a VoIP implementation plan for a [company size] business with [number] of locations. Include hardware/software requirements, network considerations, migration strategy, and training needs.'
      },
      {
        id: 'telecom-3',
        title: 'IoT Connectivity Solution',
        description: 'Design IoT network',
        prompt: 'Recommend the best connectivity solution (LPWAN, cellular, satellite, etc.) for an IoT deployment with [number] of devices across [geographic area]. Consider data volume, power constraints, and cost.'
      }
    ],
  },
  {
    id: 'hr',
    name: 'HR',
    useCases: [
      {
        id: 'hr-1',
        title: 'Remote Work Policy',
        description: 'Create hybrid work guidelines',
        prompt: 'Draft a comprehensive remote work policy for [company name] that covers work hours, availability expectations, equipment provisions, data security protocols, and performance evaluation criteria for remote employees.',
      },
      {
        id: 'hr-2',
        title: 'DEI Training Program',
        description: 'Develop diversity training',
        prompt: 'Design a 6-month DEI (Diversity, Equity, and Inclusion) training program for [company size] company. Include workshop topics, success metrics, and strategies for creating an inclusive workplace culture.'
      },
      {
        id: 'hr-3',
        title: 'Compensation Benchmarking',
        description: 'Analyze salary data',
        prompt: 'Conduct a compensation analysis for [job titles] in [location/industry]. Compare with market rates and provide recommendations for salary bands, bonuses, and benefits to remain competitive.'
      }
    ],
  },
];

interface UseCaseCategoriesProps {
  onUseCaseSelect: (prompt: string) => void;
}

export function UseCaseCategories({ onUseCaseSelect }: UseCaseCategoriesProps) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  return (
    <div className="space-y-4 p-4">
      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Categories</h3>
      <div className="flex flex-wrap gap-2">
        {categoriesData.map((category) => (
          <button
            key={category.id}
            onClick={() => setActiveCategory(activeCategory === category.id ? null : category.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              activeCategory === category.id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
            }`}
          >
            {category.name}
          </button>
        ))}
      </div>

      {activeCategory && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {categoriesData.find(c => c.id === activeCategory)?.name} Use Cases
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {categoriesData
              .find(category => category.id === activeCategory)
              ?.useCases.map((useCase) => (
                <button
                  key={useCase.id}
                  onClick={() => onUseCaseSelect(useCase.prompt)}
                  className="p-3 text-left rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <h5 className="font-medium text-gray-900 dark:text-white">{useCase.title}</h5>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{useCase.description}</p>
                </button>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
