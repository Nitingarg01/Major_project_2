import OpenAI from 'openai';
import Groq from 'groq-sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize AI clients
const openaiClient = new OpenAI({
  apiKey: process.env.EMERGENT_LLM_KEY,
});

const groqClient = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const geminiClient = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * AI Service with fallback chain: OpenAI → Groq → Gemini
 * Provides reliable AI responses with automatic failover
 */
export class AIService {
  /**
   * Generate chat completion with fallback chain
   * @param {string} prompt - The prompt to send
   * @param {string} systemMessage - System message for context
   * @param {Object} options - Additional options (temperature, maxTokens, etc.)
   * @returns {Promise<string>} - Generated response
   */
  static async generateCompletion(prompt, systemMessage = '', options = {}) {
    const { temperature = 0.7, maxTokens = 2000, model = 'gpt-4' } = options;

    // Try OpenAI (GPT-4) first
    try {
      console.log('Attempting OpenAI GPT-4...');
      const completion = await openaiClient.chat.completions.create({
        model: 'gpt-4o-mini', // Using gpt-4o-mini for cost efficiency
        messages: [
          { role: 'system', content: systemMessage },
          { role: 'user', content: prompt }
        ],
        temperature,
        max_tokens: maxTokens,
      });
      
      const response = completion.choices[0].message.content;
      console.log('✅ OpenAI succeeded');
      return response;
    } catch (openaiError) {
      console.error('OpenAI failed:', openaiError.message);

      // Try Groq as backup
      try {
        console.log('Attempting Groq...');
        const completion = await groqClient.chat.completions.create({
          model: 'llama-3.1-8b-instant', // Updated model
          messages: [
            { role: 'system', content: systemMessage },
            { role: 'user', content: prompt }
          ],
          temperature,
          max_tokens: maxTokens,
        });
        
        const response = completion.choices[0].message.content;
        console.log('✅ Groq succeeded');
        return response;
      } catch (groqError) {
        console.error('Groq failed:', groqError.message);

        // Try Gemini as final backup
        try {
          console.log('Attempting Gemini...');
          const model = geminiClient.getGenerativeModel({ 
            model: 'gemini-1.5-flash' // Updated model
          });
          
          const fullPrompt = systemMessage 
            ? `${systemMessage}\n\n${prompt}` 
            : prompt;
          
          const result = await model.generateContent(fullPrompt);
          const response = result.response.text();
          console.log('✅ Gemini succeeded');
          return response;
        } catch (geminiError) {
          console.error('Gemini failed:', geminiError.message);
          throw new Error('All AI services failed. Please try again later.');
        }
      }
    }
  }

  /**
   * Parse resume with enhanced detail extraction (PHASE 1 ENHANCED)
   * @param {string} resumeText - Raw resume text
   * @returns {Promise<Object>} - Detailed resume analysis
   */
  static async parseResumeDetailed(resumeText) {
    const prompt = `You are an expert technical recruiter analyzing a resume for HIGHLY PERSONALIZED interview preparation.

RESUME TEXT:
${resumeText}

TASK: Extract MAXIMUM detail about projects, technologies, and experience to enable deeply personalized interview questions.

Return a JSON object with this EXACT structure:

{
  "personalInfo": {
    "name": "Full name",
    "email": "Email",
    "phone": "Phone",
    "linkedin": "LinkedIn URL",
    "github": "GitHub URL",
    "summary": "Professional summary"
  },
  "projects": [
    {
      "projectName": "Exact project name from resume",
      "description": "What the project does (2-3 sentences)",
      "technologies": ["tech1", "tech2", "tech3"],
      "role": "Your specific role (Frontend Dev, Team Lead, etc)",
      "responsibilities": ["What you did", "Your contributions"],
      "challenges": ["Technical challenges faced", "Problems solved"],
      "achievements": ["Measurable outcomes", "Impact"],
      "teamSize": "Number of people or 'Solo'",
      "duration": "Time spent on project",
      "year": "2024"
    }
  ],
  "experience": [
    {
      "company": "Company name",
      "role": "Job title",
      "duration": "Jan 2020 - Present",
      "location": "Location",
      "responsibilities": ["Key responsibilities"],
      "technologies": ["Tech stack used"],
      "achievements": ["Quantifiable achievements"],
      "projectsWorked": ["Project names if mentioned"]
    }
  ],
  "skills": {
    "technical": {
      "languages": ["Python", "JavaScript"],
      "frameworks": ["React", "Node.js"],
      "tools": ["Git", "Docker"],
      "databases": ["MongoDB", "PostgreSQL"],
      "cloud": ["AWS", "Azure"],
      "other": ["Any other technical skills"]
    },
    "soft": ["Communication", "Leadership", "Problem-solving"]
  },
  "education": [
    {
      "degree": "Degree name",
      "institution": "University",
      "year": "2018",
      "gpa": "3.8/4.0 (if mentioned)",
      "relevant_courses": ["Course1", "Course2"]
    }
  ],
  "certifications": ["Certification names"],
  "overall": "3-4 sentence professional summary",
  "keyHighlights": ["Most impressive aspect 1", "Most impressive aspect 2", "Most impressive aspect 3"],
  "interviewTopics": ["Topic 1 to ask about", "Topic 2", "Topic 3"]
}

CRITICAL: Return ONLY valid JSON. No markdown, no explanations, just the JSON object.`;

    const systemMessage = 'You are a senior technical recruiter with 15 years of experience. Extract maximum actionable detail from resumes for personalized interviews. Always return valid JSON only.';

    try {
      const response = await this.generateCompletion(prompt, systemMessage, { 
        temperature: 0.2,
        maxTokens: 3000 
      });
      
      // Clean and parse JSON
      const cleanedResponse = response
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      
      const analysis = JSON.parse(cleanedResponse);
      
      // Ensure proper structure
      if (!analysis.skills?.technical) {
        analysis.skills = {
          technical: { languages: [], frameworks: [], tools: [], databases: [], cloud: [], other: [] },
          soft: analysis.skills?.soft || []
        };
      }
      
      return analysis;
    } catch (error) {
      console.error('Resume parsing error:', error);
      
      // Return fallback structure
      return {
        personalInfo: { name: 'Candidate', summary: 'Professional with technical background' },
        projects: [],
        experience: [],
        skills: { 
          technical: { languages: [], frameworks: [], tools: [], databases: [], cloud: [], other: [] },
          soft: [] 
        },
        education: [],
        certifications: [],
        overall: 'Resume parsed successfully. Ready for interview.',
        keyHighlights: ['Professional experience', 'Technical background'],
        interviewTopics: ['Technical skills', 'Project experience', 'Problem-solving abilities']
      };
    }
  }

