#!/usr/bin/env python3
"""
NextAuth Specific Testing for Interview Pro AI Platform
Tests NextAuth authentication flow with proper CSRF token handling
"""

import requests
import json
import re
from urllib.parse import parse_qs, urlparse

# Configuration
BASE_URL = "http://localhost:3000"
API_BASE = f"{BASE_URL}/api"

# Test data
TEST_USER = {
    "name": "Sarah Johnson",
    "email": "sarah.johnson.7dc4b810@testdomain.com",  # Using the same user from previous test
    "password": "SecurePass123!"
}

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    END = '\033[0m'
    BOLD = '\033[1m'

def print_success(message):
    print(f"{Colors.GREEN}✅ {message}{Colors.END}")

def print_error(message):
    print(f"{Colors.RED}❌ {message}{Colors.END}")

def print_warning(message):
    print(f"{Colors.YELLOW}⚠️  {message}{Colors.END}")

def print_info(message):
    print(f"{Colors.BLUE}ℹ️  {message}{Colors.END}")

def get_csrf_token():
    """Get CSRF token from NextAuth"""
    try:
        response = requests.get(f"{API_BASE}/auth/csrf", timeout=10)
        if response.status_code == 200:
            data = response.json()
            csrf_token = data.get('csrfToken')
            print_info(f"CSRF Token obtained: {csrf_token[:20]}...")
            return csrf_token
        else:
            print_error(f"Failed to get CSRF token: {response.status_code}")
            return None
    except Exception as e:
        print_error(f"Error getting CSRF token: {str(e)}")
        return None

def test_nextauth_signin():
    """Test NextAuth signin with proper CSRF handling"""
    print(f"\n{Colors.BLUE}{Colors.BOLD}Testing NextAuth Signin Flow{Colors.END}")
    
    # Step 1: Get CSRF token
    csrf_token = get_csrf_token()
    if not csrf_token:
        print_error("Cannot proceed without CSRF token")
        return False
    
    # Step 2: Test signin with credentials
    print_info("Testing signin with valid credentials")
    try:
        signin_data = {
            'csrfToken': csrf_token,
            'email': TEST_USER['email'],
            'password': TEST_USER['password'],
            'redirect': 'false',
            'json': 'true'
        }
        
        response = requests.post(
            f"{API_BASE}/auth/callback/credentials",
            data=signin_data,
            headers={
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json'
            },
            timeout=10,
            allow_redirects=False
        )
        
        print_info(f"Signin Status Code: {response.status_code}")
        print_info(f"Signin Response: {response.text}")
        print_info(f"Signin Headers: {dict(response.headers)}")
        
        # Check for session cookies
        cookies = response.cookies
        session_cookies = [cookie for cookie in cookies if 'next-auth' in cookie.name]
        
        if session_cookies:
            print_success("NextAuth session cookies found")
            for cookie in session_cookies:
                print_info(f"Cookie: {cookie.name} = {cookie.value[:20]}...")
            return True
        elif response.status_code == 200:
            # Check response content for success indicators
            response_data = response.json() if response.headers.get('content-type', '').startswith('application/json') else {}
            if response_data.get('url') and 'error' not in response_data.get('url', ''):
                print_success("Login appears successful (redirect URL provided)")
                return True
            else:
                print_warning("Login response received but authentication status unclear")
                return False
        else:
            print_error(f"Login failed with status: {response.status_code}")
            return False
            
    except Exception as e:
        print_error(f"Signin test failed: {str(e)}")
        return False

def test_session_verification():
    """Test session verification"""
    print(f"\n{Colors.BLUE}{Colors.BOLD}Testing Session Verification{Colors.END}")
    
    try:
        response = requests.get(f"{API_BASE}/auth/session", timeout=10)
        print_info(f"Session Status Code: {response.status_code}")
        print_info(f"Session Response: {response.text}")
        
        if response.status_code == 200:
            data = response.json()
            if data and data.get('user'):
                print_success("Active session found")
                print_info(f"User: {data['user'].get('email', 'Unknown')}")
                return True
            else:
                print_warning("No active session found")
                return False
        else:
            print_error(f"Session check failed: {response.status_code}")
            return False
            
    except Exception as e:
        print_error(f"Session verification failed: {str(e)}")
        return False

def test_providers():
    """Test available providers"""
    print(f"\n{Colors.BLUE}{Colors.BOLD}Testing Available Providers{Colors.END}")
    
    try:
        response = requests.get(f"{API_BASE}/auth/providers", timeout=10)
        print_info(f"Providers Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print_info(f"Available providers: {list(data.keys())}")
            
            # Check if credentials provider is available
            if 'credentials' in data:
                print_success("Credentials provider is configured")
                return True
            else:
                print_warning("Credentials provider not found in available providers")
                return False
        else:
            print_error(f"Providers check failed: {response.status_code}")
            return False
            
    except Exception as e:
        print_error(f"Providers test failed: {str(e)}")
        return False

def main():
    """Main test execution"""
    print(f"{Colors.BLUE}{Colors.BOLD}")
    print("=" * 60)
    print("NEXTAUTH AUTHENTICATION TESTING")
    print("=" * 60)
    print(f"{Colors.END}")
    
    results = {
        'providers': False,
        'signin': False,
        'session': False
    }
    
    # Test 1: Check available providers
    results['providers'] = test_providers()
    
    # Test 2: Test signin flow
    results['signin'] = test_nextauth_signin()
    
    # Test 3: Verify session (if signin was successful)
    if results['signin']:
        results['session'] = test_session_verification()
    
    # Summary
    print(f"\n{Colors.BLUE}{Colors.BOLD}NEXTAUTH TEST SUMMARY{Colors.END}")
    total_tests = len(results)
    passed_tests = sum(results.values())
    
    for test_name, result in results.items():
        if result:
            print_success(f"{test_name.title()} test passed")
        else:
            print_error(f"{test_name.title()} test failed")
    
    print(f"\nOverall: {passed_tests}/{total_tests} tests passed")
    
    if results['providers'] and results['signin']:
        print_success("NextAuth authentication is working correctly")
    else:
        print_error("NextAuth authentication has issues")
    
    return results

if __name__ == "__main__":
    main()