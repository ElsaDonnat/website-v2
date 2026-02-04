# Changelog

All notable changes to this website are documented in this file.

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
