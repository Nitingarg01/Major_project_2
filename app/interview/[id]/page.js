'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Mic, MicOff, Send, Volume2, ArrowRight, Loader2, MessageCircle, SkipForward } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

// PHASE 3: Viseme to mouth shape mapping for lip-sync
const VISEME_MOUTH_SHAPES = {
  // Silence
  'sil': 'closed',
  // Vowels
  'AA': 'wide-open',    // "father"
  'AE': 'medium-open',  // "cat"
  'AH': 'medium-open',  // "but"
  'AO': 'round',        // "thought"
  'AW': 'round',        // "how"
  'AY': 'smile',        // "my"
  'EH': 'medium',       // "red"
  'ER': 'medium',       // "her"
  'EY': 'smile',        // "say"
  'IH': 'smile',        // "sit"
  'IY': 'wide-smile',   // "see"
  'OW': 'round',        // "go"
  'OY': 'round',        // "toy"
  'UH': 'medium',       // "could"
  'UW': 'round',        // "too"
  // Consonants
  'B': 'closed',        // "be"
  'CH': 'tight',        // "cheese"
  'D': 'medium',        // "dee"
  'DH': 'tongue-out',   // "thee"
  'F': 'bottom-lip',    // "fee"
  'G': 'closed',        // "green"
  'HH': 'medium-open',  // "he"
  'JH': 'tight',        // "gee"
  'K': 'closed',        // "key"
  'L': 'tongue-up',     // "lee"
  'M': 'closed',        // "me"
  'N': 'medium',        // "knee"
  'NG': 'medium',       // "ping"
  'P': 'closed',        // "pee"
  'R': 'medium',        // "read"
  'S': 'tight-smile',   // "sea"
  'SH': 'tight',        // "she"
  'T': 'tongue-up',     // "tea"
  'TH': 'tongue-out',   // "theta"
  'V': 'bottom-lip',    // "vee"
  'W': 'round',         // "we"
  'Y': 'smile',         // "yield"
  'Z': 'tight-smile',   // "zee"
  'ZH': 'tight',        // "seizure"
};

