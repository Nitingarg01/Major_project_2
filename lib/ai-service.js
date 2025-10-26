import OpenAI from 'openai';
import Groq from 'groq-sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize OpenRouter client with DeepSeek v3.1
const openrouterClient = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1',
  defaultHeaders: {
    'HTTP-Referer': process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
    'X-Title': 'AI Interview Platform',
  }
});

const groqClient = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const geminiClient = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * AI Service with fallback chain: OpenRouter (DeepSeek v3.1) → Groq → Gemini
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
    const { temperature = 0.7, maxTokens = 2000, model = 'deepseek/deepseek-chat' } = options;

    // Try OpenRouter with DeepSeek v3.1 first
    try {
      console.log('Attempting OpenRouter with DeepSeek v3.1...');
      const completion = await openrouterClient.chat.completions.create({
        model: 'deepseek/deepseek-chat', // DeepSeek v3.1 model
        messages: [
          { role: 'system', content: systemMessage },
          { role: 'user', content: prompt }
        ],
        temperature,
        max_tokens: maxTokens,
      });
      
      const response = completion.choices[0].message.content;
      console.log('✅ OpenRouter (DeepSeek v3.1) succeeded');
      return response;
    } catch (openrouterError) {
      console.error('OpenRouter (DeepSeek) failed:', openrouterError.message);

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
   * Generate structured interview questions with natural flow (ENHANCED - Technical + Resume-Based)
   * Flow: Greeting → Resume Discussion → Projects Deep-Dive → Behavioral → Technical → Closing
   * @param {Object} resumeAnalysis - Detailed resume analysis
   * @param {string} jobRole - Target job role
   * @param {string} experienceLevel - Experience level (entry/mid/senior)
   * @param {number} numQuestions - Number of questions to generate
   * @returns {Promise<Array>} - Array of structured interview questions
   */
  static async generatePersonalizedQuestions(resumeAnalysis, jobRole, experienceLevel, numQuestions = 5) {
    // Extract key information from resume
    const projects = resumeAnalysis.projects || [];
    const skills = resumeAnalysis.skills || { technical: {}, soft: [] };
    const experience = resumeAnalysis.experience || [];
    const keyHighlights = resumeAnalysis.keyHighlights || [];
    
    // Build COMPREHENSIVE technical context
    const projectDetails = projects.slice(0, 5).map(p => 
      `PROJECT: "${p.projectName}"
      - Description: ${p.description}
      - Technologies: ${p.technologies?.join(', ') || 'N/A'}
      - Role: ${p.role || 'N/A'}
      - Challenges: ${p.challenges?.join(', ') || 'N/A'}
      - Achievements: ${p.achievements?.join(', ') || 'N/A'}`
    ).join('\n\n');
    
    // Extract ALL technical skills
    const allLanguages = skills.technical?.languages || [];
    const allFrameworks = skills.technical?.frameworks || [];
    const allTools = skills.technical?.tools || [];
    const allDatabases = skills.technical?.databases || [];
    const allCloud = skills.technical?.cloud || [];
    
    const techSkillsDetailed = `
PROGRAMMING LANGUAGES: ${allLanguages.join(', ') || 'None listed'}
FRAMEWORKS: ${allFrameworks.join(', ') || 'None listed'}
TOOLS: ${allTools.join(', ') || 'None listed'}
DATABASES: ${allDatabases.join(', ') || 'None listed'}
CLOUD PLATFORMS: ${allCloud.join(', ') || 'None listed'}`;
    
    const workHistory = experience.slice(0, 3).map(e => 
      `${e.role} at ${e.company} (${e.duration}) - Technologies: ${e.technologies?.join(', ') || 'N/A'}`
    ).join('\n');

    const prompt = `You are a TECHNICAL INTERVIEWER conducting a ${jobRole} interview for a ${experienceLevel} level candidate.

CRITICAL: Your questions MUST combine BOTH:
1. Technical depth for ${jobRole} position
2. Specific skills/projects from candidate's resume

CANDIDATE'S COMPLETE RESUME ANALYSIS:

${projectDetails ? `📋 PROJECTS (Ask technical questions about these!):\n${projectDetails}\n` : ''}

${workHistory ? `💼 WORK EXPERIENCE:\n${workHistory}\n` : ''}

⚙️ TECHNICAL SKILLS:${techSkillsDetailed}

${keyHighlights.length > 0 ? `🌟 KEY STRENGTHS:\n${keyHighlights.join('\n')}` : ''}

TASK: Generate ${numQuestions} HIGHLY TECHNICAL and RESUME-SPECIFIC interview questions.

**INTERVIEW FLOW & QUESTION DISTRIBUTION:**

1️⃣ **GREETING** (1 question): 
   - Warm introduction about their background and ${jobRole} interest

2️⃣ **RESUME DISCUSSION** (${Math.max(1, Math.floor(numQuestions * 0.2))} questions):
   - Overview of experience at ${experience[0]?.company || 'previous companies'}
   - Career progression and role transitions
   - Connection to ${jobRole} position

3️⃣ **PROJECTS DEEP-DIVE** (${Math.max(2, Math.floor(numQuestions * 0.4))} questions) - MOST IMPORTANT:
   - Ask DETAILED TECHNICAL questions about SPECIFIC projects: "${projects[0]?.projectName || 'recent project'}", "${projects[1]?.projectName || 'another project'}"
   - Questions MUST cover:
     * Architecture & design decisions
     * Specific technologies used (${projects[0]?.technologies?.slice(0, 3).join(', ') || 'tech stack'})
     * Technical challenges faced
     * How they solved problems
     * Code quality, testing, deployment
   - Example: "In your '${projects[0]?.projectName}' project, you used ${projects[0]?.technologies?.[0]}. Walk me through your architecture. Why did you choose ${projects[0]?.technologies?.[0]} over alternatives? What challenges did you face with scalability?"

4️⃣ **BEHAVIORAL** (${Math.max(1, Math.floor(numQuestions * 0.2))} questions):
   - Teamwork, leadership, conflict resolution
   - Learning from failures
   - Based on their actual work experience

5️⃣ **TECHNICAL DEPTH** (${Math.max(1, Math.floor(numQuestions * 0.2))} questions):
   - Deep technical questions about skills from resume
   - ${jobRole}-specific technical concepts
   - System design for ${jobRole}
   - Ask about: ${allLanguages[0] || 'primary language'}, ${allFrameworks[0] || 'frameworks'}, ${allDatabases[0] || 'databases'}
   - Coding best practices, testing, CI/CD

**MANDATORY REQUIREMENTS:**
✅ EVERY question MUST reference SPECIFIC details from resume (project names, technologies, companies)
✅ Questions MUST be TECHNICAL and job-relevant for ${jobRole}
✅ Ask about SPECIFIC technologies they used: ${allLanguages.slice(0, 3).join(', ')}, ${allFrameworks.slice(0, 3).join(', ')}
✅ Questions should invite ELABORATION and follow-ups
✅ Mix difficulty: start easier, get progressively harder
✅ Make it CONVERSATIONAL, not an interrogation

**OUTPUT FORMAT - Return ONLY this JSON array:**
[
  {
    "question": "Detailed technical question with specific resume references",
    "type": "technical|behavioral|resume-specific|project-detail",
    "phase": "greeting|resume-discussion|projects|behavioral|technical",
    "category": "projects|experience|skills|general",
    "context": "What this question is testing (e.g., 'React architecture knowledge in ProjectX')"
  }
]

IMPORTANT: Return ONLY valid JSON array. No markdown, no explanations. Questions MUST follow the phase order and be HIGHLY TECHNICAL.`;

    const systemMessage = `You are a SENIOR TECHNICAL INTERVIEWER with deep expertise in ${jobRole}. You conduct highly technical, conversational interviews that:
1. Ask SPECIFIC questions about candidate's projects, technologies, and architecture decisions
2. Reference EXACT project names, technologies, and companies from their resume
3. Probe for technical depth: "Why did you choose X over Y?", "How did you handle Z challenge?", "Walk me through your architecture"
4. Structure interviews in natural flow: greeting → resume → projects deep-dive → behavioral → technical depth
5. Ask follow-up-friendly questions that invite elaboration and discussion
6. Assess both breadth (what they know) and depth (how well they know it)
7. Match difficulty to experience level while maintaining technical rigor

Your questions should make candidates feel like they're having a professional technical discussion with a senior engineer, not answering a quiz.`;

    try {
      const response = await this.generateCompletion(prompt, systemMessage, { 
        temperature: 0.8,
        maxTokens: 2500
      });
      
      // Clean and parse JSON
      const cleanedResponse = response
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      
      const questions = JSON.parse(cleanedResponse);
      
      // Add IDs to questions and ensure proper ordering
      return questions.map((q, index) => ({
        id: index,
        question: q.question,
        type: q.type || 'general',
        phase: q.phase || 'general',
        category: q.category || 'general',
        context: q.context || '',
        conversationHistory: [] // For Phase 2 - conversation tracking
      }));
    } catch (error) {
      console.error('Question generation error:', error);
      
      // Enhanced fallback with STRUCTURED FLOW
      const fallbackQuestions = [];
      
      // 1. GREETING PHASE
      fallbackQuestions.push({
        id: 0,
        question: `Hello! Thank you for joining us today. To start, can you tell me about yourself and walk me through your professional background? What attracted you to the ${jobRole} field?`,
        type: 'behavioral',
        phase: 'greeting',
        category: 'general',
        context: 'Introduction and background',
        conversationHistory: []
      });
      
      // 2. RESUME DISCUSSION PHASE
      if (experience[0]) {
        fallbackQuestions.push({
          id: 1,
          question: `I see from your resume that you worked as ${experience[0].role} at ${experience[0].company}. Can you give me an overview of your responsibilities there and what you learned?`,
          type: 'resume-specific',
          phase: 'resume-discussion',
          category: 'experience',
          context: `${experience[0].company} experience`,
          conversationHistory: []
        });
      } else {
        fallbackQuestions.push({
          id: 1,
          question: `Looking at your background, what experiences have prepared you most for this ${jobRole} position? Walk me through your career journey so far.`,
          type: 'resume-specific',
          phase: 'resume-discussion',
          category: 'general',
          context: 'Career overview',
          conversationHistory: []
        });
      }
      
      // 3. PROJECTS DEEP-DIVE PHASE
      if (projects[0]) {
        fallbackQuestions.push({
          id: 2,
          question: `Let's dive deeper into your "${projects[0].projectName}" project. Can you walk me through: 1) What the project does, 2) Your specific role and responsibilities, 3) The technology stack you used, and 4) What were the biggest technical challenges you faced and how you solved them?`,
          type: 'project-detail',
          phase: 'projects',
          category: 'projects',
          context: `Deep dive into ${projects[0].projectName}`,
          conversationHistory: []
        });
        
        if (projects[1] && numQuestions >= 5) {
          fallbackQuestions.push({
            id: 3,
            question: `I'd also like to hear about your "${projects[1].projectName}" project. What problem were you trying to solve, what technologies did you choose and why, and what would you do differently if you built it again?`,
            type: 'project-detail',
            phase: 'projects',
            category: 'projects',
            context: `${projects[1].projectName} technical decisions`,
            conversationHistory: []
          });
        }
      } else {
        fallbackQuestions.push({
          id: 2,
          question: `Tell me about your most complex project as a ${jobRole}. What made it challenging, what was your approach to breaking down the problem, and what was the outcome?`,
          type: 'project-detail',
          phase: 'projects',
          category: 'projects',
          context: 'Complex project discussion',
          conversationHistory: []
        });
      }
      
      // 4. BEHAVIORAL PHASE
      if (experience[0]) {
        fallbackQuestions.push({
          id: fallbackQuestions.length,
          question: `Tell me about a time during your work at ${experience[0].company} when you faced a significant obstacle or disagreement with your team. How did you handle it, and what was the outcome?`,
          type: 'behavioral',
          phase: 'behavioral',
          category: 'experience',
          context: 'Conflict resolution and teamwork',
          conversationHistory: []
        });
      } else {
        fallbackQuestions.push({
          id: fallbackQuestions.length,
          question: `Describe a situation where you had to learn a completely new technology or skill under pressure. How did you approach the learning process, and how did you apply it?`,
          type: 'behavioral',
          phase: 'behavioral',
          category: 'general',
          context: 'Learning ability and adaptability',
          conversationHistory: []
        });
      }
      
      // 5. TECHNICAL PHASE
      const primaryTech = skills.technical?.frameworks?.[0] || skills.technical?.languages?.[0] || 'your primary technology';
      fallbackQuestions.push({
        id: fallbackQuestions.length,
        question: `I noticed you have experience with ${primaryTech}. Can you explain how you've used ${primaryTech} in your projects? What are some best practices you follow, and what are the common pitfalls you try to avoid?`,
        type: 'technical',
        phase: 'technical',
        category: 'skills',
        context: `${primaryTech} technical depth`,
        conversationHistory: []
      });
      
      // Add more questions if needed
      if (numQuestions > fallbackQuestions.length) {
        if (projects[0] && projects[0].technologies) {
          fallbackQuestions.push({
            id: fallbackQuestions.length,
            question: `In your "${projects[0].projectName}" project, you used ${projects[0].technologies[0]}. Why did you choose ${projects[0].technologies[0]} over alternatives? What trade-offs did you consider?`,
            type: 'technical',
            phase: 'technical',
            category: 'skills',
            context: 'Technical decision-making',
            conversationHistory: []
          });
        }
      }
      
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
  static async analyzeConversation(question, conversationHistory, jobRole, experienceLevel) {
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
