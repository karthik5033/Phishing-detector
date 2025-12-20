import google.generativeai as genai
import os
from typing import List, Dict, Any
from dotenv import load_dotenv

# Load environment variables at module level
def _load_env():
    current_dir = os.path.dirname(os.path.abspath(__file__))
    backend_root = os.path.dirname(os.path.dirname(os.path.dirname(current_dir))) 
    project_root = os.path.dirname(backend_root) 
    
    possible_paths = [
        os.path.join(backend_root, ".env.local"),
        os.path.join(project_root, ".env.local"),
        ".env.local",
        "../.env.local"
    ]
    
    for env_path in possible_paths:
        abs_path = os.path.abspath(env_path)
        if os.path.exists(abs_path):
            print(f"[LlmService] Loading env from: {abs_path}")
            load_dotenv(abs_path, override=True)
            return True
    return False

_env_loaded = _load_env()

class LlmService:
    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY")
        if self.api_key:
            self.api_key = self.api_key.strip().strip('"').strip("'")
            
        self.model = None
        # Refined list based on confirmed identifiers from user's list_models()
        self.model_names = [
            'models/gemini-2.0-flash-lite',
            'models/gemini-2.0-flash',
            'models/gemini-flash-latest',
            'models/gemini-pro-latest',
            'models/gemini-2.0-flash-exp',
            'models/gemini-1.5-flash',
            'models/gemini-1.5-flash-latest'
        ]
        
        if not self.api_key:
            print(f"[LlmService] ERROR: GEMINI_API_KEY is missing from environment.")
        else:
            try:
                genai.configure(api_key=self.api_key)
                # Just show the first few and last few chars for security
                key_preview = f"{self.api_key[:5]}...{self.api_key[-4:]}" if self.api_key else "None"
                print(f"[LlmService] AI Model configured. Key: {key_preview}")
                self._init_best_model()
            except Exception as e:
                print(f"[LlmService] CRITICAL Error configuring Gemini: {e}")

    def _init_best_model(self):
        # We just pick the first one to satisfy the initialization check
        # The real rotation happens in chat_with_context
        self.model = genai.GenerativeModel(self.model_names[0])
        print(f"[LlmService] Default model set to {self.model_names[0]}")

    async def chat_with_context(self, message: str, context: str) -> Dict[str, Any]:
        if not self.api_key:
            return {
                "response": "Configuration Error: GEMINI_API_KEY is missing. Please check your .env.local file.",
                "suggestions": ["Add API Key"]
            }
        
        system_prompt = (
            "You are Sentinel AI, a high-level Cybersecurity Strategist and protective digital guardian. "
            "You are embedded in the SecureSentinel dashboard. Your tone is professional, authoritative, but helpful.\n\n"
            "CONTEXT OF CURRENT PAGE:\n"
            f"'''{context[:3000]}'''\n\n"
            "USER QUESTION:\n"
            f"{message}\n\n"
            "INSTRUCTIONS:\n"
            "1. Provide expert-level analysis of any security risks mentioned or visible in the context.\n"
            "2. If the user asks about dashboard features, guide them like a power-user.\n"
            "3. ALWAYS include 2-3 'Suggested Follow-up Questions' at the end of your response, relevant to what we just discussed.\n"
            "4. Use professional Markdown formatting (bolding, lists, code blocks where appropriate).\n\n"
            "RESPONSE FORMAT:\n"
            "[Your expert response here]\n\n"
            "SUGGESTIONS:\n"
            "• [Suggestion 1]\n"
            "• [Suggestion 2]"
        )

        # Attempt generation with model fallback on 429
        last_error = "Unknown Error"
        for model_name in self.model_names:
            try:
                print(f"[LlmService] Attempting generation with {model_name}...")
                current_model = genai.GenerativeModel(model_name)
                response = current_model.generate_content(system_prompt)
                
                if not response.text:
                    raise Exception("Empty response from AI")
                    
                print(f"[LlmService] Success with {model_name}!")
                
                # Parse suggestions from the response text
                text_parts = response.text.split("SUGGESTIONS:")
                main_text = text_parts[0].strip()
                suggestions = []
                
                if len(text_parts) > 1:
                    raw_suggs = text_parts[1].strip().split("\n")
                    for s in raw_suggs:
                        clean_s = s.replace("•", "").replace("-", "").replace("*", "").strip()
                        if clean_s:
                            suggestions.append(clean_s)
                
                # Fallback to defaults if parsing fails
                if not suggestions:
                    suggestions = self._generate_suggestions(main_text)

                return {
                    "response": main_text,
                    "suggestions": suggestions[:3]
                }
            except Exception as e:
                err_str = str(e).lower()
                last_error = str(e)
                print(f"[LlmService] {model_name} failed: {err_str[:150]}...")
                
                if any(x in err_str for x in ["429", "quota", "404", "not found", "403", "permission"]):
                    continue
                
                return {
                    "response": f"AI Engine Error: {str(e)}",
                    "suggestions": ["Check Key"]
                }
        
        return {
            "response": f"I've exhausted all available AI models for this key. Last error: {last_error}. This usually happens when the free tier quota is depleted or the key is restricted.",
            "suggestions": ["Try Newer Key", "Wait 1 Hour"]
        }

    def _generate_suggestions(self, response_text: str) -> List[str]:
        suggestions = []
        lower_text = response_text.lower()
        if "risk" in lower_text or "score" in lower_text:
            suggestions.append("How do I improve my score?")
        if "phishing" in lower_text:
            suggestions.append("What is a phishing attack?")
        if "scan" in lower_text:
            suggestions.append("Show recent scans")
        else:
            suggestions.append("What can you do?")
        return suggestions[:3]

# Create singleton
llm_service = LlmService()

def get_llm_service():
    return llm_service
