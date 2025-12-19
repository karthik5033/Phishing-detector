from typing import Tuple, Optional
from urllib.parse import urlparse

# Define Protected Entities and their Allowed Domains
PROTECTED_ENTITIES = {
    "paypal": ["paypal.com", "paypal-objects.com"],
    "google": ["google.com", "accounts.google.com", "gmail.com"],
    "microsoft": ["microsoft.com", "live.com", "office.com", "azure.com"],
    "facebook": ["facebook.com", "fb.com", "messenger.com"],
    "apple": ["apple.com", "icloud.com"],
    "amazon": ["amazon.com", "aws.amazon.com"],
    "netflix": ["netflix.com"],
    "linkedin": ["linkedin.com"],
    "dropbox": ["dropbox.com"],
    "adobe": ["adobe.com"],
    "bank of america": ["bankofamerica.com"],
    "chase": ["chase.com"],
    "wells fargo": ["wellsfargo.com"]
}

def analyze_impersonation(title: Optional[str], url: Optional[str]) -> Tuple[float, Optional[str]]:
    """
    Checks if the Page Title claims to be a protected entity but the URL does not match.
    Returns (risk_score_addition, explanation).
    """
    if not title or not url:
        return 0.0, None

    title_lower = title.lower()
    
    # Parse domain from URL
    try:
        parsed_url = urlparse(url)
        # Handle cases where url might not have scheme
        if not parsed_url.netloc:
             parsed_url = urlparse(f"http://{url}")
        
        domain = parsed_url.netloc.lower()
        # Strip 'www.'
        if domain.startswith("www."):
            domain = domain[4:]
    except:
        return 0.0, None

    # Check for Impersonation
    for entity, allowed_domains in PROTECTED_ENTITIES.items():
        if entity in title_lower:
            # The Title claims to be this entity.
            # Check if current domain is authorized.
            is_authorized = False
            for allowed in allowed_domains:
                if domain == allowed or domain.endswith("." + allowed):
                    is_authorized = True
                    break
            
            if not is_authorized:
                return 0.4, f"Impersonation Detected: Page claims to be '{entity.title()}' but is hosted on '{domain}'."

    return 0.0, None
