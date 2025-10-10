# Form Manager - Code Summary

## Project Overview
A Google Apps Script add-on for managing Google Forms and their notification systems within Google Sheets.

## Architecture

### Core Files

#### `menu.ts`
- **Purpose**: Creates the custom menu in Google Sheets
- **Key Function**: `onOpen()` - Adds "Form Manager" menu item

#### `sidebar_controller.ts`
- **Purpose**: Backend controller for sidebar operations
- **Key Functions**:
  - `getFormSheets()` - Retrieves all sheets linked to forms
  - `toggleNotifications()` - Enables/disables notifications
  - `updateEmailRecipients()` - Updates email list
  - `updateSheetNotificationSettings()` - Updates interval and time window
  - `sendNotificationsManually()` - Manually triggers notifications (new entries only)
  - `createFormQuick()` - Creates form and returns URL immediately
  - `renameFormSheet()` - Renames sheet in background
- **Helper Functions**:
  - `createDefaultConfig()` - Creates default sheet config
  - `buildFormSheetInfo()` - Builds FormSheetInfo from sheet/form/config
  - `getOrCreateConfig()` - Gets existing or creates new config
  - `isConfigValid()` - Validates config for notifications
  - `validateManualSend()` - Validates manual send prerequisites
  - `findSheetByFormId()` - Finds sheet by form ID with retries

#### `sidebar.html`
- **Purpose**: Frontend UI for the sidebar
- **Features**:
  - Form creation with instant link
  - Per-sheet notification configuration
  - Email recipient management
  - Time window and interval settings
  - Manual "Send Now" button
  - Auto-refresh every 1 minute
  - Collapsible form cards
  - Bell icon status indicators (SVG, green/gray)
  - Real-time icon updates on toggle

#### `db.ts`
- **Purpose**: Database layer using PropertiesService with `form_manager_` prefix
- **Key Functions**:
  - `getSavedEntries()` / `saveEntries()` - Track notified entries
  - `getSheetNotificationConfig()` / `saveSheetNotificationConfig()` - Store settings
  - `getAllSheetNotificationConfigs()` - Get all enabled configs
  - `deleteSheetNotificationConfig()` - Cleanup on sheet deletion
  - `getLastNotificationTime()` / `setLastNotificationTime()` - Track last notification per sheet
  - `getGlobalNotificationSettings()` / `saveGlobalNotificationSettings()` - Global defaults

#### `tracker.ts`
- **Purpose**: Core notification tracking logic
- **Key Functions**:
  - `getSheetData()` - Extracts headers and rows from sheet
  - `findNewEntries()` - Compares current vs saved entries using JSON matching
  - `processTrackedSheet()` - Main processing logic for one sheet
  - `notifyTrackedSheets()` - Processes all enabled sheets with error tracking
- **Improvements**:
  - Concise logging with essential information
  - Success/error counting for batch operations
  - Clear progress indicators

#### `email.ts`
- **Purpose**: Email notification formatting and sending
- **Key Functions**:
  - `formatCellValue()` - Formats dates, booleans, and values for display
  - `createTableRows()` / `createHeaderRow()` - HTML table generation with empty handling
  - `createEmailBody()` - Generates full HTML email with sheet link
  - `createEmailSubject()` - Creates subject line with proper pluralization
  - `buildSheetUrl()` - Builds direct link to sheet tab
  - `notifyEntries()` - Orchestrates email notification process
  - `sendNotificationEmails()` - Sends to all recipients with error tracking

#### `triggers.ts`
- **Purpose**: Global tick system for multi-user notifications
- **Architecture**: Single 1-minute trigger checks all sheets independently
- **Key Functions**:
  - `globalTickHandler()` - Runs every minute, checks all enabled sheets
  - `shouldNotifySheet()` - Determines if sheet should notify based on interval
  - `getNextScheduledTime()` - Calculates next notification aligned to interval boundaries
  - `processSheetNotification()` - Sends notifications for one sheet
  - `setupNotificationTrigger()` - Creates global tick (any user can create)
  - `removeNotificationTrigger()` - Removes global tick
- **Benefits**: No permission conflicts, per-sheet intervals, single trigger for all users

#### `config.ts`
- **Purpose**: Configuration constants
- **Constants**:
  - `NOTIFICATION_INTERVALS` - Available intervals
  - `DEFAULT_START_HOUR` / `DEFAULT_END_HOUR` - Default time window

#### `utils.ts`
- **Purpose**: Shared utility functions
- **Key Functions**:
  - `isValidEmail()` - Email validation
  - `parseEmailList()` - Parse comma/semicolon separated emails
  - `isWithinTimeWindow()` - Check if current time is in window
  - `intervalToMilliseconds()` - Convert interval to ms
  - `formatInterval()` - Display-friendly interval names

#### `tests.ts`
- **Purpose**: Comprehensive test suite
- **Test Categories**:
  - Database operations
  - Entry tracking logic
  - Email formatting
  - Validation functions
  - Time window checks

## Data Flow

### Form Creation Flow
1. User enters form name in sidebar
2. `createFormQuick()` creates form and links to spreadsheet
3. Returns form URL immediately
4. Frontend opens form in new tab
5. `renameFormSheet()` runs in background to rename "Form Responses X" sheet
6. Sheet is activated and renamed to form name

