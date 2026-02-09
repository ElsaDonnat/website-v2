# Changelog

All notable changes to this website are documented in this file.

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
