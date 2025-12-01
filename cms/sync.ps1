# Sync Script (PowerShell Version)
# Run this with: ./sync.ps1

# 1. Load Environment Variables from .env
$envPath = Join-Path $PSScriptRoot ".env"
if (Test-Path $envPath) {
    Get-Content $envPath | ForEach-Object {
        if ($_ -match '^\s*([^#=]+)\s*=\s*(.*)$') {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim()
            [Environment]::SetEnvironmentVariable($key, $value, "Process")
        }
    }
} else {
    Write-Host "❌ Error: .env file not found in cms folder." -ForegroundColor Red
    exit
}

$NOTION_KEY = $env:NOTION_KEY
$DB_PROJECTS = $env:NOTION_DB_PROJECTS
$DB_UPDATES = $env:NOTION_DB_UPDATES

if (-not $NOTION_KEY -or -not $DB_PROJECTS -or -not $DB_UPDATES) {
    Write-Host "❌ Error: Missing variables in .env file." -ForegroundColor Red
    exit
}

$headers = @{
    "Authorization" = "Bearer $NOTION_KEY"
    "Notion-Version" = "2022-06-28"
    "Content-Type" = "application/json"
}

Write-Host "🔄 Syncing data from Notion..." -ForegroundColor Cyan

# 2. Fetch Projects
function Get-NotionProjects {
    $url = "https://api.notion.com/v1/databases/$DB_PROJECTS/query"
    $body = @{
        filter = @{
            property = "Status"
            select = @{
                is_not_empty = $true
            }
        }
    } | ConvertTo-Json -Depth 10

    try {
        $response = Invoke-RestMethod -Uri $url -Method Post -Headers $headers -Body $body
        return $response.results
    } catch {
        Write-Host "❌ Error fetching Projects: $_" -ForegroundColor Red
        return @()
    }
}

# 3. Fetch Updates
function Get-NotionUpdates {
    $url = "https://api.notion.com/v1/databases/$DB_UPDATES/query"
    $body = @{
        sorts = @(
            @{
                property = "Date"
                direction = "descending"
            }
        )
    } | ConvertTo-Json -Depth 10

    try {
        $response = Invoke-RestMethod -Uri $url -Method Post -Headers $headers -Body $body
        return $response.results
    } catch {
        Write-Host "❌ Error fetching Updates: $_" -ForegroundColor Red
        return @()
    }
}

# Helper functions to extract data safely
function Get-Text($prop) { if ($prop.rich_text.Count -gt 0) { return $prop.rich_text[0].plain_text } return "" }
function Get-Title($prop) { if ($prop.title.Count -gt 0) { return $prop.title[0].plain_text } return "Untitled" }
function Get-Select($prop) { if ($prop.select) { return $prop.select.name } return "" }
function Get-MultiSelect($prop) { if ($prop.multi_select) { return $prop.multi_select | ForEach-Object { $_.name } } return @() }
function Get-Url($prop) { if ($prop.url) { return $prop.url } return "#" }
function Get-Date($prop) { if ($prop.date) { return $prop.date.start } return "" }
function Get-Files($prop) {
    if ($prop.files.Count -gt 0) {
        $f = $prop.files[0]
        if ($f.file) { return $f.file.url } else { return $f.external.url }
    }
    return $null
}
function Get-Docs($prop) {
    $docs = @()
    if ($prop.files) {
        foreach ($f in $prop.files) {
            $link = if ($f.file) { $f.file.url } else { $f.external.url }
            $type = if ($f.name -match '\.pdf$') { 'pdf' } else { 'doc' }
            $docs += @{ title = $f.name; type = $type; link = $link }
        }
    }
    return $docs
}

# Process Data
$rawProjects = Get-NotionProjects
$projects = @()
foreach ($p in $rawProjects) {
    $props = $p.properties
    $projects += @{
        title = Get-Title $props.Name
        status = (Get-Select $props.Status).ToLower()
        description = Get-Text $props.Description
        tags = Get-MultiSelect $props.Tags
        link = Get-Url $props.Link
        documents = Get-Docs $props.Documents
    }
}

$rawUpdates = Get-NotionUpdates
$updates = @()
foreach ($u in $rawUpdates) {
    $props = $u.properties
    $updates += @{
        date = Get-Date $props.Date
        title = Get-Title $props.Name
        type = (Get-Select $props.Type).ToLower()
        content = Get-Text $props.Content
        image = Get-Files $props.Image
    }
}

Write-Host "✅ Found $($projects.Count) projects and $($updates.Count) updates." -ForegroundColor Green

# 4. Construct data.js Content
# We hardcode the static bio/links here for simplicity
$staticData = @{
    name = "Elsa Donnat"
    role = "AI Policy Researcher | Governance & Legal Frameworks"
    email = "elsa.donnat@gmail.com"
    links = @{
        cv = "assets/CV_Elsa_Donnat.pdf"
        linkedin = "https://www.linkedin.com/in/elsa-donnat"
        github = "https://github.com/ElsaDonnat"
        substack = "#"
        feedback = "https://forms.gle/rD9csMiBr1dVE1RG9"
    }
    bio = @{
        image = "profile.jpg"
        short = "I am an AI Policy Researcher at the Ada Lovelace Institute, bridging the gap between legal frameworks (Swiss, UK, EU) and the governance of autonomous AI agents. My work focuses on designing proactive architectures that ensure AI systems remain safe, legible, and aligned with human economic and legal structures."
        long = "<p>I am a legal scholar and researcher specializing in the governance of artificial intelligence. With a background in Swiss, UK, and EU law, my work focuses on how legal frameworks must adapt to the challenges of agentic AI and autonomous systems.</p><p>Currently, I am an <strong>AI Policy Researcher at the Ada Lovelace Institute</strong> in London, contributing to research on regulatory frameworks for frontier models. I am also a Mentor and Team Lead for the SPAR program, guiding research on AI agent behavior and mass manipulation.</p><p>Previously, I was a Summer Fellow at the <strong>Center for the Governance of AI (GovAI)</strong> and taught at the Machine Learning for Good (ML4G) bootcamps. My goal is to design proactive governance architectures that ensure AI agents remain safe, legible, and aligned with human economic and legal systems.</p>"
    }
}

$jsonProjects = $projects | ConvertTo-Json -Depth 10
$jsonUpdates = $updates | ConvertTo-Json -Depth 10
$jsonLinks = $staticData.links | ConvertTo-Json -Depth 10
$jsonBioShort = $staticData.bio.short | ConvertTo-Json
# Bio long needs special handling for backticks if we use template literals, but simpler to just use string
$bioLong = $staticData.bio.long

$fileContent = @"
/*
 * WEBSITE CONTENT CONFIGURATION
 * Synced from Notion: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
 */

const data = {
    // --- BASIC INFO ---
    name: "$($staticData.name)",
    role: "$($staticData.role)",
    email: "$($staticData.email)",

    // --- LINKS ---
    links: $jsonLinks,

    // --- BIO ---
    bio: {
        image: "$($staticData.bio.image)",
        short: $jsonBioShort,
        long: `$bioLong`
    },

    // --- PROJECTS ---
    projects: $jsonProjects,

    // --- UPDATES ---
    updates: $jsonUpdates
};
"@

# 5. Write to File
$outputPath = Join-Path $PSScriptRoot "../data.js"
Set-Content -Path $outputPath -Value $fileContent -Encoding UTF8

Write-Host "🎉 Successfully updated data.js!" -ForegroundColor Green
