# PowerShell script to display project structure as a tree
# Save this as project-status-script.ps1

function Show-Tree {
    param (
        [string]$Path = ".",
        [string]$Indent = "",
        [string]$Output = "project-structure.txt",
        [string[]]$ExcludeDirs = @("node_modules", ".git", "build", "dist"),
        [string[]]$ExcludeFiles = @("*.log", "package-lock.json", "yarn.lock")
    )

    # Create or clear the output file
    if (-not [string]::IsNullOrEmpty($Output)) {
        if (Test-Path $Output) {
            Clear-Content $Output
        }
        else {
            New-Item -ItemType File -Path $Output -Force | Out-Null
        }
        
        # Write project header information
        $projectName = Split-Path -Leaf (Resolve-Path $Path)
        "# Project Structure: $projectName" | Out-File -Append -FilePath $Output
        "# Generated on: $(Get-Date)" | Out-File -Append -FilePath $Output
        "" | Out-File -Append -FilePath $Output
    }

    $items = Get-ChildItem -Path $Path

    foreach ($item in $items) {
        $shouldExclude = $false
        
        if ($item.PSIsContainer) {
            # Check if directory should be excluded
            foreach ($dir in $ExcludeDirs) {
                if ($item.Name -eq $dir) {
                    $shouldExclude = $true
                    break
                }
            }
        }
        else {
            # Check if file should be excluded
            foreach ($filePattern in $ExcludeFiles) {
                if ($item.Name -like $filePattern) {
                    $shouldExclude = $true
                    break
                }
            }
        }

        if (-not $shouldExclude) {
            $line = "$Indent+-- $($item.Name)"
            
            # Output to console
            Write-Host $line
            
            # Append to file if specified
            if (-not [string]::IsNullOrEmpty($Output)) {
                $line | Out-File -Append -FilePath $Output
            }

            if ($item.PSIsContainer) {
                # Directory - recurse into it
                Show-Tree -Path $item.FullName -Indent "$Indent|   " -Output $Output -ExcludeDirs $ExcludeDirs -ExcludeFiles $ExcludeFiles
            }
        }
    }
}

# Get current directory name
$currentDir = Split-Path -Leaf (Get-Location)
Write-Host "Generating project structure for: $currentDir"

# Output the tree
Show-Tree -Path "." -Output "project-structure.txt" 

Write-Host ""
Write-Host "Structure has been saved to project-structure.txt"
Write-Host "You can include this file when sharing your project status."

