# SecureSentinel - Modern Extension Setup Script
# ---------------------------------------------

$currentPath = Get-Location
Set-Clipboard -Value $currentPath.Path

Write-Host "--- SecureSentinel Setup ---" -ForegroundColor Cyan
Write-Host "[*] Path copied to clipboard: $($currentPath.Path)" -ForegroundColor Gray

$chromePath = (Get-ItemProperty "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\chrome.exe" -ErrorAction SilentlyContinue).'(default)'
if (-not $chromePath) {
    $chromePath = (Get-ItemProperty "HKCU:\Software\Microsoft\Windows\CurrentVersion\App Paths\chrome.exe" -ErrorAction SilentlyContinue).'(default)'
}

if ($chromePath) {
    Write-Host "[*] Launching Chrome..." -ForegroundColor Green
    Start-Process $chromePath
    
    Write-Host "[!] Select your profile now. Waiting 5 seconds..." -ForegroundColor Yellow
    Start-Sleep -Seconds 5
    
    Write-Host "[*] Navigating to Extensions..." -ForegroundColor Green
    Start-Process $chromePath -ArgumentList "chrome://extensions"
} else {
    Write-Host "[!] Chrome not detected via registry. Using fallback..." -ForegroundColor Yellow
    Start-Process "chrome"
    Start-Sleep -Seconds 5
    Start-Process "chrome" -ArgumentList "chrome://extensions"
}

# Final Completion Windows Notification (Toast style if supported, otherwise Simple Window)
Add-Type -AssemblyName PresentationFramework
[System.Windows.MessageBox]::Show("1. Click 'Load Unpacked' in Chrome.`n2. Press Ctrl+V to paste the folder.`n3. Click 'Select Folder'.", "Setup Complete")
