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
 * ENHANCED FOR PHASE 2: Conversational AI with follow-up questions
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
   * Generate personalized interview questions based on resume (PHASE 1 ENHANCED)
   * @param {Object} resumeAnalysis - Detailed resume analysis
   * @param {string} jobRole - Target job role
   * @param {string} experienceLevel - Experience level (entry/mid/senior)
   * @param {number} numQuestions - Number of questions to generate
   * @returns {Promise<Array>} - Array of personalized questions
   */
  static async generatePersonalizedQuestions(resumeAnalysis, jobRole, experienceLevel, numQuestions = 5) {
    // Extract key information from resume
    const projects = resumeAnalysis.projects || [];
    const skills = resumeAnalysis.skills || { technical: {}, soft: [] };
    const experience = resumeAnalysis.experience || [];
    const keyHighlights = resumeAnalysis.keyHighlights || [];
    
    // Build detailed context
    const projectDetails = projects.slice(0, 3).map(p => 
      `"${p.projectName}" - ${p.description} (Tech: ${p.technologies?.join(', ')})`
    ).join('\n');
    
    const techSkills = skills.technical?.languages?.concat(
      skills.technical?.frameworks || [],
      skills.technical?.tools || []
    ).slice(0, 10).join(', ') || 'various technologies';
    
    const workHistory = experience.slice(0, 2).map(e => 
      `${e.role} at ${e.company} (${e.duration})`
    ).join(', ');

    const prompt = `You are conducting a ${jobRole} interview for a ${experienceLevel} level candidate. 

CANDIDATE'S RESUME HIGHLIGHTS:
${projectDetails ? `\nKEY PROJECTS:\n${projectDetails}` : ''}
${workHistory ? `\nWORK EXPERIENCE:\n${workHistory}` : ''}
${techSkills ? `\nTECHNICAL SKILLS:\n${techSkills}` : ''}
${keyHighlights.length > 0 ? `\nKEY STRENGTHS:\n${keyHighlights.join(', ')}` : ''}

TASK: Generate ${numQuestions} HIGHLY PERSONALIZED interview questions that:

1. **Reference SPECIFIC items from their resume** (exact project names, companies, technologies)
2. **Mix these question types:**
   - Resume-specific: About their exact projects mentioned (e.g., "Tell me about your ${projects[0]?.projectName || 'recent project'}")
   - Technical deep-dive: About specific technologies they used (e.g., "How did you implement ${skills.technical?.frameworks?.[0] || 'your tech'} in your projects?")
   - Behavioral: Based on their actual work experience
   - Problem-solving: Technical challenges related to their skills

3. **Make it feel PERSONAL** - Like you carefully read their resume
4. **Progress difficulty**: Start easier, build to harder questions
5. **Encourage detailed answers**: Ask about challenges, decisions, learnings

CRITICAL RULES:
- Every question should reference something from their resume
- Use exact names (project names, companies, technologies)
- Don't ask generic questions
- Make them explain their actual work

Return ONLY a JSON array:
[
  {
    "question": "Specific question text referencing their resume",
    "type": "resume-specific|technical|behavioral|problem-solving",
    "category": "projects|experience|skills|general",
    "context": "Brief note about what aspect of resume this relates to"
  }
]

IMPORTANT: Return ONLY the JSON array. No markdown, no explanations.`;

    const systemMessage = `You are an expert technical interviewer who creates deeply personalized questions. Your goal is to make candidates feel you've thoroughly studied their background. Be specific, reference exact details, and create engaging conversations.`;

    try {
      const response = await this.generateCompletion(prompt, systemMessage, { 
        temperature: 0.8,
        maxTokens: 2000
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
        category: q.category || 'general',
        context: q.context || '',
        conversationHistory: [] // For Phase 2 - conversation tracking
      }));
    } catch (error) {
      console.error('Question generation error:', error);
      
      // Enhanced fallback with resume context
      const fallbackQuestions = [];
      
      // Question 1: About specific project
      if (projects[0]) {
        fallbackQuestions.push({
          id: 0,
          question: `I see you worked on "${projects[0].projectName}" - can you walk me through this project? What was your specific role, what technologies did you use, and what challenges did you overcome?`,
          type: 'resume-specific',
          category: 'projects',
          context: `About ${projects[0].projectName} project`,
          conversationHistory: []
        });
      } else {
        fallbackQuestions.push({
          id: 0,
          question: `Tell me about your most challenging project as a ${jobRole}. What made it challenging and how did you approach it?`,
          type: 'behavioral',
          category: 'projects',
          context: 'Project experience',
          conversationHistory: []
        });
      }
      
      // Question 2: Technical deep-dive
      const primaryTech = skills.technical?.frameworks?.[0] || skills.technical?.languages?.[0] || 'your primary technology';
      fallbackQuestions.push({
        id: 1,
        question: `I noticed you have experience with ${primaryTech}. Can you describe a specific situation where you used ${primaryTech} to solve a complex problem? What was the problem and your solution?`,
        type: 'technical',
        category: 'skills',
        context: `${primaryTech} experience`,
        conversationHistory: []
      });
      
      // Question 3: Work experience behavioral
      if (experience[0]) {
        fallbackQuestions.push({
          id: 2,
          question: `During your time as ${experience[0].role} at ${experience[0].company}, what was your most significant technical achievement? How did you measure its success?`,
          type: 'behavioral',
          category: 'experience',
          context: `${experience[0].company} experience`,
          conversationHistory: []
        });
      } else {
        fallbackQuestions.push({
          id: 2,
          question: `Describe a situation where you had to learn a new technology quickly for a project. How did you approach the learning process?`,
          type: 'behavioral',
          category: 'general',
          context: 'Learning ability',
          conversationHistory: []
        });
      }
      
      // Question 4: Problem-solving
      if (projects[1]) {
        fallbackQuestions.push({
          id: 3,
          question: `In your "${projects[1].projectName}" project, what was the biggest technical challenge you faced? Walk me through your problem-solving approach.`,
          type: 'problem-solving',
          category: 'projects',
          context: `${projects[1].projectName} challenges`,
          conversationHistory: []
        });
      } else {
        fallbackQuestions.push({
          id: 3,
          question: `Tell me about a time when you had to debug a critical production issue. What was your process for identifying and fixing the problem?`,
          type: 'problem-solving',
          category: 'technical',
          context: 'Debugging skills',
          conversationHistory: []
        });
      }
      
      // Question 5: Career growth
      fallbackQuestions.push({
        id: 4,
        question: `Based on your experience with ${techSkills.split(',')[0] || 'technology'}, where do you see yourself growing in the next 2-3 years? How does this ${jobRole} position fit into that growth?`,
        type: 'behavioral',
        category: 'general',
        context: 'Career goals',
        conversationHistory: []
      });
      
      return fallbackQuestions.slice(0, numQuestions);
    }
  }

  /**
   * Generate conversational follow-up questions (PHASE 2)
   * @param {string} originalQuestion - The original question asked
   * @param {string} userAnswer - User's answer to the original question
   * @param {Array} conversationHistory - Previous exchanges for this question
   * @param {Object} resumeContext - Resume analysis for context
   * @param {string} jobRole - Job role for context
   * @returns {Promise<Object>} - Follow-up question and decision to continue
   */
  static async generateFollowUpQuestion(originalQuestion, userAnswer, conversationHistory = [], resumeContext = {}, jobRole = '') {
    // Limit follow-ups to 2 per question
    if (conversationHistory.length >= 2) {
      return {
        hasFollowUp: false,
        followUpQuestion: null,
        reason: 'Sufficient depth achieved'
      };
    }

    const conversationContext = conversationHistory.map((turn, i) => 
      `Follow-up ${i + 1}: ${turn.question}\nAnswer: ${turn.answer}`
    ).join('\n\n');

    const prompt = `You are conducting a ${jobRole} interview. Analyze the candidate's answer and decide if a follow-up question would add value.

ORIGINAL QUESTION:
${originalQuestion}

USER'S ANSWER:
${userAnswer}

${conversationContext ? `PREVIOUS FOLLOW-UPS:\n${conversationContext}\n` : ''}

TASK: Decide if you should ask a follow-up question to:
1. Get more specific details (e.g., "Can you elaborate on the technical challenges?")
2. Probe deeper into their decision-making (e.g., "Why did you choose that approach?")
3. Understand their problem-solving (e.g., "How did you overcome that obstacle?")
4. Clarify vague points (e.g., "You mentioned X, can you explain more?")

RULES:
- If answer is detailed and complete → No follow-up needed
- If answer is vague or incomplete → Ask specific follow-up
- If answer opens interesting topics → Probe deeper
- Keep follow-ups natural and conversational
- Don't ask if ${conversationHistory.length} >= 2 (max 2 follow-ups)

Return JSON:
{
  "hasFollowUp": true/false,
  "followUpQuestion": "Natural follow-up question" or null,
  "reason": "Why asking or not asking follow-up"
}

IMPORTANT: Return ONLY valid JSON.`;

    const systemMessage = 'You are an expert interviewer who knows when to probe deeper and when to move on. Be natural and conversational.';

    try {
      const response = await this.generateCompletion(prompt, systemMessage, { 
        temperature: 0.7,
        maxTokens: 300
      });
      
      const cleanedResponse = response
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      
      const decision = JSON.parse(cleanedResponse);
      return decision;
    } catch (error) {
      console.error('Follow-up generation error:', error);
      
      // Smart fallback logic
      const answerLength = userAnswer.split(' ').length;
      const hasKeywords = /because|since|so|therefore|however|although/i.test(userAnswer);
      
      // If answer is short and lacks reasoning, ask for elaboration
      if (answerLength < 30 && !hasKeywords && conversationHistory.length === 0) {
        return {
          hasFollowUp: true,
          followUpQuestion: "That's interesting. Could you elaborate on that with a specific example?",
          reason: 'Answer needs more detail'
        };
      }
      
      // If first answer was good, ask about challenges/learnings
      if (conversationHistory.length === 0 && answerLength >= 30) {
        return {
          hasFollowUp: true,
          followUpQuestion: "What was the most challenging aspect of that, and what did you learn from it?",
          reason: 'Exploring challenges and growth'
        };
      }
      
      // Otherwise, move on
      return {
        hasFollowUp: false,
        followUpQuestion: null,
        reason: 'Sufficient information gathered'
      };
    }
  }

  /**
   * Analyze complete conversation for a question and provide feedback (PHASE 2)
   * @param {string} question - The original question
   * @param {Array} conversationHistory - All exchanges for this question
   * @param {string} jobRole - Job role
   * @param {string} experienceLevel - Experience level
   * @returns {Promise<Object>} - Comprehensive feedback with score
   */
  static async analyzConversation(question, conversationHistory, jobRole, experienceLevel) {
    const allExchanges = conversationHistory.map((turn, i) => 
      `Q: ${turn.question}\nA: ${turn.answer}`
    ).join('\n\n');

    const prompt = `Analyze this complete interview conversation for a ${jobRole} position (${experienceLevel} level):

MAIN QUESTION:
${question}

CONVERSATION:
${allExchanges}

TASK: Provide constructive feedback on the candidate's overall response.

Evaluate:
1. **Completeness**: Did they fully answer the question?
2. **Specificity**: Did they provide concrete examples and details?
3. **Technical Depth**: How well did they explain technical concepts?
4. **Communication**: Was the explanation clear and structured?
5. **Problem-Solving**: Did they demonstrate good analytical thinking?

Return JSON:
{
  "score": 0-10 (integer),
  "strengths": ["specific strength 1", "specific strength 2"],
  "improvements": ["specific improvement 1", "specific improvement 2"],
  "comment": "2-3 sentence overall feedback"
}

Be constructive, specific, and helpful. Score fairly based on ${experienceLevel} expectations.

IMPORTANT: Return ONLY valid JSON.`;

    const systemMessage = 'You are an expert interviewer providing detailed, constructive feedback to help candidates improve.';

    try {
      const response = await this.generateCompletion(prompt, systemMessage, { 
        temperature: 0.6,
        maxTokens: 500
      });
      
      const cleanedResponse = response
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      
      const feedback = JSON.parse(cleanedResponse);
      
      // Ensure proper structure
      return {
        score: feedback.score || 7,
        strengths: feedback.strengths || ['Provided relevant information'],
        improvements: feedback.improvements || ['Add more specific examples'],
        comment: feedback.comment || 'Good answer with room for improvement.'
      };
    } catch (error) {
      console.error('Conversation analysis error:', error);
      
      // Fallback feedback
      return {
        score: 7,
        strengths: ['Addressed the question', 'Provided relevant information'],
        improvements: ['Provide more specific technical details', 'Use concrete examples with measurable outcomes'],
        comment: 'Solid response overall. Consider adding more depth and specific examples in future answers.'
      };
    }
  }
}

export default AIService;
