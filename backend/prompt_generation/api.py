from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
import os
import asyncio
from utils.logger import logger
from utils.config import config

router = APIRouter()

class PromptRequest(BaseModel):
    industry: str

class GeneratedPrompt(BaseModel):
    id: int
    content: str
    industry: str
    description: str

class PromptResponse(BaseModel):
    mainSubject: str
    context: str
    prompts: List[GeneratedPrompt]

async def generate_prompt_with_llm(industry: str) -> str:
    """Generate a prompt using the existing LLM service."""
    try:
        from services.llm import make_llm_api_call
        
        system_prompt = f"""You are an expert at creating practical, humanized prompts for AI assistants. Create ONE realistic, specific prompt that a {industry} professional would actually use in their daily work. 

The prompt should:
- Be conversational and natural (like someone actually asking for help)
- Include specific context and details relevant to {industry}
- Be actionable and practical
- Be 1-3 sentences long
- Not be generic - make it specific to {industry} challenges
- Start with a realistic scenario or problem

Do not include any explanations, just provide the prompt text."""

        user_prompt = f"Generate a practical {industry} prompt for an AI assistant."

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]

        # Use the existing LLM service with OpenRouter model
        response = await make_llm_api_call(
            messages=messages,
            model_name="openrouter/z-ai/glm-4.5-air:free",
            temperature=0.8,
            max_tokens=200
        )

        if response and response.get('choices') and response['choices'][0].get('message'):
            generated_prompt = response['choices'][0]['message'].get('content', '').strip()
            if generated_prompt:
                logger.info(f"Successfully generated LLM prompt for {industry}")
                return generated_prompt
        
        logger.warning("No prompt generated from LLM, using fallback")
        return generate_fallback_prompt(industry)
        
    except Exception as e:
        logger.error(f"Error generating prompt with LLM: {e}")
        return generate_fallback_prompt(industry)

