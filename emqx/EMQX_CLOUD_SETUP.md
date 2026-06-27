# EMQX Cloud Serverless — LogiXair setup runbook

Your deployment:
- **Address:** `r2c018c1.ala.asia-southeast1.emqxsl.com`
- **MQTT-over-TLS:** `8883`
- **WebSocket-TLS:** `8084`
- **CA cert valid until:** 2031-11-10

Everything below is **click-by-click in the EMQX Cloud dashboard**. Code-side
changes are already done — once you complete this runbook, the attack
runners at `/admin/security-demos` will produce real BEFORE / AFTER
results against your live broker.

---

## Step 0 — Download the CA certificate (one-time)

1. Deployment Overview → **CA Certificate → click the download icon**.
2. Save it as **`emqx/certs/emqxsl-ca.crt`** inside your local LogiXair folder.
   (The path is hardcoded in `.env.local` → `EMQX_BROKER_CA_PATH`.)

---

## Step 1 — Broker hardening (Serverless has limited UI knobs)

EMQX Cloud Serverless **hides the low-level MQTT tunables** that the
self-hosted edition exposes (max_packet_size, retain_available, max_qos).
The Deployment Settings page on Serverless only shows billing + region.

What this means for the demo:

| Setting | Where it lives on Serverless | Our defense |
|---|---|---|
| `allow_anonymous` | Always OFF (platform default) | M1 demo toggles the **authenticator** in Step 2 |
| `max_packet_size` | Fixed ~1 MB (not user-tunable) | M7 defense in `/api/emqx-webhook` → `PAYLOAD_SIZE_CAP_BYTES=2048` |
| `retain_available` | Fixed ON (not user-tunable) | M5 defense in `/api/emqx-webhook` → `REJECT_RETAINED_ENABLED=true` |
| `max_qos` | Fixed (QoS 2 allowed) | Rule-engine SQL filter (Step 4) — `WHERE flags.qos < 2` |
| ACL | Fully configurable | Step 3 |

**So this step is a no-op for you.** Skip to Step 2. The webhook code
defenses for M5 and M7 are already toggleable in
`app/api/emqx-webhook/route.ts` — flip the constants for BEFORE/AFTER
screenshots just like the existing 10 LogiXair attacks.

📸 **Screenshot for the report:** the Deployment Settings page itself —
shows it has no MQTT tunables → documents WHY the M5/M7 defenses live in
the webhook (defense-in-depth narrative).

---

## Step 2 — Create MQTT users (Access Control → Authentication)

Sidebar → **Access Control → Authentication**.

EMQX Cloud Serverless has a built-in **Password-Based** authenticator
already enabled by default — `allow_anonymous=false` is the platform
default. Just create the users:

| Username | Password (generate strong, save somewhere) | Purpose |
|---|---|---|
| `logixair-backend` | run `node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"` | Backend subscriber (READ all topics) |
| `STATION-DEMO01` | same generator | Demo station A |
| `STATION-DEMO02` | same generator | Demo station B |
| `GATEWAY-DEMO01` | same generator | Demo gateway |

**Action:**
1. Click **+ Add User** → enter username + password → save.
2. Repeat for all 4.

**Then update your `.env.local`** with the passwords (replace the
`CHANGE-ME-set-in-emqx-cloud-and-here` strings). Restart `npm run dev:https`.

📸 **Screenshot:** the Users list showing all 4 entries.

---

## Step 3 — Configure ACL (Access Control → Authorization)

Sidebar → **Access Control → Authorization**.

EMQX Cloud Serverless uses **Built-in Database** authorization. Default
action for unmatched topics: **Deny**.

Add these rules (in order — first match wins):

| # | Username / Clientid | Action | Topic | Effect |
|---|---|---|---|---|
| 1 | `logixair-backend` | Subscribe | `stations/+/telemetry` | Allow |
| 2 | `logixair-backend` | Subscribe | `stations/+/status` | Allow |
| 3 | `logixair-backend` | Subscribe | `gateways/+/status` | Allow |
| 4 | `logixair-backend` | Publish | `#` | **Deny** |
| 5 | Clientid pattern `^STATION-.*$` | Publish | `stations/${clientid}/telemetry` | Allow |
| 6 | Clientid pattern `^STATION-.*$` | Publish | `stations/${clientid}/status` | Allow |
| 7 | Clientid pattern `^STATION-.*$` | Subscribe | `#` | **Deny** |
| 8 | Clientid pattern `^GATEWAY-.*$` | Publish | `gateways/${clientid}/status` | Allow |
| 9 | Clientid pattern `^GATEWAY-.*$` | Publish | `stations/+/telemetry` | Allow |
| 10 | Clientid pattern `^GATEWAY-.*$` | Subscribe | `#` | **Deny** |

