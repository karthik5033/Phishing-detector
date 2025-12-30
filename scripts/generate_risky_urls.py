import pandas as pd
import random
import string

# Target brands often spoofed
brands = [
    "google", "amazon", "paypal", "microsoft", "apple", "netflix", "facebook", 
    "instagram", "linkedin", "chase", "wellsfargo", "bankofamerica", "irs", 
    "dhl", "fedex", "ups", "dropbox", "adobe", "outlook", "yahoo"
]

# Suspicious TLDs
risky_tlds = [
    ".xyz", ".top", ".club", ".info", ".site", ".online", ".net", ".work", 
    ".click", ".link", ".buzz", ".review", ".tk", ".ml", ".ga", ".cf"
]

# Sensitive keywords
keywords = [
    "login", "signin", "verify", "secure", "update", "account", "confirm", 
    "wallet", "banking", "billing", "invoice", "auth", "password", "support"
]

urls = []

print("🔨 Generating Risky/Phishing URLs...")

for _ in range(5000):
    brand = random.choice(brands)
    kw = random.choice(keywords)
    tld = random.choice(risky_tlds)
    
    # Pattern 1: Hyphened Keyword Stuffing (e.g. paypal-secure-login.xyz)
    if random.random() > 0.5:
        domain = f"{brand}-{kw}"
        if random.random() > 0.5:
            domain += f"-{random.choice(keywords)}"
    else:
        # Pattern 2: Typosquatting (simple)
        if 'o' in brand:
            spoofed = brand.replace('o', '0')
        elif 'i' in brand:
            spoofed = brand.replace('i', '1')
        elif 'l' in brand:
            spoofed = brand.replace('l', '1')
        elif 'e' in brand:
            spoofed = brand.replace('e', '3')
        else:
            spoofed = brand + "s" # pluralize
        domain = f"{spoofed}-{kw}"

    # Pattern 3: Subdomain abuse (e.g. secure.login.amazon.update.com)
    if random.random() > 0.7:
        sub = f"{random.choice(keywords)}.{random.choice(keywords)}"
        url = f"http://{sub}.{domain}{tld}"
    else:
        url = f"http://{domain}{tld}"
        
    # Pattern 4: Path abuse
    if random.random() > 0.5:
        url += f"/{random.choice(keywords)}.php?id={random.randint(1000,9999)}"

    urls.append(url)

# Section 2: Cloud/Platform Abuse (Very common in real attacks)
# Attackers host fake login pages on legitimate free hosting
cloud_platforms = [
    "web.app", "firebaseapp.com", "herokuapp.com", "pages.dev", "vercel.app", 
    "netlify.app", "github.io", "gitlab.io", "s3.amazonaws.com", "blob.core.windows.net"
]

cloud_prefixes = ["secure-login", "account-verify", "bank-update", "wallet-connect", "support-ticket"]

for _ in range(3000):
    platform = random.choice(cloud_platforms)
    prefix = random.choice(cloud_prefixes)
    rand_str = ''.join(random.choices(string.ascii_lowercase + string.digits, k=6))
    
    # e.g. secure-login-paypal.web.app
    if random.random() > 0.5:
        target = random.choice(brands)
        url = f"https://{prefix}-{target}-{rand_str}.{platform}"
    else:
        # e.g. vercel.app/login-chase-secure
        target = random.choice(brands)
        url = f"https://{rand_str}.{platform}/{target}-login"
    urls.append(url)

# Section 3: Crypto/WalletDrainer Phishing
crypto_brands = ["metamask", "coinbase", "binance", "trustwallet", "ledger", "trezor", "phantom"]
crypto_tlds = [".finance", ".exchange", ".art", ".app", ".io"]

for _ in range(2000):
    brand = random.choice(crypto_brands)
    fake_action = random.choice(["connect", "claim", "airdrop", "validate", "restore"])
    tld = random.choice(crypto_tlds)
    
    # e.g. metamask-airdrop-claim.art
    url = f"https://{brand}-{fake_action}{random.randint(1,99)}.{tld}"
    
    # Add deep path for 'wallet connect' scripts
    if random.random() > 0.7:
        url += "/connect?session=" + ''.join(random.choices(string.ascii_letters + string.digits, k=32))
        
    urls.append(url)

# Add some IP address attacks
for _ in range(500):
    ip = f"{random.randint(10,200)}.{random.randint(0,255)}.{random.randint(0,255)}.{random.randint(0,255)}"
    url = f"http://{ip}/login"
    urls.append(url)

# Section 4: Tech Support Scams (Urgent, scareware)
# e.g. microsoft-alert-virus-detected-0x884.tk
scam_brands = ["microsoft", "apple", "windows", "defender", "norton", "mcafee"]
scam_tlds = [".info", ".support", ".help", ".services", ".tk", ".biz"]

