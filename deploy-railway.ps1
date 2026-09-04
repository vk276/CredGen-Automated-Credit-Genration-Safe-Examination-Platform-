# CredGen Enterprise - 1-Click Direct Deployment to Railway
$env:Path += ";C:\Users\vivek\bin"
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " CredGen Platform -> Direct Live Deployment to Railway" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Cyan

& "C:\Users\vivek\bin\railway.exe" up
