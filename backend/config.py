import os

# Server
SERVER_PORT = int(os.getenv("CLICKWISE_PORT", "8002"))
SERVER_HOST = os.getenv("CLICKWISE_HOST", "127.0.0.1")  # NOT 0.0.0.0

# Detection
DETECTION_THRESHOLD_BLOCK = 0.75          # score >= this 12 block page
DETECTION_THRESHOLD_WARN = 0.55           # score >= this 12 yellow warning
DETECTION_THRESHOLD_INVESTIGATE = 0.60    # score >= this 12 trigger investigation
ML_MODEL_PATH = os.path.join(os.path.dirname(__file__), '..', 'models', 'phishing_lgbm.joblib')
ML_METADATA_PATH = os.path.join(os.path.dirname(__file__), '..', 'models', 'model_metadata.json')

# Investigation
INVESTIGATION_MAX_STEPS = 15
INVESTIGATION_MAX_TIME_SECONDS = 30
INVESTIGATION_MAX_BROWSER_CONTEXTS = 2
INVESTIGATION_POLLING_INTERVAL_HINT_MS = 2000

# Correct Path
CORRECT_PATH_AUTO_REDIRECT_THRESHOLD = 0.80
CORRECT_PATH_ASK_USER_THRESHOLD = 0.50

# Auth
ADMIN_API_KEY = os.getenv("CLICKWISE_ADMIN_KEY", None)

# LLM
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", None)

# Privacy
DEFAULT_RETENTION_DAYS = 30
DEFAULT_PII_MASKING = True