**Settings → Default Action: Deny.**

📸 **Screenshot:** the full ACL table.

---

## Step 4 — Wire EMQX → LogiXair webhook (Data Integration)

Sidebar → **Data Integration**.

### 4a. Create a Webhook resource
1. Click **+ New Resource** → pick **Webhook**.
2. **URL:** your Next.js endpoint. Three options depending on where dev/prod runs:
   - Local dev with ngrok: `https://<your-ngrok>.ngrok-free.app/api/emqx-webhook`
   - Vercel deploy: `https://logixair.vercel.app/api/emqx-webhook`
   - Direct (only if Next.js is publicly reachable): `https://your-domain/api/emqx-webhook`
3. **Method:** `POST`
4. **Headers (add 2):**
   - `Content-Type` → `application/json`
   - `x-emqx-signature` → `sha256=${sign_hmac_sha256(payload, "5ae17a3ca54537e2a892500e06ba4e20def0d43dea15f665d554b4abc5d58351")}`

   ⚠️ Use the **exact** value of `EMQX_WEBHOOK_SECRET` from your `.env.local`.

5. **Body:** `${payload}` (raw JSON — the signature MUST be over the raw body)
6. **Save** the resource.

### 4b. Create a Rule that fires the webhook
1. **+ New Rule**
2. **SQL:**
   ```sql
   SELECT
     payload  as payload,
     topic    as topic,
     clientid as clientid,
     flags    as flags,     -- needed for M5 retained-message defense
     timestamp as ts
   FROM "stations/+/telemetry"
   ```
3. **Add Action → Webhook → pick the one you just created.**
4. **Save.** Rule should show as `Enabled · 0 success / 0 failed`.

📸 **Screenshot:** the Rule detail page.

---

## Step 5 — Smoke test with EMQX's "Online Test" (sanity check)

Sidebar → **Online Test**.

1. **Subscribe** tab: subscribe to `stations/+/telemetry`.
2. **Publish** tab:
   - Topic: `stations/STATION-DEMO01/telemetry`
   - Payload: `{"device_id":"STATION-DEMO01","temperature":24.5,"humidity":60}`
   - Click **Publish**.
3. The subscriber should show the message.
4. Go to your local `https://localhost:3000` → the live tile should now
   show `24.5°C / 60%` within ~1 second.
5. Go to Firebase Console → Realtime Database → you should see `weather_station/`
   updated with the payload.

📸 **Screenshots (all in this single test):**
- EMQX Online Test pane showing message published
- LogiXair dashboard tile showing the new value
- Firebase RTDB console showing the new record

If any step fails — STOP — and tell me which one. Don't proceed to attacks
yet.

---

## Step 6 — Run the before/after demos

Now you can run each attack twice, capturing the BEFORE / AFTER screenshots.

### M1 — Anonymous CONNECT
- **BEFORE:** EMQX Cloud → Access Control → Authentication → temporarily
  disable the default password-based authenticator (toggle OFF). Save.
  Click **Run Attack #M1** on `/admin/security-demos`. Result: EXPLOITED.
  📸 Screenshot the red card + EMQX dashboard Sessions tab showing the
  anonymous client.
- **AFTER:** Re-enable the authenticator. Save. Click **Run Attack #M1**
  again. Result: BLOCKED.
  📸 Screenshot the green card.

### M3 — Cross-Station Publish
- **BEFORE:** EMQX Cloud → Access Control → Authorization → temporarily
  set **Default Action = Allow** (or remove rules 5–7). Save. Click
  **Run Attack #M3**. Result: EXPLOITED.
  📸 Screenshot card + Firebase RTDB showing STATION-DEMO02 corrupted.
- **AFTER:** Restore Default Action = Deny + rules 5–7. Click again.
  Result: BLOCKED.

