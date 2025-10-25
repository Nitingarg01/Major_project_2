'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, FileText, Briefcase, Code, GraduationCap, 
  Award, TrendingUp, Lightbulb, Target, User 
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export default function ResumeAnalysisPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  
  const [resume, setResume] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (session && params.id) {
      fetchResumeDetails();
    }
  }, [session, params.id]);

  const fetchResumeDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/resumes');
      
      if (response.ok) {
        const data = await response.json();
        const foundResume = data.resumes.find(r => r.id === params.id);
        if (foundResume) {
          setResume(foundResume);
        } else {
          toast({
            title: 'Error',
            description: 'Resume not found',
            variant: 'destructive'
          });
          router.push('/dashboard');
        }
      } else {
        toast({
          title: 'Error',
          description: 'Failed to load resume details',
          variant: 'destructive'
        });
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Error fetching resume:', error);
      toast({
        title: 'Error',
        description: 'Failed to load resume details',
        variant: 'destructive'
      });
      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading resume analysis...</p>
        </div>
      </div>
    );
  }

  if (!resume) {
    return null;
  }

  const analysis = resume.analysis || {};
  const personalInfo = analysis.personalInfo || {};
  const projects = analysis.projects || [];
  const experience = analysis.experience || [];
  const education = analysis.education || [];
  const skills = analysis.skills || { technical: [], soft: [] };
  const certifications = analysis.certifications || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={() => router.push('/dashboard')}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                {personalInfo.name || 'Resume Analysis'}
              </h1>
              <p className="text-gray-600 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                {resume.filename}
              </p>
            </div>
            <Badge variant="outline" className="text-sm">
              Uploaded: {new Date(resume.uploadedAt).toLocaleDateString()}
            </Badge>
          </div>
        </div>

        {/* Overall Assessment */}
        {analysis.overall && (
          <Card className="mb-6 border-indigo-200 bg-gradient-to-r from-indigo-50 to-purple-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-indigo-600" />
                Overall Assessment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 leading-relaxed">{analysis.overall}</p>
            </CardContent>
          </Card>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <Briefcase className="h-8 w-8 text-indigo-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900">{experience.length}</p>
                <p className="text-sm text-gray-600">Work Experiences</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <Code className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900">{projects.length}</p>
                <p className="text-sm text-gray-600">Projects</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <GraduationCap className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900">{skills.technical?.length || 0}</p>
                <p className="text-sm text-gray-600">Technical Skills</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <Award className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900">{certifications.length}</p>
                <p className="text-sm text-gray-600">Certifications</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Analysis Tabs */}
        <Tabs defaultValue="projects" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="projects">Projects</TabsTrigger>
            <TabsTrigger value="experience">Experience</TabsTrigger>
            <TabsTrigger value="skills">Skills</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
            <TabsTrigger value="personal">Personal Info</TabsTrigger>
          </TabsList>

          {/* Projects Tab */}
          <TabsContent value="projects" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Projects Portfolio</CardTitle>
                <CardDescription>Detailed analysis of your project work</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {projects.length > 0 ? (
                  projects.map((project, index) => (
                    <div key={index} className="border-l-4 border-indigo-500 pl-4 py-2">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {project.projectName}
                      </h3>
                      <p className="text-gray-700 mb-3">{project.description}</p>
                      
                      {project.role && (
                        <p className="text-sm text-gray-600 mb-2">
                          <strong>Role:</strong> {project.role}
                        </p>
                      )}
                      
                      {project.technologies && project.technologies.length > 0 && (
                        <div className="mb-3">
                          <p className="text-sm font-semibold text-gray-700 mb-2">Technologies:</p>
                          <div className="flex flex-wrap gap-2">
                            {project.technologies.map((tech, i) => (
                              <Badge key={i} variant="secondary">{tech}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {project.achievements && project.achievements.length > 0 && (
                        <div>
                          <p className="text-sm font-semibold text-gray-700 mb-2">Key Achievements:</p>
                          <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                            {project.achievements.map((achievement, i) => (
                              <li key={i}>{achievement}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {index < projects.length - 1 && <Separator className="mt-6" />}
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-8">No projects found in resume</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Experience Tab */}
          <TabsContent value="experience" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Work Experience</CardTitle>
                <CardDescription>Professional background and achievements</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {experience.length > 0 ? (
                  experience.map((exp, index) => (
                    <div key={index} className="border-l-4 border-purple-500 pl-4 py-2">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{exp.role}</h3>
                          <p className="text-indigo-600 font-medium">{exp.company}</p>
                        </div>
                        <Badge variant="outline">{exp.duration}</Badge>
                      </div>
                      
                      {exp.location && (
                        <p className="text-sm text-gray-600 mb-3">{exp.location}</p>
                      )}
                      
                      {exp.responsibilities && exp.responsibilities.length > 0 && (
                        <div className="mb-3">
                          <p className="text-sm font-semibold text-gray-700 mb-2">Responsibilities:</p>
                          <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                            {exp.responsibilities.map((resp, i) => (
                              <li key={i}>{resp}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {exp.technologies && exp.technologies.length > 0 && (
                        <div className="mb-3">
                          <p className="text-sm font-semibold text-gray-700 mb-2">Technologies Used:</p>
                          <div className="flex flex-wrap gap-2">
                            {exp.technologies.map((tech, i) => (
                              <Badge key={i} variant="secondary">{tech}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {exp.achievements && exp.achievements.length > 0 && (
                        <div>
                          <p className="text-sm font-semibold text-gray-700 mb-2">Key Achievements:</p>
                          <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                            {exp.achievements.map((achievement, i) => (
                              <li key={i}>{achievement}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {index < experience.length - 1 && <Separator className="mt-6" />}
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-8">No work experience found in resume</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Skills Tab */}
          <TabsContent value="skills" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Code className="h-5 w-5 text-indigo-600" />
                    Technical Skills
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {skills.technical && skills.technical.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {skills.technical.map((skill, index) => (
                        <Badge key={index} variant="default" className="bg-indigo-600">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4">No technical skills listed</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5 text-purple-600" />
                    Soft Skills
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {skills.soft && skills.soft.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {skills.soft.map((skill, index) => (
                        <Badge key={index} variant="secondary" className="bg-purple-100">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4">No soft skills listed</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Education & Certifications */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <GraduationCap className="h-5 w-5 text-green-600" />
                    Education
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {education.length > 0 ? (
                    education.map((edu, index) => (
                      <div key={index} className="border-l-2 border-green-500 pl-3">
                        <p className="font-semibold text-gray-900">{edu.degree}</p>
                        <p className="text-sm text-gray-600">{edu.institution}</p>
                        <p className="text-xs text-gray-500">{edu.year}</p>
                        {edu.gpa && <p className="text-xs text-gray-500">GPA: {edu.gpa}</p>}
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-center py-4">No education information found</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-orange-600" />
                    Certifications
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {certifications.length > 0 ? (
                    <ul className="space-y-2">
                      {certifications.map((cert, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-orange-600 mt-1">•</span>
                          <span className="text-gray-700">{cert}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-500 text-center py-4">No certifications listed</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Insights Tab */}
          <TabsContent value="insights" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border-green-200 bg-green-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-700">
                    <TrendingUp className="h-5 w-5" />
                    Strengths
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {analysis.strengths && analysis.strengths.length > 0 ? (
                    <ul className="space-y-2">
                      {analysis.strengths.map((strength, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-green-600 mt-1">✓</span>
                          <span className="text-gray-700">{strength}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-500 text-center py-4">No strengths analyzed</p>
                  )}
                </CardContent>
              </Card>

              <Card className="border-orange-200 bg-orange-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-orange-700">
                    <Target className="h-5 w-5" />
                    Areas for Improvement
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {analysis.improvements && analysis.improvements.length > 0 ? (
                    <ul className="space-y-2">
                      {analysis.improvements.map((improvement, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-orange-600 mt-1">→</span>
                          <span className="text-gray-700">{improvement}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-500 text-center py-4">No improvements suggested</p>
                  )}
                </CardContent>
              </Card>

              <Card className="border-blue-200 bg-blue-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-blue-700">
                    <Lightbulb className="h-5 w-5" />
                    Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {analysis.recommendations && analysis.recommendations.length > 0 ? (
                    <ul className="space-y-2">
                      {analysis.recommendations.map((recommendation, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-blue-600 mt-1">💡</span>
                          <span className="text-gray-700">{recommendation}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-500 text-center py-4">No recommendations available</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Personal Info Tab */}
          <TabsContent value="personal">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-indigo-600" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {personalInfo.name && (
                  <div>
                    <p className="text-sm text-gray-600">Name</p>
                    <p className="text-lg font-semibold text-gray-900">{personalInfo.name}</p>
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {personalInfo.email && (
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="text-gray-900">{personalInfo.email}</p>
                    </div>
                  )}
                  
                  {personalInfo.phone && (
                    <div>
                      <p className="text-sm text-gray-600">Phone</p>
                      <p className="text-gray-900">{personalInfo.phone}</p>
                    </div>
                  )}
                  
                  {personalInfo.linkedin && (
                    <div>
                      <p className="text-sm text-gray-600">LinkedIn</p>
                      <a href={personalInfo.linkedin} target="_blank" rel="noopener noreferrer" 
                         className="text-indigo-600 hover:underline">
                        {personalInfo.linkedin}
                      </a>
                    </div>
                  )}
                  
                  {personalInfo.github && (
                    <div>
                      <p className="text-sm text-gray-600">GitHub</p>
                      <a href={personalInfo.github} target="_blank" rel="noopener noreferrer"
                         className="text-indigo-600 hover:underline">
                        {personalInfo.github}
                      </a>
                    </div>
                  )}
                </div>
                
                {personalInfo.summary && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-600 mb-2">Professional Summary</p>
                    <p className="text-gray-700 leading-relaxed">{personalInfo.summary}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
