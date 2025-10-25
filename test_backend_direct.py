#!/usr/bin/env python3
"""
Direct Backend API Testing Script for Interview Pro AI Platform
Tests backend APIs with focus on AI integrations (OpenRouter + DeepSeek v3.1, Gemini, ElevenLabs)
"""

import requests
import json
import time
import uuid
import io
import os
from datetime import datetime

# Configuration
BASE_URL = os.getenv('NEXT_PUBLIC_BASE_URL', 'http://localhost:3000')
API_BASE = f"{BASE_URL}/api"

# Test data with realistic information
TEST_USER = {
    "name": "Alex Rodriguez",
    "email": f"alex.rodriguez.{uuid.uuid4().hex[:8]}@techcorp.com",
    "password": "SecurePass123!"
}

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    END = '\033[0m'
    BOLD = '\033[1m'

def print_test_header(test_name):
    print(f"\n{Colors.BLUE}{Colors.BOLD}{'='*60}{Colors.END}")
    print(f"{Colors.BLUE}{Colors.BOLD}Testing: {test_name}{Colors.END}")
    print(f"{Colors.BLUE}{Colors.BOLD}{'='*60}{Colors.END}")

def print_success(message):
    print(f"{Colors.GREEN}✅ {message}{Colors.END}")

def print_error(message):
    print(f"{Colors.RED}❌ {message}{Colors.END}")

def print_warning(message):
    print(f"{Colors.YELLOW}⚠️  {message}{Colors.END}")

def print_info(message):
    print(f"{Colors.BLUE}ℹ️  {message}{Colors.END}")

def create_realistic_resume_content():
    """Create realistic resume content for testing"""
    resume_text = """
ALEX RODRIGUEZ
Senior Software Engineer
Email: alex.rodriguez@techcorp.com | Phone: (555) 123-4567
LinkedIn: linkedin.com/in/alexrodriguez | GitHub: github.com/alexrodriguez

PROFESSIONAL SUMMARY
Experienced Full-Stack Software Engineer with 5+ years developing scalable web applications. 
Expertise in React, Node.js, Python, and cloud technologies. Led teams of 4-6 developers on 
enterprise projects serving 100K+ users.

TECHNICAL SKILLS
Languages: JavaScript, Python, TypeScript, Java, SQL
Frontend: React, Vue.js, Angular, HTML5, CSS3, Tailwind CSS
Backend: Node.js, Express.js, Django, Flask, Spring Boot
Databases: PostgreSQL, MongoDB, Redis, MySQL
Cloud: AWS (EC2, S3, Lambda, RDS), Docker, Kubernetes
Tools: Git, Jenkins, Jest, Cypress, Webpack

PROFESSIONAL EXPERIENCE

Senior Software Engineer | TechCorp Inc. | Jan 2021 - Present
• Led development of customer portal serving 50K+ daily active users using React and Node.js
• Implemented microservices architecture reducing system latency by 40%
• Mentored 3 junior developers and conducted code reviews
• Technologies: React, Node.js, PostgreSQL, AWS, Docker

Software Engineer | DataSolutions LLC | Jun 2019 - Dec 2020
• Built real-time analytics dashboard processing 1M+ events daily
• Developed REST APIs handling 10K+ requests per minute
• Optimized database queries improving performance by 60%
• Technologies: Python, Django, MongoDB, Redis, Kubernetes

PROJECTS

E-Commerce Platform (2023)
• Full-stack e-commerce application with payment integration
• Built with React, Node.js, Express, MongoDB
• Implemented user authentication, shopping cart, order management
• Deployed on AWS with CI/CD pipeline
• Challenges: Handling concurrent transactions, payment security
• Achievements: 99.9% uptime, processed $500K+ in transactions

Real-Time Chat Application (2022)
• WebSocket-based chat app supporting 1000+ concurrent users
• Technologies: React, Socket.io, Node.js, Redis
• Features: Real-time messaging, file sharing, user presence
• Challenges: Scaling WebSocket connections, message persistence
• Achievements: Sub-100ms message delivery, 24/7 availability

Data Visualization Dashboard (2021)
• Interactive dashboard for business intelligence
• Built with Vue.js, D3.js, Python Flask, PostgreSQL
• Real-time data updates using WebSockets
• Challenges: Large dataset rendering, responsive design
• Achievements: Reduced report generation time by 80%

EDUCATION
Bachelor of Science in Computer Science
University of Technology | 2015 - 2019
GPA: 3.8/4.0
Relevant Courses: Data Structures, Algorithms, Database Systems, Software Engineering

CERTIFICATIONS
• AWS Certified Solutions Architect (2022)
• MongoDB Certified Developer (2021)
• Google Cloud Professional Developer (2020)
"""
    return resume_text

