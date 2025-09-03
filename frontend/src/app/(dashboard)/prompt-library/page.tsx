'use client';

import React, { useState } from 'react';
import { Copy, CheckCircle, Star, Clock, Heart, Search, Plus } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PromptCard } from '@/components/prompt/prompt-card';
import { FancyTabs, TabConfig } from '@/components/ui/fancy-tabs';

interface GeneratedPrompt {
  id: number;
  content: string;
  description: string;
}

type TabType = 'recent' | 'favorites';

export default function PromptLibraryPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('recent');
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [previewPrompt, setPreviewPrompt] = useState<GeneratedPrompt | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const handlePreviewCopy = () => {
    if (previewPrompt) {
      copyToClipboard(previewPrompt.content, previewPrompt.id, previewPrompt);
    }
  };
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
  const [recentlyUsed, setRecentlyUsed] = useState<GeneratedPrompt[]>(() => {
    // Load from localStorage on initial render
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('recentlyUsedPrompts');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          // Ensure we only keep valid prompts (without industry field)
          return parsed.map((p: any) => ({
            id: p.id,
            description: p.description,
            content: p.content
          }));
        } catch (e) {
          console.error('Error parsing recently used prompts:', e);
        }
      }
    }
    return [];
  });

  const [explorePrompts, setExplorePrompts] = useState<GeneratedPrompt[]>([]);

  // Function to remove a prompt from recently used
  const removeFromRecentlyUsed = (id: number) => {
    setRecentlyUsed(prev => {
      const updated = prev.filter(prompt => prompt.id !== id);
      if (typeof window !== 'undefined') {
        localStorage.setItem('recentlyUsedPrompts', JSON.stringify(updated));
      }
      return updated;
    });
  };

  // Industry analysis prompts
  const allPrompts: GeneratedPrompt[] = [
    {
      id: 1,
      description: 'Market Trends Analysis',
      content: 'Analyze the current market trends over the last 12 months. Include consumer behavior shifts, regulatory changes, digital adoption, and competitor activities. Provide data-backed insights with KPIs such as revenue growth rates, churn ratios, or foot traffic patterns.'
    },
    {
      id: 2,
      description: 'Operational Workflow Evaluation',
      content: 'Evaluate operational workflows to identify bottlenecks and automation opportunities. Include metrics like production cycle time, call resolution rates, or claims processing time. Suggest scalable improvements for cost savings and efficiency gains.'
    },
    {
      id: 3,
      description: 'Customer Segmentation Strategy',
      content: 'Develop a customer segmentation strategy using historical data and behavioral trends. Include profiles based on key factors such as spending habits, ARPU, or risk scores, and recommend targeted campaigns for better engagement.'
    },
    {
      id: 4,
      description: 'Compliance & Risk Assessment',
      content: 'Conduct a compliance and risk assessment. Highlight regulatory obligations (like HIPAA, PCI DSS, GDPR), identify operational and security risks, and propose actionable mitigation strategies.'
    },
    {
      id: 5,
      description: 'Sales & Demand Forecast',
      content: 'Build a sales and demand forecast for the next 4 quarters. Leverage historical performance, seasonality, and external economic factors to project revenue, volume, and margins. Include KPIs such as sales velocity, revenue per customer, or service adoption rates.'
    },
    {
      id: 6,
      description: 'Digital Transformation Plan',
      content: 'Design a digital transformation plan. Recommend suitable technologies like AI analytics, IoT, or telemedicine platforms. Define success metrics, integration challenges, and potential ROI.'
    },
    {
      id: 7,
      description: 'Competitive Benchmarking',
      content: 'Perform a competitive benchmarking analysis. Compare KPIs such as net promoter score, operational costs, market share, or innovation index with top competitors. Suggest clear strategies to close gaps and gain market advantage.'
    },
    {
      id: 8,
      description: 'Supply Chain Performance',
      content: 'Assess the supply chain performance. Examine raw material lead times, analyze inventory turnover, and evaluate supplier reliability. Recommend data-driven improvements for resilience and cost efficiency.'
    },
    {
      id: 9,
      description: 'Workforce Productivity Analysis',
      content: 'Analyze workforce productivity and engagement trends. Include KPIs like employee satisfaction scores, output per hour, or attrition rates. Recommend tools, training, or cultural initiatives to boost retention and operational performance.'
    },
    {
      id: 10,
      description: 'Financial Performance Review',
      content: 'Review the financial performance. Break down revenue streams, operating margins, and expense drivers. Suggest actionable strategies to improve cash flow, profitability, and scalability while mitigating financial risks.'
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

  // Get filtered prompts based on search query
  const getFilteredPrompts = (prompts: GeneratedPrompt[]) => {
    if (!searchQuery.trim()) return prompts;
    
    const query = searchQuery.toLowerCase().trim();
    
    return prompts.filter(prompt => {
      const lowerDesc = prompt.description.toLowerCase();
      const lowerContent = prompt.content.toLowerCase();
      
      return lowerDesc.includes(query) || lowerContent.includes(query);
    });
  };
  
  // Get filtered prompts for recent and explore sections
  const filteredRecent = getFilteredPrompts(recentlyUsed);
  const filteredExplore = getFilteredPrompts(explorePrompts);
  const filteredFavorites = getFilteredPrompts(
    allPrompts.filter(prompt => favoriteIds.has(prompt.id))
  );
  
  // Check if there are any search results
  const hasSearchResults = searchQuery.trim() && 
    (filteredRecent.length > 0 || filteredExplore.length > 0 || filteredFavorites.length > 0);
  
  // For backward compatibility
  const filteredPrompts = [...filteredFavorites];

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
    setRecentlyUsed(prev => [prompt, ...prev.filter(p => p.id !== prompt.id)].slice(0, 10));
  };

  const copyToClipboard = (text: string, id: number, promptArg?: GeneratedPrompt) => {
    // Copy to clipboard
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    
    // Find the prompt in allPrompts if not provided
    const promptToAdd = promptArg || allPrompts.find(p => p.id === id);
    
    if (promptToAdd) {
      setRecentlyUsed(prev => {
        // Create new array with the new prompt at the start, remove any duplicates
        const updated = [
          promptToAdd,
          ...prev.filter(p => p.id !== promptToAdd.id)
        ].slice(0, 10);
        
        // Save to localStorage
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem('recentlyUsedPrompts', JSON.stringify(updated));
          } catch (error) {
            console.error('Error saving to localStorage:', error);
          }
        }
        
        return updated;
      });
    }
    
    // Reset copied state after 2 seconds
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCardClick = (prompt: GeneratedPrompt) => {
    try {
      // Add to recently used
      setRecentlyUsed(prev => {
        const updated = [prompt, ...prev.filter(p => p.id !== prompt.id)].slice(0, 10);
        if (typeof window !== 'undefined') {
          localStorage.setItem('recentlyUsedPrompts', JSON.stringify(updated));
        }
        return updated;
      });

      // Get URL parameters if they exist
      const searchParams = new URLSearchParams(window.location.search);
      const threadId = searchParams.get('threadId');
      const projectId = searchParams.get('projectId');

      // Store the prompt in localStorage with a timestamp
      const promptData = {
        content: prompt.content,
        timestamp: Date.now(),
        threadId: threadId || null,
        projectId: projectId || null
      };
      
      localStorage.setItem('selectedPrompt', JSON.stringify(promptData));
      
      // Try to send the prompt back to the parent window if opened in a new tab
      if (window.opener) {
        try {
          window.opener.postMessage(
            { type: 'PROMPT_SELECTED', ...promptData },
            window.location.origin
          );
          window.close();
          return;
        } catch (error) {
          console.error('Error sending message to parent window:', error);
          // Continue with normal navigation if postMessage fails
        }
      }
      
      // Always redirect to dashboard with the prompt
      const returnUrl = threadId && projectId 
        ? `/dashboard/projects/${projectId}/thread/${threadId}`
        : '/dashboard';
        
      const newSearchParams = new URLSearchParams();
      newSearchParams.set('prompt', encodeURIComponent(prompt.content));
      newSearchParams.set('fromPromptLibrary', 'true');
      
      // Use replace to avoid adding to browser history
      router.replace(`${returnUrl}?${newSearchParams.toString()}`);
    } catch (error) {
      console.error('Error handling prompt selection:', error);
      // Fallback to showing the preview if something goes wrong
      setPreviewPrompt(prompt);
      setIsPreviewOpen(true);
    }
  };

  const promptTabs: TabConfig[] = [
    {
      value: 'recent',
      icon: Clock,
      label: 'Recently Used',
    },
    {
      value: 'favorites',
      icon: Star,
      label: 'Favorites',
    },
  ];

  return (
    <div className="p-6 w-full">
      <div className="flex flex-col items-center space-y-4 mb-6">
        <h1 className="text-2xl font-bold">Prompt Library</h1>
        <FancyTabs
          tabs={promptTabs}
          activeTab={activeTab}
          onTabChange={(value) => setActiveTab(value as TabType)}
        />
      </div>

      {/* Prompts Grid */}
      {activeTab === 'recent' ? (
        <div className="space-y-8">
          {/* Recent Prompts Section */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Recent Prompts</h2>
            {recentlyUsed.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {(searchQuery ? filteredRecent : recentlyUsed).map((prompt) => (
                  <div key={`recent-${prompt.id}`} className="relative group">
                    <PromptCard
                      prompt={prompt}
                      isFavorite={favoriteIds.has(prompt.id)}
                      onCopy={copyToClipboard}
                      onToggleFavorite={toggleFavorite}
                      onCardClick={handleCardClick}
                      copiedId={copiedId}
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFromRecentlyUsed(prompt.id);
                      }}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Remove from recent"
                      aria-label="Remove from recent"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {(searchQuery ? filteredExplore : explorePrompts).map((prompt) => (
                  <div key={prompt.id} onClick={() => handleCardClick(prompt)}>
                    <PromptCard
                      prompt={prompt}
                      isFavorite={favoriteIds.has(prompt.id)}
                      onCopy={copyToClipboard}
                      onToggleFavorite={toggleFavorite}
                      copiedId={copiedId}
                      hideCopyButton={true}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground border rounded-lg">
                {searchQuery ? 'No matching prompts found' : 'No prompts found'}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div>
          {/* Favorites Section */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Favorites</h2>
            {filteredFavorites.length > 0 ? (
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredFavorites.map((prompt) => (
                  <div key={`favorite-${prompt.id}`} className="relative group" onClick={() => handleCardClick(prompt)}>
                    <PromptCard
                      prompt={prompt}
                      isFavorite={favoriteIds.has(prompt.id)}
                      onCopy={copyToClipboard}
                      onToggleFavorite={toggleFavorite}
                      copiedId={copiedId}
                      hideCopyButton={true}
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(prompt.id, e);
                      }}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Remove from favorites"
                      aria-label="Remove from favorites"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
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
                {previewPrompt?.description}
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