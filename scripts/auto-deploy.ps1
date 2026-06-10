# Auto-deploy portfolio to Vercel production once the free-tier daily deploy
# limit frees up. Registered as Windows scheduled task "PortfolioVercelDeploy"
# (every 2 h). Deletes its own task after a verified successful deploy.

$ErrorActionPreference = 'Continue'
$repo   = 'C:\Users\lalwa\vaibhav-portfolio'
$log    = Join-Path $repo 'scripts\auto-deploy.log'
$domain = 'vaibhavlalwani.vercel.app'
$marker = 'eyebrow-link'   # present only in the commit waiting to ship
$taskName = 'PortfolioVercelDeploy'

function Log($msg) {
    "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')  $msg" | Add-Content -Path $log
}

$npx = if (Test-Path 'D:\npx.cmd') { 'D:\npx.cmd' } else { 'npx' }

Set-Location $repo
Log "attempt start (npx=$npx)"

# Already live? (e.g. user redeployed manually) -> clean up and exit.
try {
    $live = (Invoke-WebRequest -Uri "https://$domain/?cb=$([guid]::NewGuid().ToString('N'))" -UseBasicParsing -TimeoutSec 30).Content
    if ($live -match $marker) {
        Log 'marker already live - nothing to do, removing task'
        schtasks /Delete /TN $taskName /F | Out-Null
        exit 0
    }
} catch { Log "live check failed: $($_.Exception.Message)" }

$out = & $npx -y vercel deploy --prod --yes 2>&1 | Out-String

if ($out -match 'api-deployments-free-per-day|Resource is limited') {
    Log 'still rate-limited, will retry on next trigger'
    exit 0
}

$m = [regex]::Match($out, 'Deployment (vaibhav-portfolio-[a-z0-9]+-vaibhav4046s-projects\.vercel\.app) ready')
if (-not $m.Success) {
    Log "deploy output unrecognized: $($out.Substring([Math]::Max(0, $out.Length - 400)))"
    exit 1
}

$dep = $m.Groups[1].Value
Log "deployed: $dep"

$aliasOut = & $npx -y vercel alias set $dep $domain 2>&1 | Out-String
Log "alias: $($aliasOut.Trim() -replace '\s+', ' ')"

Start-Sleep -Seconds 10
try {
    $live = (Invoke-WebRequest -Uri "https://$domain/?cb=$([guid]::NewGuid().ToString('N'))" -UseBasicParsing -TimeoutSec 30).Content
    if ($live -match $marker) {
        Log 'SUCCESS - new build verified live, removing scheduled task'
        schtasks /Delete /TN $taskName /F | Out-Null
        exit 0
    } else {
        Log 'deployed but marker not live yet - leaving task active for re-verify'
        exit 0
    }
} catch {
    Log "post-deploy verify failed: $($_.Exception.Message)"
    exit 1
}