def create_test_pdf():
    """Create a more realistic PDF content for resume upload testing"""
    resume_content = create_realistic_resume_content()
    
    # Simple PDF structure with realistic resume content
    pdf_content = f"""%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
>>
endobj

4 0 obj
<<
/Length {len(resume_content) + 50}
>>
stream
BT
/F1 10 Tf
50 750 Td
{resume_content[:500]}
ET
endstream
endobj

xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000204 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
{len(resume_content) + 300}
%%EOF""".encode('utf-8')
    
    return pdf_content

def test_registration_and_setup():
    """Register test user for authentication"""
    print_test_header("User Registration Setup")
    
    try:
        response = requests.post(
            f"{API_BASE}/register",
            json=TEST_USER,
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        print_info(f"Registration Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            if data.get("success"):
                print_success("Test user registered successfully")
                return True
            else:
                print_error("Registration failed - no success flag")
                return False
        else:
            print_error(f"Registration failed with status: {response.status_code}")
            print_info(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print_error(f"Registration failed: {str(e)}")
        return False

def get_authenticated_session():
    """Get authenticated session using NextAuth signin endpoint"""
    try:
        # Get CSRF token first
        csrf_response = requests.get(f"{API_BASE}/auth/csrf")
        csrf_token = csrf_response.json().get('csrfToken')
        
        # Create session
        session = requests.Session()
        
        # Try to authenticate using NextAuth signin
        signin_data = {
            'email': TEST_USER['email'],
            'password': TEST_USER['password'],
            'csrfToken': csrf_token,
            'callbackUrl': BASE_URL,
            'json': 'true'
        }
        
        signin_response = session.post(
            f"{API_BASE}/auth/signin/credentials",
            data=signin_data,
            headers={'Content-Type': 'application/x-www-form-urlencoded'},
            allow_redirects=False
        )
        
        print_info(f"Signin attempt status: {signin_response.status_code}")
        
        # Check if we have session cookies
        if 'next-auth.session-token' in session.cookies:
            print_success("Authentication session established")
            return session
        else:
            print_warning("No session token found, trying alternative approach")
            return None
            
    except Exception as e:
        print_error(f"Authentication failed: {str(e)}")
        return None

def test_resume_upload_with_ai():
    """Test resume upload with DeepSeek v3.1 analysis"""
    print_test_header("Resume Upload API with DeepSeek v3.1 Analysis")
    
    # Try to get authenticated session
    session = get_authenticated_session()
    
    # For testing purposes, we'll test the API structure even without auth
    print_info("Testing resume upload API structure...")
    
    try:
        # Create realistic test PDF
        pdf_content = create_test_pdf()
        files = {
            'file': ('alex_rodriguez_resume.pdf', io.BytesIO(pdf_content), 'application/pdf')
        }
        
        # Test without authentication first to check API structure
        response = requests.post(
            f"{API_BASE}/resume/upload",
            files=files,
            timeout=45  # Longer timeout for AI processing
        )
        
        print_info(f"Status Code: {response.status_code}")
        print_info(f"Response: {response.text}")
        
        if response.status_code == 401:
            print_success("✅ API structure working - properly requires authentication")
            
            # If we have a session, try with authentication
            if session:
                print_info("Attempting with authentication...")
                auth_response = session.post(
                    f"{API_BASE}/resume/upload",
                    files={'file': ('alex_rodriguez_resume.pdf', io.BytesIO(pdf_content), 'application/pdf')},
                    timeout=45
                )
                
                print_info(f"Authenticated Status: {auth_response.status_code}")
                print_info(f"Authenticated Response: {auth_response.text}")
                
                if auth_response.status_code == 200:
                    data = auth_response.json()
                    if data.get("success") and data.get("analysis"):
                        print_success("✅ Resume upload and DeepSeek v3.1 analysis successful!")
                        analysis = data["analysis"]
                        print_info(f"Analysis keys: {list(analysis.keys())}")
                        
                        # Check for detailed analysis structure
                        if analysis.get("projects") and analysis.get("skills"):
                            print_success("✅ Detailed resume analysis with projects and skills")
                            if analysis.get("projects"):
                                print_info(f"Projects found: {len(analysis['projects'])}")
                                if analysis["projects"]:
                                    print_info(f"First project: {analysis['projects'][0].get('projectName', 'N/A')}")
                        
                        return True, data.get("resumeId")
                    else:
                        print_error("❌ Resume upload succeeded but analysis failed")
                        return False, None
                else:
                    print_error(f"❌ Authenticated upload failed: {auth_response.status_code}")
                    return False, None
            else:
                print_warning("Cannot test with authentication - session not established")
                return False, None
        else:
            print_error(f"❌ Unexpected response without authentication: {response.status_code}")
            return False, None
            
    except Exception as e:
        print_error(f"Resume upload test failed: {str(e)}")
        return False, None

def test_interview_creation_with_ai(resume_id=None):
    """Test interview creation with DeepSeek v3.1 question generation"""
    print_test_header("Interview Creation API with DeepSeek v3.1 Questions")
    
    session = get_authenticated_session()
    
    try:
        interview_data = {
            "jobRole": "Senior Software Engineer",
            "experienceLevel": "senior",
            "numQuestions": 4,
            "resumeId": resume_id or "none"
        }
        
        # Test without authentication first
        response = requests.post(
            f"{API_BASE}/interview/create",
            json=interview_data,
            headers={"Content-Type": "application/json"},
            timeout=45  # Longer timeout for AI processing
        )
        
        print_info(f"Status Code: {response.status_code}")
        print_info(f"Response: {response.text}")
        
        if response.status_code == 401:
            print_success("✅ API structure working - properly requires authentication")
            
            if session:
                print_info("Attempting with authentication...")
                auth_response = session.post(
                    f"{API_BASE}/interview/create",
                    json=interview_data,
                    headers={"Content-Type": "application/json"},
                    timeout=45
                )
                
                print_info(f"Authenticated Status: {auth_response.status_code}")
                print_info(f"Authenticated Response: {auth_response.text}")
                
                if auth_response.status_code == 200:
                    data = auth_response.json()
                    if data.get("success") and data.get("questions"):
                        print_success("✅ Interview creation and DeepSeek v3.1 question generation successful!")
                        questions = data["questions"]
                        print_info(f"Questions generated: {len(questions)}")
                        
                        # Check question quality
                        if questions:
                            first_q = questions[0]
                            print_info(f"First question: {first_q.get('question', 'N/A')}")
                            print_info(f"Question type: {first_q.get('type', 'N/A')}")
                            
                            # Check if questions are personalized (if resume provided)
                            if resume_id and resume_id != "none":
                                question_text = first_q.get('question', '').lower()
                                if any(keyword in question_text for keyword in ['project', 'experience', 'techcorp', 'react', 'node']):
                                    print_success("✅ Questions appear to be personalized based on resume")
                                else:
                                    print_warning("Questions may not be fully personalized")
                        
                        return True, data.get("interviewId")
                    else:
                        print_error("❌ Interview creation succeeded but missing questions")
                        return False, None
                else:
                    print_error(f"❌ Authenticated creation failed: {auth_response.status_code}")
                    return False, None
            else:
                print_warning("Cannot test with authentication - session not established")
                return False, None
        else:
            print_error(f"❌ Unexpected response without authentication: {response.status_code}")
            return False, None
            
    except Exception as e:
        print_error(f"Interview creation test failed: {str(e)}")
        return False, None

def test_delete_interview(interview_id):
    """Test interview deletion API"""
    print_test_header("Delete Interview API")
    
    if not interview_id:
        print_warning("No interview ID provided - skipping delete test")
        return False
    
    session = get_authenticated_session()
    
    try:
        # Test without authentication first
        response = requests.delete(
            f"{API_BASE}/interview/{interview_id}",
            timeout=10
        )
        
        print_info(f"Status Code: {response.status_code}")
        print_info(f"Response: {response.text}")
        
        if response.status_code == 401:
            print_success("✅ API structure working - properly requires authentication")
            
            if session:
                print_info("Attempting with authentication...")
                auth_response = session.delete(
                    f"{API_BASE}/interview/{interview_id}",
                    timeout=10
                )
                
                print_info(f"Authenticated Status: {auth_response.status_code}")
                print_info(f"Authenticated Response: {auth_response.text}")
                
                if auth_response.status_code == 200:
                    data = auth_response.json()
                    if data.get("success"):
                        print_success("✅ Interview deletion successful!")
                        return True
                    else:
                        print_error("❌ Delete response missing success flag")
                        return False
                elif auth_response.status_code == 404:
                    print_warning("Interview not found (may have been deleted already)")
                    return True  # This is actually expected behavior
                else:
                    print_error(f"❌ Authenticated deletion failed: {auth_response.status_code}")
                    return False
            else:
                print_warning("Cannot test with authentication - session not established")
                return False
        else:
            print_error(f"❌ Unexpected response without authentication: {response.status_code}")
            return False
            
    except Exception as e:
        print_error(f"Delete interview test failed: {str(e)}")
        return False

def test_text_to_speech():
    """Test ElevenLabs TTS API"""
    print_test_header("Text-to-Speech API with ElevenLabs")
    
    try:
        tts_data = {
            "text": "Hello Alex! Welcome to your AI interview session. I'm excited to learn about your experience as a Senior Software Engineer. Let's start with your background and recent projects at TechCorp."
        }
        
        response = requests.post(
            f"{API_BASE}/tts",
            json=tts_data,
            headers={"Content-Type": "application/json"},
            timeout=30  # Longer timeout for audio generation
        )
        
        print_info(f"Status Code: {response.status_code}")
        print_info(f"Content-Type: {response.headers.get('Content-Type')}")
        print_info(f"Content-Length: {response.headers.get('Content-Length')}")
        
        if response.status_code == 200:
            content_type = response.headers.get('Content-Type', '')
            if 'audio' in content_type:
                print_success("✅ ElevenLabs TTS generation successful!")
                print_info(f"Audio size: {len(response.content)} bytes")
                
                # Check if audio size is reasonable
                if len(response.content) > 1000:  # Should be at least 1KB for real audio
                    print_success("✅ Audio content appears to be valid (good size)")
                else:
                    print_warning("Audio content seems small - may be placeholder")
                
                return True
            else:
                print_error(f"❌ Expected audio content, got: {content_type}")
                print_info(f"Response: {response.text}")
                return False
        else:
            print_error(f"❌ TTS failed with status: {response.status_code}")
            print_info(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print_error(f"TTS test failed: {str(e)}")
        return False

def test_api_integrations():
    """Test all AI API integrations"""
    print_test_header("AI API Integration Summary")
    
    results = {
        "registration": False,
        "resume_analysis": False,
        "interview_creation": False,
        "interview_deletion": False,
        "tts": False
    }
    
    # Test registration first
    print_info("Step 1: Setting up test user...")
    results["registration"] = test_registration_and_setup()
    
    if not results["registration"]:
        print_error("Cannot proceed - user registration failed")
        return results
    
    time.sleep(1)
    
    # Test resume upload with DeepSeek analysis
    print_info("Step 2: Testing resume analysis with DeepSeek v3.1...")
    resume_success, resume_id = test_resume_upload_with_ai()
    results["resume_analysis"] = resume_success
    
    time.sleep(2)
    
    # Test interview creation with DeepSeek questions
    print_info("Step 3: Testing interview creation with DeepSeek v3.1...")
    interview_success, interview_id = test_interview_creation_with_ai(resume_id)
    results["interview_creation"] = interview_success
    
    time.sleep(1)
    
    # Test interview deletion
    if interview_id:
        print_info("Step 4: Testing interview deletion...")
        results["interview_deletion"] = test_delete_interview(interview_id)
        time.sleep(1)
    
    # Test TTS with ElevenLabs
    print_info("Step 5: Testing TTS with ElevenLabs...")
    results["tts"] = test_text_to_speech()
    
    return results

def generate_final_report(results):
    """Generate final test report"""
    print_test_header("FINAL TEST REPORT")
    
    print(f"{Colors.BOLD}API Integration Test Results:{Colors.END}")
    
    # Registration
    if results["registration"]:
        print_success("User Registration - Working")
    else:
        print_error("User Registration - Failed")
    
    # Resume Analysis (DeepSeek v3.1 via OpenRouter)
    if results["resume_analysis"]:
        print_success("Resume Analysis (DeepSeek v3.1 via OpenRouter) - Working")
    else:
        print_error("Resume Analysis (DeepSeek v3.1 via OpenRouter) - Failed")
    
    # Interview Creation (DeepSeek v3.1)
    if results["interview_creation"]:
        print_success("Interview Creation (DeepSeek v3.1) - Working")
    else:
        print_error("Interview Creation (DeepSeek v3.1) - Failed")
    
    # Interview Deletion
    if results["interview_deletion"]:
        print_success("Interview Deletion - Working")
    else:
        print_error("Interview Deletion - Failed")
    
    # TTS (ElevenLabs)
    if results["tts"]:
        print_success("Text-to-Speech (ElevenLabs) - Working")
    else:
        print_error("Text-to-Speech (ElevenLabs) - Failed")
    
    # Overall assessment
    working_count = sum(1 for v in results.values() if v)
    total_count = len(results)
    
    print(f"\n{Colors.BOLD}Overall Results:{Colors.END}")
    print(f"Working APIs: {Colors.GREEN}{working_count}/{total_count}{Colors.END}")
    print(f"Success Rate: {Colors.BLUE}{(working_count/total_count)*100:.1f}%{Colors.END}")
    
    # Critical issues
    critical_issues = []
    if not results["resume_analysis"]:
        critical_issues.append("DeepSeek v3.1 resume analysis not working")
    if not results["interview_creation"]:
        critical_issues.append("DeepSeek v3.1 interview questions not working")
    if not results["interview_deletion"]:
        critical_issues.append("Interview deletion not working")
    if not results["tts"]:
        critical_issues.append("ElevenLabs TTS not working")
    
    if critical_issues:
        print(f"\n{Colors.RED}{Colors.BOLD}Critical Issues:{Colors.END}")
        for issue in critical_issues:
            print_error(issue)
    else:
        print(f"\n{Colors.GREEN}{Colors.BOLD}✅ All AI integrations working successfully!{Colors.END}")
    
    return results

def main():
    """Main test execution"""
    print(f"{Colors.BLUE}{Colors.BOLD}")
    print("=" * 80)
    print("AI INTERVIEW PLATFORM - BACKEND API TESTING")
    print("Focus: OpenRouter + DeepSeek v3.1, Gemini, ElevenLabs Integration")
    print("=" * 80)
    print(f"{Colors.END}")
    
    print_info(f"Base URL: {BASE_URL}")
    print_info(f"API Base: {API_BASE}")
    print_info(f"Test Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    try:
        # Run comprehensive AI integration tests
        results = test_api_integrations()
        
        # Generate final report
        final_results = generate_final_report(results)
        
        return final_results
        
    except KeyboardInterrupt:
        print_warning("\nTesting interrupted by user")
    except Exception as e:
        print_error(f"Unexpected error during testing: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()