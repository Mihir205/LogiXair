# Attack M17 — MQTT Packet Injection (bad per-device HMAC)
#
# Sends a payload with a deliberately wrong x-mqtt-mic header. The MQTT
# HMAC guard recomputes the MAC using the registered per-device PSK and
# rejects on mismatch (with the toggle enabled).
#
# Toggle under test:
#   app/api/emqx-webhook/route.ts  ->  MQTT_HMAC_GUARD_ENABLED
#
# Expected:
#   BEFORE (guard=false): HTTP 200 (bad MIC accepted)
#   AFTER  (guard=true):  HTTP 401 (bad MIC rejected)

param(
    [string]$HostUrl = "https://localhost:3000",
    [string]$Secret = $null
)

$ErrorActionPreference = "Stop"
[System.Net.ServicePointManager]::ServerCertificateValidationCallback = { $true }

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
    Write-Host "ERROR — EMQX_WEBHOOK_SECRET not found." -ForegroundColor Red; exit 1
}

$ts = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
# Include encrypted envelope so AES guard passes; the forged MIC is the
# only thing under test here.
$payload = @{
    device_id   = "STATION-ATTACK-DEMO"
    temperature = 25
    humidity    = 60
    timestamp   = $ts
    nonce       = Get-Random -Maximum 1000000000
    encrypted   = $true
    iv          = "00112233445566778899aabbccddeeff"
    ciphertext  = "deadbeefcafef00d"
} | ConvertTo-Json -Compress

# Webhook signature is REAL (so M11 guard passes), but x-mqtt-mic is forged.
$hmac = New-Object System.Security.Cryptography.HMACSHA256
$hmac.Key = [Text.Encoding]::UTF8.GetBytes($Secret)
$hashBytes = $hmac.ComputeHash([Text.Encoding]::UTF8.GetBytes($payload))
$sigHex = ($hashBytes | ForEach-Object { $_.ToString("x2") }) -join ""

# Deliberately wrong MIC (random hex).
$forgedMic = -join ((1..64) | ForEach-Object { '{0:x}' -f (Get-Random -Maximum 16) })

Write-Host "→ POST $HostUrl/api/emqx-webhook  (valid webhook sig + FORGED x-mqtt-mic)" -ForegroundColor Cyan
Write-Host "  forged mic: $forgedMic" -ForegroundColor DarkGray
Write-Host ""

try {
    $resp = Invoke-WebRequest `
        -Uri "$HostUrl/api/emqx-webhook" `
        -Method POST `
        -ContentType "application/json" `
        -Headers @{ "x-emqx-signature" = "sha256=$sigHex"; "x-mqtt-mic" = $forgedMic } `
        -Body $payload `
        -SkipCertificateCheck `
        -ErrorAction Stop
    Write-Host "HTTP $($resp.StatusCode)" -ForegroundColor Green
    Write-Host $resp.Content
    Write-Host ""
    Write-Host "VULNERABILITY EXPLOITED — forged-MIC payload accepted." -ForegroundColor Red
} catch {
    $code = $_.Exception.Response.StatusCode.value__
    $body = if ($_.ErrorDetails) { $_.ErrorDetails.Message } else { $_.Exception.Message }
    Write-Host "HTTP $code" -ForegroundColor Yellow
    Write-Host $body
    Write-Host ""
    if ($code -eq 401) {
        Write-Host "ATTACK BLOCKED — HMAC guard rejected forged MIC." -ForegroundColor Green
    } else {
        Write-Host "UNEXPECTED — see status code above." -ForegroundColor Magenta
    }
}
