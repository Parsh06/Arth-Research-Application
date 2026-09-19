# ==============================================================================
# Arth Research Application - Automated Deployment & Git Sync Automation
# ==============================================================================

[CmdletBinding()]
param (
    [Parameter(Mandatory = $false)]
    [ValidateSet('frontend', 'backend', 'both', '1', '2', '3')]
    [string]$Target
)

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

function Write-Banner {
    Write-Host ''
    Write-Host ' ================================================================ ' -ForegroundColor Cyan
    Write-Host '   ARTH RESEARCH PLATFORM - AUTOMATED DEPLOYMENT & SYNC ENGINE    ' -ForegroundColor Yellow
    Write-Host ' ================================================================ ' -ForegroundColor Cyan
    Write-Host ''
}

function Write-Step {
    param([string]$message)
    Write-Host ' [RUNNING] ' -ForegroundColor Cyan -NoNewline
    Write-Host $message -ForegroundColor White
}

function Write-Success {
    param([string]$message)
    Write-Host ' [SUCCESS] ' -ForegroundColor Green -NoNewline
    Write-Host $message -ForegroundColor Green
}

function Write-WarningMsg {
    param([string]$message)
    Write-Host ' [WARNING] ' -ForegroundColor Yellow -NoNewline
    Write-Host $message -ForegroundColor Yellow
}

function Write-ErrorMsg {
    param([string]$message)
    Write-Host ' [ERROR]   ' -ForegroundColor Red -NoNewline
    Write-Host $message -ForegroundColor Red
}

function Generate-CommitMessage {
    $status = git status --porcelain
    if (-not $status) {
        $dateStr = Get-Date -Format 'yyyy-MM-dd HH:mm'
        return "chore: routine release update [$dateStr]"
    }

    $fileNames = @()
    foreach ($line in $status) {
        $trimmed = $line.Trim()
        if ($trimmed.Length -gt 3) {
            $path = $trimmed.Substring(3).Trim()
            $baseName = [System.IO.Path]::GetFileName($path)
            if ($baseName -and -not ($fileNames -contains $baseName)) {
                $fileNames += $baseName
            }
        }
    }

    $summaryFiles = ($fileNames | Select-Object -First 3) -join ', '
    if ($fileNames.Count -gt 3) {
        $extra = $fileNames.Count - 3
        $summaryFiles += " +$extra more"
    }

    $statusStr = $status -join ' '
    $prefix = 'chore'
    if ($statusStr -match 'src/pages' -or $statusStr -match 'templates') {
        $prefix = 'feat(ui)'
    } elseif ($statusStr -match 'api/' -or $statusStr -match 'repositories/') {
        $prefix = 'feat(api)'
    } elseif ($statusStr -match 'index.css|theme') {
        $prefix = 'style(theme)'
    } elseif ($statusStr -match 'package.json|tsconfig|vercel|firebase') {
        $prefix = 'build(config)'
    }

    $timestamp = Get-Date -Format 'yyyy-MM-dd HH:mm'
    return "${prefix}: auto-sync update [$timestamp] - ($summaryFiles)"
}

function Execute-FrontendDeploy {
    Write-Host ''
    Write-Host '------------------------------------------------------------' -ForegroundColor DarkGray
    Write-Host ' STARTING FRONTEND PRODUCTION BUILD & FIREBASE DEPLOY' -ForegroundColor Cyan
    Write-Host '------------------------------------------------------------' -ForegroundColor DarkGray
    
    # 1. Build
    Write-Step 'Executing TypeScript validation and production build (npm run build)...'
    npm run build

    if ($LASTEXITCODE -ne 0) {
        Write-ErrorMsg 'Production build failed! Aborting Firebase deployment to protect live site.'
        return $false
    }
    Write-Success 'Production bundle compiled successfully into dist directory.'

    # 2. Deploy to Firebase Hosting
    Write-Step 'Deploying to Firebase Hosting...'
    
    cmd.exe /c 'npx firebase-tools deploy --only hosting'

    if ($LASTEXITCODE -ne 0) {
        Write-ErrorMsg 'Firebase hosting deployment encountered an error.'
        return $false
    }

    Write-Success 'Frontend successfully deployed to https://arthresearch.web.app'
    return $true
}

