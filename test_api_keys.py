#!/usr/bin/env python3
"""
API Key Validation Test
Tests each API key individually to identify which ones are working
"""

import requests
import json
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def test_openai_key():
    """Test OpenAI API key"""
    print("🤖 Testing OpenAI API Key...")
    
    api_key = os.getenv('EMERGENT_LLM_KEY')
    if not api_key:
        print("❌ No OpenAI API key found in environment")
        return False
    
    print(f"   Key: {api_key[:10]}...{api_key[-4:]}")
    
    headers = {
        'Authorization': f'Bearer {api_key}',
        'Content-Type': 'application/json'
    }
    
    data = {
        'model': 'gpt-4o-mini',
        'messages': [{'role': 'user', 'content': 'Hello, this is a test.'}],
        'max_tokens': 10
    }
    
    try:
        response = requests.post(
            'https://api.openai.com/v1/chat/completions',
            headers=headers,
            json=data,
            timeout=30
        )
        
        if response.status_code == 200:
            print("✅ OpenAI API key is VALID and working")
            return True
        else:
            print(f"❌ OpenAI API key failed: {response.status_code}")
            print(f"   Error: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ OpenAI API test error: {str(e)}")
        return False

def test_gemini_key():
    """Test Gemini API key"""
    print("\n🧠 Testing Gemini API Key...")
    
    api_key = os.getenv('GEMINI_API_KEY')
    if not api_key:
        print("❌ No Gemini API key found in environment")
        return False
    
    print(f"   Key: {api_key[:10]}...{api_key[-4:]}")
    
    url = f'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}'
    
    data = {
        'contents': [{
            'parts': [{'text': 'Hello, this is a test.'}]
        }]
    }
    
    try:
        response = requests.post(url, json=data, timeout=30)
        
        if response.status_code == 200:
            print("✅ Gemini API key is VALID and working")
            return True
        else:
            print(f"❌ Gemini API key failed: {response.status_code}")
            print(f"   Error: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Gemini API test error: {str(e)}")
        return False

def test_elevenlabs_key():
    """Test ElevenLabs API key"""
    print("\n🔊 Testing ElevenLabs API Key...")
    
    api_key = os.getenv('ELEVENLABS_API_KEY')
    if not api_key:
        print("❌ No ElevenLabs API key found in environment")
        return False
    
    print(f"   Key: {api_key[:10]}...{api_key[-4:]}")
    
    headers = {
        'xi-api-key': api_key,
        'Content-Type': 'application/json'
    }
    
    # Test with voices endpoint (simpler than TTS)
    try:
        response = requests.get(
            'https://api.elevenlabs.io/v1/voices',
            headers=headers,
            timeout=30
        )
        
        if response.status_code == 200:
            print("✅ ElevenLabs API key is VALID and working")
            return True
        else:
            print(f"❌ ElevenLabs API key failed: {response.status_code}")
            print(f"   Error: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ ElevenLabs API test error: {str(e)}")
        return False

def test_groq_key():
    """Test Groq API key"""
    print("\n⚡ Testing Groq API Key...")
    
    api_key = os.getenv('GROQ_API_KEY')
    if not api_key:
        print("❌ No Groq API key found in environment")
        return False
    
    print(f"   Key: {api_key[:10]}...{api_key[-4:]}")
    
    headers = {
        'Authorization': f'Bearer {api_key}',
        'Content-Type': 'application/json'
    }
    
    data = {
        'model': 'llama3-8b-8192',
        'messages': [{'role': 'user', 'content': 'Hello, this is a test.'}],
        'max_tokens': 10
    }
    
    try:
        response = requests.post(
            'https://api.groq.com/openai/v1/chat/completions',
            headers=headers,
            json=data,
            timeout=30
        )
        
        if response.status_code == 200:
            print("✅ Groq API key is VALID and working")
            return True
        else:
            print(f"❌ Groq API key failed: {response.status_code}")
            print(f"   Error: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Groq API test error: {str(e)}")
        return False

def main():
    print("=" * 60)
    print("🔑 API KEY VALIDATION TEST")
    print("=" * 60)
    
    results = {}
    
    # Test each API key
    results['openai'] = test_openai_key()
    results['gemini'] = test_gemini_key()
    results['elevenlabs'] = test_elevenlabs_key()
    results['groq'] = test_groq_key()
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 API KEY TEST RESULTS")
    print("=" * 60)
    
    working_keys = sum(1 for result in results.values() if result)
    total_keys = len(results)
    
    for service, working in results.items():
        status = "✅ WORKING" if working else "❌ FAILED"
        print(f"{service.upper()}: {status}")
    
    print(f"\nOverall: {working_keys}/{total_keys} API keys are working")
    
    if working_keys == 0:
        print("❌ No API keys are working - all integrations will fail")
    elif working_keys < total_keys:
        print("⚠️ Some API keys are not working - partial functionality")
    else:
        print("🎉 All API keys are working!")
    
    return results

if __name__ == "__main__":
    main()