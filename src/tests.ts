/**
 * Test Suite for Form Manager
 * 
 * To run tests:
 * 1. Deploy the script
 * 2. Run the test functions from the Apps Script editor
 */

// ============================================================================
// Test Utilities
// ============================================================================

function logTestResult(testName: string, passed: boolean, message?: string): void {
  const status = passed ? '✓ PASS' : '✗ FAIL';
  const msg = message ? ` - ${message}` : '';
  console.log(`${status}: ${testName}${msg}`);
}

function assertEqual(actual: any, expected: any, testName: string): boolean {
  const passed = JSON.stringify(actual) === JSON.stringify(expected);
  if (!passed) {
    console.log(`  Expected: ${JSON.stringify(expected)}`);
    console.log(`  Actual: ${JSON.stringify(actual)}`);
  }
  logTestResult(testName, passed);
  return passed;
}

function assertTrue(condition: boolean, testName: string): boolean {
  logTestResult(testName, condition);
  return condition;
}

function assertFalse(condition: boolean, testName: string): boolean {
  logTestResult(testName, !condition);
  return !condition;
}

// ============================================================================
// Database Tests
// ============================================================================

function testSaveAndGetSheetConfig(): void {
  console.log('\n=== Testing Sheet Config Save/Get ===');
  
  const testConfig: SheetNotificationConfig = {
    sheetId: 999999,
    enabled: true,
    emailRecipients: ['test@example.com'],
    interval: '1hr',
    startHour: 9,
    endHour: 17
  };
  
  // Save config
  saveSheetNotificationConfig(testConfig);
  
  // Retrieve config
  const retrieved = getSheetNotificationConfig(999999);
  
  assertEqual(retrieved?.sheetId, testConfig.sheetId, 'Config sheetId matches');
  assertEqual(retrieved?.enabled, testConfig.enabled, 'Config enabled matches');
  assertEqual(retrieved?.emailRecipients, testConfig.emailRecipients, 'Config emailRecipients matches');
  assertEqual(retrieved?.interval, testConfig.interval, 'Config interval matches');
  assertEqual(retrieved?.startHour, testConfig.startHour, 'Config startHour matches');
  assertEqual(retrieved?.endHour, testConfig.endHour, 'Config endHour matches');
  
  // Cleanup
  deleteSheetNotificationConfig(999999);
  const deleted = getSheetNotificationConfig(999999);
  assertEqual(deleted, null, 'Config deleted successfully');
}

function testSaveAndGetEntries(): void {
  console.log('\n=== Testing Save/Get Entries ===');
  
  const testSheetId = 888888;
  const testEntries = [
    ['Entry 1', 'Data 1', new Date('2024-01-01')],
    ['Entry 2', 'Data 2', new Date('2024-01-02')]
  ];
  
  // Save entries
  saveEntries(testSheetId, testEntries);
  
  // Retrieve entries
  const retrieved = getSavedEntries(testSheetId);
  
  assertEqual(retrieved.length, testEntries.length, 'Retrieved correct number of entries');
  assertEqual(retrieved[0][0], testEntries[0][0], 'First entry first column matches');
  assertEqual(retrieved[1][0], testEntries[1][0], 'Second entry first column matches');
  
  // Test empty case
  const emptyEntries = getSavedEntries(777777);
  assertEqual(emptyEntries, [], 'Non-existent sheet returns empty array');
}

function testGlobalSettings(): void {
  console.log('\n=== Testing Global Settings ===');
  
  const testSettings: GlobalNotificationSettings = {
    interval: '2hr',
    startHour: 10,
    endHour: 18
  };
  
  saveGlobalNotificationSettings(testSettings);
  const retrieved = getGlobalNotificationSettings();
  
  assertEqual(retrieved.interval, testSettings.interval, 'Global interval matches');
  assertEqual(retrieved.startHour, testSettings.startHour, 'Global startHour matches');
  assertEqual(retrieved.endHour, testSettings.endHour, 'Global endHour matches');
}

// ============================================================================
// Tracker Tests
// ============================================================================

