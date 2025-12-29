import pandas as pd
import random

# Domains that are definitely SAFE but look COMPLEX (dots, subdomains, login keywords)
# These confuse the model, so we need to teach it they are safe.
safe_domains = [
    "google.com", "google.co.uk", "google.co.in", "blog.google", "store.google", "about.google",
    "amazon.com", "aws.amazon.com", "sellercentral.amazon.com",
    "oracle.com", "cloud.oracle.com", "support.oracle.com", "developer.oracle.com",
    "brave.com", "search.brave.com", "talk.brave.com", "status.brave.app",
    "jpmorgan.com", "jpmorganchase.com", "chase.com", 
    "microsoft.com", "azure.microsoft.com", "login.microsoftonline.com",
    "apple.com", "support.apple.com", "icloud.com",
    "deepseek.com", "chat.deepseek.com", "openai.com", "chatgpt.com",
    "github.com", "raw.githubusercontent.com", "gist.github.com",
    "stackoverflow.com", "reddit.com", "linkedin.com", "netflix.com",
    "spotify.com", "adobe.com", "salesforce.com", "slack.com", "zoom.us",
    # 2000+ NEW additions (SaaS, Corp, Social)
    "dropbox.com", "box.com", "atlassian.net", "jira.com", "confluence.com",
    "servicenow.com", "workday.com", "okta.com", "docusign.com",
    "teamviewer.com", "webex.com", "goto.com",
    "shopify.com", "wix.com", "squarespace.com", "wordpress.com",
    "tumblr.com", "medium.com", "pinterest.com", "flickr.com",
    "vimeo.com", "dailymotion.com", "twitch.tv", "discord.com",
    "telegram.org", "whatsapp.com", "signal.org",
    "trello.com", "asana.com", "monday.com", "clickup.com",
    "notion.so", "figma.com", "canva.com", "miro.com",
    "hubspot.com", "zendesk.com", "freshdesk.com", "intercom.com",
    "mailchimp.com", "sendgrid.com", "twilio.com", "stripe.com",
    # 2000+ MORE (Universities, Retail, Travel)
    "harvard.edu", "mit.edu", "stanford.edu", "berkeley.edu", "cornell.edu", 
    "ucla.edu", "umich.edu", "nyu.edu", "columbia.edu", "yale.edu",
    "walmart.com", "target.com", "bestbuy.com", "homedepot.com", "costco.com",
    "nike.com", "adidas.com", "zara.com", "hm.com", "ikea.com",
    "booking.com", "expedia.com", "tripadvisor.com", "airbnb.com", "agoda.com",
    "skyscanner.net", "kayak.com", "hotels.com", "vrbo.com",
    "uber.com", "lyft.com", "doordash.com", "grubhub.com", "instacart.com",
    "cnn.com", "bbc.com", "nytimes.com", "washingtonpost.com", "theguardian.com",
    "forbes.com", "bloomberg.com", "reuters.com", "wsj.com", "cnbc.com",
    # 2000+ MORE (Gov, Gaming, Finance)
    "usa.gov", "nhs.uk", "europa.eu", "un.org", "who.int", "nasa.gov",
    "playstation.com", "xbox.com", "steampowered.com", "epicgames.com", "roblox.com",
    "nintendo.com", "ea.com", "ubisoft.com", "activision.com", "blizzard.com",
    "wellsfargo.com", "bankofamerica.com", "capitalone.com", "hsbc.com", "barclays.co.uk",
    "revolut.com", "wise.com", "monzo.com", "paypal.com", "venmo.com",
    "npmjs.com", "pypi.org", "docker.com", "kubernetes.io", "terraform.io",
    "fandom.com", "ign.com", "gamespot.com", "eurogamer.net", "kotaku.com",
    # 2000+ MORE (Airlines, Infrastructure, Media, Regional)
    "delta.com", "united.com", "emirates.com", "lufthansa.com", "britishairways.com",
    "southwest.com", "aa.com", "ryanair.com", "easyjet.com", "qantas.com",
    "cloudflare.com", "fastly.com", "digitalocean.com", "heroku.com", "linode.com",
    "vercel.com", "netlify.com", "mongodb.com", "redis.com", "elastic.co",
    "tesla.com", "samsung.com", "sony.com", "intel.com", "nvidia.com", "amd.com",
    "hulu.com", "disneyplus.com", "paramountplus.com", "hbomax.com", "peacocktv.com",
    "flipkart.com", "snapdeal.com", "myntra.com", "ajio.com", "zomato.com", "swiggy.com",
    "paytm.com", "phonepe.com", "irctc.co.in", "onlinesbi.sbi", "hdfcbank.com", "icicibank.com",
    # 2000+ MORE (Global Uni, Indian Tech, Auto, Freelance)
    "ox.ac.uk", "cam.ac.uk", "ethz.ch", "nus.edu.sg", "ucl.ac.uk", "utoronto.ca",
    "infosys.com", "wipro.com", "tcs.com", "reliance.com", "tata.com", "bhel.in",
    "bookmyshow.com", "makemytrip.com", "cleartrip.com", "ixigo.com", "olx.in",
    "toyota.com", "ford.com", "gm.com", "bmw.com", "mercedes-benz.com", "honda.com",
    "siemens.com", "ge.com", "honeywell.com", "3m.com", "caterpillar.com",
    "fiverr.com", "upwork.com", "freelancer.com", "guru.com", "toptal.com",
    "substack.com", "medium.com", "quora.com", "yelp.com", "tripadvisor.in",
    "puma.com", "reebok.com", "underarmour.com", "sephora.com", "ulta.com", "zappos.com",
    # 2000+ MORE (Banks, Telecom, Logistics, Crypto)
    "citigroup.com", "goldmansachs.com", "morganstanley.com", "axafos.com", "allianz.com",
    "prudential.com", "metlife.com", "berkshirehathaway.com", "ubs.com", "credit-suisse.com",
    "fedex.com", "ups.com", "dhl.com", "usps.com", "royalmail.com", "maersk.com",
    "att.com", "verizon.com", "t-mobile.com", "vodafone.com", "orange.com",
    "jio.com", "airtel.in", "vi.in", "bsnl.co.in", "tatadocomo.com",
    "coinbase.com", "binance.com", "kraken.com", "gemini.com", "crypto.com",
    "godaddy.com", "namecheap.com", "bluehost.com", "hostgator.com", "squarespace.com",
    "olasabs.com", "oyorooms.com", "razorpay.com", "zerodha.com", "groww.in", "upstox.com",
    # 2000+ MORE (Dev, jobs, Health, Real Estate)
    "gitlab.com", "bitbucket.org", "sourceforge.net", "postman.com", "swagger.io",
    "vultr.com", "ovh.com", "hetzner.com", "linode.com", "digitalocean.com",
    "lastpass.com", "1password.com", "authy.com", "dashlane.com", "keepersecurity.com",
    "indeed.com", "glassdoor.com", "monster.com", "naukri.com", "foundit.in",
    "zillow.com", "redfin.com", "trulia.com", "rightmove.co.uk", "99acres.com", "magicbricks.com",
    "webmd.com", "mayoclinic.org", "healthline.com", "nih.gov", "cdc.gov",
    "geico.com", "statefarm.com", "progressive.com", "libertymutual.com", "aig.com",
    "tinder.com", "bumble.com", "match.com", "hinge.co", "shaadi.com", "jeevansathi.com",
    # 2000+ MORE (EdTech, Sports, Luxury, Hardware)
    "coursera.org", "udemy.com", "edx.org", "khanacademy.org", "skillshare.com",
    "pluralsight.com", "udacity.com", "codecademy.com", "byjus.com", "unacademy.com",
    "espn.com", "nba.com", "nfl.com", "fifa.com", "mlb.com", "formula1.com",
    "cricbuzz.com", "espncricinfo.com", "bleacherreport.com", "skysports.com",
    "gucci.com", "louisvuitton.com", "prada.com", "chanel.com", "hermes.com",
    "rolex.com", "cartier.com", "tiffany.com", "burberry.com", "versace.com",
    "starbucks.com", "mcdonalds.com", "dominos.com", "pizzahut.com", "subway.com", "kfc.com",
    "dell.com", "hp.com", "lenovo.com", "asus.com", "acer.com", "logitech.com",
    "canon.com", "nikon.com", "sony.net", "panasonic.com", "lg.com", "whirlpool.com",
    # 2000+ MORE (Car Rental, Global News, Tech News, Tools)
    "hertz.com", "enterprise.com", "avis.com", "budget.com", "sixt.com", "alamo.com",
    "aljazeera.com", "dw.com", "scmp.com", "france24.com", "rt.com", "nhk.or.jp",
    "techcrunch.com", "theverge.com", "wired.com", "arstechnica.com", "engadget.com",
    "cnet.com", "gizmodo.com", "tomshardware.com", "pcgamer.com", "polygon.com",
    "speedtest.net", "archive.org", "weather.com", "accuweather.com", "wunderground.com",
    "imdb.com", "rottentomatoes.com", "metacritic.com", "allrecipes.com", "foodnetwork.com",
    "goodreads.com", "wattpad.com", "scribd.com", "issuu.com", "slideshare.net",
    "wikihow.com", "ehow.com", "answers.com", "investopedia.com", "thebalance.com",
    # 2000+ MORE (Email, Creative, Security, File Sharing, Misc)
    "proton.me", "protonmail.com", "zoho.com", "fastmail.com", "tutanota.com", "aol.com",
    "behance.net", "dribbble.com", "artstation.com", "deviantart.com", "unsplash.com", "pexels.com", "pixabay.com",
    "wetransfer.com", "mediafire.com", "mega.nz", "4shared.com", "zippyshare.com",
    "norton.com", "mcafee.com", "avast.com", "kaspersky.com", "bitdefender.com", "malwarebytes.com",
    "mozilla.org", "opera.com", "vivaldi.com", "brave.com", "torproject.org",
    "eventbrite.com", "meetup.com", "ticketmaster.com", "livenation.com",
    "patreon.com", "ko-fi.com", "buymeacoffee.com", "onlyfans.com", "gumroad.com",
    "itch.io", "gog.com", "humblebundle.com", "nexusmods.com", "curseforge.com",
    # 2000+ MORE (AdTech, Int'l Gov, Non-Profits, Music)
    "doubleclick.net", "googlesyndication.com", "facebook.net", "amazon-adsystem.com",
    "taboola.com", "outbrain.com", "nielsen.com", "comscore.com",
    "canada.ca", "gov.uk", "australia.gov.au", "india.gov.in", "japan.go.jp",
    "redcross.org", "unicef.org", "wwf.org", "amnesty.org", "rotary.org", "change.org",
    "soundcloud.com", "bandcamp.com", "deezer.com", "tidal.com", "mixcloud.com", "pandora.com",
    "readthedocs.io", "gitbook.io", "npm.im", "yarnpkg.com", "caniuse.com",
    "archive.is", "waybackmachine.org", "doi.org", "orcid.org", "researchgate.net",
    # 2000+ MORE (E-commerce, Consulting, Knowledge, Photos)
    "ebay.com", "etsy.com", "alibaba.com", "aliexpress.com", "rakuten.com", "temu.com", "shein.com",
    "accenture.com", "deloitte.com", "pwc.com", "kpmg.com", "ey.com", "mckinsey.com", "bcg.com",
    "w3schools.com", "geeksforgeeks.org", "tutorialspoint.com", "freecodecamp.org", "javatpoint.com",
    "shutterstock.com", "gettyimages.com", "istockphoto.com", "adobe.stock.com", "unsplash.com",
    "imgur.com", "flickr.com", "500px.com", "photobucket.com", "imageshack.com",
    "surveymonkey.com", "typeform.com", "jotform.com", "google.com/forms",
    "skype.com", "messenger.com", "wechat.com", "line.me", "viber.com", "telegram.org",
    # 2000+ MORE (Indian Startups, Global Tech, AI Tools, More Services)
    "zeptonow.com", "blinkit.com", "bigbasket.com", "meesho.com", "nykaa.com", "lenskart.com", "firstcry.com", "urbancompany.com",
    "vmware.com", "citrix.com", "sap.com", "ibm.com", "redhat.com", "ubuntu.com", "debian.org", "archlinux.org",
    "roku.com", "plex.tv", "tubitv.com", "crunchyroll.com", "funimation.com",
    "cash.app", "westernunion.com", "moneygram.com", "transferwise.com",
    "trivago.com", "hotwire.com", "orbitz.com", "priceline.com",
    "grammarly.com", "evernote.com", "quillbot.com", "otter.ai", "jasper.ai", "copy.ai", "notion.so",
    "cloudflare.com", "fastly.com", "vimeo.com",
    # 2000+ MORE (Network Sec, Hosting, Niche Retail, Tech Blogs)
    "cisco.com", "juniper.net", "paloaltonetworks.com", "fortinet.com", "fireeye.com", "crowdstrike.com",
    "ubnt.com", "arista.com", "meraki.com", "netgear.com", "tp-link.com",
    "hostinger.com", "siteground.com", "dreamhost.com", "inmotionhosting.com", "wpengine.com",
    "techradar.com", "zdnet.com", "mashable.com", "venturebeat.com", "thehackernews.com", "bleepingcomputer.com",
    "wayfair.com", "overstock.com", "chewy.com", "newegg.com", "bhphotovideo.com",
    "macys.com", "kohls.com", "nordstrom.com", "gap.com", "hm.com",
    "sweetwater.com", "reverb.com", "guitarcenter.com", "thomann.de",
    # 2000+ MORE (Energy, Pharma, Legal, Global Corp)
    "shell.com", "bp.com", "exxonmobil.com", "chevron.com", "totalenergies.com",
    "pfizer.com", "modernatx.com", "jnj.com", "astrazeneca.com", "novartis.com", "roche.com", "merck.com",
    "lexisnexis.com", "westlaw.com", "legalzoom.com", "findlaw.com", "nolo.com",
    "nestle.com", "unilever.com", "pg.com", "cocacola.com", "pepsico.com",
    "siemens-healthineers.com", "medtronic.com", "philips.com",
    "boeing.com", "airbus.com", "lockheedmartin.com", "northropgrumman.com",
    "cat.com", "johndeere.com", "deere.com", "komatsu.com",
    # 2000+ MORE (Observability, DevOps, Construction, Chemicals, Regional Giants)
    "datadoghq.com", "splunk.com", "newrelic.com", "dynatrace.com", "pagerduty.com", "grafana.com",
    "auth0.com", "pingidentity.com", "cyberark.com", "proofpoint.com", "cloudflare.net",
    "aecom.com", "jacobs.com", "fluor.com", "bechtel.com", "skanska.com",
    "basf.com", "dow.com", "dupont.com", "bayer.com", "syngenta.com",
    "chubb.com", "travelers.com", "aon.com", "marsh.com", "wtwco.com",
    "mercadolibre.com", "shopee.com", "lazada.com", "tokopedia.com", "coupang.com",
    "rakuten.co.jp", "naver.com", "kakao.com",
    "yandex.com", "mail.ru", "vk.com", "weibo.com", "baidu.com",
    "qq.com", "taobao.com", "tmall.com", "jd.com",
    # 2000+ MORE (HR, Marketing, Auto, Regional Streaming/Retail)
    "adp.com", "paychex.com", "paycom.com", "bamboohr.com", "gusto.com", "zenefits.com", "rippling.com",
    "semrush.com", "ahrefs.com", "moz.com", "similarweb.com", "spyfu.com", "mailgun.com",
    "volkswagen.com", "audi.com", "porsche.com", "hyundai.com", "kia.com", "nissan-global.com",
    "hotstar.com", "jiocinema.com", "sonyliv.com", "zee5.com", "voot.com", "mxplayer.in",
    "tatacliq.com", "urbanladder.com", "pepperfry.com", "croma.com", "reliancedigital.in",
    "indiamart.com", "justdial.com", "sulekha.com", "naukri.com", "shadi.com",
    # 3000+ MORE (Hotels, Regional Banking, Global Unis, Fashion)
    "marriott.com", "hilton.com", "hyatt.com", "ihg.com", "accor.com", "wyndham.com", "choicehotels.com",
    "dbs.com.sg", "ocbc.com", "uob.com.sg", "anz.com.au", "nab.com.au", "westpac.com.au", "commbank.com.au",
    "rbc.com", "td.com", "scotiabank.com", "bmo.com", "cibc.com",
    "utexas.edu", "gatech.edu", "uwaterloo.ca", "mcgill.ca", "ubc.ca", "unimelb.edu.au", "sydney.edu.au", "anu.edu.au",
    "uniqlo.com", "asos.com", "zalando.com", "jdsports.com", "decathlon.com", "lululemon.com",
    "gap.com", "bananarepublic.com", "oldnavy.com", "ae.com", "abercrombie.com", "hollisterco.com",
    "booking.com", "agoda.com", "trip.com", "hostelworld.com",
    "slack.com", "discord.com", "zoom.us", "skype.com", "teams.microsoft.com"
]

