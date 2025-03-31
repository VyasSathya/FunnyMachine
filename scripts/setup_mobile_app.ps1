# Setup script for moving mobile app files
$sourceDir = "C:\Users\Vyas\Comedy Assistant\comedy_assistant"
$targetDir = "mobile-app"

# Create necessary directories
New-Item -ItemType Directory -Force -Path $targetDir
New-Item -ItemType Directory -Force -Path "$targetDir\lib"
New-Item -ItemType Directory -Force -Path "$targetDir\test"
New-Item -ItemType Directory -Force -Path "$targetDir\assets"

# Copy main app files
Copy-Item "$sourceDir\lib\*" "$targetDir\lib\" -Recurse -Force
Copy-Item "$sourceDir\test\*" "$targetDir\test\" -Recurse -Force
Copy-Item "$sourceDir\pubspec.yaml" "$targetDir\" -Force
Copy-Item "$sourceDir\analysis_options.yaml" "$targetDir\" -Force
Copy-Item "$sourceDir\.env" "$targetDir\" -Force

# Copy platform-specific directories
foreach ($platform in @("android", "ios", "linux", "macos", "windows", "web")) {
    if (Test-Path "$sourceDir\$platform") {
        Copy-Item "$sourceDir\$platform" "$targetDir\" -Recurse -Force
    }
}

# Create new .gitignore for mobile app
@"
# Flutter/Dart specific
.dart_tool/
.flutter-plugins
.flutter-plugins-dependencies
.packages
.pub-cache/
.pub/
build/
*.iml
.idea/
.vscode/

# Platform specific
/android/app/debug
/android/app/profile
/android/app/release
/ios/Pods/
/ios/.symlinks/
/ios/Flutter/Generated.xcconfig
/macos/Flutter/ephemeral/
/windows/flutter/

# Environment files
.env
.env.*

# Generated files
*.g.dart
*.freezed.dart
"@ | Out-File "$targetDir\.gitignore"

Write-Host "Mobile app files have been moved to $targetDir" 