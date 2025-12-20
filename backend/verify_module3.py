from app.services.impersonation import analyze_impersonation

def test(title, url):
    score, warning = analyze_impersonation(title, url)
    print(f"Title: '{title}' | URL: '{url}'")
    print(f"Result: Score={score}, Warning='{warning}'")
    print("-" * 50)

print("--- Testing Module 3: Entity Mismatch & Homoglyphs ---\n")

# 1. Typosquatting (Homoglyph) - No Title context needed, but Title helps
test("Login Page", "http://paypa1.com")  # Simulates 'paypal.com' typo

# 2. Entity Mismatch - Title claims brand, URL is totally different
test("PayPal Secure Login", "http://secure-banking-xyz.com")

# 3. Safe Case - Exact Match
test("PayPal", "http://paypal.com")

# 4. Safe Case - Subdomain
test("Google Account", "http://accounts.google.com")

# 5. Typosquatting - Microsoft
test("Sign in", "http://microsoft-support.com") # Contains 'microsoft', might trigger Mismatch if title says it, or Typosquatting if close enough to 'microsoft.com'
# Actually 'microsoft-support.com' is not 'microsoft.com' similarity > 0.85? Let's see. 
# It might fail the similarity test if it's too long, but let's test.

# 6. Typosquatting - Single char
test("Google", "http://goog1e.com")
