'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Video, ArrowLeft, Sparkles } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export default function InterviewSetupPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resumes, setResumes] = useState([]);
  
  const [jobRole, setJobRole] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('mid');
  const [numQuestions, setNumQuestions] = useState(5);
  const [selectedResume, setSelectedResume] = useState('');

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
      fetchResumes();
    }
  }, [session]);

  const fetchResumes = async () => {
    try {
      const response = await fetch('/api/resumes');
      if (response.ok) {
        const data = await response.json();
        setResumes(data.resumes || []);
      }
    } catch (error) {
      console.error('Error fetching resumes:', error);
    }
  };

  const handleStartInterview = async () => {
    if (!jobRole.trim()) {
      toast({
        title: 'Job role required',
        description: 'Please enter a job role',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/interview/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobRole,
          experienceLevel,
          numQuestions,
          resumeId: selectedResume || null
        })
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'Interview created!',
          description: 'Starting your AI interview session...'
        });
        router.push(`/interview/${data.interviewId}`);
      } else {
        toast({
          title: 'Failed to create interview',
          description: data.error || 'Please try again',
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
      setLoading(false);
    }
  };

  if (!mounted || status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-md sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/dashboard')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
          <div className="flex items-center space-x-2">
            <Video className="h-8 w-8 text-indigo-600" />
            <h1 className="text-2xl font-bold text-indigo-600">MY interview AI</h1>
          </div>
          <div className="w-32"></div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12 max-w-3xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-4">
            <Sparkles className="h-8 w-8 text-indigo-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Customize Your Interview</h2>
          <p className="text-gray-600">Set up your AI interview session with personalized settings</p>
        </div>

        <Card className="border-2 shadow-lg">
          <CardHeader>
            <CardTitle>Interview Settings</CardTitle>
            <CardDescription>Configure your mock interview parameters</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Job Role */}
            <div className="space-y-2">
              <Label htmlFor="jobRole" className="text-base font-semibold">
                Job Role <span className="text-red-500">*</span>
              </Label>
              <Input
                id="jobRole"
                placeholder="e.g., Software Engineer, Product Manager, Data Scientist"
                value={jobRole}
                onChange={(e) => setJobRole(e.target.value)}
                className="text-base"
              />
              <p className="text-sm text-gray-500">Enter the position you're interviewing for</p>
            </div>

            {/* Experience Level */}
            <div className="space-y-2">
              <Label htmlFor="experience" className="text-base font-semibold">Experience Level</Label>
              <Select value={experienceLevel} onValueChange={setExperienceLevel}>
                <SelectTrigger id="experience" className="text-base">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="entry">Entry Level (0-2 years)</SelectItem>
                  <SelectItem value="mid">Mid Level (3-5 years)</SelectItem>
                  <SelectItem value="senior">Senior Level (6+ years)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Number of Questions */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label htmlFor="numQuestions" className="text-base font-semibold">Number of Questions</Label>
                <span className="text-2xl font-bold text-indigo-600">{numQuestions}</span>
              </div>
              <Slider
                id="numQuestions"
                min={3}
                max={50}
                step={1}
                value={[numQuestions]}
                onValueChange={(value) => setNumQuestions(value[0])}
                className="w-full"
              />
              <p className="text-sm text-gray-500">No limit! Choose as many questions as you need. Recommended: 5-10 for quick practice, 15-25 for comprehensive interview</p>
            </div>

            {/* Resume Selection */}
            {resumes.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="resume" className="text-base font-semibold">Select Resume (Optional)</Label>
                <Select value={selectedResume} onValueChange={setSelectedResume}>
                  <SelectTrigger id="resume" className="text-base">
                    <SelectValue placeholder="Choose a resume or skip" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No resume</SelectItem>
                    {resumes.map((resume) => (
                      <SelectItem key={resume.id} value={resume.id}>
                        {resume.filename}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-gray-500">Questions will be tailored to your resume if selected</p>
              </div>
            )}

            {/* Info Box */}
            <div className="bg-indigo-50 border-2 border-indigo-200 rounded-lg p-4">
              <h4 className="font-semibold text-indigo-900 mb-2">What to Expect:</h4>
              <ul className="space-y-1 text-sm text-indigo-800">
                <li>• AI interviewer will ask questions via voice</li>
                <li>• You can answer using your microphone</li>
                <li>• Get real-time feedback after each answer</li>
                <li>• Receive detailed performance report at the end</li>
              </ul>
            </div>

            {/* Start Button */}
            <Button
              onClick={handleStartInterview}
              disabled={loading || !jobRole.trim()}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-lg py-6"
              size="lg"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Creating Interview...
                </>
              ) : (
                <>
                  <Video className="mr-2 h-5 w-5" />
                  Start AI Interview
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