for _ in range(2500):
    brand = random.choice(scam_brands)
    keyword = random.choice(["virus", "spyware", "trojan", "lock", "alert", "warning", "infected", "blocked"])
    code = f"0x{random.randint(100,999)}{random.choice(['A','B','C','D','E','F'])}"
    tld = random.choice(scam_tlds)
    
    # e.g. windows-security-center-alert-0x88F.info
    url = f"http://{brand}-security-center-{keyword}-{code}.{tld}"
    urls.append(url)

# Section 5: Fake Documents / File Phishing
# e.g. shared-financial-report.pdf.exe.site
filenames = ["invoice", "payment", "receipt", "contract", "salary_slip", "bonus_details", "urgent_notice"]
extensions = ["pdf", "docx", "xlsx"]
bad_exts = ["exe", "scr", "bat", "vbs"] 

for _ in range(2500):
    name = random.choice(filenames)
    real_ext = random.choice(extensions)
    fake_ext = random.choice(bad_exts)
    
    # Double extension attack: financial-report.pdf.exe.xyz
    rand_id = random.randint(10000, 99999)
    domain_part = f"{name}_{rand_id}.{real_ext}.{fake_ext}"
    tld = random.choice(risky_tlds)
    
    url = f"http://{domain_part}{tld}"
    urls.append(url)
    urls.append(url)

# Section 6: Compromised/Hacked Sites (WordPress/Joomla injection)
# e.g. www.small-bakery.com/wp-content/themes/login-chase.html
cms_paths = [
    "wp-content/uploads", "wp-includes/js", "wp-admin/user", 
    "components/com_user", "images/stories", "assets/js"
]
hacked_domains = [
    "salon-paradise.com", "my-local-bakery.net", "school-project.org", 
    "photography-studio.com", "dentist-appointment.biz", "travel-blog.net"
]

for _ in range(2500):
    domain = random.choice(hacked_domains)
    path = random.choice(cms_paths)
    target = random.choice(brands)
    
    # Random legitimate looking file ending
    filename = f"{target}-secure-login.php"
    if random.random() > 0.5:
        filename = f"verify_{target}_{random.randint(100,999)}.html"
        
    url = f"http://{domain}/{path}/{filename}"
    urls.append(url)

# Section 7: IDN Homograph / Punycode Attacks
# e.g. xn--pple-43d.com (Looks like apple.com to legacy browsers)
puny_prefixes = ["xn--", "xn---"]
fake_endings = ["43d", "8s1", "9a2", "q3z", "x1y", "v2b"]

for _ in range(2500):
    target = random.choice(brands)
    tld = random.choice([".com", ".net", ".org"])
    
    # Construct fake punycode
    # e.g. http://xn--amzon-verify-9a2.com
    puny_part = random.choice(puny_prefixes) + target[:3] + random.choice(fake_endings)
    
    url = f"http://{puny_part}{tld}/"
    urls.append(url)

# Section 8: Open Redirect Phishing
# e.g. https://www.google.com/url?q=http://malicious-site.com
open_redirect_hosts = [
    "www.google.com/url?q=", "l.facebook.com/l.php?u=", 
    "www.linkedin.com/slink?code=", "t.co/", "www.youtube.com/redirect?q="
]

for _ in range(2500):
    host = random.choice(open_redirect_hosts)
    target_brand = random.choice(brands)
    risky_tld = random.choice(risky_tlds)
    
    # Destination is the actual malicious site
    payload = f"http://{target_brand}-secure-verify{risky_tld}"
    
    url = f"https://{host}{payload}"
    urls.append(url)

# Section 9: Malicious URL Shorteners (Smishing/Email vectors)
# e.g. bit.ly/3x89sA (This technically redirects to danger)
shorteners = ["bit.ly", "tinyurl.com", "goo.gl", "is.gd", "t.ly", "ow.ly"]

for _ in range(2500):
    shortener = random.choice(shorteners)
    code = ''.join(random.choices(string.ascii_letters + string.digits, k=random.randint(5,8)))
    
    # We label these as Risky because in a phishing context they hide the destination
    url = f"https://{shortener}/{code}"
    urls.append(url)

# Section 10: Fake Luxury Cop / E-commerce Scams
# e.g. rayban-official-outlet-sale-90.com
shop_brands = ["rayban", "nike", "adidas", "gucci", "lv", "rolex", "jordan", "yeezy", "dyson"]
shop_keywords = ["outlet", "sale", "clearance", "discount", "cheap", "90off", "official", "store", "shop"]
shop_tlds = [".shop", ".store", ".top", ".xyz", ".best", ".club"]

for _ in range(2000):
    brand = random.choice(shop_brands)
    kw = random.choice(shop_keywords)
    tld = random.choice(shop_tlds)
    
    # e.g. nike-air-jordan-cheap-sale.shop
    url = f"http://{brand}-{kw}-{random.randint(2024,2026)}{tld}"
    urls.append(url)