def generate_fallback_prompt(industry: str) -> str:
    """Generate fallback prompts when LLM is not available."""
    fallback_prompts = {
        'Healthcare': [
            "I have a CSV file with patient data from our hospital. Can you analyze it and identify high-risk patients who might need immediate attention? Look for patterns in vital signs, medication history, and emergency room visits.",
            "Our clinic is seeing an increase in no-show appointments. Can you help me create a patient communication strategy to reduce cancellations and improve attendance rates?",
            "I need to prepare a report for the board about our hospital's performance metrics. Can you help me analyze our patient satisfaction scores, readmission rates, and financial data to create compelling insights?",
            "We're implementing a new electronic health record system. Can you help me create training materials for our staff that explain the key features and benefits in simple terms?",
            "Our pharmacy department is struggling with inventory management. Can you analyze our medication usage patterns and suggest an optimal ordering schedule to reduce waste and ensure we never run out of critical medications?",
            "I'm preparing for a meeting with insurance providers. Can you help me create a presentation that highlights our hospital's quality metrics and cost-effectiveness compared to regional benchmarks?"
        ],
        'Finance': [
            "I received this pitch deck for a startup investment opportunity. Can you analyze the financial projections, market size estimates, and competitive landscape to give me a comprehensive risk assessment?",
            "Our company's quarterly financial statements just came out. Can you help me create an executive summary highlighting key performance indicators, trends, and areas that need attention?",
            "I'm reviewing loan applications for small businesses. Can you help me create a standardized evaluation framework that considers credit history, cash flow projections, and market conditions?",
            "We need to optimize our investment portfolio. Can you analyze our current asset allocation and suggest rebalancing strategies based on market conditions and our risk tolerance?",
            "Our accounting team is overwhelmed with manual data entry. Can you help me identify which processes can be automated and suggest tools that would improve efficiency?",
            "I'm preparing for a board meeting to discuss our company's financial health. Can you help me create talking points that address revenue growth, cost management, and future projections?"
        ],
        'Legal': [
            "I have a stack of contracts that need to be reviewed for compliance with new regulations. Can you help me create a checklist of key terms and clauses to look for?",
            "Our client is facing a potential lawsuit. Can you help me draft a preliminary legal strategy that outlines our defense approach and potential settlement options?",
            "I need to prepare for a deposition next week. Can you help me create a list of potential questions and prepare compelling responses based on the case facts?",
            "We're updating our company's privacy policy to comply with new data protection laws. Can you help me identify the key changes needed and draft clear language for our customers?",
            "Our firm is considering a merger with another law practice. Can you help me create a due diligence checklist to evaluate their client base, financial health, and potential conflicts?",
            "I'm representing a client in a complex intellectual property dispute. Can you help me research similar cases and identify precedents that support our position?"
        ],
        'Banking': [
            "Our branch is seeing an increase in fraudulent transactions. Can you help me create a fraud detection protocol and training materials for our tellers?",
            "We're launching a new mobile banking app. Can you help me create user acceptance testing scenarios that cover all the key features and edge cases?",
            "Our loan approval process is taking too long. Can you analyze our current workflow and suggest improvements to reduce processing time while maintaining compliance?",
            "I need to prepare a presentation for our board about digital transformation initiatives. Can you help me create compelling arguments for investing in new banking technologies?",
            "Our customer service team is receiving many complaints about account fees. Can you help me create a communication strategy to explain our fee structure more clearly?",
            "We're expanding into a new market. Can you help me research local banking regulations and create a compliance checklist for our expansion plan?"
        ],
        'HR': [
            "Our company is experiencing high turnover in the sales department. Can you help me analyze exit interview data and create a retention strategy?",
            "We're implementing a new performance management system. Can you help me create training materials that explain the new process to managers and employees?",
            "Our recruitment process is taking too long. Can you help me streamline our hiring workflow and create templates for job postings and interview questions?",
            "We need to update our employee handbook for remote work policies. Can you help me draft clear guidelines that address work hours, communication expectations, and performance standards?",
            "Our diversity and inclusion training needs updating. Can you help me create engaging content that addresses unconscious bias and promotes inclusive workplace practices?",
            "We're planning our annual employee survey. Can you help me design questions that will give us actionable insights into employee satisfaction and engagement?"
        ],
        'Telecommunication': [
            "Our network is experiencing frequent outages. Can you help me create a root cause analysis framework and preventive maintenance schedule?",
            "We're launching a new 5G service. Can you help me create marketing materials that explain the benefits to both consumer and business customers?",
            "Our customer support team is overwhelmed with technical issues. Can you help me create a troubleshooting guide and escalation procedures?",
            "We need to optimize our network capacity planning. Can you help me analyze usage patterns and create a predictive model for future demand?",
            "Our billing system is causing customer complaints. Can you help me identify the most common issues and create a plan to improve accuracy and transparency?",
            "We're expanding our fiber optic network. Can you help me create a project timeline and resource allocation plan for the expansion?"
        ],
        'Technology': [
            "Our software development team is struggling with code quality. Can you help me create coding standards and review processes to improve maintainability?",
            "We're migrating our infrastructure to the cloud. Can you help me create a migration plan that minimizes downtime and ensures data security?",
            "Our product is experiencing performance issues under load. Can you help me create a performance testing strategy and optimization plan?",
            "We need to improve our cybersecurity posture. Can you help me create a security audit checklist and incident response procedures?",
            "Our DevOps pipeline is too slow. Can you help me identify bottlenecks and create an optimization strategy for faster deployments?",
            "We're launching a new mobile app. Can you help me create a testing strategy that covers different devices, operating systems, and user scenarios?"
        ],
        'Education': [
            "Our online learning platform needs improvement. Can you help me analyze student engagement data and suggest features to enhance the learning experience?",
            "We're developing a new curriculum for digital literacy. Can you help me create learning objectives and assessment methods?",
            "Our student retention rates are declining. Can you help me create an early warning system to identify at-risk students?",
            "We need to improve our teacher training program. Can you help me create modules that address modern teaching challenges and technology integration?",
            "Our school is implementing a new grading system. Can you help me create communication materials to explain the changes to parents and students?",
            "We're planning a virtual career fair. Can you help me create an engaging format that connects students with potential employers?"
        ],
        'Retail': [
            "Our inventory management system is causing stockouts. Can you help me create a demand forecasting model and reorder point calculations?",
            "We're launching an e-commerce platform. Can you help me create a user experience strategy that converts browsers into buyers?",
            "Our customer loyalty program isn't driving repeat purchases. Can you help me analyze customer behavior data and redesign the program?",
            "We need to optimize our store layout. Can you help me create a plan to improve traffic flow and increase sales per square foot?",
            "Our seasonal sales forecasting is inaccurate. Can you help me create a model that considers historical data, trends, and external factors?",
            "We're expanding into new markets. Can you help me create a market entry strategy that considers local competition and consumer preferences?"
        ],
        'Manufacturing': [
            "Our production line is experiencing quality issues. Can you help me create a quality control framework and root cause analysis process?",
            "We're implementing lean manufacturing principles. Can you help me create training materials and identify waste reduction opportunities?",
            "Our supply chain is vulnerable to disruptions. Can you help me create a risk assessment and contingency planning strategy?",
            "We need to optimize our maintenance schedule. Can you help me create a predictive maintenance program based on equipment performance data?",
            "Our energy costs are too high. Can you help me create an energy efficiency audit and improvement plan?",
            "We're automating our warehouse operations. Can you help me create a transition plan that minimizes disruption to current operations?"
        ]
    }

    prompts = fallback_prompts.get(industry, [
        f"Can you help me analyze this data and provide actionable insights for our {industry} business?",
        f"I need to create a comprehensive report for our {industry} stakeholders. Can you help me structure the information effectively?",
        f"We're facing some challenges in our {industry} operations. Can you help me identify potential solutions and create an action plan?"
    ])

    import random
    return random.choice(prompts)

@router.post("/generate-prompts", response_model=PromptResponse)
async def generate_prompts(request: PromptRequest):
    """Generate dynamic prompts for a specific industry."""
    try:
        industry = request.industry
        
        if not industry:
            raise HTTPException(status_code=400, detail="Industry must be provided")

        logger.info(f"Generating prompts for industry: {industry}")

        # Generate 6 dynamic prompts for the industry
        prompt_tasks = [generate_prompt_with_llm(industry) for _ in range(6)]
        
        try:
            # Generate prompts concurrently
            generated_prompts = await asyncio.gather(*prompt_tasks)
            
            prompts = []
            for i, prompt_content in enumerate(generated_prompts, 1):
                prompts.append(GeneratedPrompt(
                    id=i,
                    content=prompt_content,
                    industry=industry,
                    description=f"Dynamic {industry.lower()} prompt {i}"
                ))
                
        except Exception as e:
            logger.error(f"Error generating prompts with LLM, using fallback: {e}")
            # Use fallback prompts if LLM generation fails
            prompts = []
            for i in range(6):
                fallback_prompt = generate_fallback_prompt(industry)
                prompts.append(GeneratedPrompt(
                    id=i + 1,
                    content=fallback_prompt,
                    industry=industry,
                    description=f"Fallback {industry.lower()} prompt {i + 1}"
                ))

        logger.info(f"Successfully generated {len(prompts)} prompts for {industry}")

        return PromptResponse(
            mainSubject=f"{industry} Industry Prompts",
            context=f"Dynamically generated prompt examples for {industry} professionals",
            prompts=prompts
        )

    except Exception as e:
        logger.error(f"Error in generate_prompts: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate prompts: {str(e)}"
        )
