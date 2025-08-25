import { NextRequest, NextResponse } from 'next/server';

// Enhanced role-specific context with comprehensive coverage
const getRoleSpecificContext = (role) => {
  const roleLower = role.toLowerCase();
  
  // Development roles
  if (roleLower.includes('frontend developer')) {
    return {
      diagnostic: 'Inspect browser developer tools, analyze component rendering, check responsive design across devices.',
      methodology: 'Apply component-based architecture, responsive design principles, and accessibility standards.',
      implementation: 'Build reusable components, optimize bundle size, implement proper state management.',
      optimization: 'Optimize rendering performance, minimize re-renders, implement code splitting and lazy loading.',
      collaboration: 'Work closely with designers, backend developers, and conduct cross-browser testing.',
      tools: 'React/Vue/Angular, TypeScript, Webpack, Chrome DevTools, Figma',
      frameworks: 'component libraries, design systems, and modern frontend architectures',
      validation: 'unit testing, visual regression testing, and accessibility audits',
      metrics: 'Core Web Vitals, bundle size, accessibility scores, and user engagement',
      community: 'frontend communities, design system teams, and UX researchers'
    };
  } else if (roleLower.includes('backend developer')) {
    return {
      diagnostic: 'Analyze server logs, monitor API performance, check database query efficiency.',
      methodology: 'Apply RESTful/GraphQL design, microservices architecture, and security best practices.',
      implementation: 'Build scalable APIs, implement proper authentication, design efficient database schemas.',
      optimization: 'Optimize database queries, implement caching strategies, scale horizontally.',
      collaboration: 'Coordinate with frontend teams, DevOps engineers, and database administrators.',
      tools: 'Node.js/Python/Java, databases, API testing tools, monitoring solutions',
      frameworks: 'Express/FastAPI/Spring, ORM libraries, and cloud platforms',
      validation: 'API testing, load testing, and security audits',
      metrics: 'response times, throughput, error rates, and system uptime',
      community: 'backend engineering teams, DevOps communities, and architecture groups'
    };
  } else if (roleLower.includes('devops engineer')) {
    return {
      diagnostic: 'Monitor system metrics, analyze deployment pipelines, check infrastructure health.',
      methodology: 'Apply Infrastructure as Code, CI/CD best practices, and monitoring strategies.',
      implementation: 'Automate deployments, configure monitoring, implement security policies.',
      optimization: 'Optimize resource utilization, reduce deployment times, improve system reliability.',
      collaboration: 'Support development teams, coordinate with security, manage infrastructure.',
      tools: 'Docker, Kubernetes, Terraform, Jenkins/GitHub Actions, monitoring tools',
      frameworks: 'GitOps, SRE practices, and cloud-native architectures',
      validation: 'infrastructure testing, security scans, and disaster recovery drills',
      metrics: 'deployment frequency, lead time, MTTR, and system availability',
      community: 'DevOps communities, SRE teams, and cloud platform experts'
    };
  }
  // Data & Analytics roles
  else if (roleLower.includes('data scientist')) {
    return {
      diagnostic: 'Explore data distributions, identify patterns, assess data quality and completeness.',
      methodology: 'Apply statistical analysis, machine learning techniques, and experimental design.',
      implementation: 'Build predictive models, create data pipelines, develop analytical frameworks.',
      optimization: 'Tune model hyperparameters, optimize feature engineering, improve model interpretability.',
      collaboration: 'Present insights to stakeholders, work with data engineers, validate with domain experts.',
      tools: 'Python/R, Jupyter, pandas, scikit-learn, TensorFlow/PyTorch, SQL',
      frameworks: 'CRISP-DM, MLOps practices, and statistical methodologies',
      validation: 'cross-validation, A/B testing, and model monitoring',
      metrics: 'model accuracy, business impact, data quality scores, and prediction confidence',
      community: 'data science teams, ML engineers, and business analysts'
    };
  } else if (roleLower.includes('data analyst')) {
    return {
      diagnostic: 'Examine data trends, identify anomalies, validate data sources and transformations.',
      methodology: 'Apply descriptive analytics, statistical testing, and business intelligence practices.',
      implementation: 'Create dashboards, generate reports, perform ad-hoc analysis.',
      optimization: 'Automate reporting processes, improve data visualization, enhance query performance.',
      collaboration: 'Support business decisions, communicate findings, train stakeholders on tools.',
      tools: 'SQL, Excel, Tableau/Power BI, Python/R, data warehousing tools',
      frameworks: 'business intelligence methodologies and data governance practices',
      validation: 'data validation, report accuracy checks, and stakeholder feedback',
      metrics: 'report accuracy, query performance, user adoption, and business KPIs',
      community: 'business intelligence teams, data engineers, and business stakeholders'
    };
  }
  // Design & UX roles
  else if (roleLower.includes('ux designer') || roleLower.includes('ui designer')) {
    return {
      diagnostic: 'Conduct user research, analyze user journeys, identify usability pain points.',
      methodology: 'Apply design thinking, user-centered design, and iterative prototyping.',
      implementation: 'Create wireframes, prototypes, and design systems with accessibility focus.',
      optimization: 'A/B test designs, optimize conversion funnels, improve user satisfaction.',
      collaboration: 'Work with product managers, developers, and conduct user testing sessions.',
      tools: 'Figma, Sketch, Adobe XD, prototyping tools, user research platforms',
      frameworks: 'design systems, accessibility guidelines, and usability heuristics',
      validation: 'user testing, accessibility audits, and design reviews',
      metrics: 'user satisfaction, task completion rates, conversion rates, and usability scores',
      community: 'design teams, UX researchers, and product communities'
    };
  }
  // Business & Management roles
  else if (roleLower.includes('product manager')) {
    return {
      diagnostic: 'Analyze market trends, assess user feedback, evaluate product performance metrics.',
      methodology: 'Apply agile methodologies, product discovery techniques, and data-driven decision making.',
      implementation: 'Define product roadmaps, prioritize features, coordinate cross-functional teams.',
      optimization: 'Optimize product-market fit, improve user engagement, maximize business value.',
      collaboration: 'Align stakeholders, facilitate team communication, gather customer insights.',
      tools: 'Jira, analytics platforms, user feedback tools, roadmapping software',
      frameworks: 'agile/scrum, OKRs, and product management methodologies',
      validation: 'user acceptance testing, market validation, and performance reviews',
      metrics: 'user engagement, feature adoption, revenue impact, and customer satisfaction',
      community: 'product management communities, cross-functional teams, and customer success'
    };
  }
  // Default fallback
  else {
    return {
      diagnostic: 'Systematically analyze the problem, gather relevant information, and identify key factors.',
      methodology: 'Apply industry best practices, proven frameworks, and structured approaches.',
      implementation: 'Execute solutions methodically with proper planning and resource allocation.',
      optimization: 'Continuously improve processes, measure outcomes, and refine approaches.',
      collaboration: 'Engage stakeholders, share knowledge, and build cross-functional relationships.',
      tools: 'industry-standard tools and technologies',
      frameworks: 'established methodologies and best practices',
      validation: 'quality assurance processes and peer reviews',
      metrics: 'relevant KPIs and success indicators',
      community: 'professional networks and subject matter experts'
    };
  }
};

