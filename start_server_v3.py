
import uvicorn
import os
import sys

# Ensure the project root is in sys.path
PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
sys.path.append(PROJECT_ROOT)

if __name__ == "__main__":
    print(f"Starting server v3 from {PROJECT_ROOT} on port 8002")
    # Run server on port 8002 bound to localhost for better security
    uvicorn.run("backend.main:app", host="127.0.0.1", port=8002, reload=True, reload_dirs=[PROJECT_ROOT])