# Section 11: Survey / Gift Card Scams
# e.g. amazon-winner-iphone15-claim.xyz
prize_brands = ["amazon", "walmart", "costco", "starbucks", "apple"]
prizes = ["iphone15", "ps5", "giftcard", "1000usd", "cash-prize", "winner"]
survey_tlds = [".xyz", ".win", ".bid", ".click", ".review"]

for _ in range(1500):
    brand = random.choice(prize_brands)
    prize = random.choice(prizes)
    tld = random.choice(survey_tlds)
    
    # e.g. walmart-shopper-survey-win-giftcard.click
    url = f"http://{brand}-survey-{prize}-claim{tld}"
    urls.append(url)

# Section 12: Recruitment / Job Scams
# e.g. amazon-hiring-work-from-home.net
job_brands = ["amazon", "google", "fedex", "ups", "target"]
job_kws = ["hiring", "careers", "jobs", "dispatch", "data-entry", "remote-work", "part-time"]

for _ in range(1500):
    brand = random.choice(job_brands)
    kw = random.choice(job_kws)
    tld = random.choice([".net", ".org", ".work", ".jobs"])
    
    # e.g. fedex-warehouse-jobs-hiring-now.net
    url = f"https://{brand}-{kw}-apply-now{tld}"
    urls.append(url)

# Section 13: Financial Alerts / Account Lockout (High Urgency)
# e.g. paypal-account-limited-resolution.com
fin_brands = ["paypal", "chase", "wellsfargo", "citi", "bankofamerica", "amex"]
fin_actions = ["locked", "limited", "suspended", "unusual-activity", "kyc-verify", "update-payment"]
fin_tlds = [".com", ".net", ".info", ".support", ".co"]

for _ in range(2000):
    brand = random.choice(fin_brands)
    action = random.choice(fin_actions)
    tld = random.choice(fin_tlds)
    
    # e.g. chase-unusual-activity-verify-now.info
    url = f"https://{brand}-{action}-resolution{tld}"
    if random.random() > 0.5:
        url += "/secure/login.php"
    urls.append(url)

# Section 14: Government / Tax Refund Scams
# e.g. irs-tax-refund-claim-2024.org
gov_agencies = ["irs", "hmrc", "gov", "social-security", "medicare", "dvla"]
gov_actions = ["refund", "rebate", "tax-return", "subsidy", "benefit-claim"]

for _ in range(1500):
    agency = random.choice(gov_agencies)
    action = random.choice(gov_actions)
    tld = random.choice([".org", ".net", ".info", ".us", ".uk.com"])
    
    # e.g. hmrc-tax-refund-pending-claim.uk.com
    url = f"http://{agency}-{action}-pending-{random.randint(100,999)}{tld}"
    urls.append(url)

# Section 15: Streaming / Subscription Payment Failed
# e.g. netflix-payment-declined-update.com
sub_brands = ["netflix", "spotify", "hulu", "disneyplus", "amazon-prime", "youtube-premium"]
sub_errors = ["payment-failed", "card-declined", "subscription-expired", "renew-membership"]

for _ in range(1500):
    brand = random.choice(sub_brands)
    error = random.choice(sub_errors)
    tld = random.choice([".com", ".net", ".tv", ".site"])
    
    # e.g. netflix-subscription-expired-renew.site
    url = f"https://{brand}-{error}-secure{tld}"
    urls.append(url)

# Section 16: Piracy / Warez / Crack Sites
# e.g. adobe-photoshop-cracked-activator.to
warez_software = ["photoshop", "windows-11", "office-365", "gta-6", "autocad", "premiere-pro"]
warez_actions = ["cracked", "keygen", "activator", "serial-key", "torrent", "free-download", "patch"]
warez_tlds = [".to", ".pw", ".cc", ".ru", ".ws", ".bz"]

for _ in range(2000):
    soft = random.choice(warez_software)
    action = random.choice(warez_actions)
    tld = random.choice(warez_tlds)
    
    # e.g. windows-11-activator-free-download.to
    url = f"http://{soft}-{action}-{random.randint(2024,2025)}{tld}"
    urls.append(url)

# Section 17: Illegal Pharmacy / Meds
# e.g. buy-cheap-viagra-no-prescription.biz
pills = ["viagra", "cialis", "xanax", "adderall", "oxycontin", "painkillers"]
med_pitch = ["cheap", "no-prescription", "buy-online", "discount", "overnight-shipping"]
med_tlds = [".biz", ".info", ".pharmacy", ".health", ".co.in"]

for _ in range(1500):
    pill = random.choice(pills)
    pitch = random.choice(med_pitch)
    tld = random.choice(med_tlds)
    
    # e.g. buy-online-xanax-cheap.biz
    url = f"http://{pitch}-{pill}-usa{tld}"
    urls.append(url)

