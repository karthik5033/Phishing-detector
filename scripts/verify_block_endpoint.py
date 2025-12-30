import requests
import json

BASE_URL = "http://127.0.0.1:8000/api/v1"

def test_endpoint(name, method, endpoint, data=None):
    url = f"{BASE_URL}{endpoint}"
    print(f"Testing {name}: {method} {url}")
    try:
        if method == "POST":
            response = requests.post(url, json=data)
        else:
            response = requests.get(url)
        
        print(f"Status Code: {response.status_code}")
        try:
            print(f"Response: {json.dumps(response.json(), indent=2)}")
        except:
            print(f"Response (text): {response.text}")
            
        if response.status_code in [200, 201]:
            print(f"✅ {name} PASSED")
            return True
        else:
            print(f"❌ {name} FAILED")
            return False
    except Exception as e:
        print(f"❌ {name} FAILED with error: {e}")
        return False

print("--- VERIFYING BLOCKING ENDPOINTS ---\n")

# 1. Test Detect (Control)
test_endpoint("Detect (Control)", "POST", "/detect", {"text": "example.com"})

# 2. Test Block Variations
print("\n--- Testing Variations for /block ---")
variations = [
    "/api/v1/block",           # Expected
    "/block",                  # No prefix
    "/api/v1/api/v1/block",    # Double prefix
    "/backend/api/v1/block"    # Weird path
]

for path in variations:
    success = test_endpoint(f"Block ({path})", "POST", path.replace("/api/v1", "", 1) if path.startswith("/api/v1") else path, {"domain": "test-block.com"})
    # Note: test_endpoint adds BASE_URL which is /api/v1. Need to handle carefully.

# Redefine logic for variations to be absolute
def test_manual(url, data):
    print(f"Testing info: POST {url}")
    try:
        r = requests.post(url, json=data)
        print(f"Status: {r.status_code}")
        if r.status_code != 404:
             print(f"FOUND! Response: {r.text[:200]}")
    except Exception as e:
         print(f"Error: {e}")

print("\n--- Manual Absolute URL Tests ---")
test_manual("http://127.0.0.1:8000/api/v1/block", {"domain": "test.com"})
test_manual("http://127.0.0.1:8000/block", {"domain": "test.com"}) 
test_manual("http://127.0.0.1:8000/api/block", {"domain": "test.com"})
test_manual("http://127.0.0.1:8000/api/v1/api/v1/block", {"domain": "test.com"})
