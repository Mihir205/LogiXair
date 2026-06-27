# Attack M5 — Retained-Message Poisoning (webhook-edge demo)
#
# What this script does:
#   POSTs a forged telemetry payload to /api/emqx-webhook with a VALID
#   HMAC signature (so the M11 guard passes) AND `flags.retain = true`
#   in the body — simulating EMQX rule-engine forwarding a retained
#   message that would otherwise stick on the topic and poison every
#   new subscriber.
#
# Toggle under test:
#   lib -> app/api/emqx-webhook/route.ts  ->  REJECT_RETAINED_ENABLED
#
# Expected results:
#   BEFORE (REJECT_RETAINED_ENABLED = false): HTTP 200 {"success":true}
#       -> Firebase RTDB weather_station receives temperature=666
#       -> Dashboard tile shows 666 deg C
#       -> No sentinel event fired
#   AFTER  (REJECT_RETAINED_ENABLED = true):  HTTP 400 "Retained messages rejected"
#       -> Firebase RTDB unchanged
#       -> Sentinel event: emqx_webhook_retained_dropped (high)
#
# Usage:
#   .\attack.ps1                       # https://localhost:3000, secret read from .env.local
#   .\attack.ps1 -HostUrl https://x    # custom host
#   .\attack.ps1 -Secret "abc..."      # override secret

param(
    [string]$HostUrl = "https://localhost:3000",
    [string]$Secret = $null
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

# ── Build payload with the retain flag ─────────────────────────────
# In-range but tampered — passes validateTelemetry() so the retained-flag
# branch is what's actually being tested, not the bounds check.
$payload = @{
    device_id   = "STATION-ATTACK-DEMO"
    temperature = 66      # extreme but in [-50, 80]
    humidity    = 1
    rainfall    = 499     # in [0, 500]
    receivedAt  = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
    flags       = @{ retain = $true }
} | ConvertTo-Json -Compress

# ── Compute HMAC-SHA256 over the raw body ──────────────────────────
$hmac = New-Object System.Security.Cryptography.HMACSHA256
$hmac.Key = [Text.Encoding]::UTF8.GetBytes($Secret)
$hashBytes = $hmac.ComputeHash([Text.Encoding]::UTF8.GetBytes($payload))
$sigHex = ($hashBytes | ForEach-Object { $_.ToString("x2") }) -join ""
$sigHeader = "sha256=$sigHex"

Write-Host "→ POST $HostUrl/api/emqx-webhook  (valid HMAC + flags.retain=true)" -ForegroundColor Cyan
Write-Host "  body: $payload" -ForegroundColor DarkGray
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
    Write-Host "VULNERABILITY EXPLOITED — retained payload persisted (poisons every new subscriber)." -ForegroundColor Red
} catch {
    $code = $_.Exception.Response.StatusCode.value__
    $body = if ($_.ErrorDetails) { $_.ErrorDetails.Message } else { $_.Exception.Message }
    Write-Host "HTTP $code" -ForegroundColor Yellow
    Write-Host $body
    Write-Host ""
    if ($code -eq 400) {
        Write-Host "ATTACK BLOCKED — retained-message guard rejected." -ForegroundColor Green
    } else {
        Write-Host "UNEXPECTED — see status code above." -ForegroundColor Magenta
    }
}
