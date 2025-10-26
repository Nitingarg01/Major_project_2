'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, ArrowLeft, FileText, TrendingUp, AlertCircle, CheckCircle2, Award, Target, Briefcase, History } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export default function ResumeAnalysisPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [jobRole, setJobRole] = useState('');
  const [file, setFile] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [analysisHistory, setAnalysisHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

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
      fetchAnalysisHistory();
    }
  }, [session]);

  const fetchAnalysisHistory = async () => {
    try {
      const response = await fetch('/api/resume/analysis-history');
      if (response.ok) {
        const data = await response.json();
        setAnalysisHistory(data.analyses || []);
      }
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (selectedFile.type !== 'application/pdf') {
      toast({
        title: 'Invalid file type',
        description: 'Please upload a PDF file',
        variant: 'destructive'
      });
      return;
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please upload a file smaller than 5MB',
        variant: 'destructive'
      });
      return;
    }

    setFile(selectedFile);
  };

  const handleAnalyze = async () => {
    if (!file || !jobRole.trim()) {
      toast({
        title: 'Missing information',
        description: 'Please provide both resume and job role',
        variant: 'destructive'
      });
      return;
    }

    setAnalyzing(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('jobRole', jobRole);

      const response = await fetch('/api/resume/ats-analysis', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setAnalysis(data.analysis);
        toast({
          title: 'Analysis Complete!',
          description: 'Your resume has been analyzed successfully'
        });
        // Refresh history
        fetchAnalysisHistory();
      } else {
        toast({
          title: 'Analysis failed',
          description: data.error || 'Failed to analyze resume',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An error occurred during analysis',
        variant: 'destructive'
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const handleViewHistory = (historicalAnalysis) => {
    setAnalysis(historicalAnalysis.analysis);
    setJobRole(historicalAnalysis.jobRole);
  };

  if (!mounted || status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score) => {
    if (score >= 80) return 'bg-green-100';
    if (score >= 60) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-md sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/dashboard')}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Dashboard</span>
            </Button>
            <div className="h-6 w-px bg-gray-300"></div>
            <div className="flex items-center space-x-2">
              <Target className="h-6 w-6 text-indigo-600" />
              <h1 className="text-xl font-bold text-indigo-600">ATS Resume Analysis</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="analyze" className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
            <TabsTrigger value="analyze">Analyze Resume</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          {/* Analyze Tab */}
          <TabsContent value="analyze" className="space-y-8">
            {/* Upload Section */}
            <Card className="max-w-4xl mx-auto">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Upload className="h-6 w-6 text-indigo-600" />
                  <span>Upload Resume & Job Role</span>
                </CardTitle>
                <CardDescription>Get detailed ATS score and improvements for your target role</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Job Role Input */}
                <div className="space-y-2">
                  <Label htmlFor="jobRole" className="flex items-center space-x-2">
                    <Briefcase className="h-4 w-4" />
                    <span>Job Role / Position</span>
                  </Label>
                  <Input
                    id="jobRole"
                    placeholder="e.g., Senior Software Engineer, Data Analyst, Product Manager"
                    value={jobRole}
                    onChange={(e) => setJobRole(e.target.value)}
                    className="text-base"
                  />
                </div>

                {/* File Upload */}
                <div className="space-y-2">
                  <Label htmlFor="resume-file" className="flex items-center space-x-2">
                    <FileText className="h-4 w-4" />
                    <span>Resume (PDF only)</span>
                  </Label>
                  <label htmlFor="resume-file">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-all">
                      <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-sm text-gray-600 mb-2">
                        {file ? file.name : 'Click to upload or drag and drop'}
                      </p>
                      <p className="text-xs text-gray-500">PDF (max. 5MB)</p>
                    </div>
                  </label>
                  <input
                    id="resume-file"
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>

                {/* Analyze Button */}
                <Button
                  onClick={handleAnalyze}
                  disabled={!file || !jobRole.trim() || analyzing}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white py-6"
                  size="lg"
                >
                  {analyzing ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Analyzing Resume...
                    </>
                  ) : (
                    <>
                      <Target className="mr-2 h-5 w-5" />
                      Analyze Resume
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Results Section */}
            {analysis && (
              <div className="max-w-4xl mx-auto space-y-6">
                {/* ATS Score Card */}
                <Card className="border-2 border-indigo-200">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center space-x-2">
                        <Award className="h-6 w-6 text-indigo-600" />
                        <span>ATS Score</span>
                      </span>
                      <Badge className={`text-2xl px-4 py-2 ${getScoreBgColor(analysis.atsScore)} ${getScoreColor(analysis.atsScore)}`}>
                        {analysis.atsScore}/100
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Progress value={analysis.atsScore} className="h-3" />
                    <p className="text-sm text-gray-600 mt-4">{analysis.overallFeedback}</p>
                  </CardContent>
                </Card>

                {/* Improvements by Category */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <TrendingUp className="h-6 w-6 text-purple-600" />
                      <span>Detailed Analysis & Improvements</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Keywords & Skills */}
                    {analysis.categories?.keywords && (
                      <div className="space-y-3">
                        <h3 className="font-semibold text-lg flex items-center space-x-2">
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                          <span>Keywords & Skills</span>
                          <Badge variant="outline">{analysis.categories.keywords.score}/100</Badge>
                        </h3>
                        <div className="pl-7 space-y-2">
                          {analysis.categories.keywords.improvements?.map((item, idx) => (
                            <div key={idx} className="flex items-start space-x-2">
                              <AlertCircle className="h-4 w-4 text-orange-500 mt-0.5" />
                              <p className="text-sm text-gray-700">{item}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Formatting */}
                    {analysis.categories?.formatting && (
                      <div className="space-y-3">
                        <h3 className="font-semibold text-lg flex items-center space-x-2">
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                          <span>Formatting & Structure</span>
                          <Badge variant="outline">{analysis.categories.formatting.score}/100</Badge>
                        </h3>
                        <div className="pl-7 space-y-2">
                          {analysis.categories.formatting.improvements?.map((item, idx) => (
                            <div key={idx} className="flex items-start space-x-2">
                              <AlertCircle className="h-4 w-4 text-orange-500 mt-0.5" />
                              <p className="text-sm text-gray-700">{item}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Content Quality */}
                    {analysis.categories?.content && (
                      <div className="space-y-3">
                        <h3 className="font-semibold text-lg flex items-center space-x-2">
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                          <span>Content Quality</span>
                          <Badge variant="outline">{analysis.categories.content.score}/100</Badge>
                        </h3>
                        <div className="pl-7 space-y-2">
                          {analysis.categories.content.improvements?.map((item, idx) => (
                            <div key={idx} className="flex items-start space-x-2">
                              <AlertCircle className="h-4 w-4 text-orange-500 mt-0.5" />
                              <p className="text-sm text-gray-700">{item}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Experience & Achievements */}
                    {analysis.categories?.experience && (
                      <div className="space-y-3">
                        <h3 className="font-semibold text-lg flex items-center space-x-2">
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                          <span>Experience & Achievements</span>
                          <Badge variant="outline">{analysis.categories.experience.score}/100</Badge>
                        </h3>
                        <div className="pl-7 space-y-2">
                          {analysis.categories.experience.improvements?.map((item, idx) => (
                            <div key={idx} className="flex items-start space-x-2">
                              <AlertCircle className="h-4 w-4 text-orange-500 mt-0.5" />
                              <p className="text-sm text-gray-700">{item}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Strengths */}
                {analysis.strengths && analysis.strengths.length > 0 && (
                  <Card className="border-2 border-green-200">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2 text-green-700">
                        <CheckCircle2 className="h-6 w-6" />
                        <span>Strengths</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {analysis.strengths.map((strength, idx) => (
                          <li key={idx} className="flex items-start space-x-2">
                            <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                            <span className="text-sm text-gray-700">{strength}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history">
            <Card className="max-w-4xl mx-auto">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <History className="h-6 w-6 text-indigo-600" />
                  <span>Analysis History</span>
                </CardTitle>
                <CardDescription>View your previous resume analyses</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingHistory ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                  </div>
                ) : analysisHistory.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No analysis history yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {analysisHistory.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                        onClick={() => handleViewHistory(item)}
                      >
                        <div className="flex items-center space-x-4 flex-1">
                          <div className="p-3 bg-indigo-100 rounded-full">
                            <FileText className="h-6 w-6 text-indigo-600" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{item.jobRole}</p>
                            <p className="text-sm text-gray-500">
                              {new Date(item.analyzedAt).toLocaleDateString()} • {item.fileName}
                            </p>
                          </div>
                          <div className="text-right">
                            <Badge className={`text-lg px-3 py-1 ${getScoreBgColor(item.analysis.atsScore)} ${getScoreColor(item.analysis.atsScore)}`}>
                              {item.analysis.atsScore}/100
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
