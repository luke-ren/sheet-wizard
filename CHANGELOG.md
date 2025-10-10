# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added
- Global tick system for multi-user notification support
- Per-sheet interval scheduling with boundary alignment
- Last notification timestamp tracking
- Bell icon status indicators in UI (SVG, green/gray)
- Real-time bell icon updates on toggle
- No-reply email configuration
- Comprehensive test suite (32+ tests)
- Database property prefixing (`form_manager_`)
- Smart notification scheduling (aligns to interval boundaries)
- 24-hour interval special case (always at start hour)

### Changed
- Refactored trigger system from per-sheet to global tick
- Simplified email sender to no-reply format
- Centralized all properties management in db.ts
- Updated UI with professional SVG bell icons
- Improved test coverage for scheduling logic

### Fixed
- Multi-user trigger permission conflicts
- Duplicate trigger creation issues
- Email sender consistency across users

## [1.0.0] - Initial Release

### Added
- Quick form creation with instant linking
- Per-sheet notification configuration
- Email recipient management
- Time window settings (start/end hours)
- Notification intervals (5min to 24hr)
- Entry tracking and comparison
- HTML email formatting with tables
- Manual "Send Now" functionality
- Collapsible form cards
- Auto-refresh sidebar
- Comprehensive error handling
- Test suite with 24+ tests
