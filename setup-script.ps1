# PowerShell Script to set up the Comedy Construction Engine project structure

# Create directory structure
$directories = @(
    "public",
    "src",
    "src/components",
    "src/components/InputPanel",
    "src/components/Library",
    "src/components/Assembly",
    "src/components/Analysis",
    "src/components/shared",
    "src/hooks",
    "src/utils",
    "src/styles"
)

foreach ($dir in $directories) {
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir | Out-Null
        Write-Host "Created directory: $dir"
    } else {
        Write-Host "Directory already exists: $dir"
    }
}

# Create package.json
$packageJson = @'
{
  "name": "comedy-construction-engine",
  "version": "0.1.0",
  "private": true,
  "dependencies": {
    "@testing-library/jest-dom": "^5.17.0",
    "@testing-library/react": "^13.4.0",
    "@testing-library/user-event": "^13.5.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-scripts": "5.0.1",
    "web-vitals": "^2.1.4"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  }
}
'@

# Create index.html
$indexHtml = @'
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <link rel="icon" href="%PUBLIC_URL%/favicon.ico" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#000000" />
    <meta name="description" content="Comedy Construction Engine - Tool for analyzing and building comedy material" />
    <link rel="apple-touch-icon" href="%PUBLIC_URL%/logo192.png" />
    <link rel="manifest" href="%PUBLIC_URL%/manifest.json" />
    <title>Comedy Construction Engine</title>
  </head>
  <body>
    <noscript>You need to enable JavaScript to run this app.</noscript>
    <div id="root"></div>
  </body>
</html>
'@

# Create README.md
$readmeContent = @'
# Comedy Construction Engine

A tool for building and analyzing comedy material across multiple levels:
- Level 1: Jokes - atomic humor units
- Level 2: Bits - collections of related jokes
- Level 3: Sets - arranged bits with transitions
- Level 4: Specials - complete themed performances

## Features
- Block-based assembly interface
- Text analysis with color-coded feedback
- Audio analysis with laugh detection
- Drag-and-drop organization tools

## Installation
```
npm install
npm start
```

## Usage
1. Input your comedy material via text or audio
2. Analyze the structure and effectiveness
3. Organize into hierarchical components
4. Refine based on analysis feedback
'@

# Create .gitignore
$gitignoreContent = @'
# dependencies
/node_modules
/.pnp
.pnp.js

# testing
/coverage

# production
/build

# misc
.DS_Store
.env.local
.env.development.local
.env.test.local
.env.production.local

# logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# audio files
*.mp3
*.wav
*.ogg

# editor specific
.vscode/
.idea/
*.swp
*.swo
'@

# File creation mapping
$files = @{
    "package.json" = $packageJson
    "public/index.html" = $indexHtml
    "README.md" = $readmeContent
    ".gitignore" = $gitignoreContent
}

# Create each file
foreach ($file in $files.Keys) {
    $filePath = $file
    $content = $files[$file]
    
    # Create directory if it doesn't exist
    $directory = Split-Path $filePath
    if ($directory -and -not (Test-Path $directory)) {
        New-Item -ItemType Directory -Path $directory -Force | Out-Null
        Write-Host "Created directory: $directory"
    }
    
    # Create file
    Set-Content -Path $filePath -Value $content -Force
    Write-Host "Created file: $filePath"
}

Write-Host "`nProject structure setup complete!"

