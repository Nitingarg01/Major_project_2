'use client';

import { useEffect, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Video, Upload, FileText, Plus, LogOut, User, Clock, Award, TrendingUp, Trash2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const [resumes, setResumes] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetchData();
    }
  }, [session]);

  const fetchData = async () => {
    try {
      const [resumesRes, interviewsRes] = await Promise.all([
        fetch('/api/resumes'),
        fetch('/api/interviews')
      ]);

      if (resumesRes.ok) {
        const resumesData = await resumesRes.json();
        setResumes(resumesData.resumes || []);
      }

      if (interviewsRes.ok) {
        const interviewsData = await interviewsRes.json();
        setInterviews(interviewsData.interviews || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast({
        title: 'Invalid file type',
        description: 'Please upload a PDF file',
        variant: 'destructive'
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please upload a file smaller than 5MB',
        variant: 'destructive'
      });
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/resume/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Resume uploaded successfully!'
        });
        fetchData();
      } else {
        toast({
          title: 'Upload failed',
          description: data.error || 'Failed to upload resume',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An error occurred while uploading',
        variant: 'destructive'
      });
    } finally {
      setUploading(false);
    }
  };

  const handleStartInterview = () => {
    router.push('/interview/setup');
  };

  const handleViewFeedback = (interviewId) => {
    router.push(`/interview/${interviewId}/feedback`);
  };

  if (!mounted || status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const completedInterviews = interviews.filter(i => i.status === 'completed');
  const avgScore = completedInterviews.length > 0
    ? completedInterviews.reduce((acc, i) => acc + (i.overallScore || 0), 0) / completedInterviews.length
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-md sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Video className="h-8 w-8 text-indigo-600" />
            <h1 className="text-2xl font-bold text-indigo-600">MY interview AI</h1>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <User className="h-5 w-5 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">{session?.user?.name}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => signOut({ callbackUrl: '/' })}
              className="flex items-center space-x-2"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome back, {session?.user?.name?.split(' ')[0]}! 👋</h2>
          <p className="text-gray-600">Ready to ace your next interview? Let's get started.</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-2 border-indigo-100 hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Interviews</CardTitle>
              <Video className="h-5 w-5 text-indigo-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-indigo-600">{interviews.length}</div>
              <p className="text-xs text-gray-500 mt-1">{completedInterviews.length} completed</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-purple-100 hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Average Score</CardTitle>
              <Award className="h-5 w-5 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">{avgScore.toFixed(1)}/10</div>
              <p className="text-xs text-gray-500 mt-1">Across all interviews</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-green-100 hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Resumes</CardTitle>
              <FileText className="h-5 w-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{resumes.length}</div>
              <p className="text-xs text-gray-500 mt-1">Ready for analysis</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Upload Resume */}
          <Card className="border-2 hover:border-indigo-400 transition-all">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Upload className="h-5 w-5 text-indigo-600" />
                <span>Upload Resume</span>
              </CardTitle>
              <CardDescription>Upload your resume to get AI-powered analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <label htmlFor="resume-upload">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-all">
                  <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-sm text-gray-600 mb-2">
                    {uploading ? 'Uploading...' : 'Click to upload or drag and drop'}
                  </p>
                  <p className="text-xs text-gray-500">PDF (max. 5MB)</p>
                </div>
              </label>
              <input
                id="resume-upload"
                type="file"
                accept=".pdf"
                onChange={handleFileUpload}
                className="hidden"
                disabled={uploading}
              />
            </CardContent>
          </Card>

          {/* Start Interview */}
          <Card className="border-2 hover:border-purple-400 transition-all bg-gradient-to-br from-indigo-50 to-purple-50">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Plus className="h-5 w-5 text-purple-600" />
                <span>Start New Interview</span>
              </CardTitle>
              <CardDescription>Begin your AI-powered mock interview session</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={handleStartInterview}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-lg py-6"
                size="lg"
              >
                <Video className="mr-2 h-5 w-5" />
                Start Interview Now
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Resumes List */}
        {resumes.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Your Resumes</CardTitle>
              <CardDescription>Manage and analyze your uploaded resumes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {resumes.map((resume) => (
                  <div
                    key={resume.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <FileText className="h-8 w-8 text-indigo-600" />
                      <div>
                        <p className="font-medium text-gray-900">{resume.filename}</p>
                        <p className="text-sm text-gray-500">
                          Uploaded {new Date(resume.uploadedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => router.push(`/resume/${resume.id}`)}
                    >
                      View Analysis
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Interview History */}
        <Card>
          <CardHeader>
            <CardTitle>Interview History</CardTitle>
            <CardDescription>
              {interviews.length > 0
                ? 'Review your past interview performances'
                : 'No interviews yet. Start your first interview above!'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {interviews.length > 0 ? (
              <div className="space-y-4">
                {interviews.slice(0, 5).map((interview) => (
                  <div
                    key={interview.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center space-x-4 flex-1">
                      <div className="p-3 bg-indigo-100 rounded-full">
                        <Video className="h-6 w-6 text-indigo-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{interview.jobRole || 'General Interview'}</p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                          <span className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            {new Date(interview.createdAt).toLocaleDateString()}
                          </span>
                          <span className="capitalize">{interview.status}</span>
                        </div>
                      </div>
                      {interview.status === 'completed' && interview.overallScore && (
                        <div className="text-right">
                          <p className="text-2xl font-bold text-indigo-600">{interview.overallScore}/10</p>
                          <p className="text-xs text-gray-500">Score</p>
                        </div>
                      )}
                    </div>
                    {interview.status === 'completed' ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewFeedback(interview.id)}
                      >
                        View Feedback
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/interview/${interview.id}`)}
                      >
                        Continue
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Video className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">No interviews yet</p>
                <Button onClick={handleStartInterview} variant="outline">
                  Start Your First Interview
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
