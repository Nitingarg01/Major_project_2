import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import openai from '@/lib/openai-client';
import genAI from '@/lib/gemini-client';
import { Resend } from 'resend';
const pdf = require('pdf-parse');
import { ElevenLabsClient } from 'elevenlabs';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import AIService from '@/lib/ai-service';

const resend = new Resend(process.env.RESEND_API_KEY);
const elevenlabs = new ElevenLabsClient({ apiKey: process.env.ELEVENLABS_API_KEY });

// Helper function to handle CORS
function handleCORS(response) {
  response.headers.set('Access-Control-Allow-Origin', process.env.CORS_ORIGINS || '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  return response;
}

// OPTIONS handler for CORS
export async function OPTIONS() {
  return handleCORS(new NextResponse(null, { status: 200 }));
}

// Helper function to get user from session
async function getUserFromSession(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return null;
  }
  
  const client = await clientPromise;
  const db = client.db('Cluster0');
  const user = await db.collection('users').findOne({ email: session.user.email });
  return user;
}

// REGISTER - POST /api/register
async function handleRegister(request) {
  try {
    const { name, email, password } = await request.json();
    
    if (!name || !email || !password) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('Cluster0');
    
    // Check if user already exists
    const existingUser = await db.collection('users').findOne({ email });
    if (existingUser) {
      return NextResponse.json({ error: 'User already exists' }, { status: 400 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const newUser = {
      id: uuidv4(),
      name,
      email,
      password: hashedPassword,
      createdAt: new Date(),
    };

    await db.collection('users').insertOne(newUser);

    return NextResponse.json({ 
      success: true, 
      message: 'User registered successfully',
      user: { id: newUser.id, name: newUser.name, email: newUser.email }
    });
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
  }
}

// FORGOT PASSWORD - POST /api/forgot-password
async function handleForgotPassword(request) {
  try {
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('Cluster0');
    const user = await db.collection('users').findOne({ email });

    if (!user) {
      // Don't reveal if user exists
      return NextResponse.json({ success: true, message: 'If the email exists, a reset link has been sent' });
    }

    // Generate reset token
    const resetToken = uuidv4();
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

    await db.collection('users').updateOne(
      { email },
      { $set: { resetToken, resetTokenExpiry } }
    );

    // Send email
    const resetUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/reset-password?token=${resetToken}`;
    
    try {
      await resend.emails.send({
        from: 'MY interview AI <onboarding@resend.dev>',
        to: email,
        subject: 'Password Reset Request',
        html: `
          <h2>Password Reset Request</h2>
          <p>You requested to reset your password. Click the link below to reset it:</p>
          <a href="${resetUrl}">Reset Password</a>
          <p>This link will expire in 1 hour.</p>
          <p>If you didn't request this, please ignore this email.</p>
        `,
      });
    } catch (emailError) {
      console.error('Email send error:', emailError);
    }

    return NextResponse.json({ success: true, message: 'If the email exists, a reset link has been sent' });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}

// RESET PASSWORD - POST /api/reset-password
async function handleResetPassword(request) {
  try {
    const { token, newPassword } = await request.json();
    
    if (!token || !newPassword) {
      return NextResponse.json({ error: 'Token and new password are required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('Cluster0');
    
    const user = await db.collection('users').findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: new Date() }
    });

    if (!user) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password and remove reset token
    await db.collection('users').updateOne(
      { id: user.id },
      { 
        $set: { password: hashedPassword },
        $unset: { resetToken: '', resetTokenExpiry: '' }
      }
    );

    return NextResponse.json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json({ error: 'Failed to reset password' }, { status: 500 });
  }
}

// UPLOAD RESUME - POST /api/resume/upload
async function handleResumeUpload(request) {
  try {
    const user = await getUserFromSession(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file');
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Parse PDF
    let extractedText = '';
    try {
      const pdfData = await pdf(buffer);
      extractedText = pdfData.text;
    } catch (pdfError) {
      console.error('PDF parsing error:', pdfError);
      return NextResponse.json({ error: 'Failed to parse PDF' }, { status: 400 });
    }

    // Enhanced resume analysis using AI Service with fallback chain
    console.log('Starting enhanced resume analysis...');
    const analysis = await AIService.parseResumeDetailed(extractedText);
    console.log('Resume analysis completed successfully');

    // Save resume to database
    const client = await clientPromise;
    const db = client.db('Cluster0');
    
    const resume = {
      id: uuidv4(),
      userId: user.id,
      fileName: file.name,
      fileData: buffer.toString('base64'),
      extractedText,
      analysis,
      uploadDate: new Date(),
    };

    await db.collection('resumes').insertOne(resume);

    return NextResponse.json({ 
      success: true, 
      resumeId: resume.id,
      analysis 
    });
  } catch (error) {
    console.error('Resume upload error:', error);
    return NextResponse.json({ error: 'Failed to upload resume' }, { status: 500 });
  }
}

// GET RESUMES - GET /api/resumes
async function handleGetResumes(request) {
  try {
    const user = await getUserFromSession(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db('Cluster0');
    
    const resumes = await db.collection('resumes')
      .find({ userId: user.id })
      .project({ fileData: 0, extractedText: 0 }) // Exclude large data
      .sort({ uploadDate: -1 })
      .toArray();

    // Transform the data to match frontend expectations
    const transformedResumes = resumes.map(resume => ({
      id: resume.id,
      filename: resume.fileName,
      uploadedAt: resume.uploadDate,
      analysis: resume.analysis
    }));

    return NextResponse.json({ resumes: transformedResumes });
  } catch (error) {
    console.error('Get resumes error:', error);
    return NextResponse.json({ error: 'Failed to get resumes' }, { status: 500 });
  }
}

// ANALYZE RESUME FOR ROLE - POST /api/resume/analyze-role
async function handleAnalyzeResumeForRole(request) {
  try {
    const user = await getUserFromSession(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { resumeId, jobRole } = await request.json();
    
    if (!resumeId || !jobRole) {
      return NextResponse.json({ error: 'Resume ID and job role are required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('Cluster0');
    
    const resume = await db.collection('resumes').findOne({ id: resumeId, userId: user.id });
    
    if (!resume) {
      return NextResponse.json({ error: 'Resume not found' }, { status: 404 });
    }

    // Analyze resume for specific role using Gemini
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    const prompt = `Analyze this resume specifically for a ${jobRole} position:

Resume Content:
${resume.extractedText}

Please provide:
1. Match score (0-100) for this role
2. Relevant skills for this position
3. Missing skills or qualifications
4. Specific improvements needed for this role
5. Key strengths for this position

Format as JSON with keys: matchScore, relevantSkills, missingSkills, improvements, strengths`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let roleAnalysis;
    
    try {
      const analysisText = response.text();
      try {
        roleAnalysis = JSON.parse(analysisText.replace(/```json\n?/g, '').replace(/```\n?/g, ''));
      } catch {
        roleAnalysis = { raw: analysisText };
      }
    } catch (error) {
      roleAnalysis = { raw: response.text() };
    }

    return NextResponse.json({ 
      success: true, 
      analysis: roleAnalysis 
    });
  } catch (error) {
    console.error('Role analysis error:', error);
    return NextResponse.json({ error: 'Failed to analyze resume' }, { status: 500 });
  }
}

// CREATE INTERVIEW - POST /api/interview/create
async function handleCreateInterview(request) {
  try {
    const user = await getUserFromSession(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { resumeId, jobRole, experienceLevel, numQuestions } = await request.json();
    
    if (!jobRole || !experienceLevel) {
      return NextResponse.json({ error: 'Job role and experience level are required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('Cluster0');
    
    const numQs = numQuestions || 5;
    let questions = [];

    // Get resume if provided for personalized questions
    if (resumeId && resumeId !== 'none') {
      const resume = await db.collection('resumes').findOne({ id: resumeId, userId: user.id });
      
      if (resume && resume.analysis) {
        console.log('Generating personalized questions based on resume...');
        
        try {
          // Generate highly personalized questions using AI Service
          questions = await AIService.generatePersonalizedQuestions(
            resume.analysis,
            jobRole,
            experienceLevel,
            numQs
          );
          console.log('Personalized questions generated successfully');
        } catch (error) {
          console.error('Error generating personalized questions:', error);
          // Will fall through to generic questions
        }
      }
    }

    // If no resume or personalized generation failed, generate generic questions
    if (questions.length === 0) {
      console.log('Generating generic interview questions...');
      
      const prompt = `Generate ${numQs} professional interview questions for a ${jobRole} position with ${experienceLevel} experience level.

The questions should:
1. Be relevant to the role and experience level
2. Mix technical and behavioral questions
3. Be clear and professional
4. Progress from easier to harder

Return ONLY a JSON array of question objects with this structure:
[{"question": "question text", "type": "technical|behavioral", "category": "general"}]`;

      const systemMessage = 'You are an expert interviewer. Generate relevant interview questions in valid JSON format.';

      try {
        const response = await AIService.generateCompletion(prompt, systemMessage, {
          temperature: 0.7,
          maxTokens: 1500
        });

        const parsed = JSON.parse(response.replace(/```json\n?/g, '').replace(/```\n?/g, ''));
        questions = parsed.map((q, index) => ({
          id: index,
          question: q.question || q.text || q,
          type: q.type || 'general',
          category: q.category || 'general'
        }));
      } catch (error) {
        console.error('Failed to generate questions:', error);
        // Ultimate fallback questions
        questions = [
          { id: 0, question: `Tell me about yourself and your experience with ${jobRole}.`, type: 'behavioral', category: 'general' },
          { id: 1, question: `What are your key strengths relevant to this ${jobRole} position?`, type: 'behavioral', category: 'general' },
          { id: 2, question: `Describe a challenging project you worked on and how you handled it.`, type: 'behavioral', category: 'general' },
          { id: 3, question: `What technologies are you most comfortable with and why?`, type: 'technical', category: 'general' },
          { id: 4, question: `Where do you see yourself in 5 years?`, type: 'behavioral', category: 'general' },
        ].slice(0, numQs);
      }
    }

    // Create interview record
    const interview = {
      id: uuidv4(),
      userId: user.id,
      resumeId: resumeId && resumeId !== 'none' ? resumeId : null,
      jobRole,
      experienceLevel,
      numQuestions: numQs,
      questions,
      status: 'in-progress',
      createdAt: new Date(),
    };

    await db.collection('interviews').insertOne(interview);

    return NextResponse.json({ 
      success: true, 
      interviewId: interview.id,
      questions 
    });
  } catch (error) {
    console.error('Create interview error:', error);
    return NextResponse.json({ error: 'Failed to create interview' }, { status: 500 });
  }
}

// GET INTERVIEW - GET /api/interview/:id
async function handleGetInterview(request, interviewId) {
  try {
    const user = await getUserFromSession(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db('Cluster0');
    
    const interview = await db.collection('interviews').findOne({ 
      id: interviewId, 
      userId: user.id 
    });

    if (!interview) {
      return NextResponse.json({ error: 'Interview not found' }, { status: 404 });
    }

    return NextResponse.json({ interview });
  } catch (error) {
    console.error('Get interview error:', error);
    return NextResponse.json({ error: 'Failed to get interview' }, { status: 500 });
  }
}

// GET ALL INTERVIEWS - GET /api/interviews
async function handleGetInterviews(request) {
  try {
    const user = await getUserFromSession(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db('Cluster0');
    
    const interviews = await db.collection('interviews')
      .find({ userId: user.id })
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({ interviews });
  } catch (error) {
    console.error('Get interviews error:', error);
    return NextResponse.json({ error: 'Failed to get interviews' }, { status: 500 });
  }
}

// TEXT TO SPEECH - POST /api/tts
async function handleTextToSpeech(request) {
  try {
    const { text } = await request.json();
    
    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    // Generate audio using ElevenLabs
    const audio = await elevenlabs.generate({
      voice: 'Rachel', // Professional female voice
      text,
      model_id: 'eleven_multilingual_v2',
    });

    // Convert audio stream to buffer
    const chunks = [];
    for await (const chunk of audio) {
      chunks.push(chunk);
    }
    const audioBuffer = Buffer.concat(chunks);

    // Return audio as blob
    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('TTS error:', error);
    return NextResponse.json({ error: 'Failed to generate speech' }, { status: 500 });
  }
}

// SUBMIT RESPONSE - POST /api/interview/:id/response
async function handleSubmitResponse(request, interviewId) {
  try {
    const user = await getUserFromSession(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { questionIndex, answer } = await request.json();
    
    if (questionIndex === undefined || !answer) {
      return NextResponse.json({ error: 'Question index and answer are required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('Cluster0');
    
    const interview = await db.collection('interviews').findOne({ 
      id: interviewId, 
      userId: user.id 
    });

    if (!interview) {
      return NextResponse.json({ error: 'Interview not found' }, { status: 404 });
    }

    // Find the question
    const question = interview.questions[questionIndex];
    if (!question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    // Analyze response using OpenAI
    const analysisPrompt = `Analyze this interview response:

Question: ${question.question}
Response: ${answer}
Job Role: ${interview.jobRole}
Experience Level: ${interview.experienceLevel}

Provide constructive feedback with:
1. Score (0-10)
2. Brief comment (2-3 sentences)

Format as JSON: {"score": number, "comment": "string"}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are an expert interviewer providing constructive feedback.' },
        { role: 'user', content: analysisPrompt }
      ],
      temperature: 0.7,
    });

    let feedback = {};
    try {
      const responseText = completion.choices[0].message.content;
      feedback = JSON.parse(responseText.replace(/```json\n?/g, '').replace(/```\n?/g, ''));
    } catch (error) {
      console.error('Failed to parse feedback:', error);
      feedback = {
        score: 7,
        comment: 'Good answer with room for improvement. Try to be more specific and provide concrete examples.'
      };
    }

    // Update the question with the response
    const updatePath = `questions.${questionIndex}.response`;
    await db.collection('interviews').updateOne(
      { id: interviewId },
      { 
        $set: { 
          [updatePath]: {
            answer,
            feedback,
            timestamp: new Date()
          }
        }
      }
    );

    return NextResponse.json({ 
      success: true, 
      feedback 
    });
  } catch (error) {
    console.error('Submit response error:', error);
    return NextResponse.json({ error: 'Failed to submit response' }, { status: 500 });
  }
}

