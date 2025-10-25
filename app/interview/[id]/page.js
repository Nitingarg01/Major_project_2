'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Mic, MicOff, Send, Volume2, ArrowRight, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export default function InterviewSessionPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);
  
  const [interview, setInterview] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioLoading, setAudioLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);
  
  const recognitionRef = useRef(null);
  const audioRef = useRef(null);

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
      playQuestionAudio(interview.questions[currentQuestionIndex].question);
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

  const playQuestionAudio = async (text) => {
    setAudioLoading(true);
    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });

      if (response.ok) {
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        
        if (audioRef.current) {
          audioRef.current.src = audioUrl;
          audioRef.current.onplay = () => setIsSpeaking(true);
          audioRef.current.onended = () => setIsSpeaking(false);
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
        setFeedback(data.feedback);
        toast({
          title: 'Answer submitted!',
          description: `Score: ${data.feedback.score}/10`
        });
        
        setTimeout(() => {
          if (currentQuestionIndex < interview.questions.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
            setTranscript('');
            setFeedback(null);
          } else {
            completeInterview();
          }
        }, 3000);
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

  const currentQuestion = interview.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / interview.questions.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-800">
      <audio ref={audioRef} className="hidden" />
      
      {/* Header */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center">
          <div className="text-white">
            <h1 className="text-2xl font-bold">Interview Session</h1>
            <p className="text-indigo-200">Question {currentQuestionIndex + 1} of {interview.questions.length}</p>
          </div>
          <div className="text-right text-white">
            <p className="text-sm text-indigo-200">Job Role</p>
            <p className="font-semibold">{interview.jobRole}</p>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="mt-4">
          <Progress value={progress} className="h-2" />
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* AI Avatar Section */}
          <Card className="bg-white/10 backdrop-blur-md border-2 border-white/20">
            <CardContent className="p-8">
              <div className="text-center">
                {/* Animated Avatar */}
                <div className="relative mx-auto w-64 h-64 mb-6">
                  <div className={`absolute inset-0 rounded-full bg-gradient-to-br from-indigo-400 to-purple-600 ${isSpeaking ? 'animate-pulse' : ''}`}>
                    <div className="absolute inset-4 rounded-full bg-white/90 flex items-center justify-center">
                      <div className="text-center">
                        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-indigo-100 flex items-center justify-center">
                          <Volume2 className={`h-10 w-10 text-indigo-600 ${isSpeaking ? 'animate-bounce' : ''}`} />
                        </div>
                        <p className="text-sm font-semibold text-gray-700">AI Interviewer</p>
                        {isSpeaking && (
                          <p className="text-xs text-indigo-600 mt-2 animate-pulse">Speaking...</p>
                        )}
                        {audioLoading && (
                          <p className="text-xs text-gray-500 mt-2">Loading audio...</p>
                        )}
                      </div>
                    </div>
                  </div>
                  {isSpeaking && (
                    <div className="absolute -inset-2 rounded-full border-4 border-indigo-400 animate-ping opacity-75"></div>
                  )}
                </div>

                {/* Question Card */}
                <Card className="bg-white/95 shadow-xl">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold text-indigo-600 mb-4">Question {currentQuestionIndex + 1}</h3>
                    <p className="text-xl text-gray-800 leading-relaxed">{currentQuestion.question}</p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>

          {/* Answer Section */}
          <Card className="bg-white shadow-2xl">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Your Answer</h3>
              
              {/* Recording Controls */}
              <div className="mb-6 flex justify-center">
                <Button
                  onClick={toggleRecording}
                  disabled={isProcessing}
                  size="lg"
                  className={`w-20 h-20 rounded-full ${
                    isRecording
                      ? 'bg-red-500 hover:bg-red-600 animate-pulse'
                      : 'bg-indigo-600 hover:bg-indigo-700'
                  }`}
                >
                  {isRecording ? <MicOff className="h-8 w-8" /> : <Mic className="h-8 w-8" />}
                </Button>
              </div>
              
              <p className="text-center text-sm text-gray-600 mb-6">
                {isRecording ? 'Recording... Click to stop' : 'Click microphone to start recording'}
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

              {/* Feedback Preview */}
              {feedback && (
                <Card className="mb-6 bg-indigo-50 border-2 border-indigo-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-indigo-900">Quick Feedback</h4>
                      <span className="text-2xl font-bold text-indigo-600">{feedback.score}/10</span>
                    </div>
                    <p className="text-sm text-indigo-800">{feedback.comment}</p>
                  </CardContent>
                </Card>
              )}

              {/* Submit Button */}
              <Button
                onClick={submitAnswer}
                disabled={!transcript.trim() || isProcessing}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-lg py-6"
                size="lg"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Processing...
                  </>
                ) : currentQuestionIndex < interview.questions.length - 1 ? (
                  <>
                    <Send className="mr-2 h-5 w-5" />
                    Submit & Next Question
                  </>
                ) : (
                  <>
                    <ArrowRight className="mr-2 h-5 w-5" />
                    Submit & Complete Interview
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
