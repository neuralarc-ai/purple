import React, { useState, useEffect } from 'react';
import { 
  Cpu, Code, GitBranch, FileText as FileTextIcon, BarChart2, Shield, 
  Target, ClipboardList, Search, Users, Lightbulb, Brain, LineChart, 
  TrendingDown, FileCheck, PieChart, Zap, Calendar, Megaphone, MessageSquare,
  Mail, TrendingUp, BookOpen, Package, Database, LayoutGrid, LayoutTemplate,
  AlertCircle, AlertTriangle, FileSignature, Settings, Users as Users2, Palette,
  FileSpreadsheet, LayoutDashboard, Gauge, Scale, DollarSign, ChevronDown, ChevronUp,
  Accessibility, Image as ImageIcon, Table, Bot, FileCode, FileText, ExternalLink
} from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { userProfilesApi } from '@/lib/api/user-profiles';

interface UseCaseItem {
  id: string;
  title: string;
  prompt: string;
  icon: React.ReactNode;
  category?: string;
  isNavigation?: boolean;
  navigateTo?: string;
}

interface UseCasesProps {
  onUseCaseSelect: (prompt: string) => void;
  router: any;
  onLoad?: () => void;
}

export const UseCases: React.FC<UseCasesProps> = ({ onUseCaseSelect, router, onLoad }) => {
  const { user } = useAuth();
  const [userWorkDescription, setUserWorkDescription] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(false);

  // Load user's work description on component mount and when user changes
  useEffect(() => {
    let isMounted = true;
    
    const loadUserProfile = async () => {
      try {
        console.log('Loading user profile...');
        const profile = await userProfilesApi.getProfile();
        
        if (!isMounted) return;
        
        console.log('Received profile:', profile);
        
        if (profile?.work_description) {
          const workDesc = profile.work_description.trim();
          console.log('Setting work description to:', workDesc);
          
          // Only update if the value has changed to prevent unnecessary re-renders
          setUserWorkDescription(prev => {
            if (prev !== workDesc) {
              return workDesc;
            }
            return prev;
          });
        } else {
          console.log('No work description found in profile');
          setUserWorkDescription(null);
        }
      } catch (error) {
        console.error('Error loading user profile:', error);
        if (isMounted) {
          setUserWorkDescription(null);
        }
              } finally {
          if (isMounted) {
            setIsLoading(false);
            // Trigger slide-in animation after loading
            setTimeout(() => {
              setIsVisible(true);
              // Call onLoad callback when component becomes visible
              if (onLoad) {
                onLoad();
              }
            }, 100);
          }
        }
    };

    // Initial load
    loadUserProfile();

    // Set up an interval to check for profile updates (every 3 seconds)
    const intervalId = setInterval(loadUserProfile, 3000);

    // Clean up the interval and mark as unmounted
    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [user?.id]); // Re-run when user ID changes
  // Original use cases
  const originalUseCases = [
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
      icon: <BarChart2 className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
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

  // Split original use cases into two rows of 3 items each
  const firstRow = originalUseCases.slice(0, 3);
  const secondRow = originalUseCases.slice(3, 6);

  // Render function for original use cases
  const renderOriginalUseCaseRow = (rowItems: typeof originalUseCases) => (
    <div className="flex justify-center gap-2 w-full mb-2">
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

  // Categorized use cases state
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    'Engineering': true,
    'Product Management': false,
    'Human Resources': false,
    'Finance': false,
    'Marketing': false,
    'Sales': false,
    'Operations': false,
    'Data Science': false,
    'Design': false,
    'Legal': false,
    'Other': false
  });

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const categories = [
    {
      id: 'engineering',
      name: 'Engineering',
      icon: <Cpu className="h-4 w-4 mr-2" />,
      items: [
        {
          id: 'optimize-system',
          title: 'System Optimization',
          prompt: 'Generate a step-by-step plan to optimize the performance of a large-scale system.',
          icon: <Cpu className="h-4 w-4 mr-2 text-muted-foreground" />
        },
        {
          id: 'api-debugging',
          title: 'API Debugging',
          prompt: 'Suggest ways to debug and resolve API latency issues in production.',
          icon: <Code className="h-4 w-4 mr-2 text-muted-foreground" />
        },
        {
          id: 'ci-cd-pipeline',
          title: 'CI/CD Pipeline',
          prompt: 'Create an automated CI/CD pipeline setup using GitHub Actions and Docker.',
          icon: <GitBranch className="h-4 w-4 mr-2 text-muted-foreground" />
        },
        {
          id: 'feature-docs',
          title: 'Feature Documentation',
          prompt: 'Draft documentation for an engineering feature release.',
          icon: <FileTextIcon className="h-4 w-4 mr-2 text-muted-foreground" />
        },
        {
          id: 'monitoring',
          title: 'Monitoring Strategy',
          prompt: 'Recommend monitoring and alerting strategies for cloud infrastructure.',
          icon: <BarChart2 className="h-4 w-4 mr-2 text-muted-foreground" />
        },
        {
          id: 'secure-coding',
          title: 'Secure Coding',
          prompt: 'Propose best practices for secure coding in microservices.',
          icon: <Shield className="h-4 w-4 mr-2 text-muted-foreground" />
        }
      ]
    },
    {
      id: 'product-management',
      name: 'Product Management',
      icon: <Target className="h-4 w-4 mr-2" />,
      items: [
        {
          id: 'saas-roadmap',
          title: 'SaaS Roadmap',
          prompt: 'Create a quarterly roadmap for a SaaS product in {{industry}}.',
          icon: <LayoutDashboard className="h-4 w-4 mr-2 text-muted-foreground" />
        },
        {
          id: 'prd-template',
          title: 'PRD Template',
          prompt: 'Draft a PRD (Product Requirement Document) for a new feature.',
          icon: <FileTextIcon className="h-4 w-4 mr-2 text-muted-foreground" />
        },
        {
          id: 'backlog-prioritization',
          title: 'Backlog Prioritization',
          prompt: 'Suggest methods to prioritize backlog tasks effectively.',
          icon: <ClipboardList className="h-4 w-4 mr-2 text-muted-foreground" />
        },
        {
          id: 'product-kpis',
          title: 'Product KPIs',
          prompt: 'Generate KPIs and success metrics for product adoption.',
          icon: <BarChart2 className="h-4 w-4 mr-2 text-muted-foreground" />
        },
        {
          id: 'competitive-analysis',
          title: 'Competitive Analysis',
          prompt: 'Conduct a competitive analysis outline for {{industry}} tools.',
          icon: <Search className="h-4 w-4 mr-2 text-muted-foreground" />
        },
        {
          id: 'launch-checklist',
          title: 'Launch Checklist',
          prompt: 'Create a product launch checklist for cross-functional teams.',
          icon: <ClipboardList className="h-4 w-4 mr-2 text-muted-foreground" />
        }
      ]
    },
    {
      id: 'human-resources',
      name: 'Human Resources',
      icon: <Users2 className="h-4 w-4 mr-2" />,
      items: [
        {
          id: 'performance-review',
          title: 'Performance Review',
          prompt: 'Write a performance review framework for employees.',
          icon: <FileTextIcon className="h-4 w-4 mr-2 text-muted-foreground" />
        },
        {
          id: 'remote-engagement',
          title: 'Remote Engagement',
          prompt: 'Generate an employee engagement plan for remote teams.',
          icon: <Users className="h-4 w-4 mr-2 text-muted-foreground" />
        },
        {
          id: 'onboarding',
          title: 'Onboarding',
          prompt: 'Draft an onboarding checklist for new hires.',
          icon: <ClipboardList className="h-4 w-4 mr-2 text-muted-foreground" />
        },
        {
          id: 'diversity-inclusion',
          title: 'Diversity & Inclusion',
          prompt: 'Suggest strategies to improve diversity and inclusion.',
          icon: <Users2 className="h-4 w-4 mr-2 text-muted-foreground" />
        },
        {
          id: 'training-program',
          title: 'Training Program',
          prompt: 'Create a training and development program outline.',
          icon: <Lightbulb className="h-4 w-4 mr-2 text-muted-foreground" />
        },
        {
          id: 'hiring-strategy',
          title: 'Hiring Strategy',
          prompt: 'Develop a hiring strategy for scaling teams quickly.',
          icon: <Users className="h-4 w-4 mr-2 text-muted-foreground" />
        }
      ]
    },
    {
      id: 'finance',
      name: 'Finance',
      icon: <DollarSign className="h-4 w-4 mr-2" />,
      items: [
        {
          id: 'financial-forecast',
          title: 'Financial Forecast',
          prompt: 'Build a 3-year financial forecast model for {{industry}}.',
          icon: <LineChart className="h-4 w-4 mr-2 text-muted-foreground" />
        },
        {
          id: 'cost-reduction',
          title: 'Cost Reduction',
          prompt: 'Suggest strategies for cost reduction without affecting quality.',
          icon: <TrendingDown className="h-4 w-4 mr-2 text-muted-foreground" />
        },
        {
          id: 'compliance',
          title: 'Compliance',
          prompt: 'Create a checklist for compliance with financial regulations.',
          icon: <FileCheck className="h-4 w-4 mr-2 text-muted-foreground" />
        },
        {
          id: 'budget-allocation',
          title: 'Budget Allocation',
          prompt: 'Draft a quarterly budget allocation plan.',
          icon: <PieChart className="h-4 w-4 mr-2 text-muted-foreground" />
        },
        {
          id: 'automation-roi',
          title: 'Automation ROI',
          prompt: 'Analyze the ROI of adopting automation in finance workflows.',
          icon: <Zap className="h-4 w-4 mr-2 text-muted-foreground" />
        },
        {
          id: 'risk-assessment',
          title: 'Risk Assessment',
          prompt: 'Create an investment risk assessment framework.',
          icon: <Shield className="h-4 w-4 mr-2 text-muted-foreground" />
        }
      ]
    },
    {
      id: 'marketing',
      name: 'Marketing',
      icon: <Megaphone className="h-4 w-4 mr-2" />,
      items: [
        {
          id: 'social-calendar',
          title: 'Social Calendar',
          prompt: 'Generate a social media calendar for product awareness.',
          icon: <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
        },
        {
          id: 'digital-strategy',
          title: 'Digital Strategy',
          prompt: 'Create a digital marketing strategy for a {{industry}} launch.',
          icon: <Megaphone className="h-4 w-4 mr-2 text-muted-foreground" />
        },
        {
          id: 'seo-keywords',
          title: 'SEO & Content',
          prompt: 'Suggest SEO keywords and blog outlines for growth.',
          icon: <Search className="h-4 w-4 mr-2 text-muted-foreground" />
        },
        {
          id: 'customer-segmentation',
          title: 'Customer Segments',
          prompt: 'Write customer segmentation and targeting strategies.',
          icon: <Users className="h-4 w-4 mr-2 text-muted-foreground" />
        },
        {
          id: 'influencer-outreach',
          title: 'Influencer Outreach',
          prompt: 'Draft an influencer outreach plan for brand campaigns.',
          icon: <MessageSquare className="h-4 w-4 mr-2 text-muted-foreground" />
        },
        {
          id: 'competitor-analysis',
          title: 'Competitor Analysis',
          prompt: 'Create competitor campaign analysis with improvement ideas.',
          icon: <BarChart2 className="h-4 w-4 mr-2 text-muted-foreground" />
        }
      ]
    },
    {
      id: 'sales',
      name: 'Sales',
      icon: <MessageSquare className="h-4 w-4 mr-2" />,
      items: [
        {
          id: 'sales-pitch',
          title: 'Sales Pitch',
          prompt: 'Write a sales pitch tailored for {{industry}} clients.',
          icon: <MessageSquare className="h-4 w-4 mr-2 text-muted-foreground" />
        },
        {
          id: 'cold-outreach',
          title: 'Cold Outreach',
          prompt: 'Generate cold outreach email templates.',
          icon: <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
        },
        {
          id: 'crm-optimization',
          title: 'CRM Optimization',
          prompt: 'Create a CRM pipeline optimization plan.',
          icon: <LayoutGrid className="h-4 w-4 mr-2 text-muted-foreground" />
        },
        {
          id: 'upselling-strategies',
          title: 'Upselling',
          prompt: 'Suggest upselling and cross-selling strategies.',
          icon: <TrendingUp className="h-4 w-4 mr-2 text-muted-foreground" />
        },
        {
          id: 'sales-playbook',
          title: 'Sales Playbook',
          prompt: 'Draft a sales playbook for onboarding new reps.',
          icon: <BookOpen className="h-4 w-4 mr-2 text-muted-foreground" />
        },
        {
          id: 'sales-metrics',
          title: 'Sales Metrics',
          prompt: 'Propose key metrics dashboards for sales performance.',
          icon: <BarChart2 className="h-4 w-4 mr-2 text-muted-foreground" />
        }
      ]
    },
    {
      id: 'operations',
      name: 'Operations',
      icon: <Settings className="h-4 w-4 mr-2" />,
      items: [
        {
          id: 'sop-creation',
          title: 'SOP Creation',
          prompt: 'Generate an SOP (Standard Operating Procedure) for daily tasks.',
          icon: <FileTextIcon className="h-4 w-4 mr-2 text-muted-foreground" />
        },
        {
          id: 'supply-chain',
          title: 'Supply Chain',
          prompt: 'Suggest supply chain optimization strategies.',
          icon: <Package className="h-4 w-4 mr-2 text-muted-foreground" />
        },
        {
          id: 'inventory-tracking',
          title: 'Inventory Tracking',
          prompt: 'Create an inventory tracking system outline.',
          icon: <ClipboardList className="h-4 w-4 mr-2 text-muted-foreground" />
        },
        {
          id: 'process-automation',
          title: 'Process Automation',
          prompt: 'Draft a process automation plan for repetitive tasks.',
          icon: <Zap className="h-4 w-4 mr-2 text-muted-foreground" />
        },
        {
          id: 'cost-reduction-ops',
          title: 'Cost Reduction',
          prompt: 'Propose cost reduction strategies in operations.',
          icon: <TrendingDown className="h-4 w-4 mr-2 text-muted-foreground" />
        },
        {
          id: 'project-tools',
          title: 'Project Tools',
          prompt: 'Recommend project management tools for better efficiency.',
          icon: <LayoutGrid className="h-4 w-4 mr-2 text-muted-foreground" />
        }
      ]
    },
    {
      id: 'data-science',
      name: 'Data Science',
      icon: <BarChart2 className="h-4 w-4 mr-2" />,
      items: [
        {
          id: 'churn-prediction',
          title: 'Churn Prediction',
          prompt: 'Build a predictive model to forecast customer churn.',
          icon: <BarChart2 className="h-4 w-4 mr-2 text-muted-foreground" />
        },
        {
          id: 'data-governance',
          title: 'Data Governance',
          prompt: 'Draft a data governance and compliance framework.',
          icon: <Shield className="h-4 w-4 mr-2 text-muted-foreground" />
        },
        {
          id: 'executive-dashboards',
          title: 'Executive Dashboards',
          prompt: 'Suggest visualization dashboards for executives.',
          icon: <LayoutDashboard className="h-4 w-4 mr-2 text-muted-foreground" />
        },
        {
          id: 'anomaly-detection',
          title: 'Anomaly Detection',
          prompt: 'Create a pipeline for anomaly detection.',
          icon: <AlertCircle className="h-4 w-4 mr-2 text-muted-foreground" />
        },
        {
          id: 'ml-use-cases',
          title: 'ML Use Cases',
          prompt: 'Propose ML use cases for {{industry}} applications.',
          icon: <Brain className="h-4 w-4 mr-2 text-muted-foreground" />
        },
        {
          id: 'data-cleaning',
          title: 'Data Cleaning',
          prompt: 'Generate steps for cleaning and preparing unstructured data.',
          icon: <Database className="h-4 w-4 mr-2 text-muted-foreground" />
        }
      ]
    },
    {
      id: 'design',
      name: 'Design',
      icon: <Palette className="h-4 w-4 mr-2" />,
      items: [
        {
          id: 'wireframing',
          title: 'Wireframing',
          prompt: 'Create wireframes for a new product interface.',
          icon: <LayoutTemplate className="h-4 w-4 mr-2 text-muted-foreground" />
        },
        {
          id: 'accessibility',
          title: 'Accessibility',
          prompt: 'Draft accessibility improvements for a web app.',
          icon: <Accessibility className="h-4 w-4 mr-2 text-muted-foreground" />
        },
        {
          id: 'design-system',
          title: 'Design System',
          prompt: 'Suggest a design system for consistent UI.',
          icon: <LayoutGrid className="h-4 w-4 mr-2 text-muted-foreground" />
        },
        {
          id: 'ux-research',
          title: 'UX Research',
          prompt: 'Create a UX research plan with user interviews.',
          icon: <Users className="h-4 w-4 mr-2 text-muted-foreground" />
        },
        {
          id: 'branding-guidelines',
          title: 'Branding',
          prompt: 'Generate branding guidelines for visual identity.',
          icon: <Palette className="h-4 w-4 mr-2 text-muted-foreground" />
        },
        {
          id: 'figma-workflows',
          title: 'Figma Workflows',
          prompt: 'Propose collaborative design workflows using Figma.',
          icon: <LayoutTemplate className="h-4 w-4 mr-2 text-muted-foreground" />
        }
      ]
    },
    {
      id: 'legal',
      name: 'Legal',
      icon: <Scale className="h-4 w-4 mr-2" />,
      items: [
        {
          id: 'contract-template',
          title: 'Contract Template',
          prompt: 'Draft a contract template for vendor partnerships.',
          icon: <FileTextIcon className="h-4 w-4 mr-2 text-muted-foreground" />
        },
        {
          id: 'compliance-checklist-legal',
          title: 'Compliance',
          prompt: 'Create a compliance checklist for data protection laws.',
          icon: <Shield className="h-4 w-4 mr-2 text-muted-foreground" />
        },
        {
          id: 'risk-management',
          title: 'Risk Management',
          prompt: 'Suggest risk management strategies for global expansion.',
          icon: <AlertTriangle className="h-4 w-4 mr-2 text-muted-foreground" />
        },
        {
          id: 'nda-template',
          title: 'NDA Template',
          prompt: 'Generate NDAs and confidentiality agreements.',
          icon: <FileSignature className="h-4 w-4 mr-2 text-muted-foreground" />
        },
        {
          id: 'employment-agreements',
          title: 'Employment Agreements',
          prompt: 'Draft employment agreements with legal safeguards.',
          icon: <FileTextIcon className="h-4 w-4 mr-2 text-muted-foreground" />
        },
        {
          id: 'client-intake',
          title: 'Client Intake',
          prompt: 'Create a client intake form for {{industry}} legal practice.',
          icon: <ClipboardList className="h-4 w-4 mr-2 text-muted-foreground" />
        }
      ]
    },
    {
      id: 'other',
      name: 'Other',
      icon: <LayoutGrid className="h-4 w-4 mr-2" />,
      items: [
        {
          id: 'productivity-tools',
          title: 'Productivity Tools',
          prompt: 'Suggest productivity tools to improve workflows.',
          icon: <Zap className="h-4 w-4 mr-2 text-muted-foreground" />
        },
        {
          id: 'learning-plan',
          title: 'Learning Plan',
          prompt: 'Generate a personal learning plan for upskilling.',
          icon: <BookOpen className="h-4 w-4 mr-2 text-muted-foreground" />
        },
        {
          id: 'communication-guidelines',
          title: 'Communication',
          prompt: 'Create communication guidelines for remote teams.',
          icon: <MessageSquare className="h-4 w-4 mr-2 text-muted-foreground" />
        },
        {
          id: 'reporting-templates',
          title: 'Reporting Templates',
          prompt: 'Draft templates for reporting and documentation.',
          icon: <FileTextIcon className="h-4 w-4 mr-2 text-muted-foreground" />
        },
        {
          id: 'knowledge-management',
          title: 'Knowledge Management',
          prompt: 'Propose knowledge management strategies.',
          icon: <Database className="h-4 w-4 mr-2 text-muted-foreground" />
        },
        {
          id: 'automation-opportunities',
          title: 'Automation',
          prompt: 'Recommend automation opportunities across functions.',
          icon: <Zap className="h-4 w-4 mr-2 text-muted-foreground" />
        }
      ]
    }
  ];

  const handleUseCaseClick = (useCase: UseCaseItem) => {
    if (useCase.isNavigation && useCase.navigateTo) {
      router.push(useCase.navigateTo);
    } else if (useCase.prompt) {
      onUseCaseSelect(useCase.prompt);
    }
  };

  // Filter categories based on exact work description match
  const filteredCategories = categories.filter(category => {
    if (!userWorkDescription) return false;
    
    // Direct comparison with the category name (case-insensitive)
    return category.name.toLowerCase() === userWorkDescription.trim().toLowerCase();
  });
  
  // Debug logging
  console.log('Current work description:', userWorkDescription);
  console.log('Available categories:', categories.map(c => c.name));
  console.log('Filtered categories:', filteredCategories.map(c => c.name));

  if (isLoading) {
    return (
      <div className="w-full max-w-6xl mx-auto px-4 py-6 flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If user has a specific work description, only show matching categories
  // Show all categories if no work description is set, it's 'other', or no matches were found
  const shouldShowAllCategories = 
    !userWorkDescription || 
    userWorkDescription.toLowerCase() === 'other' ||
    filteredCategories.length === 0;

  return (
    <div 
      className={`w-full max-w-6xl h-full flex flex-col justify-between mx-auto px-4 py-6 transition-all duration-700 ease-out ${
        isVisible 
          ? 'translate-y-0 opacity-100' 
          : 'translate-y-8 opacity-0'
      }`}
    >
      {/* Original Use Cases - Always show these */}
      <div className="mb-10">
        {/* <h2 className="text-2xl font-bold mb-4">Quick Actions</h2> */}
        <div className="flex flex-col items-center gap-2">
          {renderOriginalUseCaseRow(firstRow)}
          {secondRow.length > 0 && renderOriginalUseCaseRow(secondRow)}
        </div>
      </div>

      {/* Categorized Use Cases */}
      {!shouldShowAllCategories && (
        <div className="mt-10">
          {/* <h2 className="text-2xl font-bold mb-6">Use Cases for {userWorkDescription}</h2> */}
          <div className="space-y-6">
            {filteredCategories.map((category) => (
              <div key={category.id} className="border rounded-2xl overflow-hidden">
                {/* <div className="w-full flex items-center justify-between p-4 bg-muted/50">
                  <div className="flex items-center">
                    {category.icon}
                    <h3 className="font-medium">{category.name}</h3>
                  </div>
                </div> */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 bg-muted/10">
                  {category.items.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleUseCaseClick(item)}
                      className="p-4 rounded-xl border bg-card hover:bg-muted/50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center mb-2">
                        {item.icon}
                        <h4 className="font-medium">{item.title}</h4>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {item.prompt}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Show all categories if no specific work description is set */}
      {shouldShowAllCategories && (
        <div className="mt-10">
          <h2 className="text-2xl font-bold mb-6">Use Cases by Category</h2>
          <div className="space-y-6">
            {categories.map((category) => (
              <div key={category.id} className="border rounded-2xl overflow-hidden">
                <button
                  onClick={() => toggleCategory(category.name)}
                  className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors text-left"
                >
                  <div className="flex items-center">
                    {category.icon}
                    <h3 className="font-medium">{category.name}</h3>
                  </div>
                  {expandedCategories[category.name] ? (
                    <ChevronUp className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  )}
                </button>
                
                {expandedCategories[category.name] && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 bg-muted/10">
                    {category.items.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => handleUseCaseClick(item)}
                        className="p-4 rounded-xl border bg-card hover:bg-muted/50 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center mb-2">
                          {item.icon}
                          <h4 className="font-medium">{item.title}</h4>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {item.prompt}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