### Notification Setup Flow
1. User configures email recipients
2. User sets interval (5min - 24hr) and time window (0-23 hours)
3. User enables notifications toggle
4. Config saved to PropertiesService
5. Trigger created if not exists

### Automatic Notification Flow
1. Hourly trigger calls `checkAndNotify()`
2. Gets all enabled sheet configs
3. For each config:
   - Checks if within time window
   - Gets sheet data
   - Compares with saved entries (JSON matching)
   - If new entries found:
     - Sends email with table and sheet link
     - Updates saved entries
4. Respects per-sheet intervals

### Manual Notification Flow
1. User clicks "Send Notifications Now"
2. Validates email recipients exist
3. Uses same `getSheetData()` and `findNewEntries()` logic
4. Sends only new entries since last notification
5. Updates saved entries
6. Shows success message with count

## Key Design Decisions

### Entry Tracking
- Uses JSON.stringify() comparison for exact matching
- Handles edited/deleted rows correctly
- Stores full entry arrays in PropertiesService

### Two-Step Form Creation
- Step 1: Create form, return URL (fast ~2-3 seconds)
- Step 2: Rename sheet in background (slow ~10-15 seconds)
- Improves UX by opening form immediately

### Time Windows
- Per-sheet configuration
- Checked on every trigger run
- Prevents notifications outside business hours

### Intervals
- Stored per-sheet
- Checked against last notification time
- Prevents spam even with hourly trigger

### Sheet Links in Emails
- Uses `spreadsheetUrl#gid={sheetId}` format
- Opens directly to specific sheet tab
- Styled as blue button in email

## OAuth Scopes Required
```json
{
  "oauthScopes": [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/gmail.send",
    "https://www.googleapis.com/auth/script.storage",
    "https://www.googleapis.com/auth/forms",
    "https://www.googleapis.com/auth/script.container.ui",
    "https://www.googleapis.com/auth/script.scriptapp",
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/script.send_mail"
  ]
}
```

## Testing

### Running Tests
All tests run directly in Google Apps Script environment:

```javascript
// From Apps Script editor
runAllTests();
```

### Test Coverage (30+ assertions)
- ✅ Database CRUD operations (save/get/delete configs and entries)
- ✅ Entry comparison logic (findNewEntries)
- ✅ Email formatting (subject, body, tables, headers)
- ✅ Cell value formatting (dates, booleans, null, strings)
- ✅ Validation functions (email, hour, time window)
- ✅ Email parsing (comma/semicolon separated, whitespace)
- ✅ Time window checks (within/outside window)
- ✅ Interval conversion (5min, 1hr, 24hr, etc.)
- ✅ Hour validation (0-23 range, integer check)

### Test Organization
- `src/tests.ts` - All tests in one file
- Test utilities: `assertEqual`, `assertTrue`, `assertFalse`
- Organized by module: Database, Tracker, Email, Validation, Time
- Beautiful formatted output with ✓/✗ indicators

## Best Practices Implemented

1. **Error Handling**: Try-catch blocks with concise logging
2. **Type Safety**: TypeScript types for all data structures
3. **Separation of Concerns**: Clear module boundaries
4. **DRY Principle**: Extracted helper functions, eliminated duplication
5. **User Feedback**: Status messages and loading states
6. **Performance**: Batch operations, efficient queries
7. **Maintainability**: Clear function names, helpful inline comments
8. **Testing**: 24 unit tests covering core functionality
9. **Code Quality**: Refactored for readability and reduced complexity
10. **Logging**: Concise, informative logs with essential context

## Future Enhancements

### Potential Features
- [ ] Bulk email validation
- [ ] Email templates
- [ ] Notification history log
- [ ] Export notification data
- [ ] Multiple recipient groups
- [ ] Custom email subjects
- [ ] Attachment support
- [ ] Webhook integration
- [ ] Slack/Discord notifications
- [ ] Dashboard analytics

### Code Improvements
- [ ] Add more edge case tests
- [ ] Implement retry logic for failed emails
- [ ] Add rate limiting for API calls
- [ ] Optimize PropertiesService usage
- [ ] Add data migration utilities
- [ ] Implement backup/restore functionality

## Deployment

### Build Process
```bash
npm run build
npm run deploy
```

### Manual Deployment
1. Copy files from `dist/` to Apps Script project
2. Ensure `appsscript.json` has all required scopes
3. Deploy as add-on or standalone script

## Troubleshooting

### Common Issues

**Emails not sending**
- Check OAuth scopes are authorized
- Verify email addresses are valid
- Check time window settings
- Verify notifications are enabled

**Sheet not renaming**
- Check execution logs for errors
- Verify sheet exists and is linked to form
- May take 10-15 seconds to complete

**Trigger not firing**
- Check trigger exists in Apps Script project
- Verify time-based trigger is set to hourly
- Check execution logs for errors

**No new entries detected**
- Verify saved entries are being stored
- Check if entries were already notified
- Try manual send to test

## Performance Considerations

- PropertiesService has 500KB limit per property
- MailApp has daily quota limits (varies by account type)
- Trigger execution time limit: 6 minutes
- Recommended max sheets per spreadsheet: 50
- Recommended max entries per notification: 100

## Security Notes

- Email addresses stored in PropertiesService (user-scoped)
- No external API calls except Google services
- All data stays within Google ecosystem
- No sensitive data logged
- OAuth scopes follow principle of least privilege
