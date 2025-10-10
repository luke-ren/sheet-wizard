/**
 * Formats a cell value for display in email
 * Handles dates, null/undefined, and other types
 * @param cell - The cell value to format
 * @returns Formatted string representation
 */
function formatCellValue(cell: any): string {
  if (cell instanceof Date) {
    return Utilities.formatDate(cell, Session.getScriptTimeZone(), 'MM/dd/yyyy HH:mm:ss');
  }
  
  if (cell === null || cell === undefined) {
    return '';
  }
  
  // Handle boolean values
  if (typeof cell === 'boolean') {
    return cell ? 'Yes' : 'No';
  }
  
  return String(cell);
}

/**
 * Creates HTML table rows for email body
 * @param newEntries - Array of row data
 * @returns HTML string of table rows
 */
function createTableRows(newEntries: any[][]): string {
  if (!newEntries || newEntries.length === 0) {
    return '<tr><td colspan="100%" style="text-align: center; padding: 20px;">No entries</td></tr>';
  }
  
  return newEntries.map((row, rowIndex) => {
    const cells = row.map(cell => 
      `<td style="border: 1px solid #ddd; padding: 8px;">${formatCellValue(cell)}</td>`
    ).join('');
    return `<tr>${cells}</tr>`;
  }).join('');
}

/**
 * Creates HTML header row for email table
 * @param headers - Array of column headers
 * @returns HTML string of table headers
 */
function createHeaderRow(headers: any[]): string {
  if (!headers || headers.length === 0) {
    return '<th style="border: 1px solid #ddd; padding: 8px; background-color: #f2f2f2;">No Headers</th>';
  }
  
  return headers.map(header => 
    `<th style="border: 1px solid #ddd; padding: 8px; background-color: #f2f2f2;">${header || 'Unnamed'}</th>`
  ).join('');
}

/**
 * Creates the email subject line
 * @param sheetName - Name of the sheet
 * @param newEntriesCount - Number of new entries
 * @returns Formatted subject line
 */
function createEmailSubject(sheetName: string, newEntriesCount: number): string {
  const entryWord = newEntriesCount === 1 ? 'entry' : 'entries';
  return `New ${entryWord} in "${sheetName}" - ${newEntriesCount} ${entryWord}`;
}

/**
 * Creates HTML email body with formatted table of new entries
 */
function createEmailBody(sheetName: string, headers: any[], newEntries: any[][], sheetUrl?: string): string {
  const tableRows = createTableRows(newEntries);
  const headerRow = createHeaderRow(headers);
  
  const sheetLinkHtml = sheetUrl 
    ? `<p><a href="${sheetUrl}" style="display: inline-block; padding: 10px 20px; background-color: #1a73e8; color: white; text-decoration: none; border-radius: 4px; margin: 10px 0;">View Sheet: ${sheetName}</a></p>`
    : '';
  
  return `
    <html>
      <body>
        <h2>New Entries in "${sheetName}"</h2>
        <p>The following ${newEntries.length} new ${newEntries.length === 1 ? 'entry has' : 'entries have'} been added to the sheet:</p>
        
        ${sheetLinkHtml}
        
        <table style="border-collapse: collapse; width: 100%; margin: 20px 0;">
          <thead>
            <tr>${headerRow}</tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
        
        <p><em>This is an automated notification from Form Notifications.</em></p>
        <p><small>Generated on: ${Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'MM/dd/yyyy HH:mm:ss')}</small></p>
      </body>
    </html>
  `;
}

/**
 * Builds the sheet URL for direct linking
 * @param sheetId - The sheet ID
 * @returns URL string or undefined if sheet not found
 */
function buildSheetUrl(sheetId: number): string | undefined {
  try {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = spreadsheet.getSheets().find(s => s.getSheetId() === sheetId);
    
    if (!sheet) {
      console.warn(`Sheet ID ${sheetId} not found`);
      return undefined;
    }
    
    return `${spreadsheet.getUrl()}#gid=${sheetId}`;
  } catch (error) {
    console.error(`Error building sheet URL:`, error);
    return undefined;
  }
}

/**
 * Sends notification emails for entries
 * Main orchestrator for email notification process
 * @param config - Sheet configuration
 * @param headers - Column headers
 * @param entries - New entries to notify about
 */
function notifyEntries(config: FormSheetInfo, headers: any[], entries: any[][]): void {
  console.log(`Sending ${entries.length} entries to ${config.emailRecipients.length} recipients`);
  
  const subject = createEmailSubject(config.sheetName, entries.length);
  const sheetUrl = buildSheetUrl(config.sheetId);
  const emailBody = createEmailBody(config.sheetName, headers, entries, sheetUrl);
  
  sendNotificationEmails(config, subject, emailBody);
}

/**
 * Sends notification emails to all recipients
 * @param config - Sheet configuration with recipients
 * @param subject - Email subject line
 * @param emailBody - HTML email body
 */
function sendNotificationEmails(config: FormSheetInfo, subject: string, emailBody: string): void {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  
  // Use a generic display name to make it look automated
  const senderName = 'Form Notifications (Do Not Reply)';
  
  let successCount = 0;
  let failureCount = 0;
  
  config.emailRecipients.forEach((email: string) => {
    try {
      MailApp.sendEmail({
        to: email,
        subject: subject,
        htmlBody: emailBody,
        name: senderName,
        noReply: true  // Marks email as no-reply
      });
      successCount++;
    } catch (emailError) {
      console.error(`Failed to send to ${email}:`, emailError);
      failureCount++;
    }
  });
  
  console.log(`Sent: ${successCount}/${config.emailRecipients.length} no-reply emails`);
}

/**
 * Test function to send a sample email notification
 * Run this function manually to test the email system
 * Instructions:
 * 1. Update the testEmail variable with your email address
 * 2. Run this function from the Apps Script editor
 * 3. Check your inbox for the test email
 */
function testEmailSystem(): void {
  const testEmail = Session.getActiveUser().getEmail();
  
  console.log(`Sending test email to: ${testEmail}`);
  
  // Create sample data
  const sampleHeaders = ['Timestamp', 'Name', 'Email', 'Response'];
  const sampleEntries = [
    [new Date(), 'John Doe', 'john@example.com', 'Sample response 1'],
    [new Date(Date.now() - 86400000), 'Jane Smith', 'jane@example.com', 'Sample response 2']
  ];
  
  // Create test config
  const testConfig: FormSheetInfo = {
    sheetId: 0,
    sheetName: 'Test Sheet',
    formEditUrl: '',
    notificationsEnabled: true,
    emailRecipients: [testEmail],
    interval: '1hr',
    startHour: 8,
    endHour: 22
  };
  
  notifyEntries(testConfig, sampleHeaders, sampleEntries);
}