// Enhanced task-specific context with comprehensive coverage
const getTaskSpecificContext = (task) => {
  const taskLower = task.toLowerCase();
  
  // Development tasks
  if (taskLower.includes('code review')) {
    return {
      diagnostic: 'Examine code structure, identify potential issues, check adherence to coding standards.',
      methodology: 'Apply systematic review process, use checklists, focus on security and performance.',
      implementation: 'Provide constructive feedback, suggest improvements, verify test coverage.',
      optimization: 'Streamline review process, use automated tools, focus on high-impact areas.',
      collaboration: 'Facilitate knowledge sharing, mentor junior developers, document best practices.'
    };
  } else if (taskLower.includes('bug fixing')) {
    return {
      diagnostic: 'Reproduce the bug consistently, analyze error logs, trace execution flow.',
      methodology: 'Use systematic debugging techniques, isolate root cause, test hypotheses.',
      implementation: 'Fix the underlying issue, add proper error handling, create regression tests.',
      optimization: 'Improve error detection, enhance logging, implement preventive measures.',
      collaboration: 'Document the fix, share learnings with team, update troubleshooting guides.'
    };
  } else if (taskLower.includes('feature implementation')) {
    return {
      diagnostic: 'Analyze requirements, assess technical feasibility, identify dependencies.',
      methodology: 'Break down into smaller tasks, follow TDD/BDD practices, plan iterative development.',
      implementation: 'Write clean, testable code, implement proper error handling, ensure scalability.',
      optimization: 'Optimize performance, minimize technical debt, ensure maintainability.',
      collaboration: 'Coordinate with stakeholders, conduct regular demos, gather feedback.'
    };
  } else if (taskLower.includes('api development') || taskLower.includes('api') || taskLower.includes('backend')) {
    return {
      diagnostic: 'Define API contracts, analyze data flow, assess security requirements.',
      methodology: 'Follow RESTful/GraphQL principles, implement proper authentication, use OpenAPI specs.',
      implementation: 'Build robust endpoints, handle edge cases, implement rate limiting.',
      optimization: 'Optimize response times, implement caching, ensure scalability.',
      collaboration: 'Coordinate with frontend teams, document APIs thoroughly, provide usage examples.'
    };
  } else if (taskLower.includes('authentication') || taskLower.includes('auth') || taskLower.includes('login') || taskLower.includes('user management')) {
    return {
      diagnostic: 'Analyze authentication requirements, assess security threats, evaluate user flow complexity.',
      methodology: 'Implement JWT/OAuth standards, use secure password hashing, follow authentication best practices.',
      implementation: 'Build secure login/logout endpoints, implement session management, create user registration flow.',
      optimization: 'Optimize token refresh mechanisms, implement rate limiting, enhance security monitoring.',
      collaboration: 'Coordinate with frontend for auth flow, work with security team, document authentication APIs.'
    };
  } else if (taskLower.includes('database') || taskLower.includes('data model') || taskLower.includes('schema')) {
    return {
      diagnostic: 'Analyze data requirements, assess relationships, evaluate performance needs.',
      methodology: 'Design normalized schemas, implement proper indexing, follow database best practices.',
      implementation: 'Create tables/collections, implement migrations, build data access layers.',
      optimization: 'Optimize queries, implement caching strategies, monitor database performance.',
      collaboration: 'Work with backend developers, coordinate with data analysts, document schema changes.'
    };
  } else if (taskLower.includes('deployment') || taskLower.includes('deploy') || taskLower.includes('production')) {
    return {
      diagnostic: 'Assess deployment requirements, analyze infrastructure needs, evaluate scaling demands.',
      methodology: 'Use CI/CD pipelines, implement infrastructure as code, follow deployment best practices.',
      implementation: 'Configure production environments, set up monitoring, implement rollback strategies.',
      optimization: 'Optimize deployment speed, implement blue-green deployments, enhance monitoring.',
      collaboration: 'Coordinate with DevOps team, work with infrastructure engineers, document deployment processes.'
    };
  }
  // Analysis & Research tasks
  else if (taskLower.includes('data analysis')) {
    return {
      diagnostic: 'Explore data distributions, identify patterns, assess data quality and completeness.',
      methodology: 'Apply statistical methods, use appropriate visualization techniques, validate assumptions.',
      implementation: 'Clean and transform data, perform analysis, create meaningful visualizations.',
      optimization: 'Automate repetitive tasks, improve analysis efficiency, enhance insights quality.',
      collaboration: 'Present findings clearly, collaborate with stakeholders, validate business relevance.'
    };
  } else if (taskLower.includes('market research')) {
    return {
      diagnostic: 'Define research objectives, identify target segments, assess competitive landscape.',
      methodology: 'Use mixed research methods, ensure sample representativeness, apply statistical rigor.',
      implementation: 'Conduct surveys/interviews, analyze market data, synthesize findings.',
      optimization: 'Refine research methodology, improve data collection efficiency, enhance insights.',
      collaboration: 'Engage with marketing teams, present to stakeholders, inform strategic decisions.'
    };
  }
  // Design & Creative tasks
  else if (taskLower.includes('ui/ux design')) {
    return {
      diagnostic: 'Analyze user needs, assess current user experience, identify pain points.',
      methodology: 'Apply design thinking, create user personas, develop user journey maps.',
      implementation: 'Create wireframes and prototypes, design intuitive interfaces, ensure accessibility.',
      optimization: 'Conduct usability testing, iterate based on feedback, optimize conversion flows.',
      collaboration: 'Work with developers on implementation, gather user feedback, align with brand guidelines.'
    };
  } else if (taskLower.includes('wireframing')) {
    return {
      diagnostic: 'Understand user requirements, analyze information architecture, assess content hierarchy.',
      methodology: 'Start with low-fidelity sketches, focus on functionality over aesthetics, iterate quickly.',
      implementation: 'Create clear wireframes, define interaction patterns, specify component behaviors.',
      optimization: 'Streamline user flows, reduce cognitive load, improve information architecture.',
      collaboration: 'Validate with stakeholders, coordinate with developers, gather user feedback.'
    };
  }
  // Planning & Strategy tasks
  else if (taskLower.includes('project planning')) {
    return {
      diagnostic: 'Assess project scope, identify stakeholders, analyze resource requirements.',
      methodology: 'Use project management frameworks, create detailed timelines, identify critical paths.',
      implementation: 'Develop comprehensive project plans, allocate resources, establish milestones.',
      optimization: 'Monitor progress regularly, adjust plans as needed, optimize resource utilization.',
      collaboration: 'Coordinate with team members, communicate with stakeholders, facilitate decision-making.'
    };
  } else if (taskLower.includes('risk assessment')) {
    return {
      diagnostic: 'Identify potential risks, assess probability and impact, analyze risk interdependencies.',
      methodology: 'Use risk assessment frameworks, quantify risks where possible, prioritize by severity.',
      implementation: 'Develop mitigation strategies, create contingency plans, establish monitoring systems.',
      optimization: 'Regularly review and update assessments, improve risk detection, enhance response plans.',
      collaboration: 'Engage with stakeholders, communicate risks clearly, coordinate mitigation efforts.'
    };
  }
  // Frontend tasks
  else if (taskLower.includes('frontend') || taskLower.includes('ui') || taskLower.includes('component') || taskLower.includes('react') || taskLower.includes('vue')) {
    return {
      diagnostic: 'Analyze component requirements, assess user interface needs, evaluate responsive design requirements.',
      methodology: 'Use component-based architecture, implement design systems, follow accessibility guidelines.',
      implementation: 'Build reusable components, implement state management, ensure cross-browser compatibility.',
      optimization: 'Optimize bundle size, implement lazy loading, enhance performance metrics.',
      collaboration: 'Work with designers, coordinate with backend team, conduct user testing.'
    };
  } else if (taskLower.includes('testing') || taskLower.includes('test') || taskLower.includes('qa')) {
    return {
      diagnostic: 'Identify test scenarios, analyze coverage gaps, assess testing requirements.',
      methodology: 'Implement unit/integration/e2e testing, use TDD/BDD approaches, follow testing pyramids.',
      implementation: 'Write comprehensive test suites, implement automated testing, create test data.',
      optimization: 'Optimize test execution time, improve test reliability, enhance coverage reporting.',
      collaboration: 'Work with QA team, coordinate with developers, document test strategies.'
    };
  } else if (taskLower.includes('performance') || taskLower.includes('optimization') || taskLower.includes('speed')) {
    return {
      diagnostic: 'Analyze performance bottlenecks, identify slow operations, assess resource usage.',
      methodology: 'Use performance profiling tools, implement caching strategies, follow optimization best practices.',
      implementation: 'Optimize critical paths, implement efficient algorithms, reduce resource consumption.',
      optimization: 'Monitor performance metrics, implement continuous optimization, enhance user experience.',
      collaboration: 'Work with infrastructure team, coordinate with stakeholders, share performance insights.'
    };
  } else if (taskLower.includes('security') || taskLower.includes('secure') || taskLower.includes('vulnerability')) {
    return {
      diagnostic: 'Assess security vulnerabilities, analyze threat vectors, evaluate security requirements.',
      methodology: 'Implement security best practices, use secure coding standards, follow OWASP guidelines.',
      implementation: 'Build secure systems, implement proper validation, create security controls.',
      optimization: 'Enhance security monitoring, improve threat detection, optimize security processes.',
      collaboration: 'Work with security team, coordinate with compliance, document security measures.'
    };
  }
  // Default fallback - make it more dynamic based on task keywords
  else {
    // Extract key words from task to make fallback more specific
    const taskWords = task.toLowerCase().split(' ').filter(word => word.length > 3);
    const primaryFocus = taskWords[0] || 'task';
    
    return {
      diagnostic: `Analyze ${primaryFocus} requirements, break down components, identify key challenges and dependencies.`,
      methodology: `Apply industry best practices for ${primaryFocus}, use proven frameworks and systematic approaches.`,
      implementation: `Execute ${primaryFocus} systematically with proper planning, quality controls, and iterative development.`,
      optimization: `Optimize ${primaryFocus} performance, measure outcomes, implement continuous improvements.`,
      collaboration: `Coordinate with relevant teams for ${primaryFocus}, document progress, share knowledge and learnings.`
    };
  }
};