function testFindNewEntries(): void {
  console.log('\n=== Testing Find New Entries ===');
  
  const savedEntries = [
    ['Row 1', 'Data 1'],
    ['Row 2', 'Data 2']
  ];
  
  const currentRows = [
    ['Row 1', 'Data 1'],
    ['Row 2', 'Data 2'],
    ['Row 3', 'Data 3'], // New
    ['Row 4', 'Data 4']  // New
  ];
  
  const newEntries = findNewEntries(currentRows, savedEntries);
  
  assertEqual(newEntries.length, 2, 'Found 2 new entries');
  assertEqual(newEntries[0], ['Row 3', 'Data 3'], 'First new entry is correct');
  assertEqual(newEntries[1], ['Row 4', 'Data 4'], 'Second new entry is correct');
  
  // Test no new entries
  const noNew = findNewEntries(savedEntries, savedEntries);
  assertEqual(noNew.length, 0, 'No new entries when current equals saved');
  
  // Test all new entries
  const allNew = findNewEntries(currentRows, []);
  assertEqual(allNew.length, 4, 'All entries are new when saved is empty');
}

// ============================================================================
// Email Formatting Tests
// ============================================================================

function testCreateEmailSubject(): void {
  console.log('\n=== Testing Email Subject Creation ===');
  
  const subject1 = createEmailSubject('Test Sheet', 1);
  assertTrue(subject1.includes('Test Sheet'), 'Subject includes sheet name');
  assertTrue(subject1.includes('1 new entry'), 'Subject shows singular entry');
  
  const subject2 = createEmailSubject('Test Sheet', 5);
  assertTrue(subject2.includes('5 new entries'), 'Subject shows plural entries');
}

function testFormatCellValue(): void {
  console.log('\n=== Testing Cell Value Formatting ===');
  
  const dateValue = new Date('2024-01-15 10:30:00');
  const formatted = formatCellValue(dateValue);
  assertTrue(formatted.includes('2024'), 'Date formatting includes year');
  
  assertEqual(formatCellValue(null), '', 'Null returns empty string');
  assertEqual(formatCellValue(undefined), '', 'Undefined returns empty string');
  assertEqual(formatCellValue('test'), 'test', 'String returns as-is');
  assertEqual(formatCellValue(123), '123', 'Number converts to string');
}

function testCreateTableRows(): void {
  console.log('\n=== Testing Table Row Creation ===');
  
  const entries = [
    ['Name 1', 'Email 1'],
    ['Name 2', 'Email 2']
  ];
  
  const html = createTableRows(entries);
  
  assertTrue(html.includes('<tr>'), 'Contains table rows');
  assertTrue(html.includes('<td'), 'Contains table cells');
  assertTrue(html.includes('Name 1'), 'Contains first entry data');
  assertTrue(html.includes('Email 2'), 'Contains second entry data');
}

function testCreateHeaderRow(): void {
  console.log('\n=== Testing Header Row Creation ===');
  
  const headers = ['Name', 'Email', 'Timestamp'];
  const html = createHeaderRow(headers);
  
  assertTrue(html.includes('<th'), 'Contains header cells');
  assertTrue(html.includes('Name'), 'Contains Name header');
  assertTrue(html.includes('Email'), 'Contains Email header');
  assertTrue(html.includes('Timestamp'), 'Contains Timestamp header');
}

// ============================================================================
// Validation Tests
// ============================================================================

function testEmailValidation(): void {
  console.log('\n=== Testing Email Validation ===');
  
  // Valid emails
  assertTrue(isValidEmail('test@example.com'), 'Valid email accepted');
  assertTrue(isValidEmail('user.name@domain.co.uk'), 'Valid email with subdomain accepted');
  
  // Invalid emails
  assertFalse(isValidEmail('invalid'), 'Invalid email rejected');
  assertFalse(isValidEmail('test@'), 'Incomplete email rejected');
  assertFalse(isValidEmail('@example.com'), 'Email without user rejected');
  assertFalse(isValidEmail(''), 'Empty string rejected');
}

