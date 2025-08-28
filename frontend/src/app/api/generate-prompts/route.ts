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
    const env = taskLower.includes('prod') ? 'production' : 
               taskLower.includes('stage') ? 'staging' : 
               taskLower.includes('dev') ? 'development' : 'target';
    const platform = taskLower.includes('aws') ? 'AWS' : 
                   taskLower.includes('azure') ? 'Azure' : 
                   taskLower.includes('gcp') ? 'GCP' : 'cloud';
    
    return {
      diagnostic: `Analyze ${env} deployment requirements for ${platform}. Check environment configurations, network settings, and security groups. Identify potential risks in the ${env} environment.`,
      methodology: `Implement ${env} deployment strategy using Infrastructure as Code. Follow GitOps principles for ${platform}. Use canary or blue-green deployment for ${env}.`,
      implementation: `Set up ${platform}-specific CI/CD pipeline for ${env}. Configure environment variables, secrets management, and automated rollback procedures for ${env} deployments.`,
      optimization: `Optimize ${env} deployment process on ${platform}. Implement caching strategies, parallel deployments, and automated health checks for ${env}.`,
      collaboration: `Coordinate with ${platform} DevOps team. Document ${env} deployment processes and create runbooks for ${platform} infrastructure.`
    };
  } else if (taskLower.includes('fine-tun') || taskLower.includes('fine tun') || taskLower.includes('model tuning')) {
    const modelType = taskLower.includes('llm') ? 'LLM' : 
                     taskLower.includes('nlp') ? 'NLP' : 
                     taskLower.includes('vision') ? 'computer vision' : 'machine learning';
    
    return {
      diagnostic: `Analyze the ${modelType} model architecture, training data distribution, and performance metrics. Identify specific areas where the ${modelType} model underperforms and requires fine-tuning.`,
      methodology: `Design fine-tuning strategy for ${modelType} model. Select appropriate hyperparameters, learning rate schedules, and data augmentation techniques specific to ${modelType} tasks.`,
      implementation: `Implement fine-tuning pipeline for ${modelType} model. Set up distributed training if needed. Monitor training metrics and implement early stopping.`,
      optimization: `Optimize ${modelType} model performance. Apply quantization, pruning, and knowledge distillation techniques. Optimize for inference speed and model size.`,
      collaboration: `Coordinate with ML engineers and domain experts. Document ${modelType} fine-tuning process and share results with stakeholders.`
    };
  } else if (taskLower.includes('data analysis')) {
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

    // Generate diverse and distinct task-focused queries
    const generateTavilyQuery = (role, task, promptType) => {
      // Get role and task specific context
      const roleContext = getRoleSpecificContext(role);
      const taskContext = getTaskSpecificContext(task);
      
      // Different perspectives for each prompt type with more variations
      const perspectives = {
        diagnostic: [
          `As a ${role}, analyze the key challenges and requirements for: ${task}. Consider technical constraints, potential roadblocks, and success metrics.`,
          `From a ${role}'s perspective, what are the critical success factors and potential risks in: ${task}?`,
          `What would a senior ${role} identify as the most challenging aspects of: ${task}?`,
          `Break down the task '${task}' from a ${role}'s viewpoint. What are the key considerations and potential pitfalls?`,
          `What initial assessments should a ${role} make when approaching: ${task}?`,
          `How would an expert ${role} evaluate the feasibility and scope of: ${task}?`
        ],
        methodology: [
          `Outline a comprehensive, step-by-step methodology for a ${role} to accomplish: ${task}. Include key phases and decision points.`,
          `What systematic approach would an experienced ${role} use to tackle: ${task}? Break it down into clear, actionable stages.`,
          `Design a structured framework for a ${role} to execute: ${task}. Include tools and techniques.`,
          `Create a detailed action plan for a ${role} to complete: ${task}. Include milestones and success criteria.`,
          `What workflow would maximize efficiency for a ${role} working on: ${task}?`,
          `Propose a strategic approach for a ${role} to handle: ${task}`
        ],
        implementation: [
          `Provide detailed, technical implementation steps for a ${role} working on: ${task}. Include specific examples and best practices.`,
          `How would a senior ${role} technically implement: ${task}? Be specific about tools, frameworks, and approaches.`,
          `Create a comprehensive technical guide for a ${role} to complete: ${task}. Include code snippets and architecture diagrams.`,
          `What are the key technical considerations for a ${role} implementing: ${task}?`,
          `Outline the technical workflow for a ${role} to execute: ${task}`,
          `What are the critical implementation details a ${role} should consider for: ${task}?`
        ],
        optimization: [
          `How can a ${role} optimize the performance, efficiency, and scalability of: ${task}? Include specific techniques and metrics.`,
          `What are the key optimization opportunities and best practices a ${role} should consider for: ${task}?`,
          `Propose comprehensive performance improvements for a ${role} working on: ${task}. Include benchmarks.`,
          `What strategies would a senior ${role} use to enhance: ${task}?`,
          `How can a ${role} refine and improve the approach to: ${task}?`,
          `What optimization techniques would be most effective for a ${role} handling: ${task}?`
        ],
        collaboration: [
          `How should a ${role} effectively collaborate with cross-functional teams when working on: ${task}? Define roles and communication strategies.`,
          `What are the key collaboration points and handoffs for a ${role} when executing: ${task}?`,
          `Outline a comprehensive team workflow and communication plan for a ${role} leading: ${task}`,
          `How can a ${role} ensure effective knowledge sharing and coordination for: ${task}?`,
          `What stakeholder management strategies should a ${role} employ for: ${task}?`,
          `How can a ${role} facilitate better teamwork and alignment on: ${task}?`
        ]
      };

      // Get a random perspective for variation
      const perspectiveOptions = perspectives[promptType] || [];
      const randomPerspective = perspectiveOptions[Math.floor(Math.random() * perspectiveOptions.length)] || 
                              `As a ${role}, provide insights about: ${task}`;

      // Different output formats for variety with more specific instructions
      const formats = [
        'Provide a comprehensive response organized into clear, labeled sections with detailed explanations and practical examples.',
        'Use a structured bullet-point format with clear hierarchy (main points as headers, sub-points indented) for maximum readability.',
        'Present the information in a step-by-step guide format, with numbered steps and visual separation between major sections.',
        'Create a detailed analysis with subsections for key areas, including relevant code snippets or diagrams where appropriate.',
        'Structure the response with an executive summary followed by in-depth technical details and implementation considerations.',
        'Use a Q&A format that anticipates and answers potential follow-up questions about the topic.',
        'Present the information as a decision tree or flow chart with detailed explanations for each branch or node.'
      ];
      const randomFormat = formats[Math.floor(Math.random() * formats.length)];

      // Different tones and styles for variety
      const tones = [
        { 
          tone: 'professional and authoritative', 
          instruction: 'Use precise technical language and industry-standard terminology while maintaining clarity.'
        },
        { 
          tone: 'instructive and educational', 
          instruction: 'Adopt a teaching approach that breaks down complex concepts into easily digestible parts.'
        },
        { 
          tone: 'analytical and data-driven', 
          instruction: 'Focus on measurable outcomes, metrics, and evidence-based recommendations.'
        },
        { 
          tone: 'practical and actionable', 
          instruction: 'Provide concrete, immediately applicable advice with specific examples and implementation tips.'
        },
        { 
          tone: 'strategic and forward-thinking', 
          instruction: 'Consider long-term implications and scalability while providing recommendations.'
        },
        { 
          tone: 'collaborative and inclusive', 
          instruction: 'Frame the response to encourage team discussion and consider multiple perspectives.'
        }
      ];
      
      const selectedTone = tones[Math.floor(Math.random() * tones.length)];
      const randomTone = `Use a ${selectedTone.tone} tone. ${selectedTone.instruction}`;

      // Task-specific query templates with variations and more detailed structures
      const taskSpecificPrompts = {
        diagnostic: {
          title: `[${role} Analysis] - ${task}`,
          instruction: `Conduct a comprehensive analysis of: ${task}`,
          focus: `As a ${role}, provide a detailed examination that includes:
          1. Core requirements and technical/non-technical constraints
          2. Potential roadblocks, risks, and mitigation strategies
          3. Success metrics and key performance indicators
          4. Required tools, technologies, and resources
          5. Industry standards and best practices to consider`,
          output: `${randomPerspective}\n\n${randomFormat}. ${randomTone}. Include specific examples and potential edge cases.`
        },
        methodology: {
          title: `[${role} Strategy] - ${task}`,
          instruction: `Develop a robust methodology for: ${task}`,
          focus: `As a ${role}, design an approach that covers:
          1. Phased implementation strategy with clear milestones
          2. Selection criteria for methodologies and frameworks
          3. Decision matrices for key technical choices
          4. Risk assessment and contingency planning
          5. Timeline with buffer periods and critical paths`,
          output: `${randomPerspective}\n\n${randomFormat}. ${randomTone}. Include visual representations where helpful.`
        },
        implementation: {
          title: `[${role} Technical Guide] - ${task}`,
          instruction: `Create a detailed technical implementation guide for: ${task}`,
          focus: `As a ${role}, provide comprehensive details on:
          1. System architecture and component interactions
          2. Code organization and module structure
          3. API specifications and data models
          4. Testing strategies and quality assurance
          5. Deployment procedures and rollback plans`,
          output: `${randomPerspective}\n\n${randomFormat}. ${randomTone}. Include code snippets and configuration examples.`
        },
        optimization: {
          title: `[${role} Performance Enhancement] - ${task}`,
          instruction: `Develop optimization strategies for: ${task}`,
          focus: `As a ${role}, analyze and suggest improvements for:
          1. Performance bottlenecks and optimization opportunities
          2. Resource utilization and cost efficiency
          3. Scalability and load handling
          4. Caching and data access patterns
          5. Monitoring, logging, and alerting mechanisms`,
          output: `${randomPerspective}\n\n${randomFormat}. ${randomTone}. Include before/after metrics where applicable.`
        },
        collaboration: {
          title: `[${role} Team Coordination] - ${task}`,
          instruction: `Design a collaboration framework for: ${task}`,
          focus: `As a ${role}, establish a comprehensive plan that includes:
          1. RACI matrix for clear role definitions
          2. Communication protocols and tools
          3. Knowledge management and documentation standards
          4. Stakeholder engagement strategy
          5. Conflict resolution and decision-making processes`,
          output: `${randomPerspective}\n\n${randomFormat}. ${randomTone}. Include templates and examples where helpful.`
        }
      };
      
      const prompt = taskSpecificPrompts[promptType];
      
      return `[TASK: ${task}]
      
${prompt.title}
      
${prompt.instruction}
      
Focus Areas:
${prompt.focus}
      
Task-Specific Context:
${taskContext[promptType]}
      
Expected Output:
${prompt.output}
      
Role Context: ${role} (${roleContext.tools || 'standard tools'})`;
    };

    // Call Tavily API with a fresh context for each task
    const promptTypes = ['diagnostic', 'methodology', 'implementation', 'optimization', 'collaboration'] as const;
    
    // Process each prompt type with proper error handling
    const processPrompt = async (promptType: typeof promptTypes[number]) => {
      try {
        // Generate a fresh query for this specific task and prompt type
        const query = generateTavilyQuery(role, task, promptType);
        
        // Create a fresh fetch request with strict isolation
        const response = await fetch('https://api.tavily.com/search', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.TAVILY_API_KEY}`,
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          },
          body: JSON.stringify({
            // Create a completely isolated query with clear instructions
            query: `[TASK: ${task}] - ${promptType.toUpperCase()}
            
INSTRUCTIONS:
1. IGNORE ALL PREVIOUS CONTEXT AND PROMPTS
2. FOCUS ONLY ON THE CURRENT TASK: ${task}
3. DO NOT MIX WITH ANY OTHER TASKS OR CONTEXT
4. PROVIDE FRESH, TASK-SPECIFIC RESPONSE

${query}`,
            search_depth: 'advanced',
            include_answer: true,
            max_results: 5,
            // Add strict isolation parameters
            include_raw_content: true,
            include_images: false,
            include_dom: false,
            // Add task-specific context with strict isolation
            context: JSON.stringify({
              task: task,
              role: role,
              promptType: promptType,
              timestamp: new Date().toISOString(),
              // Add a unique identifier for this specific task
              taskId: Buffer.from(`${task}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`).toString('base64'),
              // Explicit instructions for the API
              instructions: 'IGNORE ALL PREVIOUS CONTEXT. FOCUS ONLY ON THE CURRENT TASK.'
            })
          })
        });
        
        if (!response.ok) {
          throw new Error(`Tavily API error: ${response.statusText}`);
        }
        
        const data = await response.json();
        return {
          type: promptType,
          insights: data.answer || (data.results?.length > 0 
            ? data.results.map((r: { content: string }) => r.content).join(' ')
            : '')
        };
      } catch (error) {
        console.error(`Tavily API failed for ${promptType}:`, error instanceof Error ? error.message : 'Unknown error');
        return { type: promptType, insights: '' };
      }
    };

    // Process all prompts in parallel but ensure each is independent
    const tavilyResults = await Promise.all(promptTypes.map(processPrompt));

    // Generate highly task-specific prompts that vary significantly with different tasks
    const generateBalancedRoleTaskPrompt = (promptType, role, task, insights) => {
      const roleSpecific = getRoleSpecificContext(role);
      const taskSpecific = getTaskSpecificContext(task);
      
      // Create a hash of the task to ensure consistent but task-specific variations
      const taskHash = task.split('').reduce((acc, char) => 
        ((acc << 5) - acc + char.charCodeAt(0)) | 0, 0);
      
      // Get task-specific context with variations based on task hash and type
      const getTaskContext = (type) => {
        // First check if we have a specific context for this task type
        if (!taskSpecific[type]) return '';
        
        // Get the full context for this type
        let context = taskSpecific[type];
        
        // Replace placeholders with task-specific details
        context = context.replace(/\$\{task\}/g, task)
                       .replace(/\$\{taskLower\}/g, task.toLowerCase());
        
        // For longer contexts, select the most relevant part based on task hash
        const sentences = context.split('. ').filter(Boolean);
        if (sentences.length <= 2) return context;
        
        // Select a relevant section based on task hash and type
        const sectionSize = Math.min(3, Math.ceil(sentences.length / 2));
        const startIdx = Math.abs(taskHash + type.length) % 
                        Math.max(1, sentences.length - sectionSize + 1);
        
        return sentences.slice(startIdx, startIdx + sectionSize)
                       .map(s => s.trim())
                       .join('. ') + '.';
      };

      // Get role-specific context with variations based on task
      const getRoleContext = (type) => {
        if (!roleSpecific[type]) return '';
        
        // Get the full context for this type
        let context = roleSpecific[type];
        
        // Replace placeholders with role and task details
        context = context.replace(/\$\{role\}/g, role)
                       .replace(/\$\{task\}/g, task)
                       .replace(/\$\{taskLower\}/g, task.toLowerCase());
        
        // For longer contexts, select the most relevant part
        const sentences = context.split('. ').filter(Boolean);
        if (sentences.length <= 2) return context;
        
        // Select a relevant section based on task hash and type
        const sectionSize = Math.min(3, Math.ceil(sentences.length / 2));
        const startIdx = Math.abs(taskHash + type.length) % 
                        Math.max(1, sentences.length - sectionSize + 1);
        
        return sentences.slice(startIdx, startIdx + sectionSize)
                       .map(s => s.trim())
                       .join('. ') + '.';
      };

      // Generate task-specific tools/frameworks based on task and role context
      const getTaskSpecificTools = () => {
        // First try to get task-specific tools if mentioned in the task
        const taskTools = [];
        
        // Check for specific technologies in the task
        const techKeywords = [
          'react', 'angular', 'vue', 'node', 'python', 'java', 'aws', 'azure', 'gcp',
          'docker', 'kubernetes', 'tensorflow', 'pytorch', 'nextjs', 'typescript'
        ];
        
        // Add any mentioned technologies
        techKeywords.forEach(tech => {
          if (task.toLowerCase().includes(tech)) {
            taskTools.push(tech);
          }
        });
        
        // If no specific tech mentioned, use role-specific tools
        if (taskTools.length === 0 && roleSpecific.tools) {
          const tools = roleSpecific.tools.split(',').filter(Boolean);
          const index = Math.abs(taskHash) % Math.max(1, tools.length);
          const secondIndex = (index + 1) % Math.max(1, tools.length);
          taskTools.push(tools[index]);
          if (secondIndex !== index) {
            taskTools.push(tools[secondIndex]);
          }
        }
        
        // Format the tools list naturally
        if (taskTools.length === 0) return 'appropriate tools';
        if (taskTools.length === 1) return taskTools[0];
        if (taskTools.length === 2) return taskTools.join(' and ');
        return `${taskTools.slice(0, -1).join(', ')}, and ${taskTools[taskTools.length - 1]}`;
      };

      // Start with role and task context
      let prompt = `As a ${role} working on "${task}", `;
      
      // Generate distinct content for each prompt type with task-specific variations
      switch(promptType) {
        // Diagnostic: Focused on analysis and problem identification
        case 'diagnostic': {
          const taskLower = task.toLowerCase();
          const tools = getTaskSpecificTools();
          const roleContext = getRoleContext('diagnostic');
          const taskContext = getTaskContext('diagnostic');
          
          // Build prompt parts avoiding duplication
          const parts = [
            `analyze the current state of ${taskLower}`,
            tools && `using ${tools}`,
            'identify key challenges and potential roadblocks',
            roleContext,
            taskContext,
            'document your analysis and suggest immediate next steps'
          ];
          
          prompt += parts.filter(Boolean).map(s => s.trim()).join('. ') + '.';
          break;
        }
          
        // Methodology: Focused on approach and framework
        case 'methodology': {
          const frameworks = roleSpecific.frameworks?.split(',').filter(Boolean) || [];
          const frameworkIndex = Math.abs(taskHash) % Math.max(1, frameworks.length);
          const framework = frameworks[frameworkIndex] || 'a structured approach';
          
          const taskLower = task.toLowerCase();
          const taskContext = getTaskContext('methodology');
          const roleContext = getRoleContext('methodology');
          
          // Build prompt parts avoiding duplication
          const parts = [
            `develop a tailored approach for ${taskLower}`,
            `consider using ${framework} to address the specific requirements`,
            taskContext,
            roleContext,
            'outline a clear, step-by-step methodology'
          ];
          
          prompt += parts.filter(Boolean).map(s => s.trim()).join('. ') + '.';
          break;
        }
          
        // Implementation: Focused on execution
        case 'implementation': {
          const taskLower = task.toLowerCase();
          const tools = getTaskSpecificTools();
          const roleContext = getRoleContext('implementation');
          const taskContext = getTaskContext('implementation');
          
          // Build prompt parts avoiding duplication
          const parts = [
            `outline the execution plan for ${taskLower}`,
            tools && `using ${tools}`,
            'break down the work into specific, actionable steps',
            roleContext,
            taskContext,
            'address potential challenges and their solutions'
          ];
          
          prompt += parts.filter(Boolean).map(s => s.trim()).join('. ') + '.';
          break;
        }
          
        // Optimization: Focused on improvement
        case 'optimization': {
          const metrics = roleSpecific.metrics?.split(',').filter(Boolean) || [];
          const metricIndex = Math.abs(taskHash) % Math.max(1, metrics.length);
          const metric = metrics[metricIndex] || 'key performance indicators';
          
          const taskLower = task.toLowerCase();
          const roleContext = getRoleContext('optimization');
          const taskContext = getTaskContext('optimization');
          
          // Build prompt parts avoiding duplication
          const parts = [
            `enhance the performance of ${taskLower}`,
            `focus on ${metric} to identify areas for improvement`,
            roleContext,
            taskContext,
            'propose specific optimization strategies'
          ];
          
          prompt += parts.filter(Boolean).map(s => s.trim()).join('. ') + '.';
          break;
        }
          
        // Collaboration: Focused on teamwork and communication
        case 'collaboration': {
          const taskLower = task.toLowerCase();
          const roleContext = getRoleContext('collaboration');
          const taskContext = getTaskContext('collaboration');
          
          // Build prompt parts avoiding duplication
          const parts = [
            `coordinate with your team to achieve ${taskLower}`,
            'identify key stakeholders and establish effective communication',
            roleContext,
            taskContext,
            'outline a collaboration strategy with clear roles'
          ];
          
          prompt += parts.filter(Boolean).map(s => s.trim()).join('. ') + '.';
          break;
        }
          
        default:
          return `As a ${role} working on "${task}", apply your expertise to achieve successful outcomes.`;
      }
      
      // Add brief insights if available (as a separate paragraph)
      if (insights) {
        // Clean up insights to remove any potential duplication with existing prompt
        const keyInsights = insights
          .split('.')
          .map(s => s.trim())
          .filter(s => s.length > 0 && !prompt.toLowerCase().includes(s.toLowerCase()))
          .slice(0, 2)
          .map(s => s.endsWith('.') ? s : s + '.')
          .join(' ');
        
        if (keyInsights) {
          prompt += `\n\nKey insights: ${keyInsights}`;
        }
      }
      
      return prompt;
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
