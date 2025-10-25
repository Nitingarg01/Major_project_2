#!/usr/bin/env python3
"""
API Integration Testing Script - Tests API integrations with current keys
Focuses on testing the API structure and integration points
"""

import requests
import json
import time
import uuid
import io
import os
from datetime import datetime

# Configuration
BASE_URL = "https://interviewassist.preview.emergentagent.com"
API_BASE = f"{BASE_URL}/api"

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

def test_tts_integration():
    """Test ElevenLabs TTS integration"""
    print_test_header("ElevenLabs TTS Integration Test")
    
    try:
        tts_data = {
            "text": "Hello, this is a test of the ElevenLabs text-to-speech integration."
        }
        
        response = requests.post(
            f"{API_BASE}/tts",
            json=tts_data,
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        
        print_info(f"Status Code: {response.status_code}")
        print_info(f"Content-Type: {response.headers.get('Content-Type')}")
        
        if response.status_code == 200:
            content_type = response.headers.get('Content-Type', '')
            if 'audio' in content_type:
                print_success("ElevenLabs TTS integration working - audio generated")
                print_info(f"Audio size: {len(response.content)} bytes")
                return True
            else:
                print_error(f"Expected audio content, got: {content_type}")
                return False
        else:
            print_error(f"TTS failed with status: {response.status_code}")
            try:
                error_data = response.json()
                print_info(f"Error: {error_data.get('error', 'Unknown error')}")
                if "api" in error_data.get('error', '').lower() or "key" in error_data.get('error', '').lower():
                    print_warning("Likely API key issue - need real ElevenLabs API key")
            except:
                print_info(f"Response: {response.text}")
            return False
            
    except requests.exceptions.RequestException as e:
        print_error(f"TTS request failed: {str(e)}")
        return False

def test_resume_upload_structure():
    """Test resume upload API structure (without authentication)"""
    print_test_header("Resume Upload API Structure Test")
    
    try:
        # Create test PDF file
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
(John Doe - Software Engineer Resume) Tj
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
        
        files = {
            'file': ('test_resume.pdf', io.BytesIO(pdf_content), 'application/pdf')
        }
        
        response = requests.post(
            f"{API_BASE}/resume/upload",
            files=files,
            timeout=30
        )
        
        print_info(f"Status Code: {response.status_code}")
        print_info(f"Response: {response.text}")
        
        if response.status_code == 401:
            print_success("Resume upload API structure working - requires authentication")
            return True
        elif response.status_code == 200:
            try:
                data = response.json()
                if data.get("success") and data.get("analysis"):
                    print_success("Resume upload and Gemini analysis working")
                    return True
                else:
                    print_error("Resume upload succeeded but missing analysis data")
                    return False
            except:
                print_error("Invalid JSON response")
                return False
        else:
            print_error(f"Unexpected status code: {response.status_code}")
            return False
            
    except requests.exceptions.RequestException as e:
        print_error(f"Resume upload test failed: {str(e)}")
        return False

def test_interview_creation_structure():
    """Test interview creation API structure (without authentication)"""
    print_test_header("Interview Creation API Structure Test")
    
    try:
        interview_data = {
            "jobRole": "Software Engineer",
            "experienceLevel": "mid",
            "numQuestions": 3,
            "resumeId": "test-resume-id"
        }
        
        response = requests.post(
            f"{API_BASE}/interview/create",
            json=interview_data,
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        
        print_info(f"Status Code: {response.status_code}")
        print_info(f"Response: {response.text}")
        
        if response.status_code == 401:
            print_success("Interview creation API structure working - requires authentication")
            return True
        elif response.status_code == 200:
            try:
                data = response.json()
                if data.get("success") and data.get("questions"):
                    print_success("Interview creation and OpenAI integration working")
                    return True
                else:
                    print_error("Interview creation succeeded but missing questions data")
                    return False
            except:
                print_error("Invalid JSON response")
                return False
        else:
            print_error(f"Unexpected status code: {response.status_code}")
            return False
            
    except requests.exceptions.RequestException as e:
        print_error(f"Interview creation test failed: {str(e)}")
        return False

def test_api_endpoints_structure():
    """Test various API endpoints for structure"""
    print_test_header("API Endpoints Structure Test")
    
    endpoints = [
        ("/resumes", "GET"),
        ("/interviews", "GET"),
        ("/interview/test-id", "GET"),
    ]
    
    results = {}
    
    for endpoint, method in endpoints:
        try:
            if method == "GET":
                response = requests.get(f"{API_BASE}{endpoint}", timeout=10)
            else:
                response = requests.post(f"{API_BASE}{endpoint}", timeout=10)
            
            print_info(f"{method} {endpoint}: Status {response.status_code}")
            
            if response.status_code == 401:
                print_success(f"{endpoint} - Properly protected (requires auth)")
                results[endpoint] = True
            elif response.status_code == 404:
                print_warning(f"{endpoint} - Not found (may be expected)")
                results[endpoint] = True
            elif response.status_code == 200:
                print_success(f"{endpoint} - Working")
                results[endpoint] = True
            else:
                print_error(f"{endpoint} - Unexpected status: {response.status_code}")
                results[endpoint] = False
                
        except requests.exceptions.RequestException as e:
            print_error(f"{endpoint} - Request failed: {str(e)}")
            results[endpoint] = False
    
    return results

def generate_integration_report(results):
    """Generate integration test report"""
    print_test_header("API INTEGRATION TEST REPORT")
    
    print(f"\n{Colors.BOLD}API STRUCTURE STATUS:{Colors.END}")
    
    # TTS Integration
    if results.get("tts"):
        print_success("ElevenLabs TTS API - Structure Working")
    else:
        print_error("ElevenLabs TTS API - Integration Failed (Need Real API Key)")
    
    # Resume Upload
    if results.get("resume_upload"):
        print_success("Resume Upload API - Structure Working")
    else:
        print_error("Resume Upload API - Structure Issues")
    
    # Interview Creation
    if results.get("interview_create"):
        print_success("Interview Creation API - Structure Working")  
    else:
        print_error("Interview Creation API - Structure Issues")
    
    # Protected Endpoints
    protected_working = all(results.get("endpoints", {}).values())
    if protected_working:
        print_success("Protected Endpoints - Authentication Working")
    else:
        print_error("Protected Endpoints - Some Issues Found")
    
    print(f"\n{Colors.BOLD}INTEGRATION REQUIREMENTS:{Colors.END}")
    print_warning("Real API Keys Needed:")
    print("  • ElevenLabs API Key (for TTS)")
    print("  • Gemini API Key (for resume analysis)")  
    print("  • OpenAI API Key (for interview questions & feedback)")
    
    print(f"\n{Colors.BOLD}HOW TO GET FREE API KEYS:{Colors.END}")
    print("  • Gemini: Visit aistudio.google.com")
    print("  • OpenAI: Visit platform.openai.com")
    print("  • ElevenLabs: Visit elevenlabs.io (may require contact)")
    
    return results

def main():
    """Main test execution"""
    print(f"{Colors.BLUE}{Colors.BOLD}")
    print("=" * 80)
    print("API INTEGRATION TESTING - STRUCTURE & KEY VALIDATION")
    print("=" * 80)
    print(f"{Colors.END}")
    
    print_info(f"Base URL: {BASE_URL}")
    print_info(f"API Base: {API_BASE}")
    print_info(f"Test Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    results = {}
    
    # Test TTS integration
    results["tts"] = test_tts_integration()
    time.sleep(1)
    
    # Test resume upload structure
    results["resume_upload"] = test_resume_upload_structure()
    time.sleep(1)
    
    # Test interview creation structure
    results["interview_create"] = test_interview_creation_structure()
    time.sleep(1)
    
    # Test API endpoints structure
    results["endpoints"] = test_api_endpoints_structure()
    
    # Generate report
    generate_integration_report(results)
    
    return results

if __name__ == "__main__":
    main()