'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Video, FileText, Brain, Award, ArrowRight } from 'lucide-react';

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/dashboard');
    }
  }, [status, router]);

  if (!mounted || status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b bg-white/50 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Video className="h-8 w-8 text-indigo-600" />
            <h1 className="text-2xl font-bold text-indigo-600">MY interview AI</h1>
          </div>
          <div className="flex space-x-4">
            <Button variant="ghost" onClick={() => router.push('/login')}>
              Login
            </Button>
            <Button onClick={() => router.push('/register')} className="bg-indigo-600 hover:bg-indigo-700">
              Get Started
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-5xl font-bold text-gray-900 mb-6">
            Master Your Interview Skills with
            <span className="text-indigo-600"> AI-Powered </span>
            Mock Interviews
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Practice with a virtual AI interviewer, get instant feedback, and improve your performance
            with personalized insights tailored to your resume.
          </p>
          <div className="flex justify-center space-x-4">
            <Button 
              onClick={() => router.push('/register')} 
              size="lg" 
              className="bg-indigo-600 hover:bg-indigo-700 text-lg"
            >
              Start Free Interview
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              onClick={() => router.push('/login')} 
              variant="outline" 
              size="lg"
              className="text-lg"
            >
              Sign In
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <h3 className="text-3xl font-bold text-center mb-12 text-gray-900">Key Features</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-2 hover:border-indigo-500 transition-all hover:shadow-lg">
            <CardHeader>
              <Video className="h-12 w-12 text-indigo-600 mb-4" />
              <CardTitle>AI Video Interviewer</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Face-to-face interview experience with an animated AI interviewer that asks questions
                and responds with natural voice.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-indigo-500 transition-all hover:shadow-lg">
            <CardHeader>
              <FileText className="h-12 w-12 text-indigo-600 mb-4" />
              <CardTitle>Resume Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Upload your resume and get AI-powered analysis with specific recommendations for
                improvement tailored to your target role.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-indigo-500 transition-all hover:shadow-lg">
            <CardHeader>
              <Brain className="h-12 w-12 text-indigo-600 mb-4" />
              <CardTitle>Smart Questions</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Get customized interview questions based on your resume, job role, and experience
                level for realistic practice.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-indigo-500 transition-all hover:shadow-lg">
            <CardHeader>
              <Award className="h-12 w-12 text-indigo-600 mb-4" />
              <CardTitle>Instant Feedback</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Receive detailed performance evaluation with scores, strengths, areas for improvement,
                and actionable recommendations.
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* How It Works */}
      <section className="container mx-auto px-4 py-16">
        <h3 className="text-3xl font-bold text-center mb-12 text-gray-900">How It Works</h3>
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0 w-12 h-12 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xl font-bold">
              1
            </div>
            <div>
              <h4 className="text-xl font-semibold mb-2">Upload Your Resume</h4>
              <p className="text-gray-600">
                Upload your resume and get instant AI analysis with improvement suggestions.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0 w-12 h-12 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xl font-bold">
              2
            </div>
            <div>
              <h4 className="text-xl font-semibold mb-2">Customize Your Interview</h4>
              <p className="text-gray-600">
                Select job role, experience level, and number of questions for a personalized
                interview session.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0 w-12 h-12 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xl font-bold">
              3
            </div>
            <div>
              <h4 className="text-xl font-semibold mb-2">Practice with AI</h4>
              <p className="text-gray-600">
                Answer questions via voice with our AI interviewer that provides a realistic
                interview experience.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0 w-12 h-12 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xl font-bold">
              4
            </div>
            <div>
              <h4 className="text-xl font-semibold mb-2">Get Detailed Feedback</h4>
              <p className="text-gray-600">
                Receive comprehensive feedback on your performance with scores, insights, and
                recommendations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16">
        <Card className="bg-indigo-600 text-white border-0">
          <CardContent className="p-12 text-center">
            <h3 className="text-3xl font-bold mb-4">Ready to Ace Your Next Interview?</h3>
            <p className="text-xl mb-8 text-indigo-100">
              Join thousands of candidates who have improved their interview skills with MY interview AI
            </p>
            <Button 
              onClick={() => router.push('/register')} 
              size="lg" 
              variant="secondary"
              className="text-lg"
            >
              Start Your Free Interview Now
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white/50 backdrop-blur-md mt-16">
        <div className="container mx-auto px-4 py-8 text-center text-gray-600">
          <p>&copy; 2025 InterviewPro. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
