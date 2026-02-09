# Sync Script (PowerShell Version)
# Run this with: ./sync.ps1
# Note: This is the PowerShell alternative to sync.js. Use either one, not both.

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

# --- HELPER FUNCTIONS ---

function Get-Text($prop) { 
    if ($prop.rich_text -and $prop.rich_text.Count -gt 0) { 
        return $prop.rich_text[0].plain_text 
    } 
    return "" 
}

function Get-Title($prop) { 
    if ($prop.title -and $prop.title.Count -gt 0) { 
        return $prop.title[0].plain_text 
    } 
    return "Untitled" 
}

function Get-Select($prop) { 
    if ($prop.select) { 
        return $prop.select.name 
    } 
    return "" 
}

function Get-MultiSelect($prop) { 
    if ($prop.multi_select) { 
        return $prop.multi_select | ForEach-Object { $_.name } 
    } 
    return @() 
}

function Get-Url($prop) { 
    if ($prop.url) { 
        return $prop.url 
    } 
    return "#" 
}

function Get-Date($prop) { 
    if ($prop.date) { 
        return $prop.date.start 
    } 
    return "" 
}

function Get-Image($prop) {
    if ($prop.files -and $prop.files.Count -gt 0) {
        $f = $prop.files[0]
        if ($f.file) { return $f.file.url } 
        elseif ($f.external) { return $f.external.url }
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

# Convert rich text array to HTML
function ConvertTo-HtmlFromRichText($richTextArray) {
    if (-not $richTextArray -or $richTextArray.Count -eq 0) { return '' }
    
    $html = ''
    foreach ($rt in $richTextArray) {
        $text = $rt.plain_text
        
        if ($rt.annotations.bold) { $text = "<strong>$text</strong>" }
        if ($rt.annotations.italic) { $text = "<em>$text</em>" }
        if ($rt.annotations.strikethrough) { $text = "<s>$text</s>" }
        if ($rt.annotations.underline) { $text = "<u>$text</u>" }
        if ($rt.annotations.code) { $text = "<code>$text</code>" }
        
        if ($rt.href) {
            $text = "<a href=`"$($rt.href)`" target=`"_blank`">$text</a>"
        }
        
        $html += $text
    }
    return $html
}

# Convert Notion blocks to HTML
function ConvertTo-HtmlFromBlocks($blocks) {
    if (-not $blocks -or $blocks.Count -eq 0) { return '' }
    
    $html = ''
    $inList = $false
    $listType = ''
    
    foreach ($block in $blocks) {
        # Close list if leaving list context
        if ($inList -and $block.type -notin @('bulleted_list_item', 'numbered_list_item')) {
            $html += if ($listType -eq 'bulleted') { '</ul>' } else { '</ol>' }
            $inList = $false
        }
        
        switch ($block.type) {
            'paragraph' {
                $pText = ConvertTo-HtmlFromRichText $block.paragraph.rich_text
                if ($pText) { $html += "<p>$pText</p>" }
            }
            'heading_1' {
                $html += "<h2>$(ConvertTo-HtmlFromRichText $block.heading_1.rich_text)</h2>"
            }
            'heading_2' {
                $html += "<h3>$(ConvertTo-HtmlFromRichText $block.heading_2.rich_text)</h3>"
            }
            'heading_3' {
                $html += "<h4>$(ConvertTo-HtmlFromRichText $block.heading_3.rich_text)</h4>"
            }
            'bulleted_list_item' {
                if (-not $inList -or $listType -ne 'bulleted') {
                    if ($inList) { $html += if ($listType -eq 'bulleted') { '</ul>' } else { '</ol>' } }
                    $html += '<ul>'
                    $inList = $true
                    $listType = 'bulleted'
                }
                $html += "<li>$(ConvertTo-HtmlFromRichText $block.bulleted_list_item.rich_text)</li>"
            }
            'numbered_list_item' {
                if (-not $inList -or $listType -ne 'numbered') {
                    if ($inList) { $html += if ($listType -eq 'bulleted') { '</ul>' } else { '</ol>' } }
                    $html += '<ol>'
                    $inList = $true
                    $listType = 'numbered'
                }
                $html += "<li>$(ConvertTo-HtmlFromRichText $block.numbered_list_item.rich_text)</li>"
            }
            'quote' {
                $html += "<blockquote>$(ConvertTo-HtmlFromRichText $block.quote.rich_text)</blockquote>"
            }
            'divider' {
                $html += '<hr>'
            }
            'image' {
                $imgUrl = if ($block.image.file) { $block.image.file.url } elseif ($block.image.external) { $block.image.external.url } else { $null }
                if ($imgUrl) {
                    $caption = if ($block.image.caption -and $block.image.caption.Count -gt 0) { ConvertTo-HtmlFromRichText $block.image.caption } else { '' }
                    $html += "<figure><img src=`"$imgUrl`" alt=`"$caption`"><figcaption>$caption</figcaption></figure>"
                }
            }
        }
    }
    
    # Close any open list
    if ($inList) {
        $html += if ($listType -eq 'bulleted') { '</ul>' } else { '</ol>' }
    }
    
    return $html
}

# Fetch page content (blocks) from Notion
function Get-PageContent($pageId) {
    $url = "https://api.notion.com/v1/blocks/$pageId/children?page_size=100"
    try {
        $response = Invoke-RestMethod -Uri $url -Method Get -Headers $headers
        return ConvertTo-HtmlFromBlocks $response.results
    } catch {
        Write-Host "⚠️ Error fetching content for page $pageId: $_" -ForegroundColor Yellow
        return ''
    }
}

# --- FETCH FUNCTIONS ---

function Get-NotionProjects {
    $url = "https://api.notion.com/v1/databases/$DB_PROJECTS/query"
    $body = '{}' # Fetch all projects, no filter
    
    try {
        $response = Invoke-RestMethod -Uri $url -Method Post -Headers $headers -Body $body
        return $response.results
    } catch {
        Write-Host "❌ Error fetching Projects: $_" -ForegroundColor Red
        return @()
    }
}

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

# --- PROCESS DATA ---

$rawProjects = Get-NotionProjects
$projects = @()
foreach ($p in $rawProjects) {
    $props = $p.properties
    $fullContent = Get-PageContent $p.id
    
    $summary = Get-Text $props.Summary
    if (-not $summary) { $summary = Get-Text $props.Description }
    
    $projects += @{
        id = $p.id
        title = Get-Title $props.Name
        status = (Get-Select $props.Status).ToLower()
        summary = $summary
        description = Get-Text $props.Description
        fullContent = $fullContent
        tags = @(Get-MultiSelect $props.Tags)
        link = Get-Url $props.Link
        documents = @(Get-Docs $props.Documents)
    }
}

$rawUpdates = Get-NotionUpdates
$updates = @()
foreach ($u in $rawUpdates) {
    $props = $u.properties
    $fullContent = Get-PageContent $u.id
    
    $summary = Get-Text $props.Summary
    if (-not $summary) { $summary = Get-Text $props.Content }
    
    $updates += @{
        id = $u.id
        date = Get-Date $props.Date
        title = Get-Title $props.Name
        type = (Get-Select $props.Type).ToLower()
        summary = $summary
        content = Get-Text $props.Content
        fullContent = $fullContent
        image = Get-Image $props.Image
    }
}

Write-Host "✅ Found $($projects.Count) projects and $($updates.Count) updates." -ForegroundColor Green

# --- STATIC DATA ---
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

# --- GENERATE OUTPUT ---

$jsonProjects = $projects | ConvertTo-Json -Depth 10 -Compress:$false
$jsonUpdates = $updates | ConvertTo-Json -Depth 10 -Compress:$false
$jsonLinks = $staticData.links | ConvertTo-Json -Depth 10
$jsonBioShort = $staticData.bio.short | ConvertTo-Json
$bioLong = $staticData.bio.long

$fileContent = @"
/*
 * WEBSITE CONTENT CONFIGURATION
 * Synced from Notion: $(Get-Date -Format "yyyy-MM-ddTHH:mm:ss")
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
        long: ``$bioLong``
    },

    // --- PROJECTS ---
    projects: $jsonProjects,

    // --- UPDATES ---
    updates: $jsonUpdates
};
"@

# Write to File
$outputPath = Join-Path $PSScriptRoot "../data.js"
Set-Content -Path $outputPath -Value $fileContent -Encoding UTF8

Write-Host "🎉 Successfully updated data.js!" -ForegroundColor Green