export async function POST(request: NextRequest) {
  try {
    const { role, task } = await request.json();

    if (!role || !task) {
      return NextResponse.json(
        { error: 'Role and task are required' },
        { status: 400 }
      );
    }

    // Generate task-focused queries for Tavily API to ensure different insights for different tasks
    const generateTavilyQuery = (role, task, promptType) => {
      const roleSpecific = getRoleSpecificContext(role);
      const taskSpecific = getTaskSpecificContext(task);
      
      // Make queries more task-specific to get different insights for different tasks
      const taskFocusedQueries = {
        diagnostic: `${task} diagnostic analysis: how to identify problems, troubleshoot issues, analyze root causes, detect bottlenecks in ${task} for ${role}`,
        methodology: `${task} best practices and methodologies: proven frameworks, systematic approaches, industry standards, step-by-step processes for ${task} implementation`,
        implementation: `${task} implementation guide: practical execution strategies, technical solutions, development approaches, tools and techniques for ${task}`,
        optimization: `${task} optimization techniques: performance improvement methods, efficiency strategies, scaling approaches, advanced optimization for ${task}`,
        collaboration: `${task} team collaboration: coordination strategies, stakeholder management, communication patterns, knowledge sharing for ${task} projects`
      };
      
      // Include task-specific context and role tools for more targeted results
      return `${taskFocusedQueries[promptType]}. Context: ${taskSpecific.diagnostic} ${taskSpecific.methodology}. Tools: ${roleSpecific.tools}. Focus on ${task} specific challenges and solutions.`;
    };

    // Call Tavily API multiple times for different prompt types
    const promptTypes = ['diagnostic', 'methodology', 'implementation', 'optimization', 'collaboration'];
    const tavilyPromises = promptTypes.map(async (promptType) => {
      try {
        const response = await fetch('https://api.tavily.com/search', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.TAVILY_API_KEY}`,
          },
          body: JSON.stringify({
            query: generateTavilyQuery(role, task, promptType),
            search_depth: 'advanced',
            include_answer: true,
            max_results: 5,
          }),
        });
        
        if (response.ok) {
          const data = await response.json();
          return {
            type: promptType,
            insights: data.answer || (data.results && data.results.length > 0 
              ? data.results.map(r => r.content).join(' ') 
              : '')
          };
        }
      } catch (error) {
        console.log(`Tavily API failed for ${promptType}:`, error.message);
      }
      return { type: promptType, insights: '' };
    });

    const tavilyResults = await Promise.all(tavilyPromises);

    // Generate 5 distinct prompts with balanced role-task focus
    const generateBalancedRoleTaskPrompt = (promptType, role, task, insights) => {
      const roleSpecific = getRoleSpecificContext(role);
      const taskSpecific = getTaskSpecificContext(task);
      
      // Use targeted insights for each prompt type - make insights more prominent and task-specific
      const relevantInsights = insights && insights.trim() ? 
        `\n\n**Task-Specific Insights from Industry Research:**\n${insights.substring(0, 400)}${insights.length > 400 ? '...' : ''}` : '';
      
      switch(promptType) {
        case 'diagnostic':
          return `**${role} Diagnostic Analysis for "${task}"**\n\nAs a ${role} approaching "${task}", combine role expertise with task-specific analysis:\n\n• **Task Focus:** ${taskSpecific.diagnostic}\n• **Role Expertise:** ${roleSpecific.diagnostic}\n• **Combined Approach:** Use ${roleSpecific.tools} to execute ${taskSpecific.methodology}\n• **Validation:** Apply both ${roleSpecific.validation} and task-specific verification\n\nLeverage your ${role} perspective to create a comprehensive problem statement for ${task}.${relevantInsights}`;
        
        case 'methodology':
          return `**${role} Methodology for "${task}"**\n\nIntegrate ${role} best practices with "${task}" requirements:\n\n• **Task Methodology:** ${taskSpecific.methodology}\n• **Role Framework:** ${roleSpecific.methodology}\n• **Integrated Approach:** Adapt ${roleSpecific.frameworks} specifically for ${task}\n• **Tool Integration:** Use ${roleSpecific.tools} to support ${taskSpecific.implementation}\n\nEnsure your ${role} expertise enhances the specific demands of ${task}.${relevantInsights}`;
        
        case 'implementation':
          return `**${role} Implementation Strategy for "${task}"**\n\nExecute "${task}" using ${role} expertise and systematic approaches:\n\n• **Task Implementation:** ${taskSpecific.implementation}\n• **Role Implementation:** ${roleSpecific.implementation}\n• **Combined Execution:** Apply ${roleSpecific.tools} to achieve ${taskSpecific.optimization}\n• **Quality Assurance:** Use ${roleSpecific.validation} throughout ${task} delivery\n\nBalance ${role} best practices with ${task}-specific requirements for optimal results.${relevantInsights}`;
        
        case 'optimization':
          return `**${role} Optimization for "${task}"**\n\nOptimize "${task}" performance using ${role} expertise:\n\n• **Task Optimization:** ${taskSpecific.optimization}\n• **Role Optimization:** ${roleSpecific.optimization}\n• **Performance Metrics:** Use ${roleSpecific.metrics} to measure ${task} success\n• **Continuous Improvement:** Apply ${taskSpecific.collaboration} with ${roleSpecific.community}\n\nLeverage your ${role} skills to continuously enhance ${task} outcomes.${relevantInsights}`;
        
        case 'collaboration':
          return `**${role} Collaboration for "${task}"**\n\nMaximize team effectiveness combining ${role} expertise with "${task}" requirements:\n\n• **Task Collaboration:** ${taskSpecific.collaboration}\n• **Role Collaboration:** ${roleSpecific.collaboration}\n• **Network Leverage:** Engage ${roleSpecific.community} for ${task} insights\n• **Knowledge Sharing:** Use ${roleSpecific.tools} to document ${task} learnings\n\nBuild collaborative workflows that merge ${role} expertise with ${task} success factors.${relevantInsights}`;
        
        default:
          return `As a ${role} working on "${task}", balance your professional expertise with task-specific requirements to achieve optimal outcomes through systematic, integrated approaches.${relevantInsights}`;
      }
    };

    // Create prompts using targeted insights for each type
    const prompts = promptTypes.map((promptType, index) => {
      const tavilyResult = tavilyResults.find(r => r.type === promptType);
      const insights = tavilyResult ? tavilyResult.insights : '';
      
      return {
        id: index + 1,
        content: generateBalancedRoleTaskPrompt(promptType, role, task, insights).trim(),
      };
    });

    return NextResponse.json({ prompts });

  } catch (error) {
    console.error('Error generating prompts:', error);
    
    // Parse request body for fallback
    let fallbackRole = 'professional';
    let fallbackTask = 'your work';
    
    try {
      const body = await request.json();
      fallbackRole = body.role || 'professional';
      fallbackTask = body.task || 'your work';
    } catch {
      // Use defaults if parsing fails
    }
    
    // Enhanced fallback prompts using role-task specific context
    const fallbackPromptTypes = ['diagnostic', 'methodology', 'implementation', 'optimization', 'collaboration'];
    const fallbackPrompts = fallbackPromptTypes.map((promptType, index) => ({
      id: index + 1,
      content: `**${promptType.charAt(0).toUpperCase() + promptType.slice(1)} Approach for ${fallbackRole}**\n\nAs a ${fallbackRole} working on ${fallbackTask}, focus on systematic ${promptType} approaches. Apply industry best practices and proven methodologies specific to your domain. Use appropriate tools and frameworks while ensuring quality outcomes through proper validation and measurement.`,
    }));

    return NextResponse.json({ prompts: fallbackPrompts });
  }
}
