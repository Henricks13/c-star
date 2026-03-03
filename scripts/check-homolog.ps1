param(
  [string]$ServerHost = "3.226.122.12",
  [string]$User = "ubuntu",
  [string]$KeyPath = "$HOME\Downloads\cstar-key.pem",
  [string]$RepoPath = "/opt/c-star",
  [string]$Branch = "homolog"
)

$ErrorActionPreference = "Stop"

function Print-Title([string]$text) {
  Write-Host "`n=== $text ===" -ForegroundColor Cyan
}

function Run-Checked([string]$command, [string]$errorMessage) {
  $output = Invoke-Expression $command
  if ($LASTEXITCODE -ne 0) {
    throw $errorMessage
  }
  return $output
}

Print-Title "Homolog Monitor"
Write-Host "Host: $ServerHost"
Write-Host "Branch: $Branch"

Print-Title "0) Último deploy no GitHub Actions"
try {
  $runs = Invoke-RestMethod -Uri "https://api.github.com/repos/Henricks13/c-star/actions/runs?branch=$Branch&per_page=10" -TimeoutSec 20
  $deployRun = $runs.workflow_runs | Where-Object { $_.name -eq "Deploy Server" } | Select-Object -First 1
  if ($null -eq $deployRun) {
    Write-Host "deploy run: não encontrado"
  } else {
    $shaShort = $deployRun.head_sha.Substring(0, 7)
    Write-Host "deploy run: #$($deployRun.run_number) | status=$($deployRun.status) | conclusion=$($deployRun.conclusion) | sha=$shaShort"
    Write-Host "url: $($deployRun.html_url)"
  }
} catch {
  Write-Host "deploy run: falha ao consultar GitHub Actions"
  Write-Host $_.Exception.Message
}

if (-not (Test-Path $KeyPath)) {
  throw "Chave SSH não encontrada em: $KeyPath"
}

Print-Title "1) Commit remoto (origin/homolog)"
$remoteCommit = Run-Checked "git ls-remote origin refs/heads/$Branch" "Falha ao ler commit remoto"
$remoteSha = ($remoteCommit -split "`t")[0]
$remoteShort = $remoteSha.Substring(0, 7)
Write-Host "origin/${Branch}: $remoteShort"

Print-Title "2) Commit no servidor"
$serverCmd = "ssh -i `"$KeyPath`" $User@$ServerHost `"cd $RepoPath && git rev-parse --short HEAD`""
$serverShort = (Run-Checked $serverCmd "Falha ao ler commit no servidor").Trim()
Write-Host "server HEAD: $serverShort"

Print-Title "3) Containers no servidor"
$psCmd = "ssh -i `"$KeyPath`" $User@$ServerHost `"cd $RepoPath && docker compose --env-file infra/.env -f infra/docker-compose.server.yml ps`""
$psOutput = Run-Checked $psCmd "Falha ao ler status dos containers"
Write-Host $psOutput

Print-Title "4) Health endpoint"
try {
  $health = Invoke-RestMethod -Uri "http://$ServerHost/actuator/health" -TimeoutSec 20
  Write-Host ("health: " + ($health | ConvertTo-Json -Compress))
} catch {
  Write-Host "health: FALHOU" -ForegroundColor Yellow
  Write-Host $_.Exception.Message
}

Print-Title "Resumo"
if ($serverShort -eq $remoteShort) {
  Write-Host "OK: Servidor está no último commit da homolog." -ForegroundColor Green
} else {
  Write-Host "ATENÇÃO: Servidor está desatualizado em relação à homolog." -ForegroundColor Yellow
  Write-Host "Remoto:   $remoteShort"
  Write-Host "Servidor: $serverShort"
}