function Execute-BackendSync {
    Write-Host ''
    Write-Host '------------------------------------------------------------' -ForegroundColor DarkGray
    Write-Host ' STARTING REPOSITORY GIT AUTO-COMMIT & CLOUD PUSH' -ForegroundColor Cyan
    Write-Host '------------------------------------------------------------' -ForegroundColor DarkGray

    # Check git status
    $status = git status --porcelain
    if (-not $status) {
        Write-WarningMsg 'No uncommitted local changes detected in working tree.'
        Write-Step 'Attempting git push in case of pending local commits...'
        git push
        if ($LASTEXITCODE -eq 0) {
            Write-Success 'Remote repository is fully synchronized.'
        }
        return $true
    }

    # 1. Git Add
    Write-Step 'Staging all modified and created files (git add .)...'
    git add .
    if ($LASTEXITCODE -ne 0) {
        Write-ErrorMsg 'Failed to stage files with git add.'
        return $false
    }

    # 2. Commit Message
    $autoMessage = Generate-CommitMessage
    Write-Host ' Commit Message: ' -ForegroundColor Magenta -NoNewline
    Write-Host "'$autoMessage'" -ForegroundColor White
    
    Write-Step 'Committing changes (git commit)...'
    git commit -m "$autoMessage"

    if ($LASTEXITCODE -ne 0) {
        Write-ErrorMsg 'Git commit failed.'
        return $false
    }
    Write-Success 'Committed successfully.'

    # 3. Git Push
    Write-Step 'Pushing commits to remote origin (git push)...'
    git push

    if ($LASTEXITCODE -ne 0) {
        Write-WarningMsg 'Standard push failed. Attempting to push with current upstream branch tracking...'
        $currentBranch = (git branch --show-current).Trim()
        git push origin $currentBranch
        if ($LASTEXITCODE -ne 0) {
            Write-ErrorMsg 'Git push failed. Please check network link and git branch credentials.'
            return $false
        }
    }

    Write-Success 'Repository successfully synchronized with GitHub remote.'
    return $true
}

# ==============================================================================
# Main Execution
# ==============================================================================

Write-Banner

if (-not $Target) {
    Write-Host ' Select Deployment Target:' -ForegroundColor White
    Write-Host ''
    Write-Host '   [1] Frontend Only  --> (npm run build + firebase deploy --only hosting)' -ForegroundColor Green
    Write-Host '   [2] Backend / Git  --> (git add . + AI commit message + git push)' -ForegroundColor Blue
    Write-Host '   [3] Full Stack     --> (Frontend Build & Deploy + Git Commit & Push)' -ForegroundColor Yellow
    Write-Host '   [4] Cancel / Exit' -ForegroundColor Gray
    Write-Host ''

    $choice = Read-Host ' Enter choice (1, 2, 3, or 4)'
    switch ($choice) {
        '1' { $Target = 'frontend' }
        '2' { $Target = 'backend' }
        '3' { $Target = 'both' }
        'frontend' { $Target = 'frontend' }
        'backend' { $Target = 'backend' }
        'both' { $Target = 'both' }
        default {
            Write-Host 'Operation cancelled. Exiting.' -ForegroundColor DarkGray
            exit 0
        }
    }
}

$startTime = Get-Date

$res = $false
switch ($Target) {
    { $_ -in 'frontend', '1' } {
        $res = Execute-FrontendDeploy
    }
    { $_ -in 'backend', '2' } {
        $res = Execute-BackendSync
    }
    { $_ -in 'both', '3' } {
        $resFrontend = Execute-FrontendDeploy
        $resBackend = Execute-BackendSync
        $res = $resFrontend -and $resBackend
    }
}

$elapsed = (Get-Date) - $startTime
$sec = [math]::Round($elapsed.TotalSeconds, 1)

Write-Host ''
Write-Host '================================================================' -ForegroundColor Cyan
if ($res) {
    Write-Host " DEPLOYMENT COMPLETED SUCCESSFULLY IN ${sec}s " -ForegroundColor Green
} else {
    Write-Host " DEPLOYMENT FINISHED WITH WARNINGS/ERRORS IN ${sec}s " -ForegroundColor Red
}
Write-Host '================================================================' -ForegroundColor Cyan
Write-Host ''