function testParseEmailList(): void {
  console.log('\n=== Testing Email List Parsing ===');
  
  const emails1 = parseEmailList('test1@example.com, test2@example.com');
  assertEqual(emails1.length, 2, 'Parsed 2 comma-separated emails');
  assertEqual(emails1[0], 'test1@example.com', 'First email correct');
  
  const emails2 = parseEmailList('test1@example.com; test2@example.com');
  assertEqual(emails2.length, 2, 'Parsed 2 semicolon-separated emails');
  
  const emails3 = parseEmailList('  test@example.com  ');
  assertEqual(emails3[0], 'test@example.com', 'Trimmed whitespace');
  
  const emails4 = parseEmailList('');
  assertEqual(emails4.length, 0, 'Empty string returns empty array');
}

// ============================================================================
// Time Window Tests
// ============================================================================

function testIsWithinTimeWindow(): void {
  console.log('\n=== Testing Time Window Check ===');
  
  // Test 9 AM - 5 PM window
  const morning = new Date('2024-01-15 10:00:00');
  assertTrue(isWithinTimeWindow(morning, 9, 17), '10 AM is within 9-5 window');
  
  const evening = new Date('2024-01-15 20:00:00');
  assertFalse(isWithinTimeWindow(evening, 9, 17), '8 PM is outside 9-5 window');
  
  const earlyMorning = new Date('2024-01-15 06:00:00');
  assertFalse(isWithinTimeWindow(earlyMorning, 9, 17), '6 AM is outside 9-5 window');
  
  // Test 24-hour window
  assertTrue(isWithinTimeWindow(morning, 0, 23), 'Any time is within 0-23 window');
}

function testIntervalConversion(): void {
  console.log('\n=== Testing Interval Conversion ===');
  
  assertEqual(intervalToMilliseconds('5min'), 5 * 60 * 1000, '5min converts correctly');
  assertEqual(intervalToMilliseconds('15min'), 15 * 60 * 1000, '15min converts correctly');
  assertEqual(intervalToMilliseconds('1hr'), 60 * 60 * 1000, '1hr converts correctly');
  assertEqual(intervalToMilliseconds('24hr'), 24 * 60 * 60 * 1000, '24hr converts correctly');
}

function testHourValidation(): void {
  console.log('\n=== Testing Hour Validation ===');
  
  // Valid hours
  assertTrue(isValidHour(0), 'Hour 0 is valid');
  assertTrue(isValidHour(12), 'Hour 12 is valid');
  assertTrue(isValidHour(23), 'Hour 23 is valid');
  
  // Invalid hours
  assertFalse(isValidHour(-1), 'Hour -1 is invalid');
  assertFalse(isValidHour(24), 'Hour 24 is invalid');
  assertFalse(isValidHour(1.5), 'Hour 1.5 is invalid');
}

// ============================================================================
// Database Last Notification Tests
// ============================================================================

function testLastNotificationTime(): void {
  console.log('\n=== Testing Last Notification Time ===');
  
  const testSheetId = 555555;
  const testTimestamp = Date.now();
  
  // Initially should be null
  const initial = getLastNotificationTime(testSheetId);
  assertEqual(initial, null, 'Initial last notification time is null');
  
  // Set a timestamp
  setLastNotificationTime(testSheetId, testTimestamp);
  
  // Retrieve it
  const retrieved = getLastNotificationTime(testSheetId);
  assertEqual(retrieved, testTimestamp, 'Retrieved timestamp matches');
  
  // Update with new timestamp
  const newTimestamp = testTimestamp + 60000;
  setLastNotificationTime(testSheetId, newTimestamp);
  const updated = getLastNotificationTime(testSheetId);
  assertEqual(updated, newTimestamp, 'Updated timestamp matches');
}

// ============================================================================
// Trigger Scheduling Tests
// ============================================================================