### M5 — Retained-Message Poison  *(code-toggle on Serverless)*
- **BEFORE:** Edit `app/api/emqx-webhook/route.ts` →
  `REJECT_RETAINED_ENABLED = false`. Save. Run Attack #M5 → publish the
  poisoned message with retain=true via EMQX Online Test (Publish tab,
  tick Retain). Reconnect a fresh subscriber in Online Test → it
  receives the poisoned payload (`temperature: 666`) instantly.
  📸 Screenshot the live tile showing 666 + Firebase RTDB row.
- **AFTER:** Flip back to `true`. Re-run. Webhook returns 400 + logs
  `emqx_webhook_retained_dropped` to Firestore.
  ⚠️ **Important — configure your EMQX Rule SQL to pass the retain flag:**
  ```sql
  SELECT payload, topic, clientid, flags FROM "stations/+/telemetry"
  ```
  Without `flags` in the SELECT, the webhook can't see retain status.

### M7 — Oversized Payload  *(code-toggle on Serverless)*
- **BEFORE:** Edit `app/api/emqx-webhook/route.ts` →
  `PAYLOAD_SIZE_CAP_ENABLED = false`. Save. Run Attack #M7. Webhook
  accepts the 64 KB payload, writes it to RTDB — burns through the
  Serverless 1 GB/mo traffic quota at scale.
  📸 Screenshot card showing EXPLOITED + EMQX Monitor → Traffic chart.
- **AFTER:** Flip back to `true`. Re-run. Webhook returns HTTP 413
  + logs `emqx_webhook_oversized_payload` to Firestore.

### M11 — Webhook Spoof
*(Code-side only — no broker change.)*
- **BEFORE:** Edit `lib/security/emqxWebhookGuard.ts:20` →
  `WEBHOOK_GUARD_ENABLED = false`. Save. Click **Run Attack #11**.
  Result: EXPLOITED. 📸 Card + Firebase RTDB showing `temperature: 999`.
- **AFTER:** Flip back to `true`. Click again. Result: BLOCKED.

---

## Step 7 — Wire the Sentinel to watch broker-side events (optional polish)

The existing `useSecuritySentinel` hook polls `/api/security/sentinel`
every 30s. Today it scans Firebase for rogue users + rogue LoRa devices.
We can extend it to also count MQTT-side events from `security_events`:

- `mqtt_anon_connect_*`
- `mqtt_cross_station_publish_*`
- `mqtt_oversized_payload_*`
- `mqtt_retained_poison_*`
- `emqx_webhook_unsigned_or_bad_signature`

Tell me when you're ready and I'll wire this — it's a 30-line addition to
the existing sentinel route.

---

## What screenshots to capture for the report (master list)

Per attack: **6 screenshots** that prove BEFORE/AFTER end-to-end.

```
attacks/M01_anonymous_connect/
  ├─ before_terminal_attack.png          # PowerShell run, red "EXPLOITED"
  ├─ before_emqx_sessions.png            # EMQX dashboard → Sessions tab
  ├─ before_dashboard_corrupted.png      # LogiXair live tile showing 999
  ├─ after_terminal_attack.png           # PowerShell run, green "BLOCKED"
  ├─ after_emqx_logs.png                 # EMQX Logs tab showing CONNACK rc=5
  └─ after_security_events.png           # Firestore security_events row
```

Drop them into `attacks/<id>/screenshots/` and they line up with the
existing `before_*` / `after_*` convention in
`security_docs/01_create_admin/notes.md`.

---

## Why this works on the free Serverless plan

| Plan limit | Our usage |
|---|---|
| 1,000 sessions concurrent | <10 (one per attack, short-lived) |
| 1,000 msg/sec TPS | 1–10 msg/sec during demos |
| 1 GB/mo traffic | <100 KB/demo run; the 64 KB M7 oversized test consumes 0.0001% |
| 1M session-minutes/mo | <100 minutes/mo at demo cadence |
| 1M rule actions/mo | 1 rule action per published message |

You're nowhere near any paid threshold. **Don't upgrade.**

When you eventually deploy 50 real stations each publishing every 60 s,
that's `50 × 1440 = 72,000 msg/day = ~2.1 M msg/mo`. Then:
- Rule actions: 2.1M/mo → still under the 1M free if you batch every 2 msg
  in the rule (use `EVERY 2 MESSAGES` SQL window). Or pay $0.30 (1.1M × $0.25/M).
- Traffic: depends on payload size. At 300 B/msg: 630 MB/mo → under 1 GB.

So the pilot → production cost is **~$0–5/mo on EMQX Cloud Serverless**.
That's the right plan to validate on.
