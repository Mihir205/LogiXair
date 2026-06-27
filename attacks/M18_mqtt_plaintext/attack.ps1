# Attack M18 — MQTT Eavesdropping (plaintext payload rejected by policy)
#
# Sends a plaintext sensor payload (no `encrypted: true` envelope). Under
# the AES-required policy, any plaintext payload is considered to have
# been sniffable over the air and is rejected.
#
# Toggle under test:
#   app/api/emqx-webhook/route.ts  ->  MQTT_AES_REQUIRED
#
# Expected:
#   BEFORE (MQTT_AES_REQUIRED = false): HTTP 200 (plaintext accepted; would be sniffable)
#   AFTER  (MQTT_AES_REQUIRED = true):  HTTP 400 (plaintext rejected)

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

# Plaintext payload — note absence of `encrypted: true`, `iv`, `ciphertext`.
$payload = @{
    device_id   = "STATION-ATTACK-DEMO"
    temperature = 25
    humidity    = 60
    timestamp   = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
    nonce       = Get-Random -Maximum 1000000000
} | ConvertTo-Json -Compress

# Webhook signature is real so M11 guard passes — what we're testing
# here is the AES policy, not the webhook signature.
$hmac = New-Object System.Security.Cryptography.HMACSHA256
$hmac.Key = [Text.Encoding]::UTF8.GetBytes($Secret)
$hashBytes = $hmac.ComputeHash([Text.Encoding]::UTF8.GetBytes($payload))
$sigHex = ($hashBytes | ForEach-Object { $_.ToString("x2") }) -join ""

# Provide a valid x-mqtt-mic too so the HMAC guard passes — we want to
# isolate the AES policy as the only thing under test.
$psk = "mqtt-psk-STATION-ATTACK-DEMO-94e1c20fb7"
$h2 = New-Object System.Security.Cryptography.HMACSHA256
$h2.Key = [Text.Encoding]::UTF8.GetBytes($psk)
$mh = $h2.ComputeHash([Text.Encoding]::UTF8.GetBytes($payload))
$micHex = ($mh | ForEach-Object { $_.ToString("x2") }) -join ""

Write-Host "→ POST $HostUrl/api/emqx-webhook  (plaintext payload — no AES envelope)" -ForegroundColor Cyan
Write-Host "  body: $payload" -ForegroundColor DarkGray
Write-Host ""

try {
    $resp = Invoke-WebRequest `
        -Uri "$HostUrl/api/emqx-webhook" `
        -Method POST `
        -ContentType "application/json" `
        -Headers @{ "x-emqx-signature" = "sha256=$sigHex"; "x-mqtt-mic" = $micHex } `
        -Body $payload `
        -SkipCertificateCheck `
        -ErrorAction Stop
    Write-Host "HTTP $($resp.StatusCode)" -ForegroundColor Green
    Write-Host $resp.Content
    Write-Host ""
    Write-Host "VULNERABILITY EXPLOITED — plaintext payload accepted (over-the-air sniffable)." -ForegroundColor Red
} catch {
    $code = $_.Exception.Response.StatusCode.value__
    $body = if ($_.ErrorDetails) { $_.ErrorDetails.Message } else { $_.Exception.Message }
    Write-Host "HTTP $code" -ForegroundColor Yellow
    Write-Host $body
    Write-Host ""
    if ($code -eq 400) {
        Write-Host "ATTACK BLOCKED — AES-required policy rejected plaintext." -ForegroundColor Green
    } else {
        Write-Host "UNEXPECTED — see status code above." -ForegroundColor Magenta
    }
}