function testGetNextScheduledTime(): void {
  console.log('\n=== Testing Next Scheduled Time Calculation ===');
  
  const testConfig: SheetNotificationConfig = {
    sheetId: 123,
    enabled: true,
    emailRecipients: ['test@example.com'],
    interval: '2hr',
    startHour: 8,
    endHour: 18
  };
  
  // Test time: 11:30 AM (should schedule for 12:00 PM)
  const currentTime = new Date('2024-01-15 11:30:00').getTime();
  const nextScheduled = getNextScheduledTime(testConfig, currentTime);
  const nextDate = new Date(nextScheduled);
  
  assertEqual(nextDate.getHours(), 12, 'Next scheduled hour is 12 (noon)');
  assertEqual(nextDate.getMinutes(), 0, 'Next scheduled minute is 0');
  
  console.log(`Current: 11:30, Next: ${nextDate.getHours()}:${nextDate.getMinutes()}`);
}

function testGetNextScheduledTime24Hr(): void {
  console.log('\n=== Testing 24hr Interval Scheduling ===');
  
  const testConfig: SheetNotificationConfig = {
    sheetId: 123,
    enabled: true,
    emailRecipients: ['test@example.com'],
    interval: '24hr',
    startHour: 9,
    endHour: 18
  };
  
  // Test time: 2:00 PM (should schedule for 9:00 AM next day)
  const currentTime = new Date('2024-01-15 14:00:00').getTime();
  const nextScheduled = getNextScheduledTime(testConfig, currentTime);
  const nextDate = new Date(nextScheduled);
  
  assertEqual(nextDate.getHours(), 9, 'Next scheduled hour is 9 AM');
  assertEqual(nextDate.getMinutes(), 0, 'Next scheduled minute is 0');
  assertTrue(nextDate.getDate() === 16, 'Scheduled for next day');
  
  console.log(`Current: 2:00 PM, Next: ${nextDate.toLocaleString()}`);
}

function testShouldNotifySheet(): void {
  console.log('\n=== Testing Should Notify Sheet Logic ===');
  
  const testConfig: SheetNotificationConfig = {
    sheetId: 999,
    enabled: true,
    emailRecipients: ['test@example.com'],
    interval: '1hr',
    startHour: 9,
    endHour: 17
  };
  
  // Test outside time window (8 AM - before start)
  const beforeWindow = new Date('2024-01-15 08:00:00').getTime();
  assertFalse(shouldNotifySheet(testConfig, beforeWindow), 'Should not notify before time window');
  
  // Test outside time window (6 PM - after end)
  const afterWindow = new Date('2024-01-15 18:00:00').getTime();
  assertFalse(shouldNotifySheet(testConfig, afterWindow), 'Should not notify after time window');
  
  // Test within window but no last notification (should notify at start hour)
  const atStartHour = new Date('2024-01-15 09:00:00').getTime();
  assertTrue(shouldNotifySheet(testConfig, atStartHour), 'Should notify at start hour when never notified');
  
  console.log('Time window and scheduling logic validated');
}

// ============================================================================
// Master Test Runner
// ============================================================================

function runAllTests(): void {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║        Form Manager Test Suite                        ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  
  try {
    // Database tests
    testSaveAndGetSheetConfig();
    testSaveAndGetEntries();
    testGlobalSettings();
    
    // Tracker tests
    testFindNewEntries();
    
    // Email formatting tests
    testCreateEmailSubject();
    testFormatCellValue();
    testCreateTableRows();
    testCreateHeaderRow();
    
    // Validation tests
    testEmailValidation();
    testParseEmailList();
    
    // Time window tests
    testIsWithinTimeWindow();
    testIntervalConversion();
    testHourValidation();
    
    // Last notification time tests
    testLastNotificationTime();
    
    // Trigger scheduling tests
    testGetNextScheduledTime();
    testGetNextScheduledTime24Hr();
    testShouldNotifySheet();
    
    console.log('\n╔════════════════════════════════════════════════════════╗');
    console.log('║        All Tests Completed                             ║');
    console.log('╚════════════════════════════════════════════════════════╝');
    
  } catch (error) {
    console.error('Test suite failed with error:', error);
  }
}