# Section 18: Unregulated Gambling / Betting
# e.g. crypto-casino-bonus-win-btc.bet
bet_actions = ["casino", "betting", "poker", "slots", "jackpot", "bonus"]
bet_coins = ["bitcoin", "crypto", "btc", "eth", "sol"]
bet_tlds = [".bet", ".casino", ".win", ".game", ".top"]

for _ in range(1500):
    action = random.choice(bet_actions)
    coin = random.choice(bet_coins)
    tld = random.choice(bet_tlds)
    
    # e.g. bitcoin-casino-jackpot-bonus.bet
    url = f"https://{coin}-{action}-instant-withdraw{tld}"
    urls.append(url)

# Section 19: Carding / CVV / Dumps Shops (Financial Fraud)
# e.g. buy-cc-fullz-cvv-shop.cc
card_terms = ["cc", "cvv", "fullz", "dumps", "credit-card", "bank-logs", "cloned-cards"]
card_actions = ["buy", "shop", "store", "market", "cheap", "no-vbv"]
card_tlds = [".cc", ".to", ".su", ".pw", ".xyz"]

for _ in range(2000):
    term = random.choice(card_terms)
    action = random.choice(card_actions)
    tld = random.choice(card_tlds)
    
    # e.g. best-cvv-dumps-shop.cc
    url = f"http://{action}-{term}-online-{random.randint(10,99)}{tld}"
    urls.append(url)

# Section 20: Fake Identity / Passport Services
# e.g. buy-real-usa-passport.co
docs = ["passport", "id-card", "drivers-license", "ssn", "utility-bill", "visa"]
doc_pitch = ["real", "fake", "novelty", "undetectable", "scannable", "biometric"]
doc_countries = ["usa", "uk", "eu", "canada", "schengen"]

for _ in range(1500):
    doc = random.choice(docs)
    country = random.choice(doc_countries)
    pitch = random.choice(doc_pitch)
    tld = random.choice([".co", ".net", ".org", ".site"])
    
    # e.g. buy-real-passport-usa.co
    url = f"http://buy-{pitch}-{country}-{doc}{tld}"
    urls.append(url)

# Section 21: Hacking / DDoS Services
# e.g. rent-hacker-darkweb.net
hack_terms = ["hacker", "ddos", "botnet", "exploit", "instagram-hack", "whatsapp-spy"]
hack_actions = ["hire", "rent", "tool", "service", "download", "free"]

for _ in range(1500):
    term = random.choice(hack_terms)
    action = random.choice(hack_actions)
    tld = random.choice([".net", ".xyz", ".top", ".club"])
    
    # e.g. instagram-hack-tool-v3.xyz
    url = f"http://{term}-{action}-v{random.randint(1,9)}{tld}"
    urls.append(url)

# Section 22: Illegal Movie / TV Streaming Sites
# e.g. watch-free-movies-123.to
stream_brands = ["123movies", "fmovies", "soap2day", "putlocker", "solarmovie", "gomovies", "yesmovies", "popcorn-time"]
stream_actions = ["watch-free", "online-hd", "streaming", "full-movie", "download-4k", "cam-rip", "season-pass"]
stream_tlds = [".to", ".is", ".ru", ".sx", ".ag", ".ch", ".bz", ".ph"]

for _ in range(3000):
    brand = random.choice(stream_brands)
    action = random.choice(stream_actions)
    tld = random.choice(stream_tlds)
    
    # e.g. fmovies-watch-free-online.to
    url = f"http://{brand}-{action}-{random.randint(1,999)}{tld}"
    
    # Add deep path
    if random.random() > 0.5:
        url += f"/watch/avengers-endgame-full-hd-free"
        
    urls.append(url)

# Section 23: Anime / Cartoon Piracy
# e.g. kissanime-official-proxy.ru
anime_brands = ["kissanime", "9anime", "gogoanime", "crunchyroll-free", "animeheaven"]
anime_actions = ["dubbed", "subbed", "raw", "uncensored", "hentai", "episode-1"]

for _ in range(2000):
    brand = random.choice(anime_brands)
    action = random.choice(anime_actions)
    tld = random.choice([".ru", ".si", ".io", ".vc"])
    
    # e.g. 9anime-naruto-shippuden-dubbed.ru
    url = f"http://{brand}-{action}-watch{tld}"
    urls.append(url)
    urls.append(url)

# Section 24: High Quality Replicas / "First Copy" Clones
# e.g. best-replica-rolex-watches-aaa.vip
rep_brands = ["rolex", "patek", "richard-mille", "gucci", "lv", "hermes", "balenciaga", "dior"]
rep_types = ["replica", "clone", "fake", "1st-copy", "mirror-quality", "aaa-grade", "master-copy"]
rep_items = ["watches", "bags", "shoes", "belts", "wallets"]
rep_tlds = [".vip", ".ru", ".cn", ".biz", ".top", ".best"]

