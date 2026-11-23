# SALU Solutions website (www.salu.co.tz)

Static HTML/CSS/JS site plus one Vercel Function (`api/contact.js`) that emails the "Start a project" form to sales@salu.co.tz.

## Deploy on Vercel
1. Import this repo in Vercel (Framework preset: **Other**, no build command, output directory: root).
2. Settings > Environment Variables (Production and Preview):

| Name | Value |
|---|---|
| `SMTP_HOST` | `server22.tanzaniaservers.com` |
| `SMTP_PORT` | `465` |
| `SMTP_USER` | `sales@salu.co.tz` |
| `SMTP_PASS` | the sales@ mailbox password (never commit it) |
| `MAIL_TO` | `sales@salu.co.tz` (optional) |

3. Redeploy after adding the variables. If the mailbox password changes, update `SMTP_PASS` and redeploy.

## Editing pages
Edit `_src/pages/*.html` (shared header/footer in `_src/build.py`), then run `python3 _src/build.py`. `_src` is not deployed (`.vercelignore`).
