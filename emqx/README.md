# LogiXair EMQX broker — MQTT-only telemetry plane

This is **Step 1** of the MQTT migration. Once the broker is hardened, every
station + gateway publishes via MQTT only (no more HTTP `/sensor/upload`),
and EMQX forwards each message to `/api/emqx-webhook` for ingest.

## What's protected here

| # | Attack | Defense | Where |
|---|---|---|---|
| M1 | Anonymous CONNECT | `allow_anonymous=false` + built-in user DB | `etc/emqx.conf` |
| M2 | CONNECT brute-force | listener `max_conn_rate` | `etc/emqx.conf` |
| M3 | Cross-station publish | per-clientid ACL `stations/${clientid}/#` | `etc/acl.conf` |
| M4 | Wildcard subscribe exfiltration | stations get `deny subscribe #` | `etc/acl.conf` |
| M5 | Retained-message poisoning | `retain_available=false` | `etc/emqx.conf` |
| M7 | Oversized payload DoS | `max_packet_size=2KB` | `etc/emqx.conf` |
| M8 | CONNECT flood | `max_connections` + `max_conn_rate` | `etc/emqx.conf` |
| M10 | LWT abuse on telemetry topic | ACL only allows LWT on `status` topic | `etc/acl.conf` |
| M11 | Webhook spoofing (cloud edge) | HMAC-SHA256 over raw body | `lib/security/emqxWebhookGuard.ts` |

## Quick start

```powershell
# 1. Generate self-signed cert for TLS listener (optional for local dev)
mkdir emqx/certs -ErrorAction SilentlyContinue
openssl req -x509 -newkey rsa:4096 -days 365 -nodes `
    -keyout emqx/certs/server.key -out emqx/certs/server.crt `
    -subj "/CN=localhost"
Copy-Item emqx/certs/server.crt emqx/certs/ca.crt

# 2. Start broker (uses hardened config by default)
docker compose -f emqx/docker-compose.yml up -d

# 3. Provision demo users via the dashboard or CLI
docker exec logixair-emqx emqx ctl users add logixair-backend backend-password
docker exec logixair-emqx emqx ctl users add STATION-DEMO01   station01-password
docker exec logixair-emqx emqx ctl users add STATION-DEMO02   station02-password
docker exec logixair-emqx emqx ctl users add GATEWAY-DEMO01   gateway01-password

# 4. Wire EMQX -> Next.js webhook in the EMQX dashboard:
#    http://localhost:18083  (admin / logixair-change-me-on-first-login)
#    Integration -> Rules -> "Create" -> SQL:
#      SELECT * FROM "stations/+/telemetry"
#    Action -> Webhook:
#      URL: https://host.docker.internal:3000/api/emqx-webhook
#      Headers:
#        Content-Type: application/json
#        x-emqx-signature: sha256=${sign_hmac_sha256(payload,
#          "5ae17a3ca54537e2a892500e06ba4e20def0d43dea15f665d554b4abc5d58351")}
#    (Use the SAME secret as EMQX_WEBHOOK_SECRET in .env.local)

# 5. Start the Next.js dev server (TLS)
npm run dev:https
```

## Before / after demo for each attack

Each attack has a script under `attacks/M*` that returns clear pass/fail
output. The workflow is the same as the existing 10 LogiXair attacks.

### M1 — Anonymous CONNECT

```powershell
# BEFORE
Copy-Item emqx/etc/emqx.conf            emqx/etc/emqx.conf.bak
Copy-Item emqx/etc/emqx.vulnerable.conf emqx/etc/emqx.conf -Force
docker restart logixair-emqx
.\attacks\M01_anonymous_connect\attack.ps1
# -> screenshot RED "VULNERABILITY EXPLOITED"

# AFTER
Copy-Item emqx/etc/emqx.conf.bak emqx/etc/emqx.conf -Force
docker restart logixair-emqx
.\attacks\M01_anonymous_connect\attack.ps1
# -> screenshot GREEN "ATTACK BLOCKED"
```

### M3 — Cross-station publish

Same swap, but run `attacks/M03_cross_station_publish/attack.ps1`.

### M11 — Webhook spoofing

No broker swap needed — just flip the constant in code:

```ts
// lib/security/emqxWebhookGuard.ts:20
export const WEBHOOK_GUARD_ENABLED = false;   // BEFORE — capture exploit screenshot
export const WEBHOOK_GUARD_ENABLED = true;    // AFTER  — capture block screenshot
```

Then run `attacks/M11_webhook_no_signature/attack.ps1` OR click "Run Attack"
on the `#11` card on `/admin/security-demos`.

## Why this slots cleanly into the existing 10 LogiXair attacks

- Same **toggle-constant pattern** (`WEBHOOK_GUARD_ENABLED`,
  `HMAC_GUARD_ENABLED`, `XSS_DEMO_VULNERABLE`, `ADMIN_CREATE_GUARD_ENABLED`).
- Same **toggle-and-rerun** workflow as the other attacks — each MQTT
  attack has a PowerShell script under `attacks/M*` and a one-line code
  or config toggle for before/after capture.
- Same **security-events** Firestore audit log (`logSecurityEvent`) so the
  Live Alerts feed picks up M11 hits automatically.
- The 5 LoRa guards (#6, #7, #8, #9, #10) are **reused** on the MQTT path
  via the new webhook handler — `validateTelemetry` shares the same
  physical bounds as `sensor_schema.py`, `device_id` is checked against
  the same allow-list pattern as `deviceRegistry.ts`.

## What's NOT here yet (Step 2 of the master plan)

- Move `replayGuard`, `hmacGuard`, `aesGuard` calls from the LoRa HTTP path
  onto the MQTT path inside `/api/emqx-webhook`. (Currently the route only
  has signature + bounds; full LoRa crypto chain is one PR away.)
- A7672S `AT+CNMP=38` LTE-only lock (firmware-side).
- ESP32 secure boot + flash encryption (firmware-side).
- Lightweight IDS over `security_events`.