for _ in range(3000):
    brand = random.choice(rep_brands)
    quality = random.choice(rep_types)
    item = random.choice(rep_items)
    tld = random.choice(rep_tlds)
    
    # e.g. replica-rolex-watches-mirror-quality.vip
    url = f"http://{quality}-{brand}-{item}-cheap{tld}"
    
    # Add fake discount param
    if random.random() > 0.5:
        url += "?discount=90_percent_off"
        
    urls.append(url)

# Section 25: Electronics Clones / "Fake Tech"
# e.g. buy-fake-iphone-15-pro-max-android.shop
tech_brands = ["iphone-15", "airpods-pro", "samsung-s24", "dyson-airwrap", "ps5-console", "macbook-pro"]
tech_qualities = ["clone", "fake", "hk-version", "dubai-version", "refurbished-fake"]

for _ in range(2000):
    tech = random.choice(tech_brands)
    quality = random.choice(tech_qualities)
    tld = random.choice([".shop", ".store", ".electronics", ".mobile"])
    
    # e.g. fake-iphone-15-hk-version-cheap.shop
    url = f"http://{quality}-{tech}-cheap-price{tld}"
    urls.append(url)

# Section 26: Live Sports / PPV Piracy
# e.g. watch-ufc-299-free-stream.crackstreams.biz
sport_leagues = ["nba", "nfl", "ufc", "f1", "premier-league", "champions-league", "ipl-live"]
sport_actions = ["free-stream", "live-stream", "watch-online", "crackstreams", "buffstreams", "totalsportek"]
sport_tlds = [".biz", ".me", ".tv", ".sx", ".xyz", ".club"]

for _ in range(2500):
    league = random.choice(sport_leagues)
    action = random.choice(sport_actions)
    tld = random.choice(sport_tlds)
    
    # e.g. nba-live-stream-free-watch.me
    url = f"http://{league}-{action}-hd{random.randint(1,99)}{tld}"
    urls.append(url)

# Section 27: Niche Streaming (Asian Drama, Cartoons, Reality TV)
# e.g. dramacool-watch-kdrama-online.vc
niche_genres = ["dramacool", "kissasian", "cartoons-on", "reality-tv-free", "soap-opera-daily"]
niche_actions = ["eng-sub", "watch-raw", "full-episode", "season-finale"]
niche_tlds = [".vc", ".se", ".io", ".la", ".sh"]

for _ in range(2500):
    genre = random.choice(niche_genres)
    action = random.choice(niche_actions)
    tld = random.choice(niche_tlds)
    
    # e.g. kissasian-watch-kdrama-eng-sub.vc
    url = f"http://{genre}-{action}-online{tld}"
    
    if random.random() > 0.5:
        url += "/server-1/play.php"
        
    urls.append(url)

# Section 28: Adult Content / Pornography / Malvertising Nodes
# e.g. best-free-porn-videos-hd.xxx
adult_keywords = ["porn", "sex", "xxx", "nude", "hardcore", "hentai", "cam-girl", "adult-dating"]
adult_actions = ["watch-free", "live-chat", "full-video", "gallery", "download", "private-show"]
adult_tlds = [".xxx", ".adult", ".sex", ".porn", ".webcam", ".cam", ".adult"]

for _ in range(3000):
    kw = random.choice(adult_keywords)
    action = random.choice(adult_actions)
    tld = random.choice(adult_tlds)
    
    # e.g. watch-free-porn-live-chat.xxx
    url = f"http://{action}-{kw}-{random.randint(18,99)}{tld}"
    urls.append(url)

# Section 29: Adult Dating / Hookup Scams (Bot driven)
# e.g. meet-local-singles-tonight.club
date_actions = ["meet", "hookup", "date", "find", "chat", "match"]
date_targets = ["locals", "singles", "milfs", "teens", "neighbors"]
date_tlds = [".club", ".date", ".love", ".xyz", ".top"]

for _ in range(2000):
    action = random.choice(date_actions)
    target = random.choice(date_targets)
    tld = random.choice(date_tlds)
    
    # e.g. meet-local-milfs-tonight-free.club
    url = f"http://{action}-{target}-tonight-free{tld}"
    
    if random.random() > 0.5:
        url += "/register?click_id=" + str(random.randint(100000,999999))
        
    urls.append(url)

# Section 30: Investment / Ponzi / High-Yield Scams
# e.g. double-your-bitcoin-in-24h.site
invest_actions = ["double", "multiply", "invest", "earn", "profit", "grow"]
invest_targets = ["bitcoin", "money", "capital", "forex", "wealth", "crypto"]
invest_promises = ["24h", "daily", "guaranteed", "instant", "risk-free", "100x"]
invest_tlds = [".site", ".online", ".pro", ".capital", ".investment", ".xyz"]

for _ in range(2000):
    action = random.choice(invest_actions)
    target = random.choice(invest_targets)
    promise = random.choice(invest_promises)
    tld = random.choice(invest_tlds)
    
    # e.g. double-your-bitcoin-guaranteed-24h.site
    url = f"http://{action}-your-{target}-{promise}{tld}"
    urls.append(url)

