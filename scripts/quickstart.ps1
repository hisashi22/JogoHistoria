$ErrorActionPreference = "Stop"

$RepoUrl = if ($env:REPO_URL) { $env:REPO_URL } else { "https://github.com/nikolareljin/500ad.git" }
$TargetDir = if ($env:TARGET_DIR) { $env:TARGET_DIR } else { Join-Path $HOME "500ad" }

Write-Host "500ad quickstart"
Write-Host "Repo:   $RepoUrl"
Write-Host "Target: $TargetDir"

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    throw "git is required but not installed."
}

if (-not (Test-Path $TargetDir)) {
    Write-Host "Cloning repository..."
    git clone $RepoUrl $TargetDir
} else {
    if (Test-Path (Join-Path $TargetDir ".git")) {
        Write-Host "Repository already exists; updating..."
        try {
            git -C $TargetDir pull --ff-only
        } catch {
            Write-Warning "Could not fast-forward pull; continuing with local copy."
        }
    } else {
        throw "Target exists and is not a git repository: $TargetDir"
    }
}

Set-Location $TargetDir

if (Get-Command bash -ErrorAction SilentlyContinue) {
    Write-Host "Starting 500ad with bash ./run ..."
    & bash ./run
    exit $LASTEXITCODE
}

throw "bash is required to run ./run on Windows. Install Git for Windows and retry."
