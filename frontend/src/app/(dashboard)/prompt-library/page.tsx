'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Copy, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface GeneratedPrompt {
  id: number;
  content: string;
  industry: string;
  description: string;
}

export default function PromptLibraryPage() {
  const [activeTab, setActiveTab] = useState('Legal');
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const [previewPrompt, setPreviewPrompt] = useState<GeneratedPrompt | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Industry tabs
  const industries = ['Legal', 'Finance', 'Healthcare', 'Telecommunication', 'HR'];

  // Dummy data for each industry
  const dummyPrompts: Record<string, GeneratedPrompt[]> = {
    Legal: [
      {
        id: 1,
        content: "Please review the uploaded contract and create a comprehensive analysis highlighting potential risks, missing clauses, and recommendations for negotiation.",
        industry: "Legal",
        description: "Contract Review"
      },
      {
        id: 2,
        content: "Draft a legal brief for civil litigation that summarizes key facts, applicable law, and strongest arguments for the case.",
        industry: "Legal",
        description: "Legal Brief Generator"
      },
      {
        id: 3,
        content: "Create a comprehensive due diligence checklist for M&A transactions covering corporate structure, financials, and legal compliance.",
        industry: "Legal",
        description: "M&A Due Diligence"
      },
      {
        id: 4,
        content: "Generate a GDPR-compliant privacy policy template for SaaS platforms with standard clauses and user rights.",
        industry: "Legal",
        description: "Privacy Policy Draft"
      },
      {
        id: 5,
        content: "Analyze the uploaded patent documents and create an IP protection strategy with filing recommendations and competitive analysis.",
        industry: "Legal",
        description: "IP Strategy"
      },
      {
        id: 6,
        content: "Draft a standard employment contract template with confidentiality, non-compete, and termination clauses.",
        industry: "Legal",
        description: "Employment Contract"
      },
      {
        id: 7,
        content: "Create a litigation strategy framework including case timeline, evidence collection, and settlement considerations.",
        industry: "Legal",
        description: "Litigation Planning"
      },
      {
        id: 8,
        content: "Develop a corporate governance checklist covering board responsibilities, shareholder rights, and compliance requirements.",
        industry: "Legal",
        description: "Corporate Governance"
      },
      {
        id: 9,
        content: "Based on the uploaded logo and brand materials, prepare a trademark application with proper classifications and descriptions.",
        industry: "Legal",
        description: "Trademark Filing"
      },
      {
        id: 10,
        content: "Generate a real estate purchase agreement template with standard terms, contingencies, and closing procedures.",
        industry: "Legal",
        description: "Real Estate Contract"
      },
      {
        id: 11,
        content: "Create comprehensive terms of service for mobile applications including user rights, liability limitations, and dispute resolution.",
        industry: "Legal",
        description: "Terms of Service"
      },
      {
        id: 12,
        content: "Please analyze our current compliance procedures against the uploaded regulatory requirements and create an audit report.",
        industry: "Legal",
        description: "Compliance Audit"
      }
    ],
    Finance: [
      {
        id: 13,
        content: "Create a comprehensive financial dashboard showing key ratios, trends, and performance metrics for quarterly reporting.",
        industry: "Finance",
        description: "Financial Dashboard"
      },
      {
        id: 14,
        content: "Based on the portfolio data I've uploaded, perform a complete risk assessment including VaR calculations, stress testing, and correlation analysis.",
        industry: "Finance",
        description: "Risk Assessment"
      },
      {
        id: 15,
        content: "Generate a detailed budget planning template with variance analysis and KPI tracking for quarterly forecasting.",
        industry: "Finance",
        description: "Budget Planning"
      },
      {
        id: 16,
        content: "Create a loan evaluation framework covering creditworthiness assessment, collateral valuation, and repayment capacity analysis.",
        industry: "Finance",
        description: "Credit Analysis"
      },
      {
        id: 17,
        content: "Generate a 12-month cash flow projection based on the uploaded sales forecasts and expense budgets.",
        industry: "Finance",
        description: "Cash Flow Model"
      },
      {
        id: 18,
        content: "Design a regulatory compliance monitoring system for financial institutions covering SOX, Basel III, and AML requirements.",
        industry: "Finance",
        description: "Compliance Review"
      },
      {
        id: 19,
        content: "Develop a credit scoring model framework using customer data and payment history to predict default probability.",
        industry: "Finance",
        description: "Credit Scoring"
      },
      {
        id: 20,
        content: "Create an investment portfolio optimization strategy including asset allocation, diversification, and rebalancing protocols.",
        industry: "Finance",
        description: "Portfolio Optimization"
      },
      {
        id: 21,
        content: "Build financial forecasting models with scenario analysis, sensitivity testing, and Monte Carlo simulations.",
        industry: "Finance",
        description: "Financial Modeling"
      },
      {
        id: 22,
        content: "Value this acquisition target using the uploaded financial data, perform DCF analysis and suggest a fair offer price.",
        industry: "Finance",
        description: "M&A Valuation"
      },
      {
        id: 23,
        content: "Develop a treasury management framework covering liquidity management, FX hedging, and interest rate risk mitigation.",
        industry: "Finance",
        description: "Treasury Dashboard"
      },
      {
        id: 24,
        content: "Create a comprehensive financial audit checklist including internal controls, revenue recognition, and asset valuation procedures.",
        industry: "Finance",
        description: "Financial Audit"
      }
    ],
    Healthcare: [
      {
        id: 25,
        content: "Create a comprehensive patient intake assessment form capturing medical history, current symptoms, and risk factors.",
        industry: "Healthcare",
        description: "Patient Assessment"
      },
      {
        id: 26,
        content: "Generate a personalized treatment plan according to the uploaded patient history, current medications, and diagnostic test results.",
        industry: "Healthcare",
        description: "Treatment Planning"
      },
      {
        id: 27,
        content: "Develop a HIPAA compliance checklist for healthcare providers covering patient data protection and access controls.",
        industry: "Healthcare",
        description: "HIPAA Compliance"
      },
      {
        id: 28,
        content: "Create standardized clinical documentation templates ensuring accurate record-keeping and billing compliance.",
        industry: "Healthcare",
        description: "Clinical Documentation"
      },
      {
        id: 29,
        content: "Design a quality improvement framework for healthcare facilities focusing on patient safety and care outcomes.",
        industry: "Healthcare",
        description: "Quality Improvement"
      },
      {
        id: 30,
        content: "Develop a telemedicine consultation protocol including patient screening, technology requirements, and documentation standards.",
        industry: "Healthcare",
        description: "Telemedicine Setup"
      },
      {
        id: 31,
        content: "Check for drug interactions and dosage recommendations based on the uploaded patient profile and current medication list.",
        industry: "Healthcare",
        description: "Medication Review"
      },
      {
        id: 32,
        content: "Create patient discharge planning templates covering follow-up care, medication instructions, and recovery monitoring.",
        industry: "Healthcare",
        description: "Discharge Planning"
      },
      {
        id: 33,
        content: "Develop emergency response protocols for medical facilities including triage procedures and resource allocation.",
        industry: "Healthcare",
        description: "Emergency Protocol"
      },
      {
        id: 34,
        content: "Generate clinical research study protocols including participant selection, data collection, and regulatory compliance.",
        industry: "Healthcare",
        description: "Research Protocol"
      },
      {
        id: 35,
        content: "Perform a mental health risk assessment based on the uploaded patient questionnaires and behavioral observations.",
        industry: "Healthcare",
        description: "Mental Health Risk"
      },
      {
        id: 36,
        content: "Design medical equipment maintenance schedules including calibration procedures, safety checks, and replacement protocols.",
        industry: "Healthcare",
        description: "Equipment Maintenance"
      }
    ],
    Telecommunication: [
      {
        id: 37,
        content: "Create a comprehensive network infrastructure assessment covering bandwidth analysis, security evaluation, and scalability planning.",
        industry: "Telecommunication",
        description: "Network Assessment"
      },
      {
        id: 38,
        content: "Generate a sales proposal for enterprise clients based on the uploaded requirements and create competitive pricing strategies.",
        industry: "Telecommunication",
        description: "Sales Proposal"
      },
      {
        id: 39,
        content: "Develop a billing dispute resolution framework with escalation procedures and customer satisfaction tracking.",
        industry: "Telecommunication",
        description: "Billing Support"
      },
      {
        id: 40,
        content: "Analyze the uploaded radiation measurement data and create a compliance report for regulatory submission.",
        industry: "Telecommunication",
        description: "Radiation Compliance"
      },
      {
        id: 41,
        content: "Create network troubleshooting guides for common performance issues including diagnostic steps and resolution procedures.",
        industry: "Telecommunication",
        description: "Network Troubleshooting"
      },
      {
        id: 42,
        content: "Design disaster recovery plans for telecommunications infrastructure including backup systems and failover procedures.",
        industry: "Telecommunication",
        description: "Disaster Recovery"
      },
      {
        id: 43,
        content: "Develop 5G network deployment strategies including site planning, equipment specifications, and regulatory compliance.",
        industry: "Telecommunication",
        description: "5G Deployment"
      },
      {
        id: 44,
        content: "Create customer service protocols for technical support including troubleshooting workflows and satisfaction metrics.",
        industry: "Telecommunication",
        description: "Customer Support"
      },
      {
        id: 45,
        content: "Analyze network traffic patterns from the uploaded data and create capacity planning recommendations for next quarter.",
        industry: "Telecommunication",
        description: "Capacity Planning"
      },
      {
        id: 46,
        content: "Design automated billing systems for telecommunications services including usage tracking and invoice generation.",
        industry: "Telecommunication",
        description: "Billing Automation"
      },
      {
        id: 47,
        content: "Create fiber optic installation procedures covering cable routing, splicing techniques, and testing protocols.",
        industry: "Telecommunication",
        description: "Fiber Installation"
      },
      {
        id: 48,
        content: "Develop mobile network optimization frameworks including signal analysis, interference mitigation, and coverage enhancement.",
        industry: "Telecommunication",
        description: "Coverage Optimization"
      }
    ],
    HR: [
      {
        id: 49,
        content: "Create comprehensive employee onboarding checklists covering documentation, training schedules, and cultural integration.",
        industry: "HR",
        description: "Employee Onboarding"
      },
      {
        id: 50,
        content: "Generate performance review templates according to the uploaded role descriptions and company evaluation criteria.",
        industry: "HR",
        description: "Performance Reviews"
      },
      {
        id: 51,
        content: "Develop recruitment strategies including job analysis, candidate sourcing methods, and interview processes.",
        industry: "HR",
        description: "Recruitment Support"
      },
      {
        id: 52,
        content: "Create employee handbook templates covering company policies, code of conduct, and workplace procedures.",
        industry: "HR",
        description: "Policy Updates"
      },
      {
        id: 53,
        content: "Design training and development programs that identify skill gaps and create personalized learning paths.",
        industry: "HR",
        description: "Training Development"
      },
      {
        id: 54,
        content: "Create a conflict resolution plan for the workplace issue described in the uploaded incident reports.",
        industry: "HR",
        description: "Conflict Resolution"
      },
      {
        id: 55,
        content: "Develop benefits administration frameworks covering health insurance, retirement plans, and leave policies.",
        industry: "HR",
        description: "Benefits Analysis"
      },
      {
        id: 56,
        content: "Create diversity and inclusion programs including bias training and inclusive hiring practices.",
        industry: "HR",
        description: "Diversity Programs"
      },
      {
        id: 57,
        content: "Design remote work policies covering work arrangements, communication protocols, and performance expectations.",
        industry: "HR",
        description: "Remote Work Policy"
      },
      {
        id: 58,
        content: "Generate succession plans for key positions based on the uploaded organizational chart and talent assessments.",
        industry: "HR",
        description: "Succession Planning"
      },
      {
        id: 59,
        content: "Develop workplace safety programs covering hazard identification, incident reporting, and emergency procedures.",
        industry: "HR",
        description: "Safety Programs"
      },
      {
        id: 60,
        content: "Create compensation analysis frameworks including salary benchmarking, pay equity assessment, and bonus structures.",
        industry: "HR",
        description: "Compensation Analysis"
      }
    ]
  };

  const filteredPrompts = dummyPrompts[activeTab] || [];

  const copyToClipboard = (text: string, id: number) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('Prompt copied to clipboard!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCardClick = (prompt: GeneratedPrompt) => {
    setPreviewPrompt(prompt);
    setIsPreviewOpen(true);
  };

  const handlePreviewCopy = () => {
    if (previewPrompt) {
      copyToClipboard(previewPrompt.content, previewPrompt.id);
    }
  };

  return (
    <div className="p-6 w-full">
      {/* Header */}
      <div className="flex items-center justify-center md:justify-between mb-6 pt-4 md:pt-0">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Prompt Library</h1>
      </div>

      {/* Industry Tabs - Desktop */}
      <div className="hidden md:flex gap-2 mb-6 overflow-x-auto">
        {industries.map((industry) => (
          <button
            key={industry}
            onClick={() => setActiveTab(industry)}
            className={`flex-shrink-0 py-2 px-4 text-center font-medium text-sm rounded-full border transition-all duration-200 ${activeTab === industry
              ? 'bg-gray-900 text-white border-gray-900 dark:bg-white dark:text-gray-900 dark:border-white'
              : 'bg-transparent text-gray-600 border-gray-300 hover:border-gray-400 hover:text-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:text-gray-200'
              }`}
          >
            {industry}
          </button>
        ))}
      </div>

      {/* Industry Dropdown - Mobile */}
      <div className="md:hidden mb-6">
        <Select value={activeTab} onValueChange={setActiveTab}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select an industry" />
          </SelectTrigger>
          <SelectContent>
            {industries.map((industry) => (
              <SelectItem key={industry} value={industry}>
                {industry}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Search */}
      {/* <div className="mb-6">
        <div className="relative max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <Input
            type="text"
            className="pl-10 w-full"
            placeholder="Search prompts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div> */}

      {/* Prompts Grid */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredPrompts.map((prompt) => (
          <Card
            key={prompt.id}
            className="p-4 h-48 hover:shadow-md transition-all duration-200 cursor-pointer hover:bg-gray-100/50 dark:hover:bg-gray-700/50"
            onClick={() => handleCardClick(prompt)}
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {prompt.description}
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  copyToClipboard(prompt.content, prompt.id);
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                {copiedId === prompt.id ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </button>
            </div>
            <p className="mt-3 text-sm text-gray-600 dark:text-gray-300 line-clamp-5 leading-relaxed">
              {prompt.content}
            </p>
          </Card>
        ))}
      </div>

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
            <div className=" rounded-lg p-4">
              <p className="text-lg text-gray-700 dark:text-gray-200 whitespace-pre-wrap leading-relaxed">
                {previewPrompt?.content}
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {filteredPrompts.length === 0 && (
        <div className="text-center py-12 border rounded-lg mt-6">
          <p className="text-gray-500">No prompts found</p>
        </div>
      )}
    </div>
  );
}