# Section 31: Money Generators / Cash App Hacks
# e.g. free-cash-app-money-generator-v2.top
gen_services = ["cash-app", "paypal", "venmo", "fortnite-vbucks", "roblox-robux"]
gen_types = ["generator", "adder", "hack", "glitch", "injector", "money-maker"]
gen_tlds = [".top", ".gq", ".tk", ".ml", ".ga", ".cf"] # Freenom TLDs are common here

for _ in range(1500):
    service = random.choice(gen_services)
    type_ = random.choice(gen_types)
    tld = random.choice(gen_tlds)
    
    # e.g. cash-app-money-glitch-working.tk
    url = f"http://{service}-{type_}-working-no-survey{tld}"
    urls.append(url)

# Section 32: Fake Grants / Relief Funds
# e.g. un-covid-relief-fund-claim.org
orgs = ["un", "who", "imf", "world-bank", "government", "facebook-lottery", "google-award"]
funds = ["relief-fund", "grant", "subsidy", "aid-program", "business-loan", "compensation"]

for _ in range(1500):
    org = random.choice(orgs)
    fund = random.choice(funds)
    tld = random.choice([".org", ".net", ".info", ".claim", ".fund"])
    
    # e.g. who-relief-fund-approved-claim.info
    url = f"http://{org}-{fund}-approved-claim{tld}"
    urls.append(url)

    urls.append(url)

# Section 36: Limited Edition Sneaker / Streetwear Scams
# e.g. yeezy-supply-limited-drop.art
street_brands = ["yeezy", "supreme", "off-white", "travis-scott", "jordan-1", "dunk-low"]
street_actions = ["supply", "drop", "raffle", "limited", "early-access", "restock"]
street_tlds = [".art", ".club", ".limited", ".shoes", ".run"]

for _ in range(2000):
    brand = random.choice(street_brands)
    action = random.choice(street_actions)
    tld = random.choice(street_tlds)
    
    # e.g. supreme-early-access-drop.art
    url = f"http://{brand}-{action}-{random.randint(2024,2025)}{tld}"
    urls.append(url)

# Section 37: Puppy / Pet Scams (Heartstring fraud)
# e.g. cute-golden-retriever-puppies-cheap.net
pets = ["golden-retriever", "french-bulldog", "poodle", "mainecoon", "bengal-kitten"]
pet_pitch = ["cute", "cheap", "adoption", "puppies", "kittens", "home-raised"]
pet_tlds = [".net", ".org", ".info", ".pet", ".love"]

for _ in range(1500):
    pet = random.choice(pets)
    pitch = random.choice(pet_pitch)
    tld = random.choice(pet_tlds)
    
    # e.g. home-raised-french-bulldog-puppies.pet
    url = f"http://{pitch}-{pet}-available-now{tld}"
    urls.append(url)

# Section 38: Cheap Gaming Keys / Digital Goods
# e.g. cheap-steam-keys-global.gq
game_items = ["steam-keys", "fortnite-skins", "valorant-points", "roblox-robux", "cod-points"]
game_pitch = ["cheap", "free", "instant", "global", "unlocked", "generator"]
game_tlds = [".gq", ".ga", ".cf", ".ml", ".tk", ".fun"]

for _ in range(1500):
    item = random.choice(game_items)
    pitch = random.choice(game_pitch)
    tld = random.choice(game_tlds)
    
    # e.g. instant-valorant-points-generator.fun
    url = f"http://{pitch}-{item}-delivery{tld}"
    urls.append(url)

    urls.append(url)

# Section 39: Fake Power Tool Sets (Facebook Dad Scams)
# e.g. dewalt-drill-set-clearance-sale.site
tool_brands = ["dewalt", "milwaukee", "makita", "bosch", "ryobi", "snap-on"]
tool_items = ["drill-set", "socket-set", "combo-kit", "impact-driver", "toolbox"]
tool_tlds = [".site", ".store", ".shop", ".online", ".club"]

for _ in range(2000):
    brand = random.choice(tool_brands)
    item = random.choice(tool_items)
    tld = random.choice(tool_tlds)
    
    # e.g. milwaukee-combo-kit-90-off.store
    url = f"http://{brand}-{item}-clearance-sale{tld}"
    
    if random.random() > 0.5:
        url += "/products/mystery-box"
        
    urls.append(url)

# Section 40: Fake Outdoor / Camping Gear
# e.g. yeti-coolers-warehouse-outlet.shop
camp_brands = ["yeti", "north-face", "patagonia", "arcteryx", "columbia", "weber"]
camp_items = ["cooler", "jacket", "tent", "grill", "backpack"]
camp_tlds = [".shop", ".outlet", ".store", ".best", ".top"]

