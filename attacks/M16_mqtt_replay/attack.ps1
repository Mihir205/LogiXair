# Attack M16 — MQTT Replay
#
# Sends the SAME payload twice in quick succession with the same
# (device_id, nonce) tuple. The MQTT-side replay guard caches the
# tuple for MQTT_REPLAY_WINDOW_SEC (60s) and rejects the second hit.
#
# Toggle under test:
#   app/api/emqx-webhook/route.ts  ->  MQTT_REPLAY_GUARD_ENABLED
#
# Expected:
#   BEFORE (guard=false): both POSTs accepted (HTTP 200)
#   AFTER  (guard=true):  1st accepted (HTTP 200), 2nd rejected (HTTP 409)

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

# Same timestamp + same nonce for both sends = textbook replay.
$ts = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
$nonce = Get-Random -Maximum 1000000000

$psk = "mqtt-psk-STATION-ATTACK-DEMO-94e1c20fb7"

function Send-Payload {
    param([int]$Attempt)
    # Include encrypted/iv/ciphertext fields so AES guard passes; the
    # only guard we're testing here is the replay (duplicate ts+nonce).
    $payload = @{
        device_id   = "STATION-ATTACK-DEMO"
        temperature = 25
        humidity    = 60
        timestamp   = $ts
        nonce       = $nonce
        encrypted   = $true
        iv          = "00112233445566778899aabbccddeeff"
        ciphertext  = "deadbeefcafef00d"
    } | ConvertTo-Json -Compress

    # Webhook signature (for M11 guard).
    $h1 = New-Object System.Security.Cryptography.HMACSHA256
    $h1.Key = [Text.Encoding]::UTF8.GetBytes($Secret)
    $sigHex = ($h1.ComputeHash([Text.Encoding]::UTF8.GetBytes($payload)) | ForEach-Object { $_.ToString("x2") }) -join ""

    # Per-device MIC (for M17 HMAC guard).
    $h2 = New-Object System.Security.Cryptography.HMACSHA256
    $h2.Key = [Text.Encoding]::UTF8.GetBytes($psk)
    $micHex = ($h2.ComputeHash([Text.Encoding]::UTF8.GetBytes($payload)) | ForEach-Object { $_.ToString("x2") }) -join ""

    Write-Host "→ Attempt $Attempt  (ts=$ts, nonce=$nonce)" -ForegroundColor Cyan
    try {
        $resp = Invoke-WebRequest `
            -Uri "$HostUrl/api/emqx-webhook" `
            -Method POST `
            -ContentType "application/json" `
            -Headers @{ "x-emqx-signature" = "sha256=$sigHex"; "x-mqtt-mic" = $micHex } `
            -Body $payload `
            -SkipCertificateCheck `
            -ErrorAction Stop
        Write-Host "  HTTP $($resp.StatusCode) $($resp.Content)" -ForegroundColor Green
        return $resp.StatusCode
    } catch {
        $code = $_.Exception.Response.StatusCode.value__
        $body = if ($_.ErrorDetails) { $_.ErrorDetails.Message } else { $_.Exception.Message }
        Write-Host "  HTTP $code $body" -ForegroundColor Yellow
        return $code
    }
}

$first  = Send-Payload -Attempt 1
$second = Send-Payload -Attempt 2

Write-Host ""
if ($first -eq 200 -and $second -eq 200) {
    Write-Host "VULNERABILITY EXPLOITED — replay accepted, duplicate persisted." -ForegroundColor Red
} elseif ($first -eq 200 -and $second -eq 409) {
    Write-Host "ATTACK BLOCKED — replay guard rejected the duplicate." -ForegroundColor Green
} else {
    Write-Host "UNEXPECTED — first=$first second=$second" -ForegroundColor Magenta
}
