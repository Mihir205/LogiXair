# Attack M1 — Anonymous CONNECT (simulator demo)
#
# EMQX Cloud Serverless does not expose allow_anonymous as a runtime
# toggle, so this script targets the simulator endpoint that mirrors
# the broker's decision behind a local code constant.
#
# Toggle under test:
#   app/api/security/sim-mqtt/[id]/route.ts  ->  BROKER_ANON_GUARD_ENABLED
#
# Expected results:
#   BEFORE (BROKER_ANON_GUARD_ENABLED = false): HTTP 200 {"success":true,"blocked":false}
#       -> Firestore mqttAnonConnectAttempts gets a blocked:false doc
#       -> Sentinel: mqtt_anon_connect_accepted (critical)
#   AFTER  (BROKER_ANON_GUARD_ENABLED = true):  HTTP 401 {"success":false,"blocked":true}
#       -> Firestore: blocked:true doc
#       -> Sentinel: mqtt_anon_connect_blocked (info)

param(
    [string]$HostUrl = "https://localhost:3000"
)

$ErrorActionPreference = "Stop"
[System.Net.ServicePointManager]::ServerCertificateValidationCallback = { $true }

$payload = @{
    device_id              = "STATION-ATTACK-DEMO"
    attempted_credentials  = $null
} | ConvertTo-Json -Compress

Write-Host "→ POST $HostUrl/api/security/sim-mqtt/M1  (simulated anonymous CONNECT)" -ForegroundColor Cyan
Write-Host "  body: $payload" -ForegroundColor DarkGray
Write-Host ""

try {
    $resp = Invoke-WebRequest `
        -Uri "$HostUrl/api/security/sim-mqtt/M1" `
        -Method POST `
        -ContentType "application/json" `
        -Body $payload `
        -SkipCertificateCheck `
        -ErrorAction Stop
    Write-Host "HTTP $($resp.StatusCode)" -ForegroundColor Green
    Write-Host $resp.Content
    Write-Host ""
    Write-Host "VULNERABILITY EXPLOITED — simulated broker accepted anonymous CONNECT." -ForegroundColor Red
} catch {
    $code = $_.Exception.Response.StatusCode.value__
    $body = if ($_.ErrorDetails) { $_.ErrorDetails.Message } else { $_.Exception.Message }
    Write-Host "HTTP $code" -ForegroundColor Yellow
    Write-Host $body
    Write-Host ""
    if ($code -eq 401) {
        Write-Host "ATTACK BLOCKED — simulated broker rejected anonymous CONNECT." -ForegroundColor Green
    } else {
        Write-Host "UNEXPECTED — see status code above." -ForegroundColor Magenta
    }
}
