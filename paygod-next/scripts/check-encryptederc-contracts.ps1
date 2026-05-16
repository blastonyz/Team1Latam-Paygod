$target = "..\EncryptedERC\contracts"
if (Test-Path $target) {
    Write-Host "Contracts found in $target `:"
    Get-ChildItem $target | Select-Object -First 5 Name
    exit 0
} else {
    Write-Host "Error: EncryptedERC contracts folder not found."
    Write-Host "Suggested commands to restore:"
    Write-Host "git -C .. restore EncryptedERC/contracts"
    Write-Host "git -C .. checkout origin/main -- EncryptedERC/contracts"
    exit 1
}
