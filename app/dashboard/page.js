'use client';

import { useEffect, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Video, Upload, FileText, Plus, LogOut, User, Clock, Award, TrendingUp, Trash2, Award as AwardIcon } from 'lucide-react';
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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [interviewToDelete, setInterviewToDelete] = useState(null);

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

  const handleDeleteInterview = async () => {
    if (!interviewToDelete) return;

    try {
      const response = await fetch(`/api/interview/${interviewToDelete}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Interview deleted successfully'
        });
        fetchData(); // Refresh the list
      } else {
        const data = await response.json();
        toast({
          title: 'Delete failed',
          description: data.error || 'Failed to delete interview',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An error occurred while deleting',
        variant: 'destructive'
      });
    } finally {
      setDeleteDialogOpen(false);
      setInterviewToDelete(null);
    }
  };

  const openDeleteDialog = (interviewId) => {
    setInterviewToDelete(interviewId);
    setDeleteDialogOpen(true);
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

  // Calculate performance stats
  const totalQuestions = completedInterviews.reduce((acc, i) => acc + (i.numQuestions || 0), 0);
  const highScoreInterviews = completedInterviews.filter(i => (i.overallScore || 0) >= 8).length;
  const recentInterviews = interviews.slice(0, 5); // Last 5 interviews
  
  // Calculate score trend (last 5 completed interviews)
  const scoreTrend = completedInterviews.slice(0, 5).reverse().map((interview, index) => ({
    interview: index + 1,
    score: interview.overallScore || 0,
    date: new Date(interview.completedAt || interview.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }));

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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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
              <CardTitle className="text-sm font-medium text-gray-600">High Scores</CardTitle>
              <TrendingUp className="h-5 w-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{highScoreInterviews}</div>
              <p className="text-xs text-gray-500 mt-1">Scored 8+ out of 10</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-orange-100 hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Questions</CardTitle>
              <FileText className="h-5 w-5 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">{totalQuestions}</div>
              <p className="text-xs text-gray-500 mt-1">Answered so far</p>
            </CardContent>
          </Card>
        </div>

        {/* Performance Insights - New Section */}
        {completedInterviews.length > 0 && (
          <Card className="mb-8 border-2 border-indigo-100">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-6 w-6 text-indigo-600" />
                <span>Performance Analytics</span>
              </CardTitle>
              <CardDescription>Track your interview performance over time</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Score Trend Chart */}
              {scoreTrend.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-4 text-gray-800">Score Trend (Last 5 Interviews)</h3>
                  <div className="flex items-end justify-between h-48 bg-gradient-to-b from-indigo-50 to-white rounded-lg p-4 border border-indigo-200">
                    {scoreTrend.map((point, index) => {
                      const height = (point.score / 10) * 100;
                      return (
                        <div key={index} className="flex flex-col items-center flex-1">
                          <div className="text-xs font-bold text-indigo-600 mb-2">{point.score.toFixed(1)}</div>
                          <div 
                            className="w-full mx-1 bg-gradient-to-t from-indigo-600 to-indigo-400 rounded-t transition-all hover:opacity-80 cursor-pointer"
                            style={{ height: `${height}%`, minHeight: '20px' }}
                            title={`Score: ${point.score}/10 on ${point.date}`}
                          ></div>
                          <div className="text-xs text-gray-600 mt-2">{point.date}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Performance Metrics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-blue-700">Completion Rate</span>
                    <Clock className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="text-2xl font-bold text-blue-600">
                    {interviews.length > 0 ? Math.round((completedInterviews.length / interviews.length) * 100) : 0}%
                  </div>
                  <div className="text-xs text-blue-600 mt-1">
                    {completedInterviews.length} of {interviews.length} interviews
                  </div>
                </div>

                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-green-700">Success Rate</span>
                    <AwardIcon className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="text-2xl font-bold text-green-600">
                    {completedInterviews.length > 0 ? Math.round((highScoreInterviews / completedInterviews.length) * 100) : 0}%
                  </div>
                  <div className="text-xs text-green-600 mt-1">
                    {highScoreInterviews} interviews scored 8+
                  </div>
                </div>

                <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-purple-700">Avg Questions</span>
                    <FileText className="h-4 w-4 text-purple-600" />
                  </div>
                  <div className="text-2xl font-bold text-purple-600">
                    {completedInterviews.length > 0 ? Math.round(totalQuestions / completedInterviews.length) : 0}
                  </div>
                  <div className="text-xs text-purple-600 mt-1">
                    per interview session
                  </div>
                </div>
              </div>

              {/* Progress Indicator */}
              <div className="mt-6 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border-2 border-indigo-200">
                <h4 className="font-semibold text-gray-800 mb-2">Your Progress</h4>
                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-700">Overall Performance</span>
                      <span className="font-semibold text-indigo-600">{avgScore.toFixed(1)}/10</span>
                    </div>
                    <Progress value={(avgScore / 10) * 100} className="h-2" />
                  </div>
                  {avgScore < 7 && (
                    <p className="text-xs text-gray-600 mt-2">
                      💡 Keep practicing! Focus on providing detailed answers with specific examples to improve your score.
                    </p>
                  )}
                  {avgScore >= 7 && avgScore < 8.5 && (
                    <p className="text-xs text-gray-600 mt-2">
                      🎯 Great progress! You're performing well. Try to elaborate more on your technical decisions and problem-solving approach.
                    </p>
                  )}
                  {avgScore >= 8.5 && (
                    <p className="text-xs text-gray-600 mt-2">
                      🌟 Excellent work! You're interviewing at a high level. Keep maintaining this consistency!
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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

          {/* ATS Resume Analysis */}
          <Card className="border-2 hover:border-green-400 transition-all bg-gradient-to-br from-green-50 to-emerald-50">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <span>ATS Analysis</span>
              </CardTitle>
              <CardDescription>Get detailed ATS score and improvements</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => router.push('/resume-analysis')}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white text-lg py-6"
                size="lg"
              >
                <Award className="mr-2 h-5 w-5" />
                Analyze Resume
              </Button>
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
                    <div className="flex gap-2">
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
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openDeleteDialog(interview.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Interview</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this interview? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteInterview}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
