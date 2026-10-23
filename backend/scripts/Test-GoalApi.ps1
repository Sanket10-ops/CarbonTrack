param(
    [string]$BaseUrl = "http://localhost:8080",
    [Parameter(Mandatory = $true)][string]$JwtToken,
    [string]$SecondUserJwtToken = ""
)

$ErrorActionPreference = "Stop"
$headers = @{ Authorization = "Bearer $JwtToken"; "Content-Type" = "application/json" }
$base = $BaseUrl.TrimEnd('/')
$today = (Get-Date).ToString('yyyy-MM-dd')
$body = @{ targetReductionPct = 15; periodDays = 30; startDate = $today } | ConvertTo-Json
$goalId = $null
$passed = 0
$failed = 0

function Assert-True([bool]$Condition, [string]$Name) {
    if ($Condition) { Write-Host "PASS $Name" -ForegroundColor Green; $script:passed++ }
    else { Write-Host "FAIL $Name" -ForegroundColor Red; $script:failed++ }
}

try {
    $created = Invoke-RestMethod -Method Post -Uri "$base/api/goals" -Headers $headers -Body $body
    $goalId = $created.id
    Assert-True ($null -ne $goalId -and $created.status -eq 'ACTIVE') "Create goal returns id and ACTIVE status"

    $list = Invoke-RestMethod -Method Get -Uri "$base/api/goals" -Headers $headers
    Assert-True (@($list | Where-Object { $_.id -eq $goalId }).Count -eq 1) "List includes newly created goal"

    $read = Invoke-RestMethod -Method Get -Uri "$base/api/goals/$goalId" -Headers $headers
    Assert-True ($read.id -eq $goalId) "Read owned goal"

    $progress = Invoke-RestMethod -Method Get -Uri "$base/api/goals/$goalId/progress" -Headers $headers
    Assert-True ($progress.goalId -eq $goalId -and $null -ne $progress.baselineFootprintKg) "Progress endpoint returns goal and baseline fields"
    Assert-True ($null -ne $progress.alerts) "Progress endpoint returns alerts"

    $updatedBody = @{ targetReductionPct = 20; periodDays = 45; startDate = $today } | ConvertTo-Json
    $updated = Invoke-RestMethod -Method Put -Uri "$base/api/goals/$goalId" -Headers $headers -Body $updatedBody
    Assert-True ($updated.targetReductionPct -eq 20 -and $updated.periodDays -eq 45) "Update active goal"

    try {
        $badBody = @{ targetReductionPct = 101; periodDays = 30; startDate = $today } | ConvertTo-Json
        Invoke-RestMethod -Method Post -Uri "$base/api/goals" -Headers $headers -Body $badBody | Out-Null
        Assert-True $false "Reject invalid reduction target"
    } catch {
        $status = [int]$_.Exception.Response.StatusCode
        Assert-True ($status -eq 400) "Reject invalid reduction target with HTTP 400"
    }

    if ($SecondUserJwtToken) {
        $otherHeaders = @{ Authorization = "Bearer $SecondUserJwtToken"; "Content-Type" = "application/json" }
        try {
            Invoke-RestMethod -Method Get -Uri "$base/api/goals/$goalId" -Headers $otherHeaders | Out-Null
            Assert-True $false "Deny cross-user goal access"
        } catch {
            $status = [int]$_.Exception.Response.StatusCode
            Assert-True ($status -eq 404) "Deny cross-user goal access with HTTP 404"
        }
    } else {
        Write-Host "SKIP Cross-user access test (supply -SecondUserJwtToken)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "API smoke test stopped: $($_.Exception.Message)" -ForegroundColor Red
    $failed++
} finally {
    if ($goalId) {
        try {
            Invoke-RestMethod -Method Delete -Uri "$base/api/goals/$goalId" -Headers $headers | Out-Null
            Write-Host "CLEANUP Deleted test goal $goalId" -ForegroundColor DarkGray
        } catch {
            Write-Host "WARNING Could not delete test goal $goalId; remove it manually if needed." -ForegroundColor Yellow
        }
    }
}

Write-Host "`nGoal API smoke-test summary: $passed passed, $failed failed."
if ($failed -gt 0) { exit 1 }