export default function InterviewSessionPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);
  
  // Interview state
  const [interview, setInterview] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  
  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Avatar state (PHASE 3)
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentMouthShape, setCurrentMouthShape] = useState('closed');
  const [audioLoading, setAudioLoading] = useState(false);
  
  // Conversational state (PHASE 2)
  const [conversationHistory, setConversationHistory] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [hasFollowUp, setHasFollowUp] = useState(false);
  const [showFinalFeedback, setShowFinalFeedback] = useState(false);
  const [questionFeedback, setQuestionFeedback] = useState(null);
  
  const recognitionRef = useRef(null);
  const audioRef = useRef(null);
  const visemeTimeoutRef = useRef(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (session && params.id) {
      fetchInterview();
    }
  }, [session, params.id]);

  useEffect(() => {
    if (interview && currentQuestionIndex < interview.questions.length) {
      const question = interview.questions[currentQuestionIndex];
      setCurrentQuestion(question.question);
      setConversationHistory([]);
      setHasFollowUp(false);
      setShowFinalFeedback(false);
      setQuestionFeedback(null);
      playQuestionAudio(question.question);
    }
  }, [interview, currentQuestionIndex]);

  useEffect(() => {
    // Initialize speech recognition
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }

        setTranscript((prev) => prev + finalTranscript);
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
      };
    }
    
    return () => {
      if (visemeTimeoutRef.current) {
        clearTimeout(visemeTimeoutRef.current);
      }
    };
  }, []);

  const fetchInterview = async () => {
    try {
      const response = await fetch(`/api/interview/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setInterview(data.interview);
      } else {
        toast({
          title: 'Error',
          description: 'Failed to load interview',
          variant: 'destructive'
        });
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Error fetching interview:', error);
      router.push('/dashboard');
    }
  };

  // PHASE 3: Animate mouth shapes based on basic timing
  const animateMouth = (duration) => {
    const mouthShapes = ['closed', 'medium', 'wide-open', 'medium', 'closed', 'smile', 'round'];
    let currentIndex = 0;
    const interval = duration / 20; // Change mouth shape 20 times during speech
    
    const animate = () => {
      if (currentIndex < 20 && isSpeaking) {
        setCurrentMouthShape(mouthShapes[currentIndex % mouthShapes.length]);
        currentIndex++;
        visemeTimeoutRef.current = setTimeout(animate, interval);
      } else {
        setCurrentMouthShape('closed');
      }
    };
    
    animate();
  };

  const playQuestionAudio = async (text) => {
    setAudioLoading(true);
    setCurrentMouthShape('closed');
    
    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, returnVisemes: false }) // Set to true when viseme support is ready
      });

      if (response.ok) {
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        
        if (audioRef.current) {
          audioRef.current.src = audioUrl;
          
          audioRef.current.onplay = () => {
            setIsSpeaking(true);
            // PHASE 3: Estimate duration and animate mouth
            const duration = audioRef.current.duration * 1000;
            if (duration > 0) {
              animateMouth(duration);
            }
          };
          
          audioRef.current.onended = () => {
            setIsSpeaking(false);
            setCurrentMouthShape('closed');
            if (visemeTimeoutRef.current) {
              clearTimeout(visemeTimeoutRef.current);
            }
          };
          
          await audioRef.current.play();
        }
      }
    } catch (error) {
      console.error('Error playing audio:', error);
    } finally {
      setAudioLoading(false);
    }
  };

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      toast({
        title: 'Not supported',
        description: 'Speech recognition is not supported in your browser',
        variant: 'destructive'
      });
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      setTranscript('');
      recognitionRef.current.start();
      setIsRecording(true);
    }
  };

  // PHASE 2: Submit answer and handle follow-ups
  const submitAnswer = async () => {
    if (!transcript.trim()) {
      toast({
        title: 'No answer',
        description: 'Please record your answer first',
        variant: 'destructive'
      });
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }

    setIsProcessing(true);

    try {
      const response = await fetch(`/api/interview/${params.id}/response`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionIndex: currentQuestionIndex,
          answer: transcript
        })
      });

      const data = await response.json();

      if (response.ok) {
        // Add to conversation history
        setConversationHistory([...conversationHistory, {
          question: currentQuestion,
          answer: transcript
        }]);
        
        // Check if there's a follow-up question
        if (data.followUp && data.followUp.hasFollowUp) {
          setHasFollowUp(true);
          setCurrentQuestion(data.followUp.question);
          setTranscript('');
          
          toast({
            title: 'Follow-up question',
            description: 'The interviewer wants to know more!',
            duration: 2000
          });
          
          // Play follow-up question audio
          setTimeout(() => {
            playQuestionAudio(data.followUp.question);
          }, 500);
        } else {
          // No follow-up, finalize this question
          finalizeQuestion();
        }
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to submit answer',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An error occurred. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // PHASE 2: Finalize question and get comprehensive feedback
  const finalizeQuestion = async () => {
    setIsProcessing(true);
    
    try {
      const response = await fetch(`/api/interview/${params.id}/finalize-question`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionIndex: currentQuestionIndex
        })
      });

      const data = await response.json();

      if (response.ok) {
        setQuestionFeedback(data.feedback);
        setShowFinalFeedback(true);
        
        toast({
          title: 'Feedback received!',
          description: `Score: ${data.feedback.score}/10`,
          duration: 3000
        });
      }
    } catch (error) {
      console.error('Error finalizing question:', error);
      // Continue to next question even if feedback fails
      moveToNextQuestion();
    } finally {
      setIsProcessing(false);
    }
  };

  // PHASE 2: Skip follow-up and move to feedback
  const skipFollowUp = async () => {
    finalizeQuestion();
  };

  // Move to next question
  const moveToNextQuestion = () => {
    if (currentQuestionIndex < interview.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setTranscript('');
      setConversationHistory([]);
      setHasFollowUp(false);
      setShowFinalFeedback(false);
      setQuestionFeedback(null);
    } else {
      completeInterview();
    }
  };

  const completeInterview = async () => {
    try {
      const response = await fetch(`/api/interview/${params.id}/complete`, {
        method: 'POST'
      });

      if (response.ok) {
        router.push(`/interview/${params.id}/feedback`);
      }
    } catch (error) {
      console.error('Error completing interview:', error);
      router.push(`/interview/${params.id}/feedback`);
    }
  };

  if (!mounted || status === 'loading' || !interview) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading interview...</p>
        </div>
      </div>
    );
  }

  const progress = ((currentQuestionIndex + 1) / interview.questions.length) * 100;

  // Get current phase information
  const currentQuestionData = interview.questions[currentQuestionIndex];
  const currentPhase = currentQuestionData?.phase || 'interview';
  
  const phaseInfo = {
    'greeting': { icon: '👋', label: 'Greeting', color: 'bg-blue-100 text-blue-700' },
    'resume-discussion': { icon: '📋', label: 'Resume Discussion', color: 'bg-green-100 text-green-700' },
    'projects': { icon: '🚀', label: 'Projects Deep-Dive', color: 'bg-purple-100 text-purple-700' },
    'behavioral': { icon: '🧠', label: 'Behavioral', color: 'bg-orange-100 text-orange-700' },
    'technical': { icon: '⚡', label: 'Technical', color: 'bg-red-100 text-red-700' },
    'closing': { icon: '✨', label: 'Closing', color: 'bg-indigo-100 text-indigo-700' },
    'general': { icon: '💬', label: 'General', color: 'bg-gray-100 text-gray-700' }
  };
  
  const currentPhaseInfo = phaseInfo[currentPhase] || phaseInfo['general'];

  // PHASE 3: Mouth shape styles
  const getMouthShape = () => {
    switch (currentMouthShape) {
      case 'closed': return 'h-1 w-12';
      case 'medium': return 'h-3 w-12 rounded-full';
      case 'medium-open': return 'h-4 w-10 rounded-full';
      case 'wide-open': return 'h-6 w-14 rounded-full';
      case 'smile': return 'h-2 w-14 rounded-full';
      case 'wide-smile': return 'h-2 w-16 rounded-full';
      case 'round': return 'h-5 w-5 rounded-full';
      case 'tight': return 'h-2 w-8 rounded-full';
      default: return 'h-1 w-12';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-800">
      <audio ref={audioRef} className="hidden" />
      
      {/* Header */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center">
          <div className="text-white">
            <h1 className="text-2xl font-bold">🎤 AI Interview Session</h1>
            <p className="text-indigo-200">Question {currentQuestionIndex + 1} of {interview.questions.length}</p>
          </div>
          <div className="text-right">
            {/* Current Phase Badge */}
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${currentPhaseInfo.color} font-semibold mb-2`}>
              <span className="text-lg">{currentPhaseInfo.icon}</span>
              <span>{currentPhaseInfo.label}</span>
            </div>
            <div className="text-white">
              <p className="text-sm text-indigo-200">Job Role</p>
              <p className="font-semibold">{interview.jobRole}</p>
            </div>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="mt-4">
          <Progress value={progress} className="h-2 bg-white/20" />
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* AI Avatar Section - PHASE 3 ENHANCED */}
          <Card className="bg-white/10 backdrop-blur-md border-2 border-white/20">
            <CardContent className="p-8">
              <div className="text-center">
                {/* Enhanced Animated Avatar with Lip-Sync */}
                <div className="relative mx-auto w-64 h-64 mb-6">
                  <div className={`absolute inset-0 rounded-full bg-gradient-to-br from-indigo-400 to-purple-600 transition-all duration-300 ${isSpeaking ? 'scale-105' : 'scale-100'}`}>
                    <div className="absolute inset-4 rounded-full bg-gradient-to-br from-white to-indigo-50 flex items-center justify-center">
                      <div className="text-center">
                        {/* Avatar Face */}
                        <div className="relative">
                          {/* Eyes */}
                          <div className="flex justify-center gap-8 mb-4">
                            <div className={`w-4 h-4 bg-indigo-900 rounded-full transition-all ${isSpeaking ? 'animate-pulse' : ''}`}></div>
                            <div className={`w-4 h-4 bg-indigo-900 rounded-full transition-all ${isSpeaking ? 'animate-pulse' : ''}`}></div>
                          </div>
                          
                          {/* Mouth - PHASE 3 LIP-SYNC */}
                          <div className="flex justify-center">
                            <div className={`bg-red-400 transition-all duration-100 ${getMouthShape()}`}></div>
                          </div>
                          
                          {/* Status indicator */}
                          <div className="mt-4">
                            <Volume2 className={`h-8 w-8 text-indigo-600 mx-auto ${isSpeaking ? 'animate-bounce' : ''}`} />
                          </div>
                        </div>
                        
                        <p className="text-sm font-semibold text-gray-700 mt-3">AI Interviewer</p>
                        {isSpeaking && (
                          <p className="text-xs text-indigo-600 mt-1 flex items-center justify-center gap-1">
                            <span className="animate-pulse">●</span>
                            <span>Speaking...</span>
                          </p>
                        )}
                        {audioLoading && (
                          <p className="text-xs text-gray-500 mt-1">
                            <Loader2 className="h-3 w-3 animate-spin inline mr-1" />
                            Loading...
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  {isSpeaking && (
                    <>
                      <div className="absolute -inset-2 rounded-full border-4 border-indigo-400 animate-ping opacity-40"></div>
                      <div className="absolute -inset-4 rounded-full border-2 border-purple-400 animate-pulse opacity-30"></div>
                    </>
                  )}
                </div>

                {/* Question Card */}
                <Card className="bg-white/95 shadow-xl">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <MessageCircle className="h-5 w-5 text-indigo-600" />
                        <h3 className="text-lg font-semibold text-indigo-600">
                          {conversationHistory.length > 0 ? 'Follow-up Question' : `Question ${currentQuestionIndex + 1}`}
                        </h3>
                      </div>
                      {/* Phase indicator in question card */}
                      <span className={`text-xs px-2 py-1 rounded-full ${currentPhaseInfo.color}`}>
                        {currentPhaseInfo.icon} {currentPhaseInfo.label}
                      </span>
                    </div>
                    <p className="text-xl text-gray-800 leading-relaxed">{currentQuestion}</p>
                    
                    {/* Show question context if available */}
                    {currentQuestionData?.context && !conversationHistory.length && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="text-sm text-gray-600 italic">
                          💡 Focus: {currentQuestionData.context}
                        </p>
                      </div>
                    )}
                    
                    {/* PHASE 2: Conversation History */}
                    {conversationHistory.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <p className="text-xs text-gray-500 mb-2">📝 Previous exchanges in this conversation:</p>
                        <div className="text-left space-y-2 max-h-32 overflow-y-auto">
                          {conversationHistory.map((exchange, idx) => (
                            <div key={idx} className="text-sm bg-gray-50 p-2 rounded">
                              <p className="text-gray-600 font-medium">Q: {exchange.question}</p>
                              <p className="text-gray-500 text-xs truncate">A: {exchange.answer.substring(0, 100)}...</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>

          {/* Answer Section - PHASE 2 ENHANCED */}
          <Card className="bg-white shadow-2xl">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Your Answer</h3>
              
              {/* Recording Controls */}
              <div className="mb-6 flex justify-center">
                <Button
                  onClick={toggleRecording}
                  disabled={isProcessing || isSpeaking}
                  size="lg"
                  className={`w-20 h-20 rounded-full transition-all ${
                    isRecording
                      ? 'bg-red-500 hover:bg-red-600 animate-pulse scale-110'
                      : 'bg-indigo-600 hover:bg-indigo-700'
                  }`}
                >
                  {isRecording ? <MicOff className="h-8 w-8" /> : <Mic className="h-8 w-8" />}
                </Button>
              </div>
              
              <p className="text-center text-sm text-gray-600 mb-6">
                {isRecording ? '🎙️ Recording... Click to stop' : '🎤 Click microphone to start recording'}
              </p>

              {/* Transcript */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Transcript</label>
                <div className="min-h-[200px] max-h-[300px] overflow-y-auto p-4 bg-gray-50 rounded-lg border-2 border-gray-200">
                  {transcript ? (
                    <p className="text-gray-800 whitespace-pre-wrap">{transcript}</p>
                  ) : (
                    <p className="text-gray-400 italic">Your answer will appear here...</p>
                  )}
                </div>
              </div>

              {/* PHASE 2: Feedback Display */}
              {showFinalFeedback && questionFeedback && (
                <Card className="mb-6 bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-bold text-indigo-900">Question Feedback</h4>
                      <span className="text-3xl font-bold text-indigo-600">{questionFeedback.score}/10</span>
                    </div>
                    
                    {questionFeedback.strengths && questionFeedback.strengths.length > 0 && (
                      <div className="mb-3">
                        <p className="text-sm font-semibold text-green-700 mb-1">✅ Strengths:</p>
                        <ul className="text-sm text-gray-700 list-disc list-inside space-y-1">
                          {questionFeedback.strengths.map((strength, idx) => (
                            <li key={idx}>{strength}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {questionFeedback.improvements && questionFeedback.improvements.length > 0 && (
                      <div className="mb-3">
                        <p className="text-sm font-semibold text-orange-700 mb-1">💡 Areas to Improve:</p>
                        <ul className="text-sm text-gray-700 list-disc list-inside space-y-1">
                          {questionFeedback.improvements.map((improvement, idx) => (
                            <li key={idx}>{improvement}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {questionFeedback.comment && (
                      <p className="text-sm text-gray-700 italic border-t border-indigo-200 pt-2 mt-2">
                        {questionFeedback.comment}
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                {!showFinalFeedback ? (
                  <>
                    <Button
                      onClick={submitAnswer}
                      disabled={!transcript.trim() || isProcessing || isSpeaking}
                      className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                      size="lg"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Send className="mr-2 h-5 w-5" />
                          Submit Answer
                        </>
                      )}
                    </Button>
                    
                    {hasFollowUp && conversationHistory.length > 0 && (
                      <Button
                        onClick={skipFollowUp}
                        disabled={isProcessing}
                        variant="outline"
                        size="lg"
                      >
                        <SkipForward className="mr-2 h-4 w-4" />
                        Skip Follow-up
                      </Button>
                    )}
                  </>
                ) : (
                  <Button
                    onClick={moveToNextQuestion}
                    className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                    size="lg"
                  >
                    {currentQuestionIndex < interview.questions.length - 1 ? (
                      <>
                        <ArrowRight className="mr-2 h-5 w-5" />
                        Next Question
                      </>
                    ) : (
                      <>
                        <ArrowRight className="mr-2 h-5 w-5" />
                        Complete Interview
                      </>
                    )}
                  </Button>
                )}
              </div>

              {/* Helper Text */}
              <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-xs text-blue-800">
                  💡 <strong>Tip:</strong> {conversationHistory.length > 0 
                    ? 'The interviewer is asking for more details. Provide specific examples!'
                    : 'Speak clearly and provide detailed answers with specific examples.'}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
