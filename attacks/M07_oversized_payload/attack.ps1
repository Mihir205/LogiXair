# Attack M7 — Oversized Payload DoS (webhook-edge demo)
#
# What this script does:
#   POSTs a forged telemetry payload >2 KB to /api/emqx-webhook with a
#   VALID HMAC signature. Without a size cap the route will JSON-parse
#   and persist the bloat into Firebase (taxing Firestore quota /
#   bandwidth). With the cap, the route rejects with HTTP 413 before
#   touching Firebase.
#
# Toggle under test:
#   app/api/emqx-webhook/route.ts  ->  PAYLOAD_SIZE_CAP_ENABLED
#                                    (also: PAYLOAD_SIZE_CAP_BYTES = 2048)
#
# Expected results:
#   BEFORE (PAYLOAD_SIZE_CAP_ENABLED = false): HTTP 200 {"success":true}
#       -> Firebase RTDB weather_station/payload contains 3 KB padding
#       -> No sentinel event fired
#   AFTER  (PAYLOAD_SIZE_CAP_ENABLED = true):  HTTP 413 "Payload too large"
#       -> Firebase RTDB unchanged
#       -> Sentinel event: emqx_webhook_oversized_payload (high)
#
# Usage:
#   .\attack.ps1                       # https://localhost:3000, secret read from .env.local
#   .\attack.ps1 -HostUrl https://x    # custom host
#   .\attack.ps1 -Secret "abc..."      # override secret
#   .\attack.ps1 -PaddingBytes 5000    # tune attack size (default 3000)

param(
    [string]$HostUrl = "https://localhost:3000",
    [string]$Secret = $null,
    [int]$PaddingBytes = 3000
)

$ErrorActionPreference = "Stop"
[System.Net.ServicePointManager]::ServerCertificateValidationCallback = { $true }

# ── Resolve the HMAC secret ────────────────────────────────────────
if (-not $Secret) {
    $envPath = Join-Path $PSScriptRoot "..\..\.env.local"
    if (Test-Path $envPath) {
        $line = Select-String -Path $envPath -Pattern '^EMQX_WEBHOOK_SECRET=' | Select-Object -First 1
        if ($line) {
            $Secret = $line.Line -replace '^EMQX_WEBHOOK_SECRET=', '' -replace '^"', '' -replace '"$', ''
        }
    }
}
if (-not $Secret) {
    Write-Host "ERROR — EMQX_WEBHOOK_SECRET not found in .env.local and not passed via -Secret." -ForegroundColor Red
    exit 1
}

# ── Build oversized payload ────────────────────────────────────────
$padding = "A" * $PaddingBytes
$payload = @{
    device_id   = "STATION-ATTACK-DEMO"
    temperature = 25.5
    humidity    = 60
    rainfall    = 0
    receivedAt  = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
    padding     = $padding   # the bloat
} | ConvertTo-Json -Compress

# ── Compute HMAC-SHA256 ────────────────────────────────────────────
$hmac = New-Object System.Security.Cryptography.HMACSHA256
$hmac.Key = [Text.Encoding]::UTF8.GetBytes($Secret)
$hashBytes = $hmac.ComputeHash([Text.Encoding]::UTF8.GetBytes($payload))
$sigHex = ($hashBytes | ForEach-Object { $_.ToString("x2") }) -join ""
$sigHeader = "sha256=$sigHex"

Write-Host "→ POST $HostUrl/api/emqx-webhook  (valid HMAC, body=$($payload.Length) bytes, cap=2048)" -ForegroundColor Cyan
Write-Host "  x-emqx-signature: $sigHeader" -ForegroundColor DarkGray
Write-Host ""

try {
    $resp = Invoke-WebRequest `
        -Uri "$HostUrl/api/emqx-webhook" `
        -Method POST `
        -ContentType "application/json" `
        -Headers @{ "x-emqx-signature" = $sigHeader } `
        -Body $payload `
        -SkipCertificateCheck `
        -ErrorAction Stop
    Write-Host "HTTP $($resp.StatusCode)" -ForegroundColor Green
    Write-Host $resp.Content
    Write-Host ""
    Write-Host "VULNERABILITY EXPLOITED — $($payload.Length)-byte payload accepted; Firebase write quota wasted." -ForegroundColor Red
} catch {
    $code = $_.Exception.Response.StatusCode.value__
    $body = if ($_.ErrorDetails) { $_.ErrorDetails.Message } else { $_.Exception.Message }
    Write-Host "HTTP $code" -ForegroundColor Yellow
    Write-Host $body
    Write-Host ""
    if ($code -eq 413) {
        Write-Host "ATTACK BLOCKED — payload-size cap rejected." -ForegroundColor Green
    } else {
        Write-Host "UNEXPECTED — see status code above." -ForegroundColor Magenta
    }
}