for _ in range(1500):
    brand = random.choice(camp_brands)
    item = random.choice(camp_items)
    tld = random.choice(camp_tlds)
    
    # e.g. north-face-jacket-outlet-store.shop
    url = f"http://{brand}-{item}-official-outlet{tld}"
    urls.append(url)

# Section 41: Miracle Home Appliances
# e.g. dyson-vacuum-99-dollar-sale.xyz
home_brands = ["dyson", "kitchenaid", "vitamix", "le-creuset", "irobot", "shark"]
home_items = ["vacuum", "mixer", "blender", "cookware", "roomba", "air-purifier"]

for _ in range(1500):
    brand = random.choice(home_brands)
    item = random.choice(home_items)
    tld = random.choice([".xyz", ".club", ".site", ".online"])
    
    # e.g. dyson-vacuum-clearance-event.xyz
    url = f"https://{brand}-{item}-warehouse-deal{random.randint(10,99)}{tld}"
    urls.append(url)

    urls.append(url)

# Section 42: Subdomain TLD Masquerading (DNS Spoofing Simulation)
# e.g. www.paypal.com.account-security-alert.net
spoof_targets = ["paypal.com", "google.com", "apple.com", "microsoft.com", "chase.com", "netflix.com"]
spoof_suffixes = ["account-security", "login-verify", "update-required", "secure-auth", "billing-error"]
spoof_tlds = [".net", ".info", ".biz", ".org", ".com"]

for _ in range(2000):
    target = random.choice(spoof_targets)
    suffix = random.choice(spoof_suffixes)
    tld = random.choice(spoof_tlds)
    
    # e.g. www.google.com.login-verify.info (User stops reading after .com)
    url = f"http://www.{target}.{suffix}{tld}"
    urls.append(url)

# Section 43: Infrastructure / SSL / DNS Panic
# e.g. ssl-certificate-expired-renew-immediately.com
infra_terms = ["ssl-certificate", "dns-resolution", "firewall-block", "server-error", "domain-expired"]
infra_actions = ["renew", "update", "verify", "restore", "unlock"]
infra_tlds = [".com", ".net", ".site", ".support", ".admin"]

for _ in range(1500):
    term = random.choice(infra_terms)
    action = random.choice(infra_actions)
    tld = random.choice(infra_tlds)
    
    # e.g. firewall-block-verify-ip.admin
    url = f"https://{term}-{action}-immediately{tld}"
    urls.append(url)

# Section 44: ISP / Router Phishing (MitM Pretext)
# e.g. xfinity-router-firmware-update-required.net
isp_brands = ["xfinity", "att", "verizon", "spectrum", "bt-internet", "virgin-media"]
router_actions = ["router-update", "firmware-upgrade", "billing-suspended", "bandwidth-limit", "security-notice"]

for _ in range(1500):
    isp = random.choice(isp_brands)
    action = random.choice(router_actions)
    tld = random.choice([".net", ".org", ".info", ".service"])
    
    # e.g. att-fiber-security-notice.service
    url = f"http://{isp}-{action}-urgent{tld}"
    urls.append(url)

    urls.append(url)

# Section 45: Fake VPN / Proxy Services (Man-in-the-Middle)
# e.g. nordvpn-free-premium-account-generator.xyz
vpn_brands = ["nordvpn", "expressvpn", "surfshark", "protonvpn", "cyberghost"]
vpn_actions = ["free-account", "premium-crack", "unblock-netflix", "anonymous-browse", "lifetime-license"]
vpn_tlds = [".xyz", ".vpn", ".proxy", ".site", ".world"]

for _ in range(2000):
    brand = random.choice(vpn_brands)
    action = random.choice(vpn_actions)
    tld = random.choice(vpn_tlds)
    
    # e.g. expressvpn-lifetime-license-hack.world
    url = f"http://{brand}-{action}-secure{tld}"
    urls.append(url)

# Section 46: Fake Network Admin / Intranet Portals
# e.g. corporation-intranet-login-sso.net
net_types = ["intranet", "cpanel", "whm", "webmail", "employee-portal", "sso-login", "vpn-access"]
net_prefixes = ["corp", "staff", "admin", "secure", "internal"]
net_tlds = [".net", ".biz", ".tech", ".admin"]

for _ in range(1500):
    type_ = random.choice(net_types)
    prefix = random.choice(net_prefixes)
    tld = random.choice(net_tlds)
    
    # e.g. corp-employee-portal-sso-login.net
    url = f"https://{prefix}-{type_}-auth-v2{tld}"
    
    if random.random() > 0.5:
        url += "/login.php?redirect=/admin"
        
    urls.append(url)

# Section 47: AI / Deepfake / Voice Cloning Fraud
# e.g. deepfake-voice-generator-celebrity-free.ai
ai_terms = ["deepfake", "voice-clone", "undress-ai", "face-swap", "celebrity-fake", "ai-generator"]
ai_targets = ["taylor-swift", "elon-musk", "celebrity", "friend", "girl"]
ai_tlds = [".ai", ".io", ".app", ".fake", ".tech"]

