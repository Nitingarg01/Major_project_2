#!/usr/bin/env python3
"""
Backend API Testing Script for Interview Pro AI Platform
Tests all backend APIs including authentication, resume upload, interviews, and TTS
"""

import requests
import json
import time
import uuid
import io
import os
from datetime import datetime

# Configuration
BASE_URL = "http://localhost:3000"
API_BASE = f"{BASE_URL}/api"

# Test data
TEST_USER = {
    "name": "Sarah Johnson",
    "email": f"sarah.johnson.{uuid.uuid4().hex[:8]}@testdomain.com",
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

def test_api_connection():
    """Test basic API connectivity"""
    print_test_header("API Connection Test")
    
    try:
        response = requests.get(f"{API_BASE}/", timeout=10)
        if response.status_code == 200:
            print_success(f"API is accessible at {API_BASE}")
            print_info(f"Response: {response.json()}")
            return True
        else:
            print_error(f"API returned status code: {response.status_code}")
            return False
    except requests.exceptions.RequestException as e:
        print_error(f"Failed to connect to API: {str(e)}")
        return False

def test_user_registration():
    """Test user registration endpoint"""
    print_test_header("User Registration API - POST /api/register")
    
    results = {
        "valid_registration": False,
        "duplicate_email": False,
        "missing_fields": False
    }
    
    # Test 1: Valid registration
    print_info("Test 1: Valid user registration")
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
            if data.get("success") and data.get("user"):
                print_success("User registration successful")
                print_info(f"User ID: {data['user'].get('id')}")
                print_info(f"User Email: {data['user'].get('email')}")
                results["valid_registration"] = True
            else:
                print_error("Registration response missing success or user data")
        else:
            print_error(f"Registration failed with status: {response.status_code}")
            
    except requests.exceptions.RequestException as e:
        print_error(f"Registration request failed: {str(e)}")
    
    # Test 2: Duplicate email registration
    print_info("\nTest 2: Duplicate email registration")
    try:
        response = requests.post(
            f"{API_BASE}/register",
            json=TEST_USER,
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        print_info(f"Status Code: {response.status_code}")
        print_info(f"Response: {response.text}")
        
        if response.status_code == 400:
            data = response.json()
            if "already exists" in data.get("error", "").lower():
                print_success("Duplicate email properly rejected")
                results["duplicate_email"] = True
            else:
                print_error("Unexpected error message for duplicate email")
        else:
            print_error(f"Expected 400 status for duplicate email, got: {response.status_code}")
            
    except requests.exceptions.RequestException as e:
        print_error(f"Duplicate email test failed: {str(e)}")
    
    # Test 3: Missing required fields
    print_info("\nTest 3: Missing required fields")
    try:
        incomplete_user = {"email": "test@example.com"}  # Missing name and password
        response = requests.post(
            f"{API_BASE}/register",
            json=incomplete_user,
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        print_info(f"Status Code: {response.status_code}")
        print_info(f"Response: {response.text}")
        
        if response.status_code == 400:
            data = response.json()
            if "required" in data.get("error", "").lower():
                print_success("Missing fields properly validated")
                results["missing_fields"] = True
            else:
                print_error("Unexpected error message for missing fields")
        else:
            print_error(f"Expected 400 status for missing fields, got: {response.status_code}")
            
    except requests.exceptions.RequestException as e:
        print_error(f"Missing fields test failed: {str(e)}")
    
    return results

def test_user_login():
    """Test user login via NextAuth credentials"""
    print_test_header("User Login API - NextAuth Credentials")
    
    results = {
        "valid_login": False,
        "invalid_credentials": False,
        "missing_credentials": False
    }
    
    # Test 1: Valid login credentials
    print_info("Test 1: Valid login credentials")
    try:
        # NextAuth credentials endpoint
        login_data = {
            "email": TEST_USER["email"],
            "password": TEST_USER["password"],
            "redirect": "false",
            "json": "true"
        }
        
        response = requests.post(
            f"{API_BASE}/auth/callback/credentials",
            data=login_data,
            headers={"Content-Type": "application/x-www-form-urlencoded"},
            timeout=10,
            allow_redirects=False
        )
        
        print_info(f"Status Code: {response.status_code}")
        print_info(f"Response Headers: {dict(response.headers)}")
        print_info(f"Response: {response.text}")
        
        # NextAuth may return 200 or redirect (302) for successful login
        if response.status_code in [200, 302]:
            # Check for session cookies or redirect
            if 'next-auth.session-token' in response.cookies or response.status_code == 302:
                print_success("Login successful - session created")
                results["valid_login"] = True
            else:
                print_warning("Login response received but no session token found")
        else:
            print_error(f"Login failed with status: {response.status_code}")
            
    except requests.exceptions.RequestException as e:
        print_error(f"Login request failed: {str(e)}")
    
    # Test 2: Invalid credentials
    print_info("\nTest 2: Invalid credentials")
    try:
        invalid_login_data = {
            "email": TEST_USER["email"],
            "password": "WrongPassword123!",
            "redirect": "false",
            "json": "true"
        }
        
        response = requests.post(
            f"{API_BASE}/auth/callback/credentials",
            data=invalid_login_data,
            headers={"Content-Type": "application/x-www-form-urlencoded"},
            timeout=10,
            allow_redirects=False
        )
        
        print_info(f"Status Code: {response.status_code}")
        print_info(f"Response: {response.text}")
        
        # NextAuth typically returns 401 or redirects to error page for invalid credentials
        if response.status_code in [401, 403] or "error" in response.text.lower():
            print_success("Invalid credentials properly rejected")
            results["invalid_credentials"] = True
        else:
            print_warning(f"Unexpected response for invalid credentials: {response.status_code}")
            
    except requests.exceptions.RequestException as e:
        print_error(f"Invalid credentials test failed: {str(e)}")
    
    # Test 3: Missing credentials
    print_info("\nTest 3: Missing credentials")
    try:
        empty_login_data = {
            "redirect": "false",
            "json": "true"
        }
        
        response = requests.post(
            f"{API_BASE}/auth/callback/credentials",
            data=empty_login_data,
            headers={"Content-Type": "application/x-www-form-urlencoded"},
            timeout=10,
            allow_redirects=False
        )
        
        print_info(f"Status Code: {response.status_code}")
        print_info(f"Response: {response.text}")
        
        if response.status_code in [400, 401, 403] or "error" in response.text.lower():
            print_success("Missing credentials properly handled")
            results["missing_credentials"] = True
        else:
            print_warning(f"Unexpected response for missing credentials: {response.status_code}")
            
    except requests.exceptions.RequestException as e:
        print_error(f"Missing credentials test failed: {str(e)}")
    
    return results

def test_forgot_password():
    """Test forgot password endpoint"""
    print_test_header("Forgot Password API - POST /api/forgot-password")
    
    results = {
        "valid_email": False,
        "nonexistent_email": False,
        "missing_email": False
    }
    
    # Test 1: Valid email (registered user)
    print_info("Test 1: Forgot password with registered email")
    try:
        response = requests.post(
            f"{API_BASE}/forgot-password",
            json={"email": TEST_USER["email"]},
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        print_info(f"Status Code: {response.status_code}")
        print_info(f"Response: {response.text}")
        
        if response.status_code == 200:
            data = response.json()
            if data.get("success") and "reset link" in data.get("message", "").lower():
                print_success("Forgot password request processed successfully")
                results["valid_email"] = True
            else:
                print_error("Unexpected response format for forgot password")
        else:
            print_error(f"Forgot password failed with status: {response.status_code}")
            
    except requests.exceptions.RequestException as e:
        print_error(f"Forgot password request failed: {str(e)}")
    
    # Test 2: Non-existent email
    print_info("\nTest 2: Forgot password with non-existent email")
    try:
        fake_email = f"nonexistent.{uuid.uuid4().hex[:8]}@testdomain.com"
        response = requests.post(
            f"{API_BASE}/forgot-password",
            json={"email": fake_email},
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        print_info(f"Status Code: {response.status_code}")
        print_info(f"Response: {response.text}")
        
        # Should return success message for security (don't reveal if email exists)
        if response.status_code == 200:
            data = response.json()
            if data.get("success"):
                print_success("Non-existent email handled securely (no user enumeration)")
                results["nonexistent_email"] = True
            else:
                print_error("Unexpected response for non-existent email")
        else:
            print_error(f"Unexpected status for non-existent email: {response.status_code}")
            
    except requests.exceptions.RequestException as e:
        print_error(f"Non-existent email test failed: {str(e)}")
    
    # Test 3: Missing email
    print_info("\nTest 3: Forgot password with missing email")
    try:
        response = requests.post(
            f"{API_BASE}/forgot-password",
            json={},
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        print_info(f"Status Code: {response.status_code}")
        print_info(f"Response: {response.text}")
        
        if response.status_code == 400:
            data = response.json()
            if "required" in data.get("error", "").lower():
                print_success("Missing email properly validated")
                results["missing_email"] = True
            else:
                print_error("Unexpected error message for missing email")
        else:
            print_error(f"Expected 400 status for missing email, got: {response.status_code}")
            
    except requests.exceptions.RequestException as e:
        print_error(f"Missing email test failed: {str(e)}")
    
    return results

def test_reset_password():
    """Test reset password endpoint"""
    print_test_header("Reset Password API - POST /api/reset-password")
    
    results = {
        "invalid_token": False,
        "missing_fields": False,
        "valid_reset": False
    }
    
    # Test 1: Invalid/expired token
    print_info("Test 1: Reset password with invalid token")
    try:
        fake_token = str(uuid.uuid4())
        response = requests.post(
            f"{API_BASE}/reset-password",
            json={
                "token": fake_token,
                "newPassword": "NewSecurePass123!"
            },
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        print_info(f"Status Code: {response.status_code}")
        print_info(f"Response: {response.text}")
        
        if response.status_code == 400:
            data = response.json()
            if "invalid" in data.get("error", "").lower() or "expired" in data.get("error", "").lower():
                print_success("Invalid token properly rejected")
                results["invalid_token"] = True
            else:
                print_error("Unexpected error message for invalid token")
        else:
            print_error(f"Expected 400 status for invalid token, got: {response.status_code}")
            
    except requests.exceptions.RequestException as e:
        print_error(f"Invalid token test failed: {str(e)}")
    
    # Test 2: Missing required fields
    print_info("\nTest 2: Reset password with missing fields")
    try:
        response = requests.post(
            f"{API_BASE}/reset-password",
            json={"token": "some-token"},  # Missing newPassword
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        print_info(f"Status Code: {response.status_code}")
        print_info(f"Response: {response.text}")
        
        if response.status_code == 400:
            data = response.json()
            if "required" in data.get("error", "").lower():
                print_success("Missing fields properly validated")
                results["missing_fields"] = True
            else:
                print_error("Unexpected error message for missing fields")
        else:
            print_error(f"Expected 400 status for missing fields, got: {response.status_code}")
            
    except requests.exceptions.RequestException as e:
        print_error(f"Missing fields test failed: {str(e)}")
    
    # Note: We can't easily test valid reset without accessing the database to get a real token
    # This would require either:
    # 1. Database access to create a valid reset token
    # 2. Integration with email service to capture the reset link
    # 3. Mocking the token generation
    print_warning("Valid reset password test skipped - requires database access for valid token")
    
    return results

def create_test_pdf():
    """Create a simple test PDF content for resume upload testing"""
    # Simple PDF-like content for testing
    pdf_content = b"""%PDF-1.4
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
/Length 44
>>
stream
BT
/F1 12 Tf
72 720 Td
(John Doe Resume - Software Engineer) Tj
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
297
%%EOF"""
    return pdf_content

def get_auth_session():
    """Get authenticated session for API calls"""
    try:
        # First try to login and get session
        login_data = {
            "email": TEST_USER["email"],
            "password": TEST_USER["password"],
            "redirect": "false",
            "json": "true"
        }
        
        session = requests.Session()
        response = session.post(
            f"{API_BASE}/auth/callback/credentials",
            data=login_data,
            headers={"Content-Type": "application/x-www-form-urlencoded"},
            timeout=10,
            allow_redirects=False
        )
        
        if response.status_code in [200, 302] or 'next-auth.session-token' in session.cookies:
            print_info("Authentication session established")
            return session
        else:
            print_error("Failed to establish authentication session")
            return None
            
    except Exception as e:
        print_error(f"Authentication failed: {str(e)}")
        return None

def test_resume_upload():
    """Test resume upload API"""
    print_test_header("Resume Upload API - POST /api/resume/upload")
    
    results = {
        "valid_upload": False,
        "no_file": False,
        "unauthorized": False
    }
    
    # Test 1: Valid resume upload with authentication
    print_info("Test 1: Valid resume upload")
    session = get_auth_session()
    if session:
        try:
            # Create test PDF file
            pdf_content = create_test_pdf()
            files = {
                'file': ('test_resume.pdf', io.BytesIO(pdf_content), 'application/pdf')
            }
            
            response = session.post(
                f"{API_BASE}/resume/upload",
                files=files,
                timeout=30  # Longer timeout for AI processing
            )
            
            print_info(f"Status Code: {response.status_code}")
            print_info(f"Response: {response.text}")
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success") and data.get("resumeId") and data.get("analysis"):
                    print_success("Resume upload and Gemini analysis successful")
                    print_info(f"Resume ID: {data['resumeId']}")
                    print_info(f"Analysis keys: {list(data['analysis'].keys())}")
                    results["valid_upload"] = True
                    # Store resume ID for later tests
                    global UPLOADED_RESUME_ID
                    UPLOADED_RESUME_ID = data['resumeId']
                else:
                    print_error("Resume upload response missing required fields")
            else:
                print_error(f"Resume upload failed with status: {response.status_code}")
                
        except requests.exceptions.RequestException as e:
            print_error(f"Resume upload request failed: {str(e)}")
    else:
        print_error("Cannot test resume upload - authentication failed")
    
    # Test 2: Upload without file
    print_info("\nTest 2: Upload without file")
    if session:
        try:
            response = session.post(
                f"{API_BASE}/resume/upload",
                files={},
                timeout=10
            )
            
            print_info(f"Status Code: {response.status_code}")
            print_info(f"Response: {response.text}")
            
            if response.status_code == 400:
                data = response.json()
                if "no file" in data.get("error", "").lower():
                    print_success("No file upload properly rejected")
                    results["no_file"] = True
                else:
                    print_error("Unexpected error message for no file")
            else:
                print_error(f"Expected 400 status for no file, got: {response.status_code}")
                
        except requests.exceptions.RequestException as e:
            print_error(f"No file test failed: {str(e)}")
    
    # Test 3: Unauthorized upload
    print_info("\nTest 3: Unauthorized upload")
    try:
        pdf_content = create_test_pdf()
        files = {
            'file': ('test_resume.pdf', io.BytesIO(pdf_content), 'application/pdf')
        }
        
        response = requests.post(
            f"{API_BASE}/resume/upload",
            files=files,
            timeout=10
        )
        
        print_info(f"Status Code: {response.status_code}")
        print_info(f"Response: {response.text}")
        
        if response.status_code == 401:
            data = response.json()
            if "unauthorized" in data.get("error", "").lower():
                print_success("Unauthorized upload properly rejected")
                results["unauthorized"] = True
            else:
                print_error("Unexpected error message for unauthorized")
        else:
            print_error(f"Expected 401 status for unauthorized, got: {response.status_code}")
            
    except requests.exceptions.RequestException as e:
        print_error(f"Unauthorized test failed: {str(e)}")
    
    return results

def test_get_resumes():
    """Test get resumes API"""
    print_test_header("Get Resumes API - GET /api/resumes")
    
    results = {
        "valid_get": False,
        "unauthorized": False
    }
    
    # Test 1: Valid get resumes with authentication
    print_info("Test 1: Get resumes with authentication")
    session = get_auth_session()
    if session:
        try:
            response = session.get(
                f"{API_BASE}/resumes",
                timeout=10
            )
            
            print_info(f"Status Code: {response.status_code}")
            print_info(f"Response: {response.text}")
            
            if response.status_code == 200:
                data = response.json()
                if "resumes" in data and isinstance(data["resumes"], list):
                    print_success("Get resumes successful")
                    print_info(f"Number of resumes: {len(data['resumes'])}")
                    if data["resumes"]:
                        resume = data["resumes"][0]
                        print_info(f"Resume fields: {list(resume.keys())}")
                    results["valid_get"] = True
                else:
                    print_error("Get resumes response missing resumes array")
            else:
                print_error(f"Get resumes failed with status: {response.status_code}")
                
        except requests.exceptions.RequestException as e:
            print_error(f"Get resumes request failed: {str(e)}")
    else:
        print_error("Cannot test get resumes - authentication failed")
    
    # Test 2: Unauthorized get resumes
    print_info("\nTest 2: Unauthorized get resumes")
    try:
        response = requests.get(
            f"{API_BASE}/resumes",
            timeout=10
        )
        
        print_info(f"Status Code: {response.status_code}")
        print_info(f"Response: {response.text}")
        
        if response.status_code == 401:
            data = response.json()
            if "unauthorized" in data.get("error", "").lower():
                print_success("Unauthorized get resumes properly rejected")
                results["unauthorized"] = True
            else:
                print_error("Unexpected error message for unauthorized")
        else:
            print_error(f"Expected 401 status for unauthorized, got: {response.status_code}")
            
    except requests.exceptions.RequestException as e:
        print_error(f"Unauthorized test failed: {str(e)}")
    
    return results

def test_create_interview():
    """Test create interview API"""
    print_test_header("Create Interview API - POST /api/interview/create")
    
    results = {
        "valid_create": False,
        "missing_fields": False,
        "unauthorized": False
    }
    
    # Test 1: Valid interview creation
    print_info("Test 1: Valid interview creation")
    session = get_auth_session()
    if session:
        try:
            interview_data = {
                "jobRole": "Software Engineer",
                "experienceLevel": "mid",
                "numQuestions": 3,
                "resumeId": getattr(globals(), 'UPLOADED_RESUME_ID', 'none')
            }
            
            response = session.post(
                f"{API_BASE}/interview/create",
                json=interview_data,
                headers={"Content-Type": "application/json"},
                timeout=30  # Longer timeout for AI processing
            )
            
            print_info(f"Status Code: {response.status_code}")
            print_info(f"Response: {response.text}")
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success") and data.get("interviewId") and data.get("questions"):
                    print_success("Interview creation and OpenAI question generation successful")
                    print_info(f"Interview ID: {data['interviewId']}")
                    print_info(f"Number of questions: {len(data['questions'])}")
                    if data["questions"]:
                        print_info(f"First question: {data['questions'][0].get('question', 'N/A')}")
                    results["valid_create"] = True
                    # Store interview ID for later tests
                    global CREATED_INTERVIEW_ID
                    CREATED_INTERVIEW_ID = data['interviewId']
                else:
                    print_error("Interview creation response missing required fields")
            else:
                print_error(f"Interview creation failed with status: {response.status_code}")
                
        except requests.exceptions.RequestException as e:
            print_error(f"Interview creation request failed: {str(e)}")
    else:
        print_error("Cannot test interview creation - authentication failed")
    
    # Test 2: Missing required fields
    print_info("\nTest 2: Missing required fields")
    if session:
        try:
            incomplete_data = {"jobRole": "Software Engineer"}  # Missing experienceLevel
            
            response = session.post(
                f"{API_BASE}/interview/create",
                json=incomplete_data,
                headers={"Content-Type": "application/json"},
                timeout=10
            )
            
            print_info(f"Status Code: {response.status_code}")
            print_info(f"Response: {response.text}")
            
            if response.status_code == 400:
                data = response.json()
                if "required" in data.get("error", "").lower():
                    print_success("Missing fields properly validated")
                    results["missing_fields"] = True
                else:
                    print_error("Unexpected error message for missing fields")
            else:
                print_error(f"Expected 400 status for missing fields, got: {response.status_code}")
                
        except requests.exceptions.RequestException as e:
            print_error(f"Missing fields test failed: {str(e)}")
    
    # Test 3: Unauthorized creation
    print_info("\nTest 3: Unauthorized interview creation")
    try:
        interview_data = {
            "jobRole": "Software Engineer",
            "experienceLevel": "mid",
            "numQuestions": 3
        }
        
        response = requests.post(
            f"{API_BASE}/interview/create",
            json=interview_data,
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        print_info(f"Status Code: {response.status_code}")
        print_info(f"Response: {response.text}")
        
        if response.status_code == 401:
            data = response.json()
            if "unauthorized" in data.get("error", "").lower():
                print_success("Unauthorized creation properly rejected")
                results["unauthorized"] = True
            else:
                print_error("Unexpected error message for unauthorized")
        else:
            print_error(f"Expected 401 status for unauthorized, got: {response.status_code}")
            
    except requests.exceptions.RequestException as e:
        print_error(f"Unauthorized test failed: {str(e)}")
    
    return results

def test_get_interviews():
    """Test get all interviews API"""
    print_test_header("Get All Interviews API - GET /api/interviews")
    
    results = {
        "valid_get": False,
        "unauthorized": False
    }
    
    # Test 1: Valid get interviews
    print_info("Test 1: Get all interviews with authentication")
    session = get_auth_session()
    if session:
        try:
            response = session.get(
                f"{API_BASE}/interviews",
                timeout=10
            )
            
            print_info(f"Status Code: {response.status_code}")
            print_info(f"Response: {response.text}")
            
            if response.status_code == 200:
                data = response.json()
                if "interviews" in data and isinstance(data["interviews"], list):
                    print_success("Get interviews successful")
                    print_info(f"Number of interviews: {len(data['interviews'])}")
                    if data["interviews"]:
                        interview = data["interviews"][0]
                        print_info(f"Interview fields: {list(interview.keys())}")
                    results["valid_get"] = True
                else:
                    print_error("Get interviews response missing interviews array")
            else:
                print_error(f"Get interviews failed with status: {response.status_code}")
                
        except requests.exceptions.RequestException as e:
            print_error(f"Get interviews request failed: {str(e)}")
    else:
        print_error("Cannot test get interviews - authentication failed")
    
    # Test 2: Unauthorized get interviews
    print_info("\nTest 2: Unauthorized get interviews")
    try:
        response = requests.get(
            f"{API_BASE}/interviews",
            timeout=10
        )
        
        print_info(f"Status Code: {response.status_code}")
        print_info(f"Response: {response.text}")
        
        if response.status_code == 401:
            data = response.json()
            if "unauthorized" in data.get("error", "").lower():
                print_success("Unauthorized get interviews properly rejected")
                results["unauthorized"] = True
            else:
                print_error("Unexpected error message for unauthorized")
        else:
            print_error(f"Expected 401 status for unauthorized, got: {response.status_code}")
            
    except requests.exceptions.RequestException as e:
        print_error(f"Unauthorized test failed: {str(e)}")
    
    return results

def test_get_interview():
    """Test get specific interview API"""
    print_test_header("Get Interview API - GET /api/interview/{id}")
    
    results = {
        "valid_get": False,
        "not_found": False,
        "unauthorized": False
    }
    
    # Test 1: Valid get specific interview
    print_info("Test 1: Get specific interview with authentication")
    session = get_auth_session()
    interview_id = getattr(globals(), 'CREATED_INTERVIEW_ID', None)
    
    if session and interview_id:
        try:
            response = session.get(
                f"{API_BASE}/interview/{interview_id}",
                timeout=10
            )
            
            print_info(f"Status Code: {response.status_code}")
            print_info(f"Response: {response.text}")
            
            if response.status_code == 200:
                data = response.json()
                if "interview" in data and data["interview"].get("id") == interview_id:
                    print_success("Get specific interview successful")
                    interview = data["interview"]
                    print_info(f"Interview ID: {interview.get('id')}")
                    print_info(f"Job Role: {interview.get('jobRole')}")
                    print_info(f"Status: {interview.get('status')}")
                    print_info(f"Questions count: {len(interview.get('questions', []))}")
                    results["valid_get"] = True
                else:
                    print_error("Get interview response missing interview data")
            else:
                print_error(f"Get interview failed with status: {response.status_code}")
                
        except requests.exceptions.RequestException as e:
            print_error(f"Get interview request failed: {str(e)}")
    else:
        if not session:
            print_error("Cannot test get interview - authentication failed")
        if not interview_id:
            print_error("Cannot test get interview - no interview ID available")
    
    # Test 2: Interview not found
    print_info("\nTest 2: Get non-existent interview")
    if session:
        try:
            fake_id = str(uuid.uuid4())
            response = session.get(
                f"{API_BASE}/interview/{fake_id}",
                timeout=10
            )
            
            print_info(f"Status Code: {response.status_code}")
            print_info(f"Response: {response.text}")
            
            if response.status_code == 404:
                data = response.json()
                if "not found" in data.get("error", "").lower():
                    print_success("Non-existent interview properly handled")
                    results["not_found"] = True
                else:
                    print_error("Unexpected error message for not found")
            else:
                print_error(f"Expected 404 status for not found, got: {response.status_code}")
                
        except requests.exceptions.RequestException as e:
            print_error(f"Not found test failed: {str(e)}")
    
    # Test 3: Unauthorized get interview
    print_info("\nTest 3: Unauthorized get interview")
    if interview_id:
        try:
            response = requests.get(
                f"{API_BASE}/interview/{interview_id}",
                timeout=10
            )
            
            print_info(f"Status Code: {response.status_code}")
            print_info(f"Response: {response.text}")
            
            if response.status_code == 401:
                data = response.json()
                if "unauthorized" in data.get("error", "").lower():
                    print_success("Unauthorized get interview properly rejected")
                    results["unauthorized"] = True
                else:
                    print_error("Unexpected error message for unauthorized")
            else:
                print_error(f"Expected 401 status for unauthorized, got: {response.status_code}")
                
        except requests.exceptions.RequestException as e:
            print_error(f"Unauthorized test failed: {str(e)}")
    
    return results

def test_submit_response():
    """Test submit interview response API"""
    print_test_header("Submit Interview Response API - POST /api/interview/{id}/response")
    
    results = {
        "valid_submit": False,
        "missing_fields": False,
        "not_found": False,
        "unauthorized": False
    }
    
    # Test 1: Valid response submission
    print_info("Test 1: Valid response submission")
    session = get_auth_session()
    interview_id = getattr(globals(), 'CREATED_INTERVIEW_ID', None)
    
    if session and interview_id:
        try:
            response_data = {
                "questionIndex": 0,
                "answer": "I have 5 years of experience in software development, specializing in full-stack web applications using React, Node.js, and Python. I've worked on several large-scale projects including e-commerce platforms and data analytics dashboards."
            }
            
            response = session.post(
                f"{API_BASE}/interview/{interview_id}/response",
                json=response_data,
                headers={"Content-Type": "application/json"},
                timeout=30  # Longer timeout for AI processing
            )
            
            print_info(f"Status Code: {response.status_code}")
            print_info(f"Response: {response.text}")
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success") and data.get("feedback"):
                    print_success("Response submission and OpenAI feedback successful")
                    feedback = data["feedback"]
                    print_info(f"Feedback score: {feedback.get('score')}")
                    print_info(f"Feedback comment: {feedback.get('comment', 'N/A')[:100]}...")
                    results["valid_submit"] = True
                else:
                    print_error("Response submission missing success or feedback")
            else:
                print_error(f"Response submission failed with status: {response.status_code}")
                
        except requests.exceptions.RequestException as e:
            print_error(f"Response submission request failed: {str(e)}")
    else:
        if not session:
            print_error("Cannot test response submission - authentication failed")
        if not interview_id:
            print_error("Cannot test response submission - no interview ID available")
    
    # Test 2: Missing required fields
    print_info("\nTest 2: Missing required fields")
    if session and interview_id:
        try:
            incomplete_data = {"questionIndex": 0}  # Missing answer
            
            response = session.post(
                f"{API_BASE}/interview/{interview_id}/response",
                json=incomplete_data,
                headers={"Content-Type": "application/json"},
                timeout=10
            )
            
            print_info(f"Status Code: {response.status_code}")
            print_info(f"Response: {response.text}")
            
            if response.status_code == 400:
                data = response.json()
                if "required" in data.get("error", "").lower():
                    print_success("Missing fields properly validated")
                    results["missing_fields"] = True
                else:
                    print_error("Unexpected error message for missing fields")
            else:
                print_error(f"Expected 400 status for missing fields, got: {response.status_code}")
                
        except requests.exceptions.RequestException as e:
            print_error(f"Missing fields test failed: {str(e)}")
    
    # Test 3: Interview not found
    print_info("\nTest 3: Submit to non-existent interview")
    if session:
        try:
            fake_id = str(uuid.uuid4())
            response_data = {
                "questionIndex": 0,
                "answer": "Test answer"
            }
            
            response = session.post(
                f"{API_BASE}/interview/{fake_id}/response",
                json=response_data,
                headers={"Content-Type": "application/json"},
                timeout=10
            )
            
            print_info(f"Status Code: {response.status_code}")
            print_info(f"Response: {response.text}")
            
            if response.status_code == 404:
                data = response.json()
                if "not found" in data.get("error", "").lower():
                    print_success("Non-existent interview properly handled")
                    results["not_found"] = True
                else:
                    print_error("Unexpected error message for not found")
            else:
                print_error(f"Expected 404 status for not found, got: {response.status_code}")
                
        except requests.exceptions.RequestException as e:
            print_error(f"Not found test failed: {str(e)}")
    
    # Test 4: Unauthorized submission
    print_info("\nTest 4: Unauthorized response submission")
    if interview_id:
        try:
            response_data = {
                "questionIndex": 0,
                "answer": "Test answer"
            }
            
            response = requests.post(
                f"{API_BASE}/interview/{interview_id}/response",
                json=response_data,
                headers={"Content-Type": "application/json"},
                timeout=10
            )
            
            print_info(f"Status Code: {response.status_code}")
            print_info(f"Response: {response.text}")
            
            if response.status_code == 401:
                data = response.json()
                if "unauthorized" in data.get("error", "").lower():
                    print_success("Unauthorized submission properly rejected")
                    results["unauthorized"] = True
                else:
                    print_error("Unexpected error message for unauthorized")
            else:
                print_error(f"Expected 401 status for unauthorized, got: {response.status_code}")
                
        except requests.exceptions.RequestException as e:
            print_error(f"Unauthorized test failed: {str(e)}")
    
    return results

def test_complete_interview():
    """Test complete interview API"""
    print_test_header("Complete Interview API - POST /api/interview/{id}/complete")
    
    results = {
        "valid_complete": False,
        "not_found": False,
        "unauthorized": False
    }
    
    # Test 1: Valid interview completion
    print_info("Test 1: Valid interview completion")
    session = get_auth_session()
    interview_id = getattr(globals(), 'CREATED_INTERVIEW_ID', None)
    
    if session and interview_id:
        try:
            response = session.post(
                f"{API_BASE}/interview/{interview_id}/complete",
                headers={"Content-Type": "application/json"},
                timeout=30  # Longer timeout for AI processing
            )
            
            print_info(f"Status Code: {response.status_code}")
            print_info(f"Response: {response.text}")
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success") and "overallScore" in data:
                    print_success("Interview completion and OpenAI feedback generation successful")
                    print_info(f"Overall Score: {data.get('overallScore')}")
                    print_info(f"Strengths count: {len(data.get('strengths', []))}")
                    print_info(f"Improvements count: {len(data.get('improvements', []))}")
                    if data.get("strengths"):
                        print_info(f"First strength: {data['strengths'][0]}")
                    results["valid_complete"] = True
                else:
                    print_error("Interview completion response missing required fields")
            else:
                print_error(f"Interview completion failed with status: {response.status_code}")
                
        except requests.exceptions.RequestException as e:
            print_error(f"Interview completion request failed: {str(e)}")
    else:
        if not session:
            print_error("Cannot test interview completion - authentication failed")
        if not interview_id:
            print_error("Cannot test interview completion - no interview ID available")
    
    # Test 2: Complete non-existent interview
    print_info("\nTest 2: Complete non-existent interview")
    if session:
        try:
            fake_id = str(uuid.uuid4())
            
            response = session.post(
                f"{API_BASE}/interview/{fake_id}/complete",
                headers={"Content-Type": "application/json"},
                timeout=10
            )
            
            print_info(f"Status Code: {response.status_code}")
            print_info(f"Response: {response.text}")
            
            if response.status_code == 404:
                data = response.json()
                if "not found" in data.get("error", "").lower():
                    print_success("Non-existent interview properly handled")
                    results["not_found"] = True
                else:
                    print_error("Unexpected error message for not found")
            else:
                print_error(f"Expected 404 status for not found, got: {response.status_code}")
                
        except requests.exceptions.RequestException as e:
            print_error(f"Not found test failed: {str(e)}")
    
    # Test 3: Unauthorized completion
    print_info("\nTest 3: Unauthorized interview completion")
    if interview_id:
        try:
            response = requests.post(
                f"{API_BASE}/interview/{interview_id}/complete",
                headers={"Content-Type": "application/json"},
                timeout=10
            )
            
            print_info(f"Status Code: {response.status_code}")
            print_info(f"Response: {response.text}")
            
            if response.status_code == 401:
                data = response.json()
                if "unauthorized" in data.get("error", "").lower():
                    print_success("Unauthorized completion properly rejected")
                    results["unauthorized"] = True
                else:
                    print_error("Unexpected error message for unauthorized")
            else:
                print_error(f"Expected 401 status for unauthorized, got: {response.status_code}")
                
        except requests.exceptions.RequestException as e:
            print_error(f"Unauthorized test failed: {str(e)}")
    
    return results

def test_text_to_speech():
    """Test text-to-speech API"""
    print_test_header("Text-to-Speech API - POST /api/tts")
    
    results = {
        "valid_tts": False,
        "missing_text": False
    }
    
    # Test 1: Valid TTS request
    print_info("Test 1: Valid text-to-speech request")
    try:
        tts_data = {
            "text": "Hello, this is a test question for the AI interview platform. How are you today?"
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
                print_success("TTS generation successful - audio content returned")
                print_info(f"Audio size: {len(response.content)} bytes")
                results["valid_tts"] = True
            else:
                print_error(f"Expected audio content, got: {content_type}")
        else:
            print_error(f"TTS failed with status: {response.status_code}")
            print_info(f"Response: {response.text}")
            
    except requests.exceptions.RequestException as e:
        print_error(f"TTS request failed: {str(e)}")
    
    # Test 2: Missing text
    print_info("\nTest 2: TTS without text")
    try:
        response = requests.post(
            f"{API_BASE}/tts",
            json={},
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        print_info(f"Status Code: {response.status_code}")
        print_info(f"Response: {response.text}")
        
        if response.status_code == 400:
            data = response.json()
            if "required" in data.get("error", "").lower():
                print_success("Missing text properly validated")
                results["missing_text"] = True
            else:
                print_error("Unexpected error message for missing text")
        else:
            print_error(f"Expected 400 status for missing text, got: {response.status_code}")
            
    except requests.exceptions.RequestException as e:
        print_error(f"Missing text test failed: {str(e)}")
    
    return results

def generate_test_report(test_results):
    """Generate comprehensive test report"""
    print_test_header("TEST REPORT SUMMARY")
    
    total_tests = 0
    passed_tests = 0
    
    # Define test categories and their display names
    test_categories = [
        ("registration", "User Registration API"),
        ("login", "User Login API"),
        ("forgot_password", "Forgot Password API"),
        ("reset_password", "Reset Password API"),
        ("resume_upload", "Resume Upload API"),
        ("get_resumes", "Get Resumes API"),
        ("create_interview", "Create Interview API"),
        ("get_interviews", "Get All Interviews API"),
        ("get_interview", "Get Interview API"),
        ("submit_response", "Submit Interview Response API"),
        ("complete_interview", "Complete Interview API"),
        ("text_to_speech", "Text-to-Speech API")
    ]
    
    # Process each test category
    for category_key, category_name in test_categories:
        if category_key in test_results:
            print(f"\n{Colors.BOLD}{category_name}:{Colors.END}")
            category_results = test_results[category_key]
            for test_name, result in category_results.items():
                total_tests += 1
                if result:
                    passed_tests += 1
                    print_success(f"{test_name.replace('_', ' ').title()}")
                else:
                    print_error(f"{test_name.replace('_', ' ').title()}")
    
    # Overall summary
    print(f"\n{Colors.BOLD}OVERALL RESULTS:{Colors.END}")
    print(f"Total Tests: {total_tests}")
    print(f"Passed: {Colors.GREEN}{passed_tests}{Colors.END}")
    print(f"Failed: {Colors.RED}{total_tests - passed_tests}{Colors.END}")
    
    success_rate = (passed_tests / total_tests * 100) if total_tests > 0 else 0
    print(f"Success Rate: {Colors.BLUE}{success_rate:.1f}%{Colors.END}")
    
    # Critical issues
    critical_issues = []
    
    # Authentication critical issues
    reg_results = test_results.get("registration", {})
    login_results = test_results.get("login", {})
    forgot_results = test_results.get("forgot_password", {})
    
    if not reg_results.get("valid_registration"):
        critical_issues.append("User registration not working")
    if not login_results.get("valid_login"):
        critical_issues.append("User login not working")
    if not forgot_results.get("valid_email"):
        critical_issues.append("Forgot password not working")
    
    # New API critical issues
    resume_results = test_results.get("resume_upload", {})
    interview_create_results = test_results.get("create_interview", {})
    interview_response_results = test_results.get("submit_response", {})
    interview_complete_results = test_results.get("complete_interview", {})
    tts_results = test_results.get("text_to_speech", {})
    
    if not resume_results.get("valid_upload"):
        critical_issues.append("Resume upload with Gemini analysis not working")
    if not interview_create_results.get("valid_create"):
        critical_issues.append("Interview creation with OpenAI not working")
    if not interview_response_results.get("valid_submit"):
        critical_issues.append("Interview response submission with OpenAI feedback not working")
    if not interview_complete_results.get("valid_complete"):
        critical_issues.append("Interview completion with OpenAI feedback not working")
    if not tts_results.get("valid_tts"):
        critical_issues.append("Text-to-Speech with ElevenLabs not working")
    
    # API Integration Status
    print(f"\n{Colors.BOLD}API INTEGRATION STATUS:{Colors.END}")
    
    # Gemini Integration
    if resume_results.get("valid_upload"):
        print_success("Gemini API (Resume Analysis) - Working")
    else:
        print_error("Gemini API (Resume Analysis) - Failed")
    
    # OpenAI Integration
    openai_working = (interview_create_results.get("valid_create") and 
                     interview_response_results.get("valid_submit") and 
                     interview_complete_results.get("valid_complete"))
    if openai_working:
        print_success("OpenAI API (Interview Questions & Feedback) - Working")
    else:
        print_error("OpenAI API (Interview Questions & Feedback) - Failed")
    
    # ElevenLabs Integration
    if tts_results.get("valid_tts"):
        print_success("ElevenLabs API (Text-to-Speech) - Working")
    else:
        print_error("ElevenLabs API (Text-to-Speech) - Failed")
    
    if critical_issues:
        print(f"\n{Colors.RED}{Colors.BOLD}CRITICAL ISSUES:{Colors.END}")
        for issue in critical_issues:
            print_error(issue)
    else:
        print(f"\n{Colors.GREEN}{Colors.BOLD}✅ All critical backend APIs working!{Colors.END}")
    
    return {
        "total_tests": total_tests,
        "passed_tests": passed_tests,
        "success_rate": success_rate,
        "critical_issues": critical_issues
    }

def main():
    """Main test execution function"""
    print(f"{Colors.BLUE}{Colors.BOLD}")
    print("=" * 80)
    print("INTERVIEW PRO AI PLATFORM - COMPLETE BACKEND API TESTING")
    print("=" * 80)
    print(f"{Colors.END}")
    
    print_info(f"Base URL: {BASE_URL}")
    print_info(f"API Base: {API_BASE}")
    print_info(f"Test User: {TEST_USER['email']}")
    print_info(f"Test Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Test API connection first
    if not test_api_connection():
        print_error("Cannot proceed with tests - API is not accessible")
        return
    
    # Run all tests
    test_results = {}
    
    try:
        # Authentication Tests (Prerequisites)
        print_info("\n🔐 Running Authentication Tests...")
        test_results["registration"] = test_user_registration()
        time.sleep(1)
        
        if test_results["registration"].get("valid_registration"):
            test_results["login"] = test_user_login()
        else:
            print_warning("Skipping login tests - registration failed")
            test_results["login"] = {"valid_login": False, "invalid_credentials": False, "missing_credentials": False}
        
        time.sleep(1)
        test_results["forgot_password"] = test_forgot_password()
        time.sleep(1)
        test_results["reset_password"] = test_reset_password()
        
        # Check if authentication is working before proceeding
        auth_working = (test_results["registration"].get("valid_registration") and 
                       test_results["login"].get("valid_login"))
        
        if not auth_working:
            print_error("Authentication not working - skipping protected API tests")
            # Generate report with only auth tests
            report = generate_test_report(test_results)
            return report
        
        # New API Tests (Require Authentication)
        print_info("\n📄 Running Resume API Tests...")
        test_results["resume_upload"] = test_resume_upload()
        time.sleep(2)  # Longer pause for AI processing
        test_results["get_resumes"] = test_get_resumes()
        time.sleep(1)
        
        print_info("\n🎯 Running Interview API Tests...")
        test_results["create_interview"] = test_create_interview()
        time.sleep(2)  # Longer pause for AI processing
        test_results["get_interviews"] = test_get_interviews()
        time.sleep(1)
        test_results["get_interview"] = test_get_interview()
        time.sleep(1)
        
        print_info("\n💬 Running Interview Response Tests...")
        test_results["submit_response"] = test_submit_response()
        time.sleep(2)  # Longer pause for AI processing
        test_results["complete_interview"] = test_complete_interview()
        time.sleep(2)  # Longer pause for AI processing
        
        print_info("\n🔊 Running Text-to-Speech Tests...")
        test_results["text_to_speech"] = test_text_to_speech()
        
        # Generate final report
        report = generate_test_report(test_results)
        
        return report
        
    except KeyboardInterrupt:
        print_warning("\nTesting interrupted by user")
    except Exception as e:
        print_error(f"Unexpected error during testing: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()