// COMPLETE INTERVIEW - POST /api/interview/:id/complete
async function handleCompleteInterview(request, interviewId) {
  try {
    const user = await getUserFromSession(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db('Cluster0');
    
    const interview = await db.collection('interviews').findOne({ 
      id: interviewId, 
      userId: user.id 
    });

    if (!interview) {
      return NextResponse.json({ error: 'Interview not found' }, { status: 404 });
    }

    // Calculate overall score from responses
    const scores = interview.questions
      .filter(q => q.response?.feedback?.score)
      .map(q => q.response.feedback.score);
    
    const overallScore = scores.length > 0 
      ? scores.reduce((a, b) => a + b, 0) / scores.length
      : 0;

    // Collect all feedback
    const allFeedback = interview.questions
      .filter(q => q.response?.feedback)
      .map(q => q.response.feedback);

    // Generate comprehensive feedback using OpenAI
    const feedbackPrompt = `Generate comprehensive interview feedback:

Job Role: ${interview.jobRole}
Experience Level: ${interview.experienceLevel}
Number of Questions: ${interview.questions.length}
Overall Score: ${overallScore.toFixed(1)}/10

Provide:
1. 3-5 key strengths demonstrated
2. 3-5 areas needing improvement
3. Make it specific and actionable

Format as JSON: {"strengths": ["strength1", "strength2"], "improvements": ["improvement1", "improvement2"]}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are an expert interviewer providing comprehensive feedback.' },
        { role: 'user', content: feedbackPrompt }
      ],
      temperature: 0.7,
    });

    let comprehensiveFeedback = {};
    try {
      const responseText = completion.choices[0].message.content;
      comprehensiveFeedback = JSON.parse(responseText.replace(/```json\n?/g, '').replace(/```\n?/g, ''));
    } catch (error) {
      console.error('Failed to parse feedback:', error);
      comprehensiveFeedback = {
        strengths: [
          'Clear communication skills',
          'Good understanding of core concepts',
          'Professional demeanor'
        ],
        improvements: [
          'Provide more specific examples',
          'Elaborate on technical details',
          'Structure answers using STAR method'
        ]
      };
    }

    // Update interview
    await db.collection('interviews').updateOne(
      { id: interviewId },
      { 
        $set: { 
          status: 'completed',
          overallScore: parseFloat(overallScore.toFixed(1)),
          strengths: comprehensiveFeedback.strengths || [],
          improvements: comprehensiveFeedback.improvements || [],
          completedAt: new Date()
        }
      }
    );

    return NextResponse.json({ 
      success: true, 
      overallScore: parseFloat(overallScore.toFixed(1)),
      strengths: comprehensiveFeedback.strengths || [],
      improvements: comprehensiveFeedback.improvements || []
    });
  } catch (error) {
    console.error('Complete interview error:', error);
    return NextResponse.json({ error: 'Failed to complete interview' }, { status: 500 });
  }
}

// DELETE INTERVIEW - DELETE /api/interview/:id
async function handleDeleteInterview(request, interviewId) {
  try {
    const user = await getUserFromSession(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db('Cluster0');
    
    const interview = await db.collection('interviews').findOne({ 
      id: interviewId, 
      userId: user.id 
    });

    if (!interview) {
      return NextResponse.json({ error: 'Interview not found' }, { status: 404 });
    }

    // Delete the interview
    await db.collection('interviews').deleteOne({ 
      id: interviewId, 
      userId: user.id 
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Interview deleted successfully' 
    });
  } catch (error) {
    console.error('Delete interview error:', error);
    return NextResponse.json({ error: 'Failed to delete interview' }, { status: 500 });
  }
}

// Route handler function
async function handleRoute(request, { params }) {
  const { path = [] } = params;
  const route = `/${path.join('/')}`;
  const method = request.method;

  try {
    // Root endpoint
    if (route === '/' && method === 'GET') {
      return handleCORS(NextResponse.json({ message: 'Interview Pro API' }));
    }

    // Register
    if (route === '/register' && method === 'POST') {
      return handleCORS(await handleRegister(request));
    }

    // Forgot password
    if (route === '/forgot-password' && method === 'POST') {
      return handleCORS(await handleForgotPassword(request));
    }

    // Reset password
    if (route === '/reset-password' && method === 'POST') {
      return handleCORS(await handleResetPassword(request));
    }

    // Resume upload
    if (route === '/resume/upload' && method === 'POST') {
      return handleCORS(await handleResumeUpload(request));
    }

    // Get resumes
    if (route === '/resumes' && method === 'GET') {
      return handleCORS(await handleGetResumes(request));
    }

    // Analyze resume for role
    if (route === '/resume/analyze-role' && method === 'POST') {
      return handleCORS(await handleAnalyzeResumeForRole(request));
    }

    // Create interview
    if (route === '/interview/create' && method === 'POST') {
      return handleCORS(await handleCreateInterview(request));
    }

    // Get all interviews
    if (route === '/interviews' && method === 'GET') {
      return handleCORS(await handleGetInterviews(request));
    }

    // Get specific interview
    if (route.startsWith('/interview/') && !route.includes('/response') && !route.includes('/complete') && method === 'GET') {
      const interviewId = path[1];
      return handleCORS(await handleGetInterview(request, interviewId));
    }

    // Submit response
    if (route.includes('/response') && method === 'POST') {
      const interviewId = path[1];
      return handleCORS(await handleSubmitResponse(request, interviewId));
    }

    // Complete interview
    if (route.includes('/complete') && method === 'POST') {
      const interviewId = path[1];
      return handleCORS(await handleCompleteInterview(request, interviewId));
    }

    // Delete interview
    if (route.startsWith('/interview/') && !route.includes('/response') && !route.includes('/complete') && method === 'DELETE') {
      const interviewId = path[1];
      return handleCORS(await handleDeleteInterview(request, interviewId));
    }

    // Text to speech
    if (route === '/tts' && method === 'POST') {
      return handleCORS(await handleTextToSpeech(request));
    }

    // Route not found
    return handleCORS(NextResponse.json(
      { error: `Route ${route} not found` },
      { status: 404 }
    ));

  } catch (error) {
    console.error('API Error:', error);
    return handleCORS(NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    ));
  }
}

// Export all HTTP methods
export const GET = handleRoute;
export const POST = handleRoute;
export const PUT = handleRoute;
export const DELETE = handleRoute;
export const PATCH = handleRoute;