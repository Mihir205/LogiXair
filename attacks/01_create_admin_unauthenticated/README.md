# Attack 01 — Unauthenticated Admin Creation

## TL;DR

A single anonymous HTTP POST to `/api/admin/create-user` creates a fully
functional admin account in this project's Firebase tenant. No login. No
token. No CSRF check. The route hands the caller `adminAuth.createUser()`
straight from the firebase-admin SDK.

This is the most severe vulnerability in the LogiXair codebase as of this
audit and is the first slide of the cybersecurity demo.

## Architecture column

Maps to **Column 7 — Cloud Platform (MQTT Broker)** → *Insecure API* on the
threat-model diagram, and **Column 8 — Application** → *Privilege Escalation*.

## Why it works (vulnerable code)

`app/api/admin/create-user/route.ts` *before* the fix:

```ts
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { email, password, role, stations } = body;
        const user = await adminAuth.createUser({ email, password });
        await adminFirestore.collection("users").doc(user.uid).set({
            uid: user.uid, email, role, stations,
            active: true, createdAt: new Date(),
        });
        return NextResponse.json({ success: true });
    } catch (err: any) { ... }
}
```

There is no `verifyIdToken`, no role check, no origin check. The route
trusts the request body verbatim — including the `role` field, which the
attacker sets to `"admin"`.

## Proof of concept

```powershell
.\attacks\01_create_admin_unauthenticated\attack.ps1
```

Expected output before the fix:

```json
{
  "success": true,
  "uid": "T6q...AbCd"
}
```

Then in Firebase Console:

- Authentication → Users: `hacker@evil.com` present
- Firestore → `users/<uid>` → `role: "admin"`

Logging in via the dashboard with those credentials lands on `/admin`.

## Fix

`lib/security/requireAdmin.ts` is a server-side guard that:

1. Pulls the `Authorization: Bearer <ID_TOKEN>` header.
2. Verifies the ID token via `adminAuth.verifyIdToken(idToken, true)` — the
   `true` second argument enables revocation checking, so logged-out or
   password-changed tokens are rejected immediately.
3. Reads `users/{uid}.role` via the admin SDK and confirms `role === "admin"`.
4. Returns a structured `{ caller }` on success or a `NextResponse` 401/403
   on failure.

The patched route calls the guard first, then proceeds:

```ts
const guard = await requireAdmin(req);
if ("error" in guard) return guard.error;
// guard.caller.uid is the verified admin
```

After the fix the attack returns:

```json
{ "success": false, "error": "Missing or malformed Authorization header" }
```

with HTTP `401`.

## Evidence to capture for the PPT

1. **Before** — terminal screenshot of `attack.ps1` returning `success: true`,
   plus Firebase Console showing the new user + admin role.
2. **After** — terminal screenshot of `attack.ps1` returning the 401 error,
   plus the diff of `route.ts` highlighting the new guard call.

Place the screenshots in `security_docs/01_create_admin/before.png` and
`after.png`.

## How to verify the fix manually

The legitimate way to create a user (after the fix) is:

```powershell
# 1. Log in via the dashboard as admin@gmail.com (or your seeded admin)
# 2. In DevTools console:
firebase.auth().currentUser.getIdToken().then(t => copy(t))
# (Token is now in your clipboard.)

# 3. From PowerShell:
$token = "<paste here>"
Invoke-RestMethod -Uri http://localhost:3000/api/admin/create-user `
    -Method POST -ContentType "application/json" `
    -Headers @{ Authorization = "Bearer $token" } `
    -Body (@{ email="legit@x.com"; password="Legit@1234"; role="user"; stations=@() } | ConvertTo-Json)
```

That should return `{ "success": true, "uid": "..." }`.
