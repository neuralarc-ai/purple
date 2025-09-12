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
      prompt: 'Analyze the uploaded image in detail. Describe all visible elements including objects, text, and context. Highlight key patterns or relationships and suggest possible interpretations. Recommend how this image could be improved or repurposed for use in [presentation/report/marketing].',
      icon: <ImageIcon className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
    },
    {
      id: 'analysis',
      title: 'Analysis',
      prompt: 'Perform a comprehensive analysis of the following [dataset/document/scenario]. Identify key patterns, trends, and anomalies. Generate clear insights that highlight risks and opportunities. Provide actionable recommendations and, if helpful, suggest visualizations like charts or tables.',
      icon: <BarChart2 className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
    },
    {
      id: 'webpage',
      title: 'Webpage',
      prompt: 'Generate a complete webpage for [company/product/service]. Include sections such as a hero banner with headline and call-to-action, an about section, product or service highlights, testimonials, and a contact form. Use a modern, responsive design with clear headings, structured layout, and engaging content tailored to the target audience.',
      icon: <FileCode className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
    },
    {
      id: 'summarize-document',
      title: 'Summarize Document',
      prompt: 'Summarize the following document: [upload text or file]. Create a concise overview broken into sections that highlight main arguments, evidence, and conclusions. Ensure the summary is clear, decision-focused, and easy to share with [team/clients/stakeholders].',
      icon: <FileText className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
    },
    {
      id: 'spreadsheet',
      title: 'Spreadsheet',
      prompt: 'Analyze the attached spreadsheet: [upload file]. Generate a summary of key patterns, trends, and important metrics. Highlight anomalies or errors if found. Recommend optimizations and suggest visualizations (charts/tables/graphs) that make the data easier to interpret.',
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

  // Render function for original use cases with responsive design
  const renderOriginalUseCaseRow = (rowItems: typeof originalUseCases) => (
    <div className="flex justify-center gap-2 w-full mb-2 flex-wrap">
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
        className="
        inline-flex items-center px-3 py-1.5 text-sm font-medium border border-border 
    hover:bg-muted/50 transition-colors focus:outline-none focus:ring-2 focus:ring-ring/50 focus:ring-offset-2
    rounded-[12px] min-[489px]:rounded-full
        "
      >
        {/* 👇 Mobile (<488px): square buttons, stacked layout */}
        <span className="flex flex-col items-center justify-center w-20 h-20 min-[489px]:hidden">
          {React.cloneElement(useCase.icon as React.ReactElement, {
            className:
              "h-6 w-6 text-muted-foreground group-hover:text-foreground transition-colors",
          })}
          <span className="text-xs mt-1 text-center">{useCase.title}</span>
        </span>
  
        {/* 👇 Desktop (≥489px): normal inline layout */}
        <span className="hidden min-[489px]:inline-flex items-center">
          {React.cloneElement(useCase.icon as React.ReactElement, {
            className:
              "h-4 w-4 mr-1.5 text-muted-foreground group-hover:text-foreground transition-colors",
          })}
          {useCase.title}
        </span>
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
      id: 'ceo',
      name: 'CEO',
      icon: <TrendingUp className="h-4 w-4 mr-2" />,
      items: [
        {
          id: 'strategic-planning',
          title: 'Strategic Planning',
          prompt: 'Develop a comprehensive 3-year strategic plan for a {{industry}} company. Include market analysis, competitive positioning, growth opportunities, and resource allocation. Define key initiatives, success metrics, and risk mitigation strategies. Provide a roadmap for execution with quarterly milestones and board reporting frameworks.',
          icon: <Target className="h-4 w-4 mr-2 text-muted-foreground" />
        },
        {
          id: 'board-presentation',
          title: 'Board Presentation',
          prompt: 'Create a quarterly board presentation for a {{industry}} company covering financial performance, strategic initiatives, market trends, and operational metrics. Include executive summary, key achievements, challenges, and forward-looking strategies. Ensure clear visualizations and actionable insights for board decision-making.',
          icon: <BarChart2 className="h-4 w-4 mr-2 text-muted-foreground" />
        },
        {
          id: 'leadership-team-building',
          title: 'Leadership Team Building',
          prompt: 'Design a leadership development program for C-suite executives in a {{industry}} organization. Include succession planning, executive coaching, cross-functional collaboration, and performance management. Define leadership competencies, assessment methods, and development pathways for senior talent.',
          icon: <Users className="h-4 w-4 mr-2 text-muted-foreground" />
        },
        {
          id: 'investor-relations',
          title: 'Investor Relations',
          prompt: 'Develop an investor relations strategy for a {{industry}} company including quarterly earnings calls, investor presentations, and stakeholder communication. Cover financial storytelling, market positioning, growth narratives, and risk communication. Include templates for investor updates and Q&A preparation.',
          icon: <TrendingUp className="h-4 w-4 mr-2 text-muted-foreground" />
        },
        {
          id: 'crisis-management',
          title: 'Crisis Management',
          prompt: 'Create a crisis management framework for a {{industry}} company covering communication protocols, stakeholder management, and business continuity. Include scenarios like market downturns, regulatory changes, or operational disruptions. Define escalation procedures, decision-making authority, and recovery strategies.',
          icon: <Shield className="h-4 w-4 mr-2 text-muted-foreground" />
        },
        {
          id: 'digital-transformation',
          title: 'Digital Transformation',
          prompt: 'Lead a digital transformation initiative for a {{industry}} organization. Assess current technology landscape, identify transformation opportunities, and create a roadmap for modernization. Include change management strategies, ROI projections, and success metrics for digital adoption across all business functions.',
          icon: <Cpu className="h-4 w-4 mr-2 text-muted-foreground" />
        }
      ]
    },
    {
      id: 'founder',
      name: 'Founder',
      icon: <Lightbulb className="h-4 w-4 mr-2" />,
      items: [
        {
          id: 'startup-fundraising',
          title: 'Startup Fundraising',
          prompt: 'Prepare a comprehensive fundraising strategy for a {{industry}} startup including pitch deck development, investor targeting, and due diligence preparation. Cover valuation methodologies, term sheet negotiation, and investor relationship management. Include templates for pitch presentations and financial projections.',
          icon: <DollarSign className="h-4 w-4 mr-2 text-muted-foreground" />
        },
        {
          id: 'product-market-fit',
          title: 'Product-Market Fit',
          prompt: 'Develop a product-market fit strategy for a {{industry}} startup. Include customer discovery methods, MVP development, user feedback loops, and iteration cycles. Define success metrics, customer acquisition strategies, and scaling approaches once product-market fit is achieved.',
          icon: <Target className="h-4 w-4 mr-2 text-muted-foreground" />
        },
        {
          id: 'team-scaling',
          title: 'Team Scaling',
          prompt: 'Create a team scaling plan for a growing {{industry}} startup from 10 to 100 employees. Include hiring strategies, culture building, organizational structure, and leadership development. Cover remote work policies, equity distribution, and retention strategies for early-stage companies.',
          icon: <Users className="h-4 w-4 mr-2 text-muted-foreground" />
        },
        {
          id: 'go-to-market-strategy',
          title: 'Go-to-Market Strategy',
          prompt: 'Design a go-to-market strategy for a {{industry}} startup including market segmentation, pricing models, distribution channels, and customer acquisition. Cover launch planning, competitive positioning, and growth hacking techniques. Include metrics for tracking GTM success and optimization strategies.',
          icon: <Megaphone className="h-4 w-4 mr-2 text-muted-foreground" />
        },
        {
          id: 'startup-operations',
          title: 'Startup Operations',
          prompt: 'Build operational frameworks for a {{industry}} startup including financial management, legal compliance, and operational efficiency. Cover cash flow management, vendor relationships, and process automation. Include templates for operational dashboards and KPI tracking systems.',
          icon: <Settings className="h-4 w-4 mr-2 text-muted-foreground" />
        },
        {
          id: 'exit-strategy',
          title: 'Exit Strategy Planning',
          prompt: 'Develop an exit strategy framework for a {{industry}} startup including IPO preparation, acquisition readiness, and strategic partnership opportunities. Cover valuation optimization, due diligence preparation, and stakeholder alignment. Include timelines and milestones for different exit scenarios.',
          icon: <TrendingUp className="h-4 w-4 mr-2 text-muted-foreground" />
        }
      ]
    },
    {
      id: 'engineering',
      name: 'Engineering',
      icon: <Cpu className="h-4 w-4 mr-2" />,
      items: [
        {
          id: 'optimize-system',
          title: 'System Optimization',
          prompt: 'Analyze a large-scale distributed system for performance bottlenecks. Provide a detailed plan to improve throughput, latency, and resource utilization. Suggest code-level improvements, caching strategies, and infrastructure scaling methods while ensuring minimal downtime.',
          icon: <Cpu className="h-4 w-4 mr-2 text-muted-foreground" />
        },
        {
          id: 'api-debugging',
          title: 'API Debugging',
          prompt: 'Investigate API latency issues occurring in a production environment. Identify possible root causes such as inefficient queries, network congestion, or memory leaks. Recommend monitoring tools, profiling techniques, and fixes to restore optimal response times.',
          icon: <Code className="h-4 w-4 mr-2 text-muted-foreground" />
        },
        {
          id: 'ci-cd-pipeline',
          title: 'CI/CD Pipeline',
          prompt: 'Design an automated CI/CD pipeline using GitHub Actions, Docker, and Kubernetes. Ensure proper build, test, and deployment stages with rollback strategies in case of failures. Highlight tools for continuous monitoring and security integration.',
          icon: <GitBranch className="h-4 w-4 mr-2 text-muted-foreground" />
        },
        {
          id: 'feature-docs',
          title: 'Feature Documentation',
          prompt: 'Draft comprehensive documentation for a newly released feature. Include the feature’s purpose, technical specifications, usage instructions, known limitations, and code examples. Make the content suitable for both technical and non-technical stakeholders.',
          icon: <FileTextIcon className="h-4 w-4 mr-2 text-muted-foreground" />
        },
        {
          id: 'infrastructure monitoring',
          title: 'Infrastructure Monitoring',
          prompt: 'Recommend a complete monitoring and alerting setup for cloud-based infrastructure. Compare tools like Prometheus, Grafana, or Datadog. Define key metrics (CPU, memory, error rates), set up alert thresholds, and propose dashboards for visibility.',
          icon: <BarChart2 className="h-4 w-4 mr-2 text-muted-foreground" />
        },
        {
          id: 'secure-coding',
          title: 'Secure Coding',
          prompt: 'Suggest best practices for writing secure code in microservices architecture. Cover areas like input validation, authentication/authorization, encryption, and dependency management. Include real-world examples of vulnerabilities and mitigation strategies.',
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
          prompt: 'Design a quarterly roadmap for a {{industry}} SaaS product. Break down epics, milestones, and feature releases aligned with business goals. Include dependencies across engineering, marketing, and sales. Suggest KPIs to track adoption and customer satisfaction.',
          icon: <LayoutDashboard className="h-4 w-4 mr-2 text-muted-foreground" />
        },
        {
          id: 'prd-template',
          title: 'PRD Template',
          prompt: 'Draft a PRD for a new {{industry}} feature. Define the problem statement, target users, acceptance criteria, and technical dependencies. Include wireframes or mockups for clarity. Suggest metrics to evaluate success post-launch.',
          icon: <FileTextIcon className="h-4 w-4 mr-2 text-muted-foreground" />
        },
        {
          id: 'backlog-prioritization',
          title: 'Backlog Prioritization',
          prompt: 'Develop a framework to prioritize backlog tasks for a {{industry}} product. Apply models like RICE (Reach, Impact, Confidence, Effort) or MoSCoW. Highlight how this ensures resource alignment with high-value features. Provide an example prioritization matrix.',
          icon: <ClipboardList className="h-4 w-4 mr-2 text-muted-foreground" />
        },
        {
          id: 'product-kpis',
          title: 'Product KPIs',
          prompt: 'Generate a set of KPIs to track feature adoption in {{industry}} products. Metrics could include DAU/MAU, churn rates, feature utilization, and NPS. Recommend dashboards for real-time visibility and reporting for stakeholders.',
          icon: <BarChart2 className="h-4 w-4 mr-2 text-muted-foreground" />
        },
        {
          id: 'competitive-analysis',
          title: 'Competitive Analysis',
          prompt: 'Perform a competitive analysis for a {{industry}} solution. Compare features, pricing, user experience, and adoption strategies with top competitors. Highlight gaps and opportunities. Suggest strategies to differentiate and capture market share.',
          icon: <Search className="h-4 w-4 mr-2 text-muted-foreground" />
        },
        {
          id: 'launch-checklist',
          title: 'Launch Checklist',
          prompt: 'Create a product launch checklist for cross-functional teams in {{industry}}. Cover tasks across engineering, QA, marketing, customer support, and sales. Include risk management steps and contingency planning. Ensure alignment with go-to-market strategies.',
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
          id: 'recruitment strategy plan',
          title: 'Recruitment Strategy Plan',
          prompt: 'Design a recruitment strategy for a fast-growing {{industry}} company. Outline sourcing methods, job descriptions, interview processes, and assessment frameworks. Recommend tools for applicant tracking and diversity-focused hiring. Suggest KPIs such as time-to-hire, cost-per-hire, and quality-of-hire.',
          icon: <FileTextIcon className="h-4 w-4 mr-2 text-muted-foreground" />
        },
        {
          id: 'employee onboarding program',
          title: 'Employee Onboarding Program',
          prompt: 'Create a structured onboarding program for new hires in {{industry}}. Include pre-joining touchpoints, first-day experiences, role-based training, and buddy systems. Highlight cultural integration and employee engagement. Recommend metrics like retention rate after 90 days and employee satisfaction scores.',
          icon: <Users className="h-4 w-4 mr-2 text-muted-foreground" />
        },
        {
          id: 'performance management framework',
          title: 'Performance Management Framework',
          prompt: 'Develop a performance review system for {{industry}} teams. Incorporate goal-setting (OKRs/KPIs), continuous feedback, and quarterly appraisals. Suggest tools for performance tracking and manager-employee check-ins. Highlight methods to ensure fairness and transparency in evaluations.',
          icon: <ClipboardList className="h-4 w-4 mr-2 text-muted-foreground" />
        },
        {
          id: 'employee engagement survey design',
          title: 'Employee Engagement Survey Design',
          prompt: 'Draft an employee engagement survey for a {{industry}} organization. Include questions on job satisfaction, career growth, work-life balance, and leadership effectiveness. Provide guidance on survey cadence, anonymity, and analysis techniques. Suggest action plans based on results.',
          icon: <Users2 className="h-4 w-4 mr-2 text-muted-foreground" />
        },
        {
          id: 'learning & development roadmap',
          title: 'Learning & Development Roadmap',
          prompt: 'Build an L&D strategy for employees in {{industry}}. Identify role-specific skills, soft skill training, and leadership programs. Recommend platforms (Coursera, Udemy, in-house workshops). Define KPIs such as training completion rates, skill assessments, and internal mobility success rates.',
          icon: <Lightbulb className="h-4 w-4 mr-2 text-muted-foreground" />
        },
        {
          id: 'hr policy handbook creation',
          title: 'HR Policy Handbook Creation',
          prompt: 'Draft a comprehensive HR policy handbook for a {{industry}} firm. Cover leave policies, workplace ethics, remote work guidelines, DEI initiatives, grievance redressal, and compliance regulations. Ensure alignment with labor laws. Suggest digital platforms for easy employee access.',
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
          prompt: 'Create a 12-month financial forecasting model for a {{industry}} company. Include revenue projections, operating expenses, and net profit margins. Factor in market growth trends, seasonality, and customer acquisition rates. Suggest Excel or Python-based frameworks for automation. Provide clear KPIs like cash runway and break-even analysis.',
          icon: <LineChart className="h-4 w-4 mr-2 text-muted-foreground" />
        },
        {
          id: 'cost optimization plan',
          title: 'Cost Optimization Plan',
          prompt: 'Design a cost optimization plan for a {{industry}} company experiencing high operational expenses. Identify unnecessary overheads, negotiate vendor contracts, and automate financial workflows. Suggest benchmarks like cost per employee, customer acquisition cost, and operating margin improvements.',
          icon: <TrendingDown className="h-4 w-4 mr-2 text-muted-foreground" />
        },
        {
          id: 'compliance & audit preparatio',
          title: 'Compliance & Audit Preparatio',
          prompt: 'Draft an internal audit checklist to ensure compliance with financial regulations (e.g., GAAP, IFRS, SOX). Cover key areas like expense reporting, payroll, tax compliance, and asset management. Recommend digital tools for audit tracking. Provide steps to prepare teams for external audits..',
          icon: <FileCheck className="h-4 w-4 mr-2 text-muted-foreground" />
        },
        {
          id: 'budget-allocation',
          title: 'Budget Allocation',
          prompt: 'Develop a budget allocation strategy for a {{industry}} organization with multiple departments. Prioritize funding across R&D, operations, marketing, and HR. Recommend frameworks like zero-based budgeting or activity-based costing. Highlight risks of overspending and propose cost-saving measures without impacting productivity.',
          icon: <PieChart className="h-4 w-4 mr-2 text-muted-foreground" />
        },
        {
          id: 'M&A Financial Due Diligence',
          title: 'M&A Financial Due Diligence',
          prompt: 'Prepare a financial due diligence framework for a merger or acquisition in the {{industry}} sector. Analyze target company’s cash flows, debts, assets, and revenue streams. Identify red flags like inflated valuations or hidden liabilities. Provide a structured report for decision-makers.',
          icon: <Zap className="h-4 w-4 mr-2 text-muted-foreground" />
        },
        {
          id: 'investment isk-assessment',
          title: 'Investment Risk Assessment',
          prompt: 'Perform a risk assessment for a new investment in the {{industry}} sector. Analyze market volatility, liquidity risk, credit exposure, and regulatory compliance. Suggest methods like Monte Carlo simulations or Value-at-Risk. Provide a decision matrix showing potential returns vs. risk factors.',
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
          prompt: 'Design a 3-month social media content calendar for a {{industry}} company. Include platform-specific strategies for LinkedIn, Instagram, and Twitter. Suggest optimal posting times, content formats (videos, carousels, blogs), and engagement tactics. Ensure alignment with seasonal events, campaigns, and brand voice.',
          icon: <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
        },
        {
          id: 'digital-marketing-strategy',
          title: 'Digital Marketing Strategy',
          prompt: 'Develop a digital marketing strategy for a {{industry}} organization. Incorporate paid ads, organic content, and email automation. Define KPIs such as CTR, CAC, and conversion rates. Propose a channel mix balancing brand awareness and lead generation. Highlight budget allocation and ROI expectations.',
          icon: <Megaphone className="h-4 w-4 mr-2 text-muted-foreground" />
        },
        {
          id: 'seo-keywords',
          title: 'SEO & Content',
          prompt: 'Generate a list of high-ranking SEO keywords for a {{industry}} business. Use a combination of short-tail and long-tail keywords relevant to customer intent. Map keywords to landing pages and blog topics. Suggest optimization methods like on-page SEO, backlinks, and schema markup.',
          icon: <Search className="h-4 w-4 mr-2 text-muted-foreground" />
        },
        {
          id: 'customer-segmentation',
          title: 'Customer Segments',
          prompt: 'Build a customer segmentation strategy for a {{industry}} company. Define personas based on demographics, spending behavior, ARPU, or engagement scores. Recommend personalized campaigns for each segment. Suggest metrics like churn rates, CLV, and retention ratios to measure effectiveness.',
          icon: <Users className="h-4 w-4 mr-2 text-muted-foreground" />
        },
        {
          id: 'influencer-outreach',
          title: 'Influencer Outreach',
          prompt: 'Design an influencer marketing plan for {{industry}}. Identify relevant influencers by audience demographics, engagement rates, and credibility. Draft outreach templates, define partnership KPIs, and propose incentive models (affiliate, flat fee, or product-based). Ensure brand safety and compliance guidelines.',
          icon: <MessageSquare className="h-4 w-4 mr-2 text-muted-foreground" />
        },
        {
          id: 'competitor-analysis-report',
          title: 'Competitor Analysis Report',
          prompt: 'Create a competitor analysis framework for a {{industry}} business. Compare competitors’ digital presence, ad strategies, SEO performance, and customer engagement levels. Highlight gaps and opportunities in positioning. Recommend actionable steps to differentiate and increase market share.',
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
          id: 'sales-pitch-development',
          title: 'Sales Pitch Development',
          prompt: 'Craft a compelling sales pitch for a {{industry}} solution targeting decision-makers. Highlight the product’s unique value proposition, ROI impact, and competitive differentiation. Include storytelling elements and industry-specific case studies. Provide variations for in-person, email, and virtual presentations.',
          icon: <MessageSquare className="h-4 w-4 mr-2 text-muted-foreground" />
        },
        {
          id: 'cold-outreach',
          title: 'Cold Outreach',
          prompt: 'Design a cold outreach sequence for potential leads in {{industry}}. Structure a 3–5 touchpoint strategy using personalized emails, LinkedIn messages, and follow-up calls. Recommend tone, frequency, and key hooks to capture attention. Provide templates optimized for high open and reply rates.',
          icon: <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
        },
        {
          id: 'crm-optimization',
          title: 'CRM Optimization',
          prompt: 'Evaluate the CRM system for {{industry}} sales teams to ensure maximum productivity. Recommend pipeline structuring, lead scoring, automation rules, and data hygiene practices. Suggest integrations with marketing tools for lead nurturing. Provide KPIs like lead conversion rate and sales vel',
          icon: <LayoutGrid className="h-4 w-4 mr-2 text-muted-foreground" />
        },
        {
          id: 'upselling-strategies',
          title: 'Upselling & Cross-Selling Playbook',
          prompt: 'Develop an upselling and cross-selling strategy tailored for {{industry}}. Identify key triggers such as product adoption milestones, contract renewals, or usage thresholds. Provide scripts and offers for account managers to use. Highlight metrics like average deal size and customer lifetime value.',
          icon: <TrendingUp className="h-4 w-4 mr-2 text-muted-foreground" />
        },
        {
          id: 'sales-playbook',
          title: 'Sales Playbook',
          prompt: 'Create a sales playbook for {{industry}} sales teams covering prospecting, objection handling, product demos, and closing techniques. Include best practices, role-specific responsibilities, and deal stage guidelines. Recommend tools for collaboration and tracking performance across the funnel.',
          icon: <BookOpen className="h-4 w-4 mr-2 text-muted-foreground" />
        },
        {
          id: 'sales-metrics-dashboard',
          title: 'Sales Metrics Dashboard',
          prompt: 'Design a sales metrics dashboard for a {{industry}} company. Track KPIs like quota attainment, win rates, pipeline coverage, and average deal cycle. Suggest visualization tools (Tableau, Power BI, or CRM dashboards). Provide insights on how to interpret metrics for coaching and forecasting.',
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
          prompt: 'Draft a Standard Operating Procedure (SOP) for a {{industry}} organization to ensure consistency in daily operations. Break processes into step-by-step guidelines covering quality checks, compliance, and employee responsibilities. Include escalation paths, approval workflows, and training recommendations. Suggest digital documentation tools for easy updates.',
          icon: <FileTextIcon className="h-4 w-4 mr-2 text-muted-foreground" />
        },
        {
          id: 'supply-chain-optimization',
          title: 'Supply Chain Optimization',
          prompt: 'Design a supply chain optimization strategy for a {{industry}} company. Map supplier relationships, logistics networks, and demand cycles. Highlight risks like lead-time delays or geopolitical dependencies. Recommend predictive analytics, demand forecasting, and supplier scorecards to enhance resilience and efficiency.',
          icon: <Package className="h-4 w-4 mr-2 text-muted-foreground" />
        },
        {
          id: 'inventory-tracking-forecasting',
          title: 'Inventory Tracking & Forecasting',
          prompt: 'Develop an inventory tracking and forecasting system for a {{industry}} organization. Integrate real-time monitoring of stock levels, safety stock, and reorder points. Suggest methods like ABC analysis or JIT (Just-in-Time) inventory. Recommend ERP integration or IoT sensors for accurate demand planning.',
          icon: <ClipboardList className="h-4 w-4 mr-2 text-muted-foreground" />
        },
        {
          id: 'process-automation-blueprint',
          title: 'Process Automation Blueprint',
          prompt: 'Build a process automation blueprint for recurring operational tasks in a {{industry}} firm. Identify areas like procurement approvals, reporting, or workforce scheduling. Propose technologies such as RPA (Robotic Process Automation) or workflow engines. Highlight success metrics like cycle time reduction and error minimization.',
          icon: <Zap className="h-4 w-4 mr-2 text-muted-foreground" />
        },
        {
          id: 'cost-reduction-ops',
          title: 'Cost Reduction',
          prompt: 'Prepare a cost reduction plan focusing on operational efficiencies. Identify high-cost activities like energy consumption, logistics, or manual rework. Recommend lean management techniques, vendor negotiations, and automation opportunities. Provide measurable KPIs such as cost per unit, defect rate reduction, and improved resource utilization.',
          icon: <TrendingDown className="h-4 w-4 mr-2 text-muted-foreground" />
        },
        {
          id: 'project-management-tools-evaluation',
          title: 'Project Management Tools Evaluation',
          prompt: 'Evaluate project management tools suitable for {{industry}} operations. Compare solutions like Asana, Trello, Jira, or MS Project. Assess features for task tracking, reporting dashboards, and cross-team collaboration. Recommend the best-fit tool aligned with project complexity, scalability, and budget. Include implementation roadmap and adoption KPIs..',
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
          prompt: 'Design a machine learning model to predict customer churn in a {{industry}} company. Use historical transaction, engagement, and demographic data to train predictive algorithms. Recommend features such as usage frequency, complaints, or inactivity signals. Provide strategies for retention campaigns based on model outcomes.',
          icon: <BarChart2 className="h-4 w-4 mr-2 text-muted-foreground" />
        },
        {
          id: 'data-governance',
          title: 'Data Governance',
          prompt: 'Develop a comprehensive data governance strategy for a {{industry}} organization. Include policies for data ownership, privacy, compliance, and access control. Recommend metadata management tools and automated validation workflows. Highlight benefits like improved data quality, security, and regulatory alignment (GDPR, HIPAA, etc.).',
          icon: <Shield className="h-4 w-4 mr-2 text-muted-foreground" />
        },
        {
          id: 'executive-dashboards',
          title: 'Executive Dashboards',
          prompt: 'Build interactive dashboards to track executive-level KPIs in a {{industry}} business. Include metrics like revenue growth, churn rate, operational efficiency, and customer satisfaction. Recommend visualization tools such as Tableau, Power BI, or Looker. Ensure dashboards are dynamic, drill-down enabled, and mobile-friendly.',
          icon: <LayoutDashboard className="h-4 w-4 mr-2 text-muted-foreground" />
        },
        {
          id: 'anomaly-detection',
          title: 'Anomaly Detection',
          prompt: 'Create an anomaly detection system for real-time monitoring of {{industry}} operations. Apply techniques such as Isolation Forest, Autoencoders, or Bayesian methods. Detect fraud, equipment failures, or unusual customer activity. Provide alerts with confidence scores and categorize anomalies by severity for quick action.',
          icon: <AlertCircle className="h-4 w-4 mr-2 text-muted-foreground" />
        },
        {
          id: 'ml-use-cases',
          title: 'ML Use Cases',
          prompt: 'Propose a roadmap of machine learning use cases tailored for {{industry}}. Include short-term wins (recommendation engines, process automation), mid-term projects (predictive maintenance, fraud detection), and long-term initiatives (personalized AI-driven experiences). Prioritize based on ROI, complexity, and implementation feasibility.',
          icon: <Brain className="h-4 w-4 mr-2 text-muted-foreground" />
        },
        {
          id: 'data-cleaning-preprocessing',
          title: 'Data Cleaning & Preprocessing Plan',
          prompt: 'Outline a structured process for cleaning and preprocessing raw {{industry}} datasets. Handle missing values, duplicate records, outliers, and inconsistent formats. Recommend scalable tools like Pandas, Spark, or dbt. Ensure data pipelines maintain reproducibility and document all transformations for auditability..',
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
          prompt: 'Create low-fidelity wireframes for a new {{industry}} platform’s landing page, dashboard, and user onboarding flow. Focus on layout clarity, content hierarchy, and intuitive navigation. Suggest wireframing tools like Figma or Balsamiq. Provide at least two variations to compare user flow efficiency.',
          icon: <LayoutTemplate className="h-4 w-4 mr-2 text-muted-foreground" />
        },
        {
          id: 'accessibility-audit-checklist',
          title: 'Accessibility Audit Checklist',
          prompt: 'Conduct an accessibility audit for a {{industry}} website or application. Ensure compliance with WCAG 2.1 AA standards. Test screen reader compatibility, color contrast, keyboard navigation, and ARIA labels. Recommend design changes that improve inclusivity without disrupting brand identity.',
          icon: <Accessibility className="h-4 w-4 mr-2 text-muted-foreground" />
        },
        {
          id: 'design-system-documentation',
          title: 'Design System Documentation',
          prompt: 'Build a scalable design system for a {{industry}} product. Define typography, color palettes, component libraries, and interaction patterns. Include usage guidelines, versioning, and governance policies. Provide Figma-based templates to ensure consistency across product teams and external vendors.',
          icon: <LayoutGrid className="h-4 w-4 mr-2 text-muted-foreground" />
        },
        {
          id: 'ux-research',
          title: 'UX Research',
          prompt: 'Design a UX research plan for a {{industry}} digital product. Outline goals, participant recruitment strategies, and research methods like usability testing, card sorting, and surveys. Include measurable success metrics such as task completion rates and time on task. Suggest how findings should be documented and shared.',
          icon: <Users className="h-4 w-4 mr-2 text-muted-foreground" />
        },
        {
          id: 'branding-guidelines',
          title: 'Branding',
          prompt: 'Develop branding guidelines for a {{industry}} organization. Define visual identity (logos, typography, and color palette), tone of voice, and content style. Provide do’s and don’ts for logo placement and asset usage. Create templates for presentations, social media, and marketing collateral.',
          icon: <Palette className="h-4 w-4 mr-2 text-muted-foreground" />
        },
        {
          id: 'figma-workflows',
          title: 'Figma Workflows',
          prompt: 'Design an efficient Figma workflow for a {{industry}} product team. Recommend naming conventions, component structuring, and version control practices. Suggest how to integrate Figma with tools like Jira or Notion. Provide tips for team collaboration, including shared libraries and prototyping best practices.',
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
          title: 'Contract Template Drafting',
          prompt: 'Create a customizable contract template for a {{industry}} business engaging with clients or vendors. Include standard clauses for payment terms, termination rights, dispute resolution, and confidentiality. Ensure it is adaptable across jurisdictions. Highlight optional add-ons like arbitration or late-payment penalties.',
          icon: <FileTextIcon className="h-4 w-4 mr-2 text-muted-foreground" />
        },
        {
          id: 'compliance-checklist-legal',
          title: 'Compliance checklist',
          prompt: 'Design a compliance checklist tailored to the {{industry}} sector. Cover mandatory regulations such as GDPR, HIPAA, PCI DSS, or local labor laws depending on context. Suggest methods to monitor ongoing compliance. Recommend digital tools or frameworks for tracking regulatory updates..',
          icon: <Shield className="h-4 w-4 mr-2 text-muted-foreground" />
        },
        {
          id: 'risk-management',
          title: 'Risk Management policy',
          prompt: 'Develop a legal risk management framework for a {{industry}} organization. Identify potential liabilities, contract risks, IP disputes, and data protection breaches. Include a scoring model to prioritize risks. Propose mitigation strategies such as insurance coverage, stronger indemnities, and regular compliance.',
          icon: <AlertTriangle className="h-4 w-4 mr-2 text-muted-foreground" />
        },
        {
          id: 'nda-template',
          title: 'NDA Template',
          prompt: 'Draft a non-disclosure agreement (NDA) template for a {{industry}} business to safeguard sensitive information. Include clear definitions of confidential data, permitted use, and exclusions. Define the duration of obligations and penalties for breach. Ensure adaptability for employees, contractors, and third-party vendors.',
          icon: <FileSignature className="h-4 w-4 mr-2 text-muted-foreground" />
        },
        {
          id: 'employment-agreements',
          title: 'Employment Agreements',
          prompt: 'Create an employment agreement template for {{industry}} companies hiring full-time staff. Cover job role, salary, benefits, termination conditions, and non-compete obligations. Highlight compliance with local labor and tax laws. Provide optional clauses like intellectual property ownership and remote work policies.',
          icon: <FileTextIcon className="h-4 w-4 mr-2 text-muted-foreground" />
        },
        {
          id: 'client-intake',
          title: 'Client Intake',
          prompt: 'Design a comprehensive client intake form for {{industry}} legal practice. Include case details, opposing party information, deadlines, and required documentation. Ensure data privacy compliance under GDPR or local laws. Provide sections for conflict checks and billing preferences to streamline onboarding.',
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
          title: 'Productivity Tool Evaluation',
          prompt: 'Evaluate the best productivity tools for a {{industry}} team managing remote and hybrid work. Compare collaboration features, integrations, pricing, and security. Suggest the top 3 tools that can improve efficiency and reduce context switching. Provide a decision matrix with pros and cons.',
          icon: <Zap className="h-4 w-4 mr-2 text-muted-foreground" />
        },
        {
          id: 'learning-plan',
          title: 'Learning Plan',
          prompt: 'Develop a structured learning plan for employees in a {{industry}} company. Cover role-specific upskilling, compliance training, and leadership development. Suggest a mix of e-learning, peer mentoring, and workshops. Define milestones, completion goals, and ROI measurement methods.',
          icon: <BookOpen className="h-4 w-4 mr-2 text-muted-foreground" />
        },
        {
          id: 'communication-guidelines',
          title: 'Communication Guidlines',
          prompt: 'Create a communication framework for a {{industry}} workplace. Define tone, frequency, and preferred channels for internal and external communication. Address remote/hybrid team needs, escalation flows, and conflict resolution steps. Provide do’s and don’ts for consistency.',
          icon: <MessageSquare className="h-4 w-4 mr-2 text-muted-foreground" />
        },
        {
          id: 'reporting-templates',
          title: 'Reporting Templates',
          prompt: 'Design a reporting template system for a {{industry}} business. Include finance, HR, and project status reports. Recommend visualization formats like dashboards for executives. Define reporting frequency, compliance requirements, and automation opportunities.',
          icon: <FileTextIcon className="h-4 w-4 mr-2 text-muted-foreground" />
        },
        {
          id: 'knowledge-management',
          title: 'Knowledge Management',
          prompt: 'Develop a knowledge management strategy for a {{industry}} team. Suggest platforms for centralized repositories, guidelines for version control, and a framework for capturing and sharing expertise. Include governance policies, incentives for contributions, and usage metric',
          icon: <Database className="h-4 w-4 mr-2 text-muted-foreground" />
        },
        {
          id: 'automation-opportunities',
          title: 'Automation',
          prompt: 'Identify automation opportunities in a {{industry}} organization. Map repetitive workflows across finance, HR, and customer service. Recommend RPA or AI-driven solutions, estimate cost and time savings, and outline an implementation roadmap with measurable ROI.',
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
      className={`w-full max-w-7xl h-full flex flex-col justify-between mx-auto px-6 py-8 transition-all duration-700 ease-out ${isVisible
          ? 'translate-y-0 opacity-100'
          : 'translate-y-8 opacity-0'
        }`}
    >
      {/* Original Use Cases - Always show these */}
      <div className="mb-10">
        <div className="flex flex-col items-center gap-2">
          {renderOriginalUseCaseRow(firstRow)}
          {secondRow.length > 0 && renderOriginalUseCaseRow(secondRow)}
        </div>
      </div>

      {/* Categorized Use Cases */}
      {!shouldShowAllCategories && (
        <div className="mt-6">
          <div className="space-y-4">
            {filteredCategories.map((category) => (
              <div key={category.id} className="overflow-hidden">
                {/* <div className="w-full flex items-center justify-between p-4 bg-muted/50">
                  <div className="flex items-center">
                    {category.icon}
                    <h3 className="font-medium">{category.name}</h3>
                  </div>
                </div> */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 bg-background/50">
                  {category.items.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleUseCaseClick(item)}
                      className="group relative p-5 rounded-2xl border dark:border-muted/50 bg-sidebar-accent/60 dakr:bg-sidebar-accent/30 backdrop-blur-sm hover:bg-card/60 hover:border-border hover:shadow-md transition-all duration-300 cursor-pointer overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors duration-300">
                            {React.cloneElement(item.icon as React.ReactElement, {
                              className: "h-4 w-4 text-primary"
                            })}
                          </div>
                          <h4 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors duration-300">{item.title}</h4>
                        </div>
                        <p className="text-xs text-muted-foreground/80 line-clamp-3 leading-relaxed group-hover:text-muted-foreground transition-colors duration-300">
                          {item.prompt}
                        </p>
                      </div>
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
        <div className="mt-6">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent mb-2">Use Cases by Category</h2>
            <p className="text-muted-foreground text-sm">Choose from our collection of specialized templates</p>
          </div>
          <div className="space-y-4">
            {categories.map((category) => (
              <div key={category.id} className="border border-muted/50 rounded-3xl overflow-hidden bg-sidebar-accent/30 backdrop-blur-sm shadow-sm">
                <button
                  onClick={() => toggleCategory(category.name)}
                  className="w-full flex items-center justify-between p-5 hover:bg-muted/30 transition-all duration-200 text-left group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors duration-200">
                      {React.cloneElement(category.icon as React.ReactElement, {
                        className: "h-4 w-4 text-primary"
                      })}
                    </div>
                    <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors duration-200">{category.name}</h3>
                  </div>
                  <div className="p-1 rounded-lg bg-muted/50 group-hover:bg-muted transition-colors duration-200">
                    {expandedCategories[category.name] ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors duration-200" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors duration-200" />
                    )}
                  </div>
                </button>

                {expandedCategories[category.name] && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 p-6 bg-background/50">
                    {category.items.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => handleUseCaseClick(item)}
                        className="group relative p-5 rounded-2xl border border-border/50 bg-card/30 backdrop-blur-sm hover:bg-card/60 hover:border-border hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        <div className="relative z-10">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors duration-300">
                              {React.cloneElement(item.icon as React.ReactElement, {
                                className: "h-4 w-4 text-primary"
                              })}
                            </div>
                            <h4 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors duration-300">{item.title}</h4>
                          </div>
                          <p className="text-xs text-muted-foreground/80 line-clamp-3 leading-relaxed group-hover:text-muted-foreground transition-colors duration-300">
                            {item.prompt}
                          </p>
                        </div>
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
