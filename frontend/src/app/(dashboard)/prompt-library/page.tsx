'use client';

import React, { useState } from 'react';
import { Copy, CheckCircle, Star, Clock, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PromptCard } from '@/components/prompt/prompt-card';

interface GeneratedPrompt {
  id: number;
  content: string;
  industry: string;
  description: string;
}

type TabType = 'recent' | 'favorites';

export default function PromptLibraryPage() {
  const [activeTab, setActiveTab] = useState<TabType>('recent');
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [previewPrompt, setPreviewPrompt] = useState<GeneratedPrompt | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  // Load favorites from localStorage on initial render
  const [favoriteIds, setFavoriteIds] = useState<Set<number>>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('favoritePromptIds');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    }
    return new Set();
  });

  // Save favorites to localStorage whenever they change
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('favoritePromptIds', JSON.stringify(Array.from(favoriteIds)));
    }
  }, [favoriteIds]);
  const [recentlyUsed, setRecentlyUsed] = useState<GeneratedPrompt[]>([]);
  const [explorePrompts, setExplorePrompts] = useState<GeneratedPrompt[]>([]);

  // Hardcoded B2B prompts for Explore section (50 prompts across 5 industries)
  const allPrompts: GeneratedPrompt[] = [
    // HR Prompts (10)
    {
      id: 1,
      industry: 'HR',
      description: 'Job Description Generator',
      content: 'Create a comprehensive job description for a [Job Title] role in the [Industry] sector. Include key responsibilities, required qualifications, and preferred skills. Focus on [specific requirements].'
    },
    {
      id: 2,
      industry: 'HR',
      description: 'Performance Review Template',
      content: 'Create a structured performance review form for [Job Role] including sections for goal achievement, core competencies, and development plans.'
    },
    {
      id: 3,
      industry: 'HR',
      description: 'Employee Onboarding Checklist',
      content: 'Develop a 30-60-90 day onboarding checklist for new [Department] hires, covering HR paperwork, training sessions, and key introductions.'
    },
    {
      id: 4,
      industry: 'HR',
      description: 'Exit Interview Questionnaire',
      content: 'Create an exit interview form to gather feedback from departing employees about their experience, reasons for leaving, and suggestions for improvement.'
    },
    {
      id: 5,
      industry: 'HR',
      description: 'Remote Work Policy',
      content: 'Draft a comprehensive remote work policy covering work hours, availability expectations, communication protocols, and equipment requirements.'
    },
    {
      id: 6,
      industry: 'HR',
      description: 'Diversity & Inclusion Survey',
      content: 'Design an employee survey to assess workplace diversity, inclusion, and belonging. Include both quantitative and qualitative questions.'
    },
    {
      id: 7,
      industry: 'HR',
      description: 'Training Needs Assessment',
      content: 'Create a template to identify skill gaps and training needs across different departments, including current competencies and desired skill levels.'
    },
    {
      id: 8,
      industry: 'HR',
      description: 'Employee Engagement Survey',
      content: 'Develop a comprehensive employee engagement survey covering job satisfaction, work environment, management effectiveness, and company culture.'
    },
    {
      id: 9,
      industry: 'HR',
      description: 'Compensation Review Template',
      content: 'Create a structured format for conducting annual compensation reviews, including market data analysis, performance metrics, and adjustment recommendations.'
    },
    {
      id: 10,
      industry: 'HR',
      description: 'Workplace Safety Protocol',
      content: 'Develop a workplace safety protocol document for [Type of Workplace], including emergency procedures, first aid, and hazard reporting.'
    },

    // Healthcare Prompts (10)
    {
      id: 11,
      industry: 'Healthcare',
      description: 'Patient Intake Form',
      content: 'Draft a professional patient intake form for a [Type of Practice] clinic. Include personal information, medical history, and insurance details with HIPAA compliance.'
    },
    {
      id: 12,
      industry: 'Healthcare',
      description: 'Medical Billing Template',
      content: 'Design a medical billing template for [Type of Practice] including patient details, insurance information, CPT codes, and payment terms.'
    },
    {
      id: 13,
      industry: 'Healthcare',
      description: 'Patient Discharge Instructions',
      content: 'Create a template for post-procedure discharge instructions including medication guidelines, activity restrictions, and warning signs to watch for.'
    },
    {
      id: 14,
      industry: 'Healthcare',
      description: 'HIPAA Compliance Checklist',
      content: 'Develop a comprehensive HIPAA compliance checklist covering administrative, physical, and technical safeguards for healthcare providers.'
    },
    {
      id: 15,
      industry: 'Healthcare',
      description: 'Telehealth Consent Form',
      content: 'Draft an informed consent form for telehealth services, including technology requirements, privacy considerations, and limitations of virtual care.'
    },
    {
      id: 16,
      industry: 'Healthcare',
      description: 'Medication Administration Record',
      content: 'Create a template for tracking medication administration including drug name, dosage, time, and staff initials.'
    },
    {
      id: 17,
      industry: 'Healthcare',
      description: 'Infection Control Protocol',
      content: 'Develop a comprehensive infection control policy for [Type of Healthcare Facility] including hand hygiene, PPE usage, and disinfection procedures.'
    },
    {
      id: 18,
      industry: 'Healthcare',
      description: 'Clinical Trial Consent Form',
      content: 'Create a participant information and consent form for a clinical trial, including study purpose, procedures, risks, and benefits.'
    },
    {
      id: 19,
      industry: 'Healthcare',
      description: 'Medical Equipment Maintenance Log',
      content: 'Design a log for tracking medical equipment maintenance, including service dates, issues found, and next service due date.'
    },
    {
      id: 20,
      industry: 'Healthcare',
      description: 'Patient Satisfaction Survey',
      content: 'Develop a patient satisfaction survey covering wait times, staff interactions, and overall care experience.'
    },

    // Finance Prompts (10)
    {
      id: 21,
      industry: 'Finance',
      description: 'Investment Proposal',
      content: 'Create a template for an investment proposal for [Type of Investment] targeting [Target Investors]. Include executive summary, market analysis, and financial projections.'
    },
    {
      id: 22,
      industry: 'Finance',
      description: 'Quarterly Financial Report',
      content: 'Create a template for a quarterly financial report including income statement, balance sheet, cash flow statement, and key performance indicators.'
    },
    {
      id: 23,
      industry: 'Finance',
      description: 'Business Loan Application',
      content: 'Develop a comprehensive business loan application template including company overview, loan purpose, financial history, and repayment plan.'
    },
    {
      id: 24,
      industry: 'Finance',
      description: 'Budget Forecast Template',
      content: 'Create a 12-month budget forecast template with monthly breakdowns for revenue, expenses, and cash flow projections.'
    },
    {
      id: 25,
      industry: 'Finance',
      description: 'Expense Report Form',
      content: 'Design an employee expense report form with sections for date, description, category, amount, and approval fields.'
    },
    {
      id: 26,
      industry: 'Finance',
      description: 'Financial Risk Assessment',
      content: 'Create a template for assessing financial risks including market risk, credit risk, and operational risk factors.'
    },
    {
      id: 27,
      industry: 'Finance',
      description: 'Invoice Template',
      content: 'Design a professional invoice template with company branding, itemized services, payment terms, and tax calculations.'
    },
    {
      id: 28,
      industry: 'Finance',
      description: 'Investment Portfolio Review',
      content: 'Create a template for quarterly investment portfolio reviews including performance metrics, asset allocation, and rebalancing recommendations.'
    },
    {
      id: 29,
      industry: 'Finance',
      description: 'Financial Policy Document',
      content: 'Develop a comprehensive financial policy document covering authorization limits, expense approvals, and financial controls.'
    },
    {
      id: 30,
      industry: 'Finance',
      description: 'Break-Even Analysis',
      content: 'Create a template for calculating break-even points including fixed costs, variable costs, and contribution margin analysis.'
    },

    // Legal Prompts (10)
    {
      id: 31,
      industry: 'Legal',
      description: 'NDA Template',
      content: 'Generate a non-disclosure agreement between [Party A] and [Party B] for the purpose of [Purpose]. Include confidentiality clauses and return of information provisions.'
    },
    {
      id: 32,
      industry: 'Legal',
      description: 'Employment Contract',
      content: 'Draft a comprehensive employment contract including position details, compensation, benefits, intellectual property rights, and termination clauses.'
    },
    {
      id: 33,
      industry: 'Legal',
      description: 'Privacy Policy Generator',
      content: 'Create a privacy policy template for a [Type of Business] website, covering data collection, usage, and protection practices.'
    },
    {
      id: 34,
      industry: 'Legal',
      description: 'Terms of Service',
      content: 'Draft a terms of service agreement for [Type of Service] including user responsibilities, limitations of liability, and dispute resolution.'
    },
    {
      id: 35,
      industry: 'Legal',
      description: 'Cease and Desist Letter',
      content: 'Create a template for a cease and desist letter regarding [Issue], including specific violations and requested actions.'
    },
    {
      id: 36,
      industry: 'Legal',
      description: 'Intake Form for New Clients',
      content: 'Design a comprehensive client intake form for [Type of Legal Practice] including case details, opposing parties, and relevant deadlines.'
    },
    {
      id: 37,
      industry: 'Legal',
      description: 'Contract Review Checklist',
      content: 'Create a detailed checklist for reviewing [Type of Contract] including key clauses, potential risks, and negotiation points.'
    },
    {
      id: 38,
      industry: 'Legal',
      description: 'Corporate Resolution Template',
      content: 'Draft a template for corporate resolutions including company details, meeting information, and specific actions being approved.'
    },
    {
      id: 39,
      industry: 'Legal',
      description: 'Demand Letter',
      content: 'Create a template for a demand letter regarding [Issue], including factual background, legal basis, and specific demands.'
    },
    {
      id: 40,
      industry: 'Legal',
      description: 'Compliance Audit Checklist',
      content: 'Develop a checklist for conducting [Regulation] compliance audits, including required documentation and key control points.'
    },

    // Telecom Prompts (10)
    {
      id: 41,
      industry: 'Telecom',
      description: 'Service Level Agreement',
      content: 'Draft a service level agreement for [Telecom Service] with guaranteed uptime of [X]%, response times, and resolution procedures.'
    },
    {
      id: 42,
      industry: 'Telecom',
      description: 'Network Security Policy',
      content: 'Develop a comprehensive network security policy covering access controls, data encryption, and incident response procedures.'
    },
    {
      id: 43,
      industry: 'Telecom',
      description: 'Customer Service Script',
      content: 'Create a troubleshooting script for customer service representatives handling [Specific Issue] calls, including escalation paths.'
    },
    {
      id: 44,
      industry: 'Telecom',
      description: '5G Implementation Plan',
      content: 'Develop a phased implementation plan for 5G network rollout, including site selection, testing procedures, and customer migration strategy.'
    },
    {
      id: 45,
      industry: 'Telecom',
      description: 'Roaming Agreement Template',
      content: 'Draft a template for roaming agreements between telecom operators, covering service terms, pricing, and quality standards.'
    },
    {
      id: 46,
      industry: 'Telecom',
      description: 'Network Outage Report',
      content: 'Create a template for documenting network outages including root cause analysis, impact assessment, and preventive measures.'
    },
    {
      id: 47,
      industry: 'Telecom',
      description: 'BYOD Policy',
      content: 'Develop a Bring Your Own Device policy covering security requirements, acceptable use, and support limitations.'
    },
    {
      id: 48,
      industry: 'Telecom',
      description: 'Vendor Assessment Form',
      content: 'Create a template for evaluating telecom equipment vendors including technical capabilities, support services, and pricing structures.'
    },
    {
      id: 49,
      industry: 'Telecom',
      description: 'Disaster Recovery Plan',
      content: 'Develop a comprehensive disaster recovery plan for telecom infrastructure including backup systems and communication protocols.'
    },
    {
      id: 50,
      industry: 'Telecom',
      description: 'Customer Satisfaction Survey',
      content: 'Design a survey to measure customer satisfaction with telecom services, including network quality, customer support, and billing experience.'
    }
  ];
  
  // Shuffle array using Fisher-Yates algorithm
  const shuffleArray = (array: any[]) => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  };

  // Shuffle prompts on component mount
  React.useEffect(() => {
    setExplorePrompts(shuffleArray(allPrompts));
  }, []);

  // Get filtered prompts based on active tab
  const getFilteredPrompts = () => {
    if (activeTab === 'favorites') {
      return allPrompts.filter(prompt => favoriteIds.has(prompt.id));
    } else if (activeTab === 'recent') {
      return []; // For recent tab, we'll handle display in the JSX
    }
    return explorePrompts; // For explore tab
  };
  
  const filteredPrompts = getFilteredPrompts();
  
  const toggleFavorite = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavoriteIds(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(id)) {
        newFavorites.delete(id);
      } else {
        newFavorites.add(id);
      }
      return newFavorites;
    });
  };

  const addToRecentlyUsed = (prompt: GeneratedPrompt) => {
    setRecentlyUsed((prev) => {
      const updated = prev.filter((p) => p.id !== prompt.id);
      return [prompt, ...updated].slice(0, 10);
    });
  };

  const copyToClipboard = (text: string, id: number, prompt?: GeneratedPrompt) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    if (prompt) {
      addToRecentlyUsed(prompt);
    }
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCardClick = (prompt: GeneratedPrompt) => {
    // Preview is now handled directly in the PromptCard
    setPreviewPrompt(prompt);
    setIsPreviewOpen(true);
  };

  const handlePreviewCopy = () => {
    if (previewPrompt) {
      copyToClipboard(previewPrompt.content, previewPrompt.id, previewPrompt);
    }
  };

  return (
    <div className="p-6 w-full">
      <div className="flex flex-col space-y-4 mb-6">
        <h1 className="text-2xl font-bold">Prompt Library</h1>
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as TabType)}
          className="w-full"
        >
          <TabsList className="grid w-full md:w-[400px] grid-cols-2">
            <TabsTrigger value="recent" className="flex items-center justify-center">
              <Clock className="h-4 w-4 mr-2" />
              Recently Used
            </TabsTrigger>
            <TabsTrigger value="favorites" className="flex items-center justify-center">
              <Star className="h-4 w-4 mr-2" />
              Favorites
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Prompts Grid */}
      {activeTab === 'recent' ? (
        <div className="space-y-8">
          {/* Recent Prompts Section */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Recent Prompts</h2>
            {recentlyUsed.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {recentlyUsed.map((prompt) => (
                  <PromptCard
                    key={prompt.id}
                    prompt={prompt}
                    isFavorite={favoriteIds.has(prompt.id)}
                    onCopy={copyToClipboard}
                    onToggleFavorite={toggleFavorite}
                    copiedId={copiedId}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground border rounded-lg">
                No recently used prompts yet. Copy a prompt to see it here!
              </div>
            )}
          </div>

          {/* Explore Section */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Explore</h2>
            {allPrompts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {explorePrompts.map((prompt) => (
                  <PromptCard
                    key={prompt.id}
                    prompt={prompt}
                    isFavorite={favoriteIds.has(prompt.id)}
                    onCopy={copyToClipboard}
                    onToggleFavorite={toggleFavorite}
                    copiedId={copiedId}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground border rounded-lg">
                No prompts found
              </div>
            )}
          </div>
        </div>
      ) : (
        <div>
          {/* Favorites Section */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Favorites</h2>
            {filteredPrompts.length > 0 ? (
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredPrompts.map((prompt) => (
                  <Card
                    key={`favorite-${prompt.id}`}
                    className="p-4 h-48 hover:shadow-md transition-all duration-200 cursor-pointer hover:bg-gray-100/50 dark:hover:bg-gray-700/50 relative group flex flex-col"
                    onClick={() => handleCardClick(prompt)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        {prompt.industry}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(prompt.id, e);
                        }}
                        className="text-yellow-500 hover:text-yellow-600 dark:text-yellow-400 dark:hover:text-yellow-300 focus:outline-none"
                        aria-label="Remove from favorites"
                      >
                        <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                      </button>
                    </div>
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-1 line-clamp-1">
                      {prompt.description}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-4 leading-relaxed flex-grow">
                      {prompt.content}
                    </p>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground border rounded-lg">
                No favorite prompts yet. Mark a prompt as favorite to see it here!
              </div>
            )}
          </div>
        </div>
      )}

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-6">
              <DialogTitle className="text-lg font-semibold">
                {previewPrompt?.industry} - {previewPrompt?.description}
              </DialogTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePreviewCopy}
                className="flex items-center gap-2 dark:bg-gray-500"
              >
                {copiedId === previewPrompt?.id ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                {copiedId === previewPrompt?.id ? 'Copied!' : 'Copy'}
              </Button>
            </div>
          </DialogHeader>
          <div className="mt-4">
            <div className="rounded-lg p-4">
              <p className="text-lg text-gray-700 dark:text-gray-200 whitespace-pre-wrap leading-relaxed">
                {previewPrompt?.content}
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {allPrompts.length === 0 && (
        <div className="text-center py-12 border rounded-lg mt-6">
          <p className="text-gray-500">No prompts found</p>
        </div>
      )}
    </div>
  );
}