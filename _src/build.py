"""Assembles the static site: wraps each page in _src/pages with the shared head, header and footer.

Run from anywhere: python3 website/_src/build.py
Edit pages in _src/pages/*.html (first line is a JSON front-matter comment).
"""
import json, os, re

SRC = os.path.dirname(os.path.abspath(__file__))
SITE = os.path.dirname(SRC)
DOMAIN = "https://www.salu.co.tz"

ARROW = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2 8h11M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>'

NAV = [("services.html", "Services"), ("index.html#industries", "Industries"), ("index.html#partners", "Partners"), ("about.html", "About")]

ORG = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "SALU Solutions Limited",
    "url": DOMAIN,
    "logo": f"{DOMAIN}/assets/brand/salu-icon-512.png",
    "slogan": "Keep it running.",
    "description": "Engineering and technology company for power transmission and substations, telecom infrastructure, industrial automation, robotics and mining technology.",
    "email": "sales@salu.co.tz",
    "telephone": ["+255785670976", "+255754710509"],
    "areaServed": "Worldwide",
    "address": {
        "@type": "PostalAddress",
        "streetAddress": "Shule Street, Mbezi Beach",
        "addressLocality": "Dar es Salaam",
        "postalCode": "60201",
        "addressCountry": "TZ",
    },
}


def head(meta):
    path = "" if meta["file"] == "index.html" else meta["file"]
    preload = ('<link rel="preload" as="image" href="assets/video/salu-hero-poster.jpg">\n'
               if meta["file"] == "index.html" else "")
    return f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{meta['title']}</title>
<meta name="description" content="{meta['description']}">{'<meta name="robots" content="noindex">' if meta['file'] == '404.html' else ''}
<meta name="theme-color" content="#061723">
<link rel="canonical" href="{DOMAIN}/{path}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="SALU Solutions Limited">
<meta property="og:title" content="{meta['title']}">
<meta property="og:description" content="{meta['description']}">
<meta property="og:image" content="{DOMAIN}/assets/img/og-image.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:url" content="{DOMAIN}/{path}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{meta['title']}">
<meta name="twitter:description" content="{meta['description']}">
<link rel="icon" href="assets/brand/salu-icon.svg" type="image/svg+xml">
<link rel="icon" href="favicon.ico" sizes="48x48">
<link rel="apple-touch-icon" href="assets/brand/apple-touch-icon.png">
{preload}<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@500&family=IBM+Plex+Sans:wght@400;500;600&family=Saira:wdth,wght@100..125,500..800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="assets/css/style.css">
<script>document.documentElement.classList.add('js')</script>
<script type="application/ld+json">{json.dumps(ORG)}</script>
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
"""


def header(active):
    links = "\n".join(
        f'      <a href="{f}"{" aria-current=\"page\"" if f == active else ""}>{n}</a>' for f, n in NAV
    )
    contact_cur = ' aria-current="page"' if active == "contact.html" else ""
    return f"""<header class="site-header">
  <div class="wrap">
    <a class="brand" href="index.html" aria-label="SALU Solutions home"><img src="assets/brand/salu-lockup-reversed.svg" alt="SALU Solutions Limited" width="144" height="50"></a>
    <button class="menu-btn" aria-expanded="false" aria-controls="nav"><span>Menu</span><i aria-hidden="true"></i></button>
    <nav class="nav" id="nav" aria-label="Main">
{links}
      <a class="btn" href="contact.html"{contact_cur}>Start a project {ARROW}</a>
    </nav>
  </div>
</header>
"""


FOOTER = f"""<footer class="site-footer">
  <div class="wrap">
    <div class="top">
      <div>
        <a class="brand" href="index.html"><img src="assets/brand/salu-lockup-reversed.svg" alt="SALU Solutions Limited" width="220" height="77"></a>
        <p class="tagline">Keep it running.</p>
        <p>Engineering and technology for power networks, telecom infrastructure, automated plants and mines.</p>
      </div>
      <div>
        <h4>Company</h4>
        <ul>
          <li><a href="about.html">About us</a></li>
          <li><a href="index.html#industries">Industries</a></li>
          <li><a href="index.html#partners">Technology partners</a></li>
          <li><a href="contact.html">Start a project</a></li>
          <li><a href="assets/docs/SALU-Solutions-Company-Profile.pdf" download>Company profile (PDF)</a></li>
        </ul>
      </div>
      <div>
        <h4>Services</h4>
        <ul>
          <li><a href="services.html#power">Power transmission</a></li>
          <li><a href="services.html#substations">Substations</a></li>
          <li><a href="services.html#telecom">Telecom infrastructure</a></li>
          <li><a href="services.html#automation">Industrial automation</a></li>
          <li><a href="services.html#robotics">Robotics</a></li>
          <li><a href="services.html#mining">Mining</a></li>
        </ul>
      </div>
      <div>
        <h4>Contact</h4>
        <address>
          <a href="mailto:sales@salu.co.tz">sales@salu.co.tz</a><br>
          <a href="tel:+255785670976">+255 785 670 976</a><br>
          <a href="tel:+255754710509">+255 754 710 509</a><br><br>
          Head office<br>
          Shule Street, Mbezi Beach<br>
          Dar es Salaam 60201, Tanzania
        </address>
      </div>
    </div>
    <div class="bottom">
      <span>© <span data-year>2026</span> SALU Solutions Limited. All rights reserved.</span>
      <span class="mono">Company Reg. No. 211841354</span>
    </div>
  </div>
</footer>
<a class="wa-float" href="https://wa.me/255785670976" target="_blank" rel="noopener" aria-label="Chat with us on WhatsApp: +255 785 670 976"><img src="assets/brand/whatsapp.png" alt="" width="60" height="60"></a>
<script src="assets/js/main.js"></script>
</body>
</html>
"""


def render(path):
    raw = open(path).read()
    m = re.match(r"<!--\s*(\{.*?\})\s*-->\s*", raw, re.S)
    meta = json.loads(m.group(1))
    body = raw[m.end():].replace("{{ARROW}}", ARROW)
    meta["file"] = os.path.basename(path)
    return head(meta) + header(meta["file"]) + body + FOOTER


for name in sorted(os.listdir(os.path.join(SRC, "pages"))):
    if name.endswith(".html"):
        with open(os.path.join(SITE, name), "w") as f:
            f.write(render(os.path.join(SRC, "pages", name)))
        print("built", name)
