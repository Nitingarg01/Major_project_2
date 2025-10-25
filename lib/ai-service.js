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
   * Parse resume with enhanced detail extraction
   * @param {string} resumeText - Raw resume text
   * @returns {Promise<Object>} - Detailed resume analysis
   */
  static async parseResumeDetailed(resumeText) {
    const prompt = `Analyze this resume in EXTREME DETAIL and extract comprehensive information for personalized interview preparation:

Resume Content:
${resumeText}

Extract and return a JSON object with these exact keys:

{
  "personalInfo": {
    "name": "Full name",
    "email": "Email address",
    "phone": "Phone number",
    "linkedin": "LinkedIn URL",
    "github": "GitHub URL",
    "summary": "Professional summary/objective"
  },
  "projects": [
    {
      "projectName": "Project name",
      "description": "Detailed description",
      "technologies": ["tech1", "tech2", "tech3"],
      "role": "Your role in the project",
      "achievements": ["achievement1", "achievement2"],
      "year": "2024"
    }
  ],
  "experience": [
    {
      "company": "Company name",
      "role": "Job title",
      "duration": "Jan 2020 - Present",
      "location": "Location",
      "responsibilities": ["resp1", "resp2", "resp3"],
      "technologies": ["tech1", "tech2"],
      "achievements": ["achievement1", "achievement2"]
    }
  ],
  "skills": {
    "technical": ["JavaScript", "Python", "React", "Node.js"],
    "soft": ["Leadership", "Communication", "Problem-solving"]
  },
  "education": [
    {
      "degree": "Bachelor of Science in Computer Science",
      "institution": "University Name",
      "year": "2018",
      "gpa": "3.8/4.0"
    }
  ],
  "certifications": ["AWS Certified", "Google Cloud Professional"],
  "overall": "2-3 sentence overall assessment",
  "strengths": ["strength1", "strength2", "strength3", "strength4"],
  "improvements": ["area1", "area2", "area3"],
  "recommendations": ["recommendation1", "recommendation2", "recommendation3"]
}

IMPORTANT: Return ONLY valid JSON, no markdown formatting or explanations.`;

    const systemMessage = 'You are an expert resume analyzer specializing in extracting detailed, structured information for interview preparation. Always return valid JSON.';

    try {
      const response = await this.generateCompletion(prompt, systemMessage, { temperature: 0.3 });
      
      // Clean and parse JSON
      const cleanedResponse = response
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      
      const analysis = JSON.parse(cleanedResponse);
      return analysis;
    } catch (error) {
      console.error('Resume parsing error:', error);
      
      // Return fallback structure
      return {
        personalInfo: { name: 'Unknown', summary: 'Resume parsed successfully' },
        projects: [],
        experience: [],
        skills: { technical: [], soft: [] },
        education: [],
        certifications: [],
        overall: 'Resume analysis completed. Unable to extract detailed information.',
        strengths: ['Professional background', 'Technical skills'],
        improvements: ['Provide more detailed project descriptions'],
        recommendations: ['Practice behavioral questions', 'Review technical concepts']
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
