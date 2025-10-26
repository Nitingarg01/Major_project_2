#!/usr/bin/env python3
"""
ATS Resume Analysis API Testing Script
Tests the new ATS Resume Analysis backend APIs with real Gemini API key
"""

import requests
import json
import io
import uuid
import os
from datetime import datetime

# Configuration
BASE_URL = 'http://localhost:3000'  # Use localhost for testing
API_BASE = f"{BASE_URL}/api"

# Test data
TEST_USER = {
    "name": "Emma Wilson",
    "email": f"emma.wilson.{uuid.uuid4().hex[:8]}@testdomain.com",
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

def print_info(message):
    print(f"{Colors.BLUE}ℹ️  {message}{Colors.END}")

def create_realistic_resume_pdf():
    """Create a realistic resume PDF content for ATS analysis testing"""
    pdf_text = """%PDF-1.4
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
/Length 600
>>
stream
BT
/F1 14 Tf
72 720 Td
(EMMA WILSON) Tj
0 -20 Td
(Senior Full Stack Developer) Tj
0 -15 Td
(emma.wilson@email.com | (555) 987-6543) Tj

0 -30 Td
/F1 12 Tf
(PROFESSIONAL SUMMARY) Tj
0 -15 Td
/F1 10 Tf
(Experienced full-stack developer with 6+ years building scalable applications.) Tj
0 -12 Td
(Expert in React, Node.js, Python, AWS, and modern development practices.) Tj
0 -12 Td
(Led cross-functional teams and delivered 20+ successful projects.) Tj

0 -25 Td
/F1 12 Tf
(TECHNICAL SKILLS) Tj
0 -15 Td
/F1 10 Tf
(Frontend: React, Vue.js, TypeScript, HTML5, CSS3, Tailwind CSS) Tj
0 -12 Td
(Backend: Node.js, Python, Express, FastAPI, REST APIs, GraphQL) Tj
0 -12 Td
(Cloud: AWS (Lambda, EC2, S3, RDS), Docker, Kubernetes, CI/CD) Tj
0 -12 Td
(Databases: PostgreSQL, MongoDB, Redis, MySQL) Tj

0 -25 Td
/F1 12 Tf
(PROFESSIONAL EXPERIENCE) Tj
0 -15 Td
/F1 11 Tf
(Senior Full Stack Developer | TechSolutions Inc. | 2022-Present) Tj
0 -12 Td
/F1 10 Tf
(Built microservices architecture handling 500K+ requests daily) Tj
0 -12 Td
(Improved application performance by 50% through optimization) Tj
0 -12 Td
(Led team of 4 developers using Agile methodologies) Tj

0 -20 Td
/F1 11 Tf
(Full Stack Developer | InnovateCorp | 2020-2022) Tj
0 -12 Td
/F1 10 Tf
(Developed React-based dashboard with real-time analytics) Tj
0 -12 Td
(Implemented automated testing reducing bugs by 60%) Tj
0 -12 Td
(Collaborated with UX team to improve user experience) Tj

0 -25 Td
/F1 12 Tf
(EDUCATION) Tj
0 -15 Td
/F1 10 Tf
(Master of Science in Computer Science | Tech University | 2020) Tj
0 -12 Td
(Bachelor of Science in Software Engineering | State College | 2018) Tj

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
850
%%EOF"""
    return pdf_text.encode('utf-8')

def register_user():
    """Register a test user"""
    print_test_header("User Registration")
    
    try:
        response = requests.post(
            f"{API_BASE}/register",
            json=TEST_USER,
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        print_info(f"Status Code: {response.status_code}")
        print_info(f"Response: {response.text}")
        
        if response.status_code == 200:
            data = response.json()
            if data.get("success"):
                print_success("User registration successful")
                return True
            else:
                print_error("Registration failed")
                return False
        else:
            print_error(f"Registration failed with status: {response.status_code}")
            return False
            
    except Exception as e:
        print_error(f"Registration request failed: {str(e)}")
        return False

def get_auth_session():
    """Get authenticated session using NextAuth"""
    print_test_header("Authentication Setup")
    
    try:
        session = requests.Session()
        
        # First get CSRF token
        csrf_response = session.get(f"{API_BASE}/auth/csrf", timeout=10)
        if csrf_response.status_code == 200:
            csrf_data = csrf_response.json()
            csrf_token = csrf_data.get('csrfToken')
            print_info(f"CSRF Token obtained: {csrf_token[:20]}...")
        else:
            print_error("Failed to get CSRF token")
            return None
        
        # Now attempt login
        login_data = {
            "email": TEST_USER["email"],
            "password": TEST_USER["password"],
            "csrfToken": csrf_token,
            "redirect": "false",
            "json": "true"
        }
        
        response = session.post(
            f"{API_BASE}/auth/callback/credentials",
            data=login_data,
            headers={"Content-Type": "application/x-www-form-urlencoded"},
            timeout=10,
            allow_redirects=False
        )
        
        print_info(f"Login Status Code: {response.status_code}")
        print_info(f"Login Response: {response.text}")
        print_info(f"Session Cookies: {dict(session.cookies)}")
        
        # Check if we have session cookies
        if 'next-auth.session-token' in session.cookies or response.status_code in [200, 302]:
            print_success("Authentication session established")
            return session
        else:
            print_error("Failed to establish authentication session")
            return None
            
    except Exception as e:
        print_error(f"Authentication failed: {str(e)}")
        return None

def test_ats_analysis_direct():
    """Test ATS analysis with direct API call (no auth for testing)"""
    print_test_header("ATS Resume Analysis API - Direct Test")
    
    try:
        # Create realistic resume PDF
        pdf_content = create_realistic_resume_pdf()
        
        # Test without authentication first to see API structure
        files = {
            'file': ('emma_wilson_resume.pdf', io.BytesIO(pdf_content), 'application/pdf')
        }
        data = {
            'jobRole': 'Senior Full Stack Developer'
        }
        
        response = requests.post(
            f"{API_BASE}/resume/ats-analysis",
            files=files,
            data=data,
            timeout=60
        )
        
        print_info(f"Status Code: {response.status_code}")
        print_info(f"Response: {response.text}")
        
        if response.status_code == 401:
            print_success("API endpoint exists and requires authentication (as expected)")
            return True
        elif response.status_code == 200:
            print_success("API endpoint working - unexpected success without auth")
            return True
        else:
            print_error(f"Unexpected response: {response.status_code}")
            return False
            
    except Exception as e:
        print_error(f"ATS analysis test failed: {str(e)}")
        return False

def test_ats_analysis_with_auth(session):
    """Test ATS analysis with authentication"""
    print_test_header("ATS Resume Analysis API - With Authentication")
    
    if not session:
        print_error("No authenticated session available")
        return False
    
    try:
        # Create realistic resume PDF
        pdf_content = create_realistic_resume_pdf()
        
        files = {
            'file': ('emma_wilson_resume.pdf', io.BytesIO(pdf_content), 'application/pdf')
        }
        data = {
            'jobRole': 'Senior Full Stack Developer'
        }
        
        response = session.post(
            f"{API_BASE}/resume/ats-analysis",
            files=files,
            data=data,
            timeout=60
        )
        
        print_info(f"Status Code: {response.status_code}")
        print_info(f"Response: {response.text}")
        
        if response.status_code == 200:
            data = response.json()
            if (data.get("success") and 
                data.get("analysisId") and 
                data.get("analysis") and
                data["analysis"].get("atsScore") is not None):
                
                print_success("ATS analysis with Gemini AI successful!")
                analysis = data["analysis"]
                print_info(f"Analysis ID: {data['analysisId']}")
                print_info(f"ATS Score: {analysis['atsScore']}/100")
                
                # Check category structure
                categories = analysis.get("categories", {})
                for cat_name, cat_data in categories.items():
                    print_info(f"{cat_name.title()} Score: {cat_data.get('score', 'N/A')}/100")
                    improvements = cat_data.get('improvements', [])
                    print_info(f"{cat_name.title()} Improvements: {len(improvements)} suggestions")
                
                strengths = analysis.get('strengths', [])
                print_info(f"Strengths: {len(strengths)} identified")
                
                feedback = analysis.get('overallFeedback', '')
                print_info(f"Overall Feedback: {len(feedback)} characters")
                
                return True
            else:
                print_error("ATS analysis response missing required fields")
                return False
        elif response.status_code == 401:
            print_error("Authentication failed - session not valid")
            return False
        else:
            print_error(f"ATS analysis failed with status: {response.status_code}")
            return False
            
    except Exception as e:
        print_error(f"ATS analysis request failed: {str(e)}")
        return False

def test_analysis_history_with_auth(session):
    """Test analysis history with authentication"""
    print_test_header("Get Analysis History API - With Authentication")
    
    if not session:
        print_error("No authenticated session available")
        return False
    
    try:
        response = session.get(
            f"{API_BASE}/resume/analysis-history",
            timeout=10
        )
        
        print_info(f"Status Code: {response.status_code}")
        print_info(f"Response: {response.text}")
        
        if response.status_code == 200:
            data = response.json()
            if "analyses" in data and isinstance(data["analyses"], list):
                print_success("Analysis history retrieval successful!")
                print_info(f"Number of analyses: {len(data['analyses'])}")
                
                if data["analyses"]:
                    analysis = data["analyses"][0]
                    print_info(f"Latest analysis ID: {analysis.get('id')}")
                    print_info(f"Job Role: {analysis.get('jobRole')}")
                    print_info(f"File Name: {analysis.get('fileName')}")
                    if analysis.get('analysis'):
                        print_info(f"ATS Score: {analysis['analysis'].get('atsScore')}")
                
                return True
            else:
                print_error("Analysis history response missing analyses array")
                return False
        elif response.status_code == 401:
            print_error("Authentication failed - session not valid")
            return False
        else:
            print_error(f"Analysis history failed with status: {response.status_code}")
            return False
            
    except Exception as e:
        print_error(f"Analysis history request failed: {str(e)}")
        return False

def main():
    """Main test execution function"""
    print(f"{Colors.BLUE}{Colors.BOLD}")
    print("=" * 80)
    print("ATS RESUME ANALYSIS API TESTING WITH REAL GEMINI API KEY")
    print("=" * 80)
    print(f"{Colors.END}")
    
    print_info(f"Base URL: {BASE_URL}")
    print_info(f"API Base: {API_BASE}")
    print_info(f"Test User: {TEST_USER['email']}")
    print_info(f"Test Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Test API endpoint existence first
    print_info("\n🔍 Testing API endpoint accessibility...")
    if not test_ats_analysis_direct():
        print_error("ATS Analysis API endpoint not accessible")
        return
    
    # Register user
    print_info("\n👤 Registering test user...")
    if not register_user():
        print_error("User registration failed - cannot proceed with authenticated tests")
        return
    
    # Get authenticated session
    print_info("\n🔐 Setting up authentication...")
    session = get_auth_session()
    
    if session:
        # Test ATS analysis with authentication
        print_info("\n🎯 Testing ATS Resume Analysis...")
        ats_success = test_ats_analysis_with_auth(session)
        
        # Test analysis history
        print_info("\n📊 Testing Analysis History...")
        history_success = test_analysis_history_with_auth(session)
        
        # Final report
        print_test_header("FINAL RESULTS")
        
        if ats_success:
            print_success("ATS Resume Analysis API - WORKING ✅")
        else:
            print_error("ATS Resume Analysis API - FAILED ❌")
        
        if history_success:
            print_success("Analysis History API - WORKING ✅")
        else:
            print_error("Analysis History API - FAILED ❌")
        
        if ats_success and history_success:
            print(f"\n{Colors.GREEN}{Colors.BOLD}🎉 ALL ATS APIS WORKING WITH REAL GEMINI API KEY! 🎉{Colors.END}")
        else:
            print(f"\n{Colors.RED}{Colors.BOLD}⚠️  SOME ATS APIS NEED ATTENTION ⚠️{Colors.END}")
    
    else:
        print_error("Authentication setup failed - cannot test authenticated endpoints")
        print_info("This may be due to NextAuth configuration or session handling")

if __name__ == "__main__":
    main()