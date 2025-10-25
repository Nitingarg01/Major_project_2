'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Award, TrendingUp, AlertCircle, CheckCircle, Home, Video } from 'lucide-react';

export default function FeedbackPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const [mounted, setMounted] = useState(false);
  const [interview, setInterview] = useState(null);
  const [loading, setLoading] = useState(true);

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

  const fetchInterview = async () => {
    try {
      const response = await fetch(`/api/interview/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setInterview(data.interview);
      } else {
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Error fetching interview:', error);
      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (!mounted || status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your feedback...</p>
        </div>
      </div>
    );
  }

  if (!interview) {
    return null;
  }

  const overallScore = interview.overallScore || 0;
  const strengths = interview.strengths || [];
  const improvements = interview.improvements || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-md sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Video className="h-8 w-8 text-indigo-600" />
            <h1 className="text-2xl font-bold text-indigo-600">MY interview AI</h1>
          </div>
          <Button
            onClick={() => router.push('/dashboard')}
            variant="outline"
          >
            <Home className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12 max-w-5xl">
        {/* Congratulations Banner */}
        <Card className="mb-8 bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-0 shadow-2xl">
          <CardContent className="p-8 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 rounded-full mb-4">
              <Award className="h-10 w-10" />
            </div>
            <h2 className="text-3xl font-bold mb-2">Interview Completed! 🎉</h2>
            <p className="text-indigo-100 text-lg">Great job completing your mock interview session</p>
          </CardContent>
        </Card>

        {/* Overall Score */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-2 border-indigo-200 shadow-lg">
            <CardHeader className="text-center">
              <CardTitle className="text-sm font-medium text-gray-600">Overall Score</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <div className="text-5xl font-bold text-indigo-600 mb-2">{overallScore.toFixed(1)}</div>
              <p className="text-gray-500">out of 10</p>
              <Progress value={overallScore * 10} className="mt-4" />
            </CardContent>
          </Card>

          <Card className="border-2 border-green-200 shadow-lg">
            <CardHeader className="text-center">
              <CardTitle className="text-sm font-medium text-gray-600">Questions Answered</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <div className="text-5xl font-bold text-green-600 mb-2">{interview.questions?.length || 0}</div>
              <p className="text-gray-500">questions</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-purple-200 shadow-lg">
            <CardHeader className="text-center">
              <CardTitle className="text-sm font-medium text-gray-600">Job Role</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-2xl font-bold text-purple-600">{interview.jobRole}</p>
              <p className="text-gray-500 capitalize">{interview.experienceLevel} level</p>
            </CardContent>
          </Card>
        </div>

        {/* Strengths */}
        {strengths.length > 0 && (
          <Card className="mb-8 border-2 border-green-200">
            <CardHeader>
              <CardTitle className="flex items-center text-green-700">
                <CheckCircle className="mr-2 h-6 w-6" />
                Your Strengths
              </CardTitle>
              <CardDescription>Areas where you excelled</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {strengths.map((strength, index) => (
                  <li key={index} className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-800">{strength}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Areas for Improvement */}
        {improvements.length > 0 && (
          <Card className="mb-8 border-2 border-orange-200">
            <CardHeader>
              <CardTitle className="flex items-center text-orange-700">
                <TrendingUp className="mr-2 h-6 w-6" />
                Areas for Improvement
              </CardTitle>
              <CardDescription>Focus on these to enhance your performance</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {improvements.map((improvement, index) => (
                  <li key={index} className="flex items-start space-x-3 p-3 bg-orange-50 rounded-lg">
                    <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-800">{improvement}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Detailed Feedback per Question */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Detailed Question Feedback</CardTitle>
            <CardDescription>Review your performance on each question</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {interview.questions?.map((question, index) => (
                <div key={index} className="border-l-4 border-indigo-500 pl-4">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold text-gray-900">Question {index + 1}</h4>
                    {question.response?.feedback?.score && (
                      <span className="text-xl font-bold text-indigo-600">
                        {question.response.feedback.score}/10
                      </span>
                    )}
                  </div>
                  <p className="text-gray-700 mb-3">{question.question}</p>
                  
                  {question.response?.answer && (
                    <div className="bg-gray-50 p-3 rounded-lg mb-2">
                      <p className="text-sm font-semibold text-gray-600 mb-1">Your Answer:</p>
                      <p className="text-gray-800 text-sm">{question.response.answer}</p>
                    </div>
                  )}
                  
                  {question.response?.feedback?.comment && (
                    <div className="bg-indigo-50 p-3 rounded-lg">
                      <p className="text-sm font-semibold text-indigo-900 mb-1">Feedback:</p>
                      <p className="text-indigo-800 text-sm">{question.response.feedback.comment}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recommendations */}
        <Card className="mb-8 bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-200">
          <CardHeader>
            <CardTitle className="text-indigo-900">Next Steps</CardTitle>
            <CardDescription>Recommendations to improve your interview skills</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-gray-700">
              <li>• Practice answering similar questions to build confidence</li>
              <li>• Focus on providing structured answers using the STAR method</li>
              <li>• Review your areas for improvement and work on them</li>
              <li>• Take another mock interview to track your progress</li>
              <li>• Research common questions for your target role</li>
            </ul>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center">
          <Button
            onClick={() => router.push('/dashboard')}
            variant="outline"
            size="lg"
          >
            <Home className="mr-2 h-5 w-5" />
            Back to Dashboard
          </Button>
          <Button
            onClick={() => router.push('/interview/setup')}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
            size="lg"
          >
            <Video className="mr-2 h-5 w-5" />
            Start New Interview
          </Button>
        </div>
      </main>
    </div>
  );
}
