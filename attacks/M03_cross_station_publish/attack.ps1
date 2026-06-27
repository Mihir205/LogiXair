# Attack M3 — Cross-Station Publish / ACL Bypass (simulator demo)
#
# EMQX Cloud Serverless does not expose per-clientid ACL toggling at
# runtime, so this script targets the simulator endpoint that mirrors
# the broker's ACL decision behind a local code constant.
#
# Toggle under test:
#   app/api/security/sim-mqtt/[id]/route.ts  ->  BROKER_CROSS_STATION_ACL_ENABLED
#
# Scenario:
#   acting_clientid = STATION-DEMO01 publishes to stations/STATION-DEMO02/telemetry
#   With ACL enabled: rejected (info event).
#   With ACL disabled: accepted (critical event — DEMO02's data hijacked).

param(
    [string]$HostUrl = "https://localhost:3000"
)

$ErrorActionPreference = "Stop"
[System.Net.ServicePointManager]::ServerCertificateValidationCallback = { $true }

$payload = @{
    acting_clientid = "STATION-DEMO01"
    target_topic    = "stations/STATION-DEMO02/telemetry"
} | ConvertTo-Json -Compress

Write-Host "→ POST $HostUrl/api/security/sim-mqtt/M3  (DEMO01 publishing to DEMO02's topic)" -ForegroundColor Cyan
Write-Host "  body: $payload" -ForegroundColor DarkGray
Write-Host ""

try {
    $resp = Invoke-WebRequest `
        -Uri "$HostUrl/api/security/sim-mqtt/M3" `
        -Method POST `
        -ContentType "application/json" `
        -Body $payload `
        -SkipCertificateCheck `
        -ErrorAction Stop
    Write-Host "HTTP $($resp.StatusCode)" -ForegroundColor Green
    Write-Host $resp.Content
    Write-Host ""
    Write-Host "VULNERABILITY EXPLOITED — simulated ACL allowed cross-station publish." -ForegroundColor Red
} catch {
    $code = $_.Exception.Response.StatusCode.value__
    $body = if ($_.ErrorDetails) { $_.ErrorDetails.Message } else { $_.Exception.Message }
    Write-Host "HTTP $code" -ForegroundColor Yellow
    Write-Host $body
    Write-Host ""
    if ($code -eq 403) {
        Write-Host "ATTACK BLOCKED — simulated ACL rejected cross-station publish." -ForegroundColor Green
    } else {
        Write-Host "UNEXPECTED — see status code above." -ForegroundColor Magenta
    }
}
