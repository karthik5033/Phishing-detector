
import os
import google.generativeai as genai
from dotenv import load_dotenv

def test_ai():
    # Load env
    load_dotenv('.env.local')
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("FAIL: GEMINI_API_KEY not found in .env.local")
        return
    
    api_key = api_key.strip().strip('"').strip("'")
    print(f"Testing key: {api_key[:5]}...{api_key[-5:]}")
    
    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-pro')
        response = model.generate_content("Hello, this is a test. Reply with 'ACK' if you receive this.")
        print(f"SUCCESS: AI responded: {response.text}")
    except Exception as e:
        print(f"FAIL: AI error: {e}")

if __name__ == "__main__":
    test_ai()
