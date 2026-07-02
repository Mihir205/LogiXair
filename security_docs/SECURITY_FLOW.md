# LogiXair — End-to-End Security Architecture

Every hop from the physical sensor to the dashboard, the attack surface at
each step, and the defense in place. ✅ = implemented in code & deployed.
⚠️ = requires a one-time action by you (firmware reflash / cloud console).

```
[1] Sensor → [2] ESP32 firmware → [3] Radio (LoRa/WiFi/GSM) →
[4] EMQX broker → [5] Ingest webhook → [6] Firebase → [7] Dashboard
                                                    ↘ [8] ML pipeline
```

---

## [1] Physical sensor (Bresser 5-in-1, BMP280, LDR, INA219)
**Threat:** faulted sensor emits garbage; physical tampering.
- ✅ Dead-feed guard — pipeline skips all-zero readings.
- ✅ Per-sensor bus verification on the Diagnostics page (each sensor must
  report a finite value).
- ✅ Physical-bounds rejection at ingest **and** clamping at the model.

## [2] ESP32 firmware
**Threat:** hardcoded secrets in the binary; unsigned data; insecure TLS.
- ✅ No real secrets committed — credentials are placeholders filled at flash.
- ✅ LoRa node signs each frame (HMAC) with a per-device PSK; the backend
  verifies before storing.
- ⚠️ **`setInsecure()` in `mqtt_direct_node.ino` and `weather_station.ino`
  disables TLS certificate verification (MITM risk).** Fix — pin the broker CA:
  ```cpp
  // Replace:  wifiClient.setInsecure();
  static const char* ISRG_ROOT_X1 = R"EOF(
  -----BEGIN CERTIFICATE-----
  ...ISRG Root X1 (Let's Encrypt) — HiveMQ/EMQX Cloud use LE...
  -----END CERTIFICATE-----
  )EOF";
  wifiClient.setCACert(ISRG_ROOT_X1);
  ```
  Then reflash. This makes the ESP32 verify it is talking to the real broker.

## [3] Radio transport (LoRa / WiFi / GSM)
**Threat:** eavesdropping, frame injection, replay, jamming.
- ✅ MQTT over **TLS (port 8883)** — WiFi + GSM paths encrypt in transit.
- ✅ LoRa frames: HMAC signature (integrity) + AES payload (confidentiality)
  + replay-window/nonce guard — all enforced at `/api/sensors/ingest`.
- ✅ Jamming watchdog (heartbeat tracker) flags silent nodes.

## [4] EMQX broker
**Threat:** anonymous connect, cross-station publish, retained-message poison,
oversized-payload quota drain.
- ✅ Webhook egress is signed (shared token / HMAC).
- ⚠️ **Set these in the EMQX Cloud console** (cannot be done in code):
  - Access Control → Authentication → **disable anonymous connect**.
  - Access Control → Authorization → per-client **topic ACL**
    (`stations/${clientid}/#` only) — blocks cross-station publish.
  - Deployment Settings → **retained = off** on telemetry topics.
  - Deployment Settings → **max packet size = 2 KB** — quota-drain cap.

## [5] Ingest webhook (`/api/emqx-webhook`, `/api/weather-ingest`, `/api/sensors/ingest`)
**Threat:** forged telemetry (data poisoning), oversized payload, replay.
- ✅ **Signature guard ON** — unsigned POSTs rejected 401 + logged.
- ✅ Strict schema + physical-bounds validation.
- ✅ 2 KB payload cap; retained-message reject.
- ✅ Edge rate limiting (240/min ingest tier) + 32 KB body ceiling.
- ✅ `weather-ingest` (legacy) locked behind the same token + validation.

## [6] Firebase (RTDB + Firestore)
**Threat:** unauthorized read/write, role escalation, email enumeration.
- ✅ **RTDB rules**: per-node authenticated reads, **zero client writes**
  (verified live: unauthenticated read/write → Permission denied).
- ✅ **Firestore rules**: least-privilege, role field locked (no self-promote),
  user enumeration blocked, default-deny (verified live).
- ✅ Service-account key gitignored; Cloud Run uses ADC (no baked secret).
- ⚠️ **Enable Firebase App Check** (console + reCAPTCHA) to stop bots calling
  Firebase directly — the last non-code Firebase hardening.

## [7] Dashboard (Next.js)
**Threat:** XSS, clickjacking, MITM, privilege bypass, brute force, DoS.
- ✅ CSP, HSTS, X-Frame-Options DENY, nosniff, Referrer-Policy.
- ✅ Role-based route guards (client) + server-verified role on every
  privileged API route.
- ✅ **Server-side brute-force lockout** (Admin SDK — tamper-proof).
- ✅ Edge rate limiting (auth tier 30/min).
- ✅ API key HTTP-referrer restricted (Google Cloud console).
- ✅ Input sanitization + React auto-escaping.

## [8] ML / DL pipeline
**Threat:** training/validation data poisoning, absurd-input extrapolation,
model/secret theft.
- ✅ Trains on NASA POWER (not attacker-reachable); live data only validates.
- ✅ **Model clamps every input** to physical bounds (defense-in-depth beyond
  the webhook) — poisoned/faulty readings can't drive absurd predictions.
- ✅ No public inference endpoint; pipeline writes via Admin SDK only.
- ✅ Nested date/time audit trail of every reading, prediction, and validation.

---

## Your one-time action checklist (the only non-code items)
1. **Firmware** — replace `setInsecure()` with `setCACert(ISRG_ROOT_X1)` in
   the two sketches, reflash. (Closes MITM on the WiFi node.)
2. **EMQX Cloud console** — the 4 broker settings in [4].
3. **Firebase App Check** — console + reCAPTCHA.

Everything else is implemented, verified, and deployed.
