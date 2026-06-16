# Attack #4 — MITM (Man-in-the-Middle) — LogiXair

The Next.js dashboard normally talks to Firebase Auth + Firestore over
HTTPS, but the **browser ↔ dev server** channel on `localhost:3000` is
plain HTTP. That means:

- Firebase ID tokens stored in `localStorage` are loaded into the page over
  unencrypted HTTP.
- The page HTML (including dashboard routes, station data already
  hydrated from Firestore, and any analyst report) is in the clear.
- A LAN attacker (rogue AP, ARP-spoof MITM, malicious proxy) sees every
  rendered byte and can also inject script into the response.

This demo flips the dev server to HTTPS and proves the difference in
Wireshark.

---

## 0. Prep

```powershell
choco install wireshark        # if needed
```

In Wireshark pick the **Adapter for loopback traffic capture** (Npcap) so
localhost packets are visible.

---

## BEFORE — plain HTTP

```powershell
cd C:\Users\vssva\OneDrive\Desktop\LogiXair
npm run dev
```

Open `http://localhost:3000`, log in.

- The Navbar TLS badge shows **red "Plain HTTP"** with a broken-shield icon.
  **Screenshot the dashboard.**
- Wireshark filter: `tcp.port == 3000 and http`
- Capture a request → click any GET for the dashboard route → **Follow → HTTP Stream**.
  You will see fully readable HTML, station JSON, the `__session` cookie
  if present, and the page contents. **Screenshot the stream.**

---

## AFTER — HTTPS (Next.js built-in self-signed cert)

```powershell
npm run dev:https
```

Next.js auto-generates a self-signed cert via mkcert on first run; accept
the browser warning once (Advanced → Proceed to localhost). The URL bar
will show `https://localhost:3000`.

- The Navbar TLS badge flips to **green "TLS Secured"** with a lock icon.
  **Screenshot the dashboard.**
- Wireshark filter: `tcp.port == 3000`
- Same capture now shows only TCP handshake + `Client Hello` → `Server Hello`
  → `Application Data` (encrypted TLS records). No readable HTML, no cookies.
  **Screenshot the encrypted capture.**
- F12 → Network → any document request → **Response Headers** — confirm:
  - `Strict-Transport-Security: max-age=31536000; includeSubDomains`
  - `Content-Security-Policy: ...; frame-ancestors 'none'; ...`
  - `X-Content-Type-Options: nosniff`
  **Screenshot the headers panel.**

---

## Justification card (for the report)

### Before — technical risks
- Dev server bound to plain HTTP on `:3000` — entire page payload (HTML,
  hydrated Firestore data, scripts) readable on the LAN.
- Firebase ID tokens persisted in `localStorage` are exposed any time a
  page is reloaded over HTTP (initial HTML is sniffable, even though the
  later XHRs to `*.firebaseio.com` are themselves TLS).
- A LAN attacker on the same WiFi (rogue AP, ARP spoof, captive portal)
  can read every dashboard view and inject `<script>` into the response.
- HSTS headers set by `next.config.ts` are useless because the browser
  never sees them — they require an HTTPS connection to be remembered.

### After — technical controls
- **TLS on the dev server** (`next dev --experimental-https`) — Next.js
  auto-issues a self-signed cert; channel encrypted with TLS 1.3.
- **HSTS now active** — `Strict-Transport-Security: max-age=31536000;
  includeSubDomains` is honoured by the browser, locking this origin to
  HTTPS for a year.
- **CSP `frame-ancestors 'none'`** (from Attack #3) prevents the attacker
  from re-presenting our origin inside an iframe even after MITM injection.
- **On-screen indicator** — Navbar badge reads
  `window.location.protocol` so the operator can confirm transport at a
  glance during demos and field deployment.
- For production deploy: terminate TLS at a reverse proxy (Nginx /
  Cloudflare) with a real CA cert; the `dev:https` script proves the
  app code is already TLS-ready.
