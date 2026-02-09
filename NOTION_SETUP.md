# Notion CMS Setup Guide

This guide explains how to connect your Notion workspace to the website.

---

## Overview

The website uses:
- **Website Projects** database — Your research projects
- **Website Updates** database — News, announcements, talks
- **Website Settings** database — Editable fields (bio, CV link, social links)
- **About Me** page — Your full biography with rich formatting

---

## Phase 1: Create the Integration

1. Go to [My Integrations](https://www.notion.so/my-integrations)
2. Click **"New integration"**
3. Name it (e.g., "Elsa Website CMS")
4. Select your workspace → Click **Submit**
5. **Copy the "Internal Integration Secret"**

---

## Phase 2: Create the Databases and Pages

Create everything inside a parent page (e.g., "Website Content").

### Database 1: "Website Projects"

| Property | Type | Description |
|----------|------|-------------|
| `Name` | Title | Project title |
| `Status` | Select | "ongoing", "past" |
| `Summary` | Text | Short summary (1-2 sentences) |
| `Tags` | Multi-select | e.g., "AI Safety", "Law" |
| `Link` | URL | External link (optional) |
| `Documents` | Files & Media | Upload PDFs here |

### Database 2: "Website Updates"

| Property | Type | Description |
|----------|------|-------------|
| `Name` | Title | Update title |
| `Date` | Date | When it happened |
| `Type` | Select | "news", "talk", "publication", "career" |
| `Summary` | Text | Short summary (1-2 sentences) |
| `Cover` | Files & Media | Thumbnail for list + wrap on detail page |
| `Banner` | Files & Media | Full-width header on detail page |
| `Gallery` | Files & Media | Multiple images as grid on detail page |

#### Image Layout System

**All Updates (list page):**
- Shows one image on the **right side** of each card
- Picks from (in order): Cover → first Gallery image → Banner → no image

**Update Detail Page (layout order):**
1. **Banner** — Full-width at top (if set)
2. **Title + Date + Type**
3. **Content** — with Cover wrapped newspaper-style (if set)
4. **Gallery** — Grid of images at bottom (if set)

**Examples:**

| You set... | List page shows | Detail page layout |
|------------|-----------------|-------------------|
| Cover only | Cover (right) | Content wraps around Cover |
| Banner + Gallery | Gallery[0] (right) | Banner top → Gallery bottom |
| All three | Cover (right) | Banner → Cover wrap → Gallery |
| Nothing | No image | Text only |

### Database 3: "Website Settings"

| Property | Type | Description |
|----------|------|-------------|
| `Key` | Title | Setting name |
| `Value` | Text | The value (supports formatting) |

**Required rows:**

| Key | Value |
|-----|-------|
| `name` | Your name |
| `role` | Your job title |
| `email` | your@email.com |
| `cv` | Google Drive link to your CV PDF |
| `linkedin` | LinkedIn URL |
| `github` | GitHub URL |
| `substack` | Substack URL (or `#`) |
| `feedback` | Feedback form URL |
| `shortBio` | 1-2 sentence bio for homepage |

> **💡 CV Link**: Use a Google Drive "Anyone with link" URL — clicking the CV button will open your Drive PDF!

### Page: "About Me"

Create a **new page** (not a database) for your full biography.

Write your bio using Notion's formatting:
- **Bold** and *italic* → become `<strong>` and `<em>`
- Headings, bullet lists, numbered lists
- Links, quotes, dividers

Example:
```
I am a legal scholar specializing in AI governance...

## Current Role
I am an **AI Policy Researcher at the Ada Lovelace Institute**...

## Previous Experience
- Summer Fellow at **GovAI**
- Teacher at ML4G bootcamps
```

---

## Phase 3: Connect the Integration

For **each database and the About Me page**:
1. Click **...** → **Connect to** → Select your integration

---

## Phase 4: Get IDs

Copy the ID from each URL (32-character code before `?`):
- Projects database ID
- Updates database ID  
- Settings database ID
- About Me page ID

---

## Phase 5: Configure Environment

### Local (.env file in `cms/`)
```env
NOTION_KEY=secret_xxxxx
NOTION_DB_PROJECTS=xxxxx
NOTION_DB_UPDATES=xxxxx
NOTION_DB_SETTINGS=xxxxx
NOTION_PAGE_ABOUT=xxxxx
```

### GitHub Secrets
Go to **Settings > Secrets > Actions** and add all 5 secrets above.

---

## Phase 6: Run the Sync

```bash
cd cms && node sync.js
```

---

## Changing Your Profile Photo

The profile photo is a **static file** in the repository (faster loading).

To update:
1. Replace `profile.jpg` in the root folder
2. Keep the filename the same
3. Recommended: 400x400 px, under 200KB
4. Commit and push

---

## Troubleshooting

**Settings/About page not loading**
- Make sure integration is connected
- Check IDs are correct (page ID for About, database ID for Settings)

**Formatting not appearing**
- Rich text works in Settings `Value` field and About Me page
- Project/Update `Summary` fields are plain text
