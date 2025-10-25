#!/usr/bin/env python3
"""
Backend API Testing Script for Interview Pro AI Platform
Tests authentication flow: registration, login, forgot password, reset password
"""

import requests
import json
import time
import uuid
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

def generate_test_report(test_results):
    """Generate comprehensive test report"""
    print_test_header("TEST REPORT SUMMARY")
    
    total_tests = 0
    passed_tests = 0
    
    # Registration tests
    print(f"\n{Colors.BOLD}User Registration API:{Colors.END}")
    reg_results = test_results.get("registration", {})
    for test_name, result in reg_results.items():
        total_tests += 1
        if result:
            passed_tests += 1
            print_success(f"{test_name.replace('_', ' ').title()}")
        else:
            print_error(f"{test_name.replace('_', ' ').title()}")
    
    # Login tests
    print(f"\n{Colors.BOLD}User Login API:{Colors.END}")
    login_results = test_results.get("login", {})
    for test_name, result in login_results.items():
        total_tests += 1
        if result:
            passed_tests += 1
            print_success(f"{test_name.replace('_', ' ').title()}")
        else:
            print_error(f"{test_name.replace('_', ' ').title()}")
    
    # Forgot password tests
    print(f"\n{Colors.BOLD}Forgot Password API:{Colors.END}")
    forgot_results = test_results.get("forgot_password", {})
    for test_name, result in forgot_results.items():
        total_tests += 1
        if result:
            passed_tests += 1
            print_success(f"{test_name.replace('_', ' ').title()}")
        else:
            print_error(f"{test_name.replace('_', ' ').title()}")
    
    # Reset password tests
    print(f"\n{Colors.BOLD}Reset Password API:{Colors.END}")
    reset_results = test_results.get("reset_password", {})
    for test_name, result in reset_results.items():
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
    if not reg_results.get("valid_registration"):
        critical_issues.append("User registration not working")
    if not login_results.get("valid_login"):
        critical_issues.append("User login not working")
    if not forgot_results.get("valid_email"):
        critical_issues.append("Forgot password not working")
    
    if critical_issues:
        print(f"\n{Colors.RED}{Colors.BOLD}CRITICAL ISSUES:{Colors.END}")
        for issue in critical_issues:
            print_error(issue)
    else:
        print(f"\n{Colors.GREEN}{Colors.BOLD}✅ All critical authentication flows working!{Colors.END}")
    
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
    print("INTERVIEW PRO AI PLATFORM - BACKEND AUTHENTICATION TESTING")
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
    
    # Run all authentication tests
    test_results = {}
    
    try:
        # Test user registration
        test_results["registration"] = test_user_registration()
        time.sleep(1)  # Brief pause between tests
        
        # Test user login (only if registration succeeded)
        if test_results["registration"].get("valid_registration"):
            test_results["login"] = test_user_login()
        else:
            print_warning("Skipping login tests - registration failed")
            test_results["login"] = {"valid_login": False, "invalid_credentials": False, "missing_credentials": False}
        
        time.sleep(1)
        
        # Test forgot password
        test_results["forgot_password"] = test_forgot_password()
        time.sleep(1)
        
        # Test reset password
        test_results["reset_password"] = test_reset_password()
        
        # Generate final report
        report = generate_test_report(test_results)
        
        return report
        
    except KeyboardInterrupt:
        print_warning("\nTesting interrupted by user")
    except Exception as e:
        print_error(f"Unexpected error during testing: {str(e)}")

if __name__ == "__main__":
    main()