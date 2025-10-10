# Form Manager - Google Workspace Add-on

A Google Workspace add-on that streamlines form management and provides intelligent email notifications for new form responses. Designed for internal deployment within your organization.

## Features

### 🚀 Quick Form Creation
- Create Google Forms directly from your spreadsheet
- Instant form link generation (2-3 seconds)
- Automatic sheet creation and renaming
- Forms open immediately while setup completes in background

### 📧 Smart Notifications
- No-reply email alerts for new form responses
- Configurable notification intervals (5min to 24hr)
- Smart scheduling aligned to interval boundaries
- Time window controls (e.g., only notify 9 AM - 5 PM)
- Per-sheet email recipient lists
- Beautiful HTML email formatting with data tables
- Direct links to specific sheet tabs

### ⚙️ Flexible Configuration
- Per-form notification settings
- Multiple notification intervals with boundary alignment
- Business hours enforcement
- Manual "Send Now" button for testing
- Auto-refresh UI every minute
- Visual bell icon status indicators

### 🎯 Intelligent Tracking
- Only notifies about NEW entries
- JSON-based entry comparison
- Handles edited/deleted rows correctly
- Prevents duplicate notifications
- Per-sheet last notification timestamps

### 🔔 Multi-User Support
- Global tick system (single 1-minute trigger)
- No permission conflicts between users
- Any user can enable/disable notifications
- Emails sent as "Form Notifications (Do Not Reply)"

## Installation

### Prerequisites
- Google Account
- Node.js 18+ (for development)
- npm or yarn

### For Internal Workspace Deployment

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd form-manager
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Login to Google Apps Script**
   ```bash
   npm run login
   ```

4. **Create a new Apps Script project**
   ```bash
   npx clasp create --type sheets --title "Form Manager"
   ```

5. **Configure for Workspace**
   - Update `src/appsscript.json` with your organization's OAuth scopes
   - Set deployment type to "Internal" in Apps Script settings

6. **Deploy**
   ```bash
   npm run build
   npm run push
   ```

7. **Publish as Internal Add-on**
   - In Apps Script editor: Deploy → New deployment
   - Type: Add-on
   - Access: Internal (your organization only)
   - Add description and version info

8. **Install in Sheets**
   - Open any Google Sheet in your organization
   - Extensions → Add-ons → Manage add-ons
   - Find "Form Manager" and install
   - The "Form Manager" menu will appear

## Usage

### Creating a Form

1. Open the Form Manager sidebar
2. Enter a form name (e.g., "Customer Feedback Survey")
3. Click "Create Linked Form"
4. Click the link to open your new form
5. The sheet will be automatically renamed to match your form

### Setting Up Notifications

1. Expand a form card in the sidebar
2. Add email recipients (comma or semicolon separated)
3. Configure notification interval (5min, 15min, 30min, 1hr, 2hr, 24hr)
4. Set time window (e.g., 9 AM to 5 PM)
5. Click "Save Settings"
6. Toggle "Enable Notifications" to ON

### Manual Testing

- Click "Send Notifications Now" to test immediately
- Only sends notifications for NEW entries since last send
- Shows success message with entry count

### Managing Forms

- **Refresh UI** - Updates the form list
- **Collapse/Expand** - Click form name to show/hide settings
- **Auto-refresh** - UI updates every minute automatically

## Development

### Project Structure

```
form-manager/
├── src/
│   ├── menu.ts              # Custom menu
│   ├── sidebar.html         # UI
│   ├── sidebar_controller.ts # Backend logic
│   ├── db.ts                # Data persistence
│   ├── tracker.ts           # Entry tracking
│   ├── email.ts             # Email formatting
│   ├── trigger.ts           # Time-based triggers
│   ├── config.ts            # Configuration
│   ├── utils.ts             # Utility functions
│   └── tests.ts             # Runtime tests
├── tests/
│   └── unit.test.ts         # Build-time tests
├── scripts/
│   └── extract-testable-functions.js
└── dist/                    # Compiled output
```

### Available Scripts

```bash
# Development
npm run dev              # Build and deploy (skip tests)
npm run watch            # Watch mode for development

# Testing
npm test                 # Run Jest tests
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Generate coverage report

# Building
npm run build            # Run tests, compile, and build
npm run build:skip-tests # Build without running tests

# Deployment
npm run deploy           # Test, build, and deploy
npm run push             # Push to Apps Script (no build)
```

### Running Tests

**Build-time tests (Jest)**:
```bash
npm test
```

**Runtime tests (Apps Script)**:
1. Deploy the script
2. Open Apps Script editor
3. Run `runAllTests()` function
4. Check execution logs

See [TESTING.md](TESTING.md) for detailed testing guide.

### Making Changes

1. Edit files in `src/`
2. Run `npm run dev` to deploy
3. Refresh your Google Sheet
4. Test your changes

### Code Quality

- **TypeScript** for type safety
- **Jest** for unit testing
- **Comprehensive error handling**
- **Detailed logging**
- **Modular architecture**

## Configuration

### Notification Intervals

Notifications are aligned to interval boundaries starting from the configured start hour:

- `5min` - Every 5 minutes (e.g., 9:00, 9:05, 9:10...)
- `15min` - Every 15 minutes (e.g., 9:00, 9:15, 9:30...)
- `30min` - Every 30 minutes (e.g., 9:00, 9:30, 10:00...)
- `1hr` - Every hour (e.g., 9:00, 10:00, 11:00...) - recommended
- `2hr` - Every 2 hours (e.g., 8:00, 10:00, 12:00...)
- `24hr` - Once per day at start hour (e.g., always at 9:00 AM)

**Example**: If start hour is 8 AM and interval is 2hr, notifications send at 8:00, 10:00, 12:00, 2:00, 4:00, etc.

### Time Windows

- Set start hour (0-23) - When notifications can begin
- Set end hour (0-23) - When notifications must stop
- Notifications only sent within this window
- Useful for business hours enforcement (e.g., 9 AM - 5 PM)

### Email Format

Emails include:
- Subject: "New entries in [Sheet Name] - X new entries"
- HTML table with all new entries
- Blue button linking directly to the sheet
- Timestamp of notification

## Permissions

The add-on requires these OAuth scopes:

- `spreadsheets` - Read/write spreadsheet data
- `gmail.send` - Send email notifications
- `script.storage` - Store configuration
- `forms` - Create and manage forms
- `script.container.ui` - Show sidebar
- `script.scriptapp` - Manage triggers
- `userinfo.email` - Access user email
- `script.send_mail` - Send emails via MailApp

## Troubleshooting

### Emails Not Sending

- Verify email addresses are valid
- Check time window settings
- Ensure notifications are enabled
- Check daily email quota (varies by account type)

### Sheet Not Renaming

- Check execution logs for errors
- Renaming takes 10-15 seconds
- Verify sheet is linked to form

### Notifications Not Firing

- Check trigger exists (Apps Script > Triggers)
- Verify time window includes current time
- Check execution logs for errors

### No New Entries Detected

- Verify entries are actually new
- Check saved entries in PropertiesService
- Try manual send to test

## Limitations

- PropertiesService: 500KB per property
- Email quota: Varies by Google account type
- Trigger execution: 6 minute timeout
- Recommended max: 50 sheets per spreadsheet
- Recommended max: 100 entries per notification

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `npm test`
5. Submit a pull request

## License

ISC

## Support

For issues, questions, or feature requests, please open an issue on GitHub.

## Changelog

### v1.0.0 (2024)
- Initial release
- Form creation with instant links
- Smart notification system
- Per-sheet configuration
- Time window controls
- Manual send functionality
- Comprehensive test suite

## Acknowledgments

Built with:
- Google Apps Script
- TypeScript
- Jest
- Clasp

## Security

- All data stored in Google's infrastructure
- No external API calls
- User-scoped data storage
- OAuth 2.0 authentication
- Follows principle of least privilege