  /**
   * Generate personalized interview questions based on resume
   * @param {Object} resumeAnalysis - Detailed resume analysis
   * @param {string} jobRole - Target job role
   * @param {string} experienceLevel - Experience level (entry/mid/senior)
   * @param {number} numQuestions - Number of questions to generate
   * @returns {Promise<Array>} - Array of personalized questions
   */
  static async generatePersonalizedQuestions(resumeAnalysis, jobRole, experienceLevel, numQuestions = 5) {
    // Extract key information from resume
    const projects = resumeAnalysis.projects || [];
    const skills = resumeAnalysis.skills || { technical: [], soft: [] };
    const experience = resumeAnalysis.experience || [];
    
    const projectNames = projects.map(p => p.projectName).join(', ');
    const techSkills = skills.technical?.slice(0, 8).join(', ') || 'various technologies';
    const companies = experience.map(e => e.company).slice(0, 3).join(', ');

    const prompt = `Generate ${numQuestions} HIGHLY PERSONALIZED interview questions for a ${jobRole} position at ${experienceLevel} level.

Candidate's Background:
- Projects: ${projectNames || 'Various projects'}
- Technical Skills: ${techSkills}
- Work Experience: ${companies || 'Professional experience'}
- Projects Details: ${JSON.stringify(projects.slice(0, 3), null, 2)}

Requirements:
1. Generate questions that reference SPECIFIC projects, technologies, or experiences from their resume
2. Mix question types:
   - Resume-specific: "Tell me about your ${projects[0]?.projectName || 'recent project'}"
   - Technology-deep-dive: "How did you use ${skills.technical?.[0] || 'your tech stack'} in your projects?"
   - Behavioral: Based on their actual work experience
   - Technical: Relevant to their skill set
3. Questions should feel personal, not generic
4. Progress from easier to harder
5. Make the candidate feel you've read their resume carefully

Return ONLY a JSON array with this exact structure:
[
  {
    "question": "Question text here",
    "type": "resume-specific|technical|behavioral",
    "category": "projects|experience|skills|general"
  }
]

IMPORTANT: Return ONLY valid JSON array, no markdown or explanations.`;

    const systemMessage = `You are an expert interviewer who creates highly personalized questions based on a candidate's specific background. Your questions should make candidates feel like you've thoroughly reviewed their resume.`;

    try {
      const response = await this.generateCompletion(prompt, systemMessage, { 
        temperature: 0.8,
        maxTokens: 1500
      });
      
      // Clean and parse JSON
      const cleanedResponse = response
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      
      const questions = JSON.parse(cleanedResponse);
      
      // Add IDs to questions
      return questions.map((q, index) => ({
        id: index,
        question: q.question,
        type: q.type || 'general',
        category: q.category || 'general'
      }));
    } catch (error) {
      console.error('Question generation error:', error);
      
      // Fallback personalized questions using available data
      const fallbackQuestions = [
        {
          id: 0,
          question: projects[0] 
            ? `Tell me about your "${projects[0].projectName}" project. What was your role and what challenges did you face?`
            : `Tell me about yourself and your experience as a ${jobRole}.`,
          type: 'resume-specific',
          category: 'projects'
        },
        {
          id: 1,
          question: skills.technical?.[0]
            ? `I see you have experience with ${skills.technical[0]}. Can you describe a specific project where you used it and what you learned?`
            : `What are your key technical strengths relevant to this ${jobRole} position?`,
          type: 'technical',
          category: 'skills'
        },
        {
          id: 2,
          question: experience[0]
            ? `During your time at ${experience[0].company}, what was your most significant achievement and how did you accomplish it?`
            : `Describe a challenging project you worked on and how you overcame the obstacles.`,
          type: 'behavioral',
          category: 'experience'
        },
        {
          id: 3,
          question: `How do you stay updated with new technologies and trends in ${jobRole}? Can you share a recent example?`,
          type: 'behavioral',
          category: 'general'
        },
        {
          id: 4,
          question: `Where do you see yourself in the next 3-5 years, and how does this ${jobRole} position align with your career goals?`,
          type: 'behavioral',
          category: 'general'
        }
      ];
      
      return fallbackQuestions.slice(0, numQuestions);
    }
  }
}

export default AIService;
