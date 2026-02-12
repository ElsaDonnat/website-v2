# Changelog

All notable changes to this website are documented in this file.

## [2026-02-12] - Project Dates, Layout Overhaul & Home Page Highlights

### Added
- **Project dates** - Dates synced from Notion (`Date` property with start/end), displayed as "Month Year" or date ranges
- **Project pinning** - New `Pinned` checkbox property from Notion controls which projects appear on the home page
- **Ideas category** - New project status with filter button and amber "IDEA" badge
- **Home page "new" indicator** - Pulsing red dot next to update titles less than 7 days old
- **Update URL support** - `URL` property synced from Notion, displayed as "Visit Link" button on update detail pages
- **Bold accent styling** - Bold text in rich content (projects & updates) renders in the site's accent color

### Changed
- **Projects grid** - Switched from 2 to 3 columns with smaller fonts and tighter padding
- **Home page highlights** - Now shows 5 most recent updates (was 3) and 3 pinned projects (was 2 ongoing)
- **Project cards** - Status badge and date now displayed on the same line below the title
- **Project detail page** - Uses Notion page body content (`fullContent`) instead of Description property
- **Home page mini-cards** - Reduced padding and font size for a more compact look
- **Projects subtitle** - Updated wording to encourage reaching out for collaboration
- **Update thumbnails** - Realigned to match title position on the updates list page

### Fixed
- **Date alignment** - Fine-tuned vertical alignment of dates with status badges using baseline positioning

---

## [2026-02-09] - Notion CMS Extension & Image Layout System

### Added
- **Notion Settings database** - Manage name, role, email, social links, and CV link from Notion
- **Notion About Me page** - Long biography with rich text formatting (bold, italic, headings, lists)
- **Update image layout system** - Three image properties for flexible layouts:
  - `Cover` - Thumbnail for list page + newspaper-style wrap on detail page
  - `Banner` - Full-width header on detail page with cinematic 21:9 cropping and rounded corners
  - `Gallery` - Multiple images as grid on detail page
- **Premium Image Lightbox** - Clickable gallery images with full-screen view, blurred background effect, elegant close button, and Escape key support
- **Image fallback logic** - List page automatically uses Cover → Gallery[0] → Banner

### Changed
- **sync.js** - Now fetches from Settings database, About page, and new image properties
- **script.js** - Updates list page with right-aligned images, detail page with refined Banner/Cover/Gallery sections
- **style.css** - Major UI polishing: refined "Back to Updates" link, precision vertical alignment for date/tag metadata, and improved spacing
- **NOTION_SETUP.md** - Updated documentation with image layout system and examples
- **sync.yml** - GitHub workflow updated with new environment variables

### Fixed
- **server.js** - Fixed 404 errors on detail pages by properly parsing URL query parameters
- **Meta-alignment** - Achieved perfect vertical and horizontal rhythm for date and category tags on detail pages

---

## [2026-02-04] - Website Cleanup & Bug Fixes

### Removed
- **contact.html** - Removed unused contact page (was inconsistent with site structure)
- **research.html** - Removed unused research page (was orphaned and not linked properly)
- **MIGRATION_GUIDE.md** - Removed outdated migration guide
- **cms/debug_log.txt** - Removed debug log file (should not be in repo)

### Added
- **404.html** - Added proper 404 error page with consistent styling and navigation

### Fixed
- **Navigation consistency** - All pages now have the same navigation menu (Home, About, Projects, Updates)
- **index.html** - Fixed duplicate `class` attribute on hero-role element that was causing `loading-text` class to be ignored
- **script.js** - Removed debug `console.log` statements from production code
- **script.js** - Cleaned up empty conditional block for contact page handling

### Changed
- Updated navigation in `index.html`, `about.html`, `projects.html`, `updates.html` to remove Contact link