for _ in range(1500):
    term = random.choice(ai_terms)
    target = random.choice(ai_targets)
    tld = random.choice(ai_tlds)
    
    # e.g. undress-ai-celebrity-fake-app.io
    url = f"http://{term}-{target}-free-tool{tld}"
    urls.append(url)

    urls.append(url)

# Section 48: Social Media DNS Spoofing / Account Takeover
# e.g. www.facebook.com-login-verify.site
social_targets = ["facebook.com", "instagram.com", "tiktok.com", "twitter.com", "linkedin.com", "snapchat.com"]
social_actions = ["login-verify", "recover-account", "copyright-appeal", "badge-verification", "security-check"]
social_tlds = [".site", ".top", ".info", ".net", ".xyz"]

for _ in range(2000):
    target = random.choice(social_targets)
    action = random.choice(social_actions)
    tld = random.choice(social_tlds)
    
    # e.g. www.instagram.com-copyright-appeal.site (Hyphenated TLD spoof)
    url = f"http://www.{target}-{action}{tld}"
    urls.append(url)

# Section 49: Big Tech / Cloud Account Spoofing
# e.g. apple-id.com-support-alert.net
tech_targets = ["apple-id", "google-account", "microsoft-online", "amazon-security", "icloud-find"]
tech_actions = ["locked", "disabled", "sign-in-attempt", "gps-location", "billing-failed"]
tech_tlds = [".net", ".org", ".co", ".support", ".gq"]

for _ in range(1500):
    target = random.choice(tech_targets)
    action = random.choice(tech_actions)
    tld = random.choice(tech_tlds)
    
    # e.g. apple-id.com-locked-reason-2024.net
    url = f"https://{target}.com-{action}-fix{tld}"
    
    if random.random() > 0.5:
        url += "/secure/auth.html"
        
    urls.append(url)

# Section 50: Major Bank DNS / Login Spoofing
# e.g. chase.com.online-banking-secure.login.web.app
bank_targets = ["chase.com", "wellsfargo.com", "boa.com", "citi.com", "hsbc.com", "usbank.com"]
bank_subs = ["online-banking", "secure-login", "fraud-alert", "manage-account", "verify-identity"]
bank_hosts = ["web.app", "pages.dev", "netlify.app", "firebaseapp.com"]  # Hosting abuse

for _ in range(1500):
    target = random.choice(bank_targets)
    sub = random.choice(bank_subs)
    host = random.choice(bank_hosts)
    
    # e.g. chase.com.online-banking-secure.web.app (Subdomain layering)
    url = f"https://{target}.{sub}.{host}"
    urls.append(url)

# Section 51: Famous News, Search, Streaming & E‑Commerce DNS Spoofing
# e.g. www.nytimes.com-security-alert.org
news_sites = ["nytimes.com", "washingtonpost.com", "theguardian.com", "bbc.co.uk", "cnn.com"]
search_sites = ["google.com", "bing.com", "duckduckgo.com", "yahoo.com", "baidu.com"]
stream_sites = ["netflix.com", "hulu.com", "primevideo.com", "disneyplus.com", "spotify.com"]
ecom_sites = ["amazon.com", "ebay.com", "aliexpress.com", "shopify.com", "walmart.com"]
spoof_actions = ["login-verify", "account-alert", "security-update", "password-reset", "billing-issue"]
spoof_tlds = [".org", ".net", ".info", ".biz", ".co"]

# News site spoofing
for _ in range(1250):
    site = random.choice(news_sites)
    action = random.choice(spoof_actions)
    tld = random.choice(spoof_tlds)
    url = f"http://www.{site}-{action}{tld}"
    urls.append(url)

# Search engine spoofing
for _ in range(1250):
    site = random.choice(search_sites)
    action = random.choice(spoof_actions)
    tld = random.choice(spoof_tlds)
    url = f"http://{site}-{action}{tld}"
    urls.append(url)

# Streaming service spoofing
for _ in range(1250):
    site = random.choice(stream_sites)
    action = random.choice(spoof_actions)
    tld = random.choice(spoof_tlds)
    url = f"https://{site}-{action}{tld}"
    urls.append(url)

# E‑Commerce spoofing
for _ in range(1250):
    site = random.choice(ecom_sites)
    action = random.choice(spoof_actions)
    tld = random.choice(spoof_tlds)
    url = f"https://{site}-{action}{tld}"
    urls.append(url)

# Create DataFrame
df = pd.DataFrame({
    'url': urls,
    'urgency': 1,
    'authority': 0,
    'fear': 1,
    'impersonation': 1
})

output_path = "ext_data/risky_urls.csv"
df.to_csv(output_path, index=False)

print(f"✅ Generated {len(df)} Risky URLs.")
print(f"💾 Saved to {output_path}")
