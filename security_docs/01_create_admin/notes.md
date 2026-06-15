# Slide notes — Attack 01: Unauthenticated Admin Creation

## Screenshots to capture (drop into this folder)

| File | What it shows |
|---|---|
| `before_attack_terminal.png` | `attack.ps1` output with `success: true` + new UID |
| `before_firebase_auth.png` | Firebase Console → Authentication tab showing `hacker@evil.com` |
| `before_firestore_user.png` | Firestore Console → `users/<uid>` doc with `role: "admin"` |
| `before_dashboard_login.png` | Logging in via dashboard as `hacker@evil.com` → lands on `/admin` |
| `after_attack_terminal.png` | Same `attack.ps1` returning 401 + "Missing or malformed Authorization header" |
| `after_code_diff.png` | Side-by-side: vulnerable `route.ts` vs. patched `route.ts` (guard call highlighted) |

## Slide layout (1 slide, 2 columns)

```
┌──────────────────────────────────────────────────────────────────────┐
│  Attack 01 — Unauthenticated Admin Creation                          │
│  Severity: CRITICAL                                                  │
│  Threat-model column: Cloud / Insecure API + App / Privilege Escal.  │
├─────────────────────────────────┬────────────────────────────────────┤
│              BEFORE             │             AFTER                  │
│  before_attack_terminal.png     │  after_attack_terminal.png         │
│  before_firebase_auth.png       │  after_code_diff.png               │
├─────────────────────────────────┴────────────────────────────────────┤
│  Fix: lib/security/requireAdmin.ts — verifyIdToken + role lookup     │
└──────────────────────────────────────────────────────────────────────┘
```

## Talking points (30-second pitch)

1. "No auth check on a route that creates Firebase users — one curl = admin access."
2. "The fix is a 5-line guard that verifies the Firebase ID token server-side."
3. "Now the same attack returns 401, and the legitimate admin UI still works."

## Cleanup after demo

Delete the attacker account so the dashboard isn't polluted:

```
firebase auth:export users.json --project weather-app-2-920f0
# find the hacker@evil.com UID, then:
firebase auth:delete <UID> --project weather-app-2-920f0
```

Or via the Firebase console UI: Authentication → Users → trash icon.
