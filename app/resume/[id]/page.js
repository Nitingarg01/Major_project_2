'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { FileText, ArrowLeft, CheckCircle, AlertCircle, Lightbulb, Award, Briefcase } from 'lucide-react';

export default function ResumeAnalysisPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const [mounted, setMounted] = useState(false);
  const [resume, setResume] = useState(null);
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
      fetchResumeAnalysis();
    }
  }, [session, params.id]);

  const fetchResumeAnalysis = async () => {
    try {
      const response = await fetch('/api/resumes');
      if (response.ok) {
        const data = await response.json();
        const foundResume = data.resumes.find(r => r.id === params.id);
        if (foundResume) {
          setResume(foundResume);
        } else {
          router.push('/dashboard');
        }
      } else {
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Error fetching resume:', error);
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
          <p className="text-gray-600">Loading resume analysis...</p>
        </div>
      </div>
    );
  }

  if (!resume || !resume.analysis) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Analysis Not Available</h2>
            <p className="text-gray-600 mb-4">Resume analysis data could not be found.</p>
            <Button onClick={() => router.push('/dashboard')}>Back to Dashboard</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const analysis = resume.analysis;
  
  // Handle both JSON and raw text analysis
  const hasStructuredAnalysis = analysis.overall || analysis.strengths || analysis.improvements || analysis.skills || analysis.recommendations;
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-md sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Button
            variant="ghost"
            onClick={() => router.push('/dashboard')}
            className="flex items-center"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <div className="flex items-center space-x-2">
            <FileText className="h-8 w-8 text-indigo-600" />
            <h1 className="text-2xl font-bold text-indigo-600">Resume Analysis</h1>
          </div>
          <div className="w-32"></div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12 max-w-5xl">
        {/* Header Card */}
        <Card className="mb-8 bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-0 shadow-2xl">
          <CardContent className="p-8">
            <div className="flex items-center space-x-4">
              <div className="p-4 bg-white/20 rounded-full">
                <FileText className="h-10 w-10" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-1">{resume.filename}</h2>
                <p className="text-indigo-100">
                  Uploaded {new Date(resume.uploadedAt).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {hasStructuredAnalysis ? (
          <>
            {/* Overall Assessment */}
            {analysis.overall && (
              <Card className="mb-8 border-2 border-indigo-200">
                <CardHeader>
                  <CardTitle className="flex items-center text-indigo-900">
                    <Award className="mr-2 h-6 w-6" />
                    Overall Assessment
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-800 text-lg leading-relaxed">{analysis.overall}</p>
                </CardContent>
              </Card>
            )}

            {/* Strengths */}
            {analysis.strengths && (
              <Card className="mb-8 border-2 border-green-200">
                <CardHeader>
                  <CardTitle className="flex items-center text-green-700">
                    <CheckCircle className="mr-2 h-6 w-6" />
                    Key Strengths
                  </CardTitle>
                  <CardDescription>What makes your resume stand out</CardDescription>
                </CardHeader>
                <CardContent>
                  {Array.isArray(analysis.strengths) ? (
                    <ul className="space-y-3">
                      {analysis.strengths.map((strength, index) => (
                        <li key={index} className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
                          <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-800">{strength}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-800">{analysis.strengths}</p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Areas for Improvement */}
            {analysis.improvements && (
              <Card className="mb-8 border-2 border-orange-200">
                <CardHeader>
                  <CardTitle className="flex items-center text-orange-700">
                    <AlertCircle className="mr-2 h-6 w-6" />
                    Areas for Improvement
                  </CardTitle>
                  <CardDescription>Suggestions to enhance your resume</CardDescription>
                </CardHeader>
                <CardContent>
                  {Array.isArray(analysis.improvements) ? (
                    <ul className="space-y-3">
                      {analysis.improvements.map((improvement, index) => (
                        <li key={index} className="flex items-start space-x-3 p-3 bg-orange-50 rounded-lg">
                          <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-800">{improvement}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-800">{analysis.improvements}</p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Key Skills Identified */}
            {analysis.skills && (
              <Card className="mb-8 border-2 border-blue-200">
                <CardHeader>
                  <CardTitle className="flex items-center text-blue-700">
                    <Briefcase className="mr-2 h-6 w-6" />
                    Key Skills Identified
                  </CardTitle>
                  <CardDescription>Skills highlighted in your resume</CardDescription>
                </CardHeader>
                <CardContent>
                  {Array.isArray(analysis.skills) ? (
                    <div className="flex flex-wrap gap-2">
                      {analysis.skills.map((skill, index) => (
                        <span 
                          key={index}
                          className="px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-800">{analysis.skills}</p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Recommendations */}
            {analysis.recommendations && (
              <Card className="mb-8 border-2 border-purple-200">
                <CardHeader>
                  <CardTitle className="flex items-center text-purple-700">
                    <Lightbulb className="mr-2 h-6 w-6" />
                    Recommendations for Improvement
                  </CardTitle>
                  <CardDescription>Action items to strengthen your resume</CardDescription>
                </CardHeader>
                <CardContent>
                  {Array.isArray(analysis.recommendations) ? (
                    <ul className="space-y-3">
                      {analysis.recommendations.map((recommendation, index) => (
                        <li key={index} className="flex items-start space-x-3 p-3 bg-purple-50 rounded-lg">
                          <Lightbulb className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-800">{recommendation}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-800">{analysis.recommendations}</p>
                  )}
                </CardContent>
              </Card>
            )}
          </>
        ) : (
          /* Raw Analysis Text */
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>AI Analysis</CardTitle>
              <CardDescription>Detailed feedback on your resume</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none">
                <pre className="whitespace-pre-wrap text-gray-800 font-sans text-base leading-relaxed">
                  {analysis.raw || JSON.stringify(analysis, null, 2)}
                </pre>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center">
          <Button
            onClick={() => router.push('/dashboard')}
            variant="outline"
            size="lg"
          >
            <ArrowLeft className="mr-2 h-5 w-5" />
            Back to Dashboard
          </Button>
          <Button
            onClick={() => router.push('/interview/setup')}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
            size="lg"
          >
            <Briefcase className="mr-2 h-5 w-5" />
            Start Interview with This Resume
          </Button>
        </div>
      </main>
    </div>
  );
}