keywords = [
    "login", "auth", "account", "signin", "dashboard", "billing", 
    "support", "help", "secure", "verify", "update", "mobile", "app"
]

paths = [
    "user", "home", "en-us", "portal", "profile", "settings", "v2", "api", 
    "search", "products", "services", "downloads"
]

urls = []

print("🔨 Generating Hard Negatives (Complex Safe URLs)...")

# 1. Generate Complex Subdomains + Paths
for domain in safe_domains:
    # Base
    urls.append(f"https://{domain}")
    urls.append(f"http://{domain}")
    urls.append(f"https://www.{domain}")
    
    # Keyword Variations (e.g. login.microsoft.com)
    for kw in keywords:
        urls.append(f"https://{kw}.{domain}")
        urls.append(f"https://{domain}/{kw}")
        urls.append(f"https://{domain}/v1/{kw}")
        
    # Deep Paths (e.g. oracle.com/products/cloud/login)
    for p in paths:
        urls.append(f"https://{domain}/{p}")
        urls.append(f"https://{domain}/{p}/index")
        
    # Query Params (e.g. google.com/search?q=login)
    urls.append(f"https://{domain}/search?q=test")
    urls.append(f"https://{domain}/auth?redirect=true")

# 2. Add some "Scary" but Safe URLs (whitelisted patterns essentially)
urls.append("https://accounts.google.com/signin/v2/identifier")
urls.append("https://www.amazon.com/ap/signin")
urls.append("https://login.microsoftonline.com/common/oauth2/authorize")
urls.append("https://www.paypal.com/signin")
urls.append("https://www.netflix.com/login")
urls.append("https://www.linkedin.com/login")

# Shuffle and ensure unique
urls = list(set(urls))
random.shuffle(urls)

# Create DataFrame
df = pd.DataFrame({
    'url': urls,
    'urgency': 0,        # SAFE
    'authority': 0,      # SAFE
    'fear': 0,           # SAFE
    'impersonation': 0   # SAFE
})

output_path = "ext_data/hard_negatives.csv"
df.to_csv(output_path, index=False)

print(f"✅ Generated {len(df)} URLs.")
print(f"💾 Saved to {output_path}")
