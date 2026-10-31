# CloudPulse Automated Load Test Runner (PowerShell)
param(
    [string]$Endpoint = "http://localhost:3000",
    [int]$Duration = 210,
    [int]$Concurrency = 25,
    [int]$Iterations = 1500000
)

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "           CloudPulse Controlled Load Generator           " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "Target Endpoint: $Endpoint"
Write-Host "Test Duration:   $Duration seconds"
Write-Host "Concurrency:     $Concurrency"
Write-Host "CPU Iterations:  $Iterations"
Write-Host "=========================================================="
Write-Host ""

try {
    $health = Invoke-RestMethod -Uri "$Endpoint/api/health" -TimeoutSec 5
    Write-Host "✅ Target is online and healthy. Backend status: $($health.status)" -ForegroundColor Green
} catch {
    Write-Host "❌ Error: Cannot connect to $Endpoint/api/health" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🚀 Launching load workers..." -ForegroundColor Yellow

$stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
$totalRequests = 0
$successCount = 0
$failCount = 0

while ($stopwatch.Elapsed.TotalSeconds -lt $Duration) {
    $jobs = @()
    for ($i = 0; $i -lt $Concurrency; $i++) {
        $jobs += Start-Job -ScriptBlock {
            param($url)
            $sw = [System.Diagnostics.Stopwatch]::StartNew()
            try {
                Invoke-RestMethod -Uri $url -TimeoutSec 20 | Out-Null
                $sw.Stop()
                return @{ Success = $true; LatencyMs = $sw.ElapsedMilliseconds }
            } catch {
                $sw.Stop()
                return @{ Success = $false; LatencyMs = $sw.ElapsedMilliseconds }
            }
        } -ArgumentList "$Endpoint/api/load-test?iterations=$Iterations"
    }

    $results = $jobs | Wait-Job | Receive-Job
    $jobs | Remove-Job

    foreach ($r in $results) {
        $totalRequests++
        if ($r.Success) { $successCount++ } else { $failCount++ }
    }

    $elapsed = [math]::Round($stopwatch.Elapsed.TotalSeconds)
    Write-Host "  [$elapsed s / $Duration s] Requests: $totalRequests | Success: $successCount | Failed: $failCount" -ForegroundColor Gray
}

$stopwatch.Stop()

Write-Host ""
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "Load generation finished. Check your HPA and Azure Monitor." -ForegroundColor Cyan
Write-Host "Total Requests: $totalRequests"
Write-Host "Successful:     $successCount"
Write-Host "Failed:         $failCount"
Write-Host "=========================================================="

