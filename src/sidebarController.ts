type FormSheetInfo = {
  sheetId: number;
  sheetName: string;
  formEditUrl: string;
  notificationsEnabled: boolean;
  emailRecipients: string[];
  interval: NotificationInterval;
  startHour: number;
  endHour: number;
};

/**
 * Opens the sidebar
 */
function openSidebar(): void {
  const html = HtmlService.createHtmlOutputFromFile("src/sidebar")
    .setTitle("Form Notifications Manager")
    .setWidth(400);
  SpreadsheetApp.getUi().showSidebar(html);
}

/**
 * Creates default config for a sheet
 */
function createDefaultConfig(sheetId: number, overrides: Partial<SheetNotificationConfig> = {}): SheetNotificationConfig {
  return {
    sheetId,
    enabled: false,
    emailRecipients: [],
    interval: '1hr',
    startHour: 8,
    endHour: 22,
    ...overrides
  };
}

/**
 * Builds FormSheetInfo from sheet and config
 */
function buildFormSheetInfo(sheet: GoogleAppsScript.Spreadsheet.Sheet, form: GoogleAppsScript.Forms.Form, config: SheetNotificationConfig | null): FormSheetInfo {
  return {
    sheetId: sheet.getSheetId(),
    sheetName: sheet.getName(),
    formEditUrl: form.getEditUrl(),
    notificationsEnabled: config?.enabled ?? false,
    emailRecipients: config?.emailRecipients ?? [],
    interval: config?.interval ?? '1hr',
    startHour: config?.startHour ?? 8,
    endHour: config?.endHour ?? 22,
  };
}

/**
 * Gets all sheets that are connected to forms
 * Scans all sheets in the spreadsheet and returns those with form links
 */
function getFormSheets(): FormSheetInfo[] {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheets = spreadsheet.getSheets();
  const formSheets: FormSheetInfo[] = [];

  console.log(`Scanning ${sheets.length} sheets for form connections`);

  sheets.forEach((sheet) => {
    const formUrl = sheet.getFormUrl();
    
    // Only process sheets that have a linked form
    if (formUrl) {
      try {
        const form = FormApp.openByUrl(formUrl);
        const config = getSheetNotificationConfig(sheet.getSheetId());
        formSheets.push(buildFormSheetInfo(sheet, form, config));
        console.log(`  ✓ "${sheet.getName()}" - notifications ${config?.enabled ? 'ON' : 'OFF'}`);
      } catch (error) {
        console.error(`  ✗ Error processing "${sheet.getName()}":`, error);
      }
    }
  });

  console.log(`Found ${formSheets.length} form-linked sheets`);
  return formSheets;
}

/**
 * Gets or creates config for a sheet
 */
function getOrCreateConfig(sheetId: number, overrides: Partial<SheetNotificationConfig> = {}): SheetNotificationConfig {
  const existing = getSheetNotificationConfig(sheetId);
  return existing ? { ...existing, ...overrides } : createDefaultConfig(sheetId, overrides);
}

/**
 * Toggles notifications for a specific sheet
 */
function toggleNotifications(sheetId: number, enabled: boolean): boolean {
  try {
    const config = getOrCreateConfig(sheetId, { enabled });
    saveSheetNotificationConfig(config);
    console.log(`Notifications ${enabled ? 'enabled' : 'disabled'} for sheet ${sheetId}`);
    return true;
  } catch (error) {
    console.error(`Error toggling notifications:`, error);
    return false;
  }
}

/**
 * Updates email recipients for a specific sheet
 */
function updateEmailRecipients(sheetId: number, emailsString: string): boolean {
  try {
    const emails = parseEmailList(emailsString);
    const config = getOrCreateConfig(sheetId, { emailRecipients: emails });
    saveSheetNotificationConfig(config);
    console.log(`Updated recipients for sheet ${sheetId}: ${emails.length} emails`);
    return true;
  } catch (error) {
    console.error(`Error updating recipients:`, error);
    return false;
  }
}

/**
 * Checks if config is valid for notifications
 */
function isConfigValid(config: SheetNotificationConfig): boolean {
  return config.enabled && config.emailRecipients.length > 0;
}

/**
 * Gets all enabled sheet configurations for the notification system
 * Only returns configs that are enabled AND have email recipients
 */
function getEnabledNotificationConfigs(): FormSheetInfo[] {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const allConfigs = getAllSheetNotificationConfigs();
  const enabledConfigs: FormSheetInfo[] = [];

  console.log(`Checking ${allConfigs.length} configs for enabled notifications`);

  allConfigs.forEach((config) => {
    // Skip if not enabled or no recipients
    if (!isConfigValid(config)) return;
    
    const sheet = spreadsheet.getSheets().find((s) => s.getSheetId() === config.sheetId);
    if (!sheet) return;
    
    const formUrl = sheet.getFormUrl();
    if (!formUrl) return;
    
    try {
      const form = FormApp.openByUrl(formUrl);
      enabledConfigs.push(buildFormSheetInfo(sheet, form, config));
    } catch (error) {
      console.error(`Error loading form for "${sheet.getName()}":`, error);
    }
  });

  console.log(`Found ${enabledConfigs.length} enabled notification configs`);
  return enabledConfigs;
}

/**
 * Updates notification settings for a specific sheet
 */
function updateSheetNotificationSettings(
  sheetId: number,
  interval: NotificationInterval,
  startHour: number,
  endHour: number
): boolean {
  try {
    const config = getOrCreateConfig(sheetId, { interval, startHour, endHour });
    saveSheetNotificationConfig(config);
    console.log(`Updated settings for sheet ${sheetId}: ${interval}, ${startHour}:00-${endHour}:00`);
    return true;
  } catch (error) {
    console.error(`Error updating settings:`, error);
    return false;
  }
}


/**
 * Gets global notification settings for the sidebar (deprecated - keeping for backward compatibility)
 */
function getGlobalSettings(): GlobalNotificationSettings & {
  triggerActive: boolean;
} {
  const settings = getGlobalNotificationSettings();
  const triggerStatus = getNotificationTriggerStatus();

  return {
    ...settings,
    triggerActive: triggerStatus.active,
  };
}

/**
 * Starts the notification trigger
 */
function startNotificationTrigger(): boolean {
  return setupNotificationTrigger();
}

/**
 * Stops the notification trigger
 */
function stopNotificationTrigger(): boolean {
  return removeNotificationTrigger();
}

/**
 * Validates manual send prerequisites
 * Returns error message if validation fails, null if valid
 */
function validateManualSend(sheet: GoogleAppsScript.Spreadsheet.Sheet | undefined, config: SheetNotificationConfig | null): string | null {
  if (!sheet) return 'Sheet not found';
  if (!config || !config.enabled) return 'Notifications are not enabled for this sheet';
  if (!config.emailRecipients || config.emailRecipients.length === 0) return 'No email recipients configured';
  return null; // All validations passed
}

/**
 * Manually sends notifications for a specific sheet
 * Uses same logic as automatic notifications (only sends new entries)
 */
function sendNotificationsManually(sheetId: number): { sent: boolean; count?: number; recipients?: number; message?: string } {
  console.log(`Manual send requested for sheet ${sheetId}`);
  
  try {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = spreadsheet.getSheets().find(s => s.getSheetId() === sheetId);
    const config = getSheetNotificationConfig(sheetId);
    
    // Validate prerequisites
    const validationError = validateManualSend(sheet, config);
    if (validationError) {
      console.log(`Validation failed: ${validationError}`);
      return { sent: false, message: validationError };
    }
    
    // Get sheet data
    const sheetData = getSheetData(sheet!);
    if (!sheetData) {
      return { sent: false, message: 'No data entries found in sheet' };
    }
    
    const { headers, currentRows } = sheetData;
    const savedEntries = getSavedEntries(sheetId);
    const newEntries = findNewEntries(currentRows, savedEntries);
    
    if (newEntries.length === 0) {
      console.log(`No new entries to send`);
      return { sent: false, message: 'No new entries since last notification' };
    }
    
    // Build config and send notifications
    const formUrl = sheet!.getFormUrl();
    const form = formUrl ? FormApp.openByUrl(formUrl) : null;
    const formSheetInfo = buildFormSheetInfo(sheet!, form!, config!);
    
    notifyEntries(formSheetInfo, headers, newEntries);
    saveEntries(sheetId, currentRows);
    
    console.log(`✓ Manual send complete: ${newEntries.length} entries to ${config!.emailRecipients.length} recipients`);
    
    return { 
      sent: true, 
      count: newEntries.length,
      recipients: config!.emailRecipients.length
    };
  } catch (error) {
    console.error('Manual send failed:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to send notifications: ${errorMessage}`);
  }
}


/**
 * Creates a new Google Form and links it to the spreadsheet
 * Returns immediately with the form URL
 */
function createFormQuick(formName: string): { success: boolean; formUrl: string; formId: string } {
  try {
    if (!formName || formName.trim().length === 0) {
      throw new Error('Form name cannot be empty');
    }

    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const form = FormApp.create(formName);
    
    form.setDestination(FormApp.DestinationType.SPREADSHEET, spreadsheet.getId());
    SpreadsheetApp.flush();
    
    console.log(`Created form "${formName}" (ID: ${form.getId()})`);
    
    return {
      success: true,
      formUrl: form.getEditUrl(),
      formId: form.getId()
    };
  } catch (error) {
    console.error('Form creation failed:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to create form: ${errorMessage}`);
  }
}

/**
 * Finds sheet by form ID with retry logic
 * Google takes a few seconds to create the response sheet after form creation
 */
function findSheetByFormId(spreadsheet: GoogleAppsScript.Spreadsheet.Spreadsheet, formId: string, maxAttempts: number = 6): GoogleAppsScript.Spreadsheet.Sheet | null {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    // Wait before checking (3s first attempt, 2s subsequent)
    Utilities.sleep(attempt === 1 ? 3000 : 2000);
    
    const sheets = spreadsheet.getSheets();
    for (const sheet of sheets) {
      const formUrl = sheet.getFormUrl();
      if (formUrl) {
        try {
          const linkedForm = FormApp.openByUrl(formUrl);
          if (linkedForm.getId() === formId) {
            console.log(`✓ Found sheet "${sheet.getName()}" (attempt ${attempt}/${maxAttempts})`);
            return sheet;
          }
        } catch (e) {
          // Form URL exists but can't open - skip this sheet
          continue;
        }
      }
    }
    
    if (attempt < maxAttempts) {
      console.log(`Sheet not found yet, retrying... (${attempt}/${maxAttempts})`);
    }
  }
  
  console.error(`Failed to find sheet after ${maxAttempts} attempts`);
  return null;
}

/**
 * Finds and renames the sheet created by a form
 * This runs in the background after the form is created
 * Note: Runs asynchronously - form is already accessible to user
 */
function renameFormSheet(formId: string, desiredSheetName: string): { success: boolean; sheetName?: string } {
  console.log(`Background task: Renaming sheet for form ${formId} to "${desiredSheetName}"`);
  
  try {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    
    // Wait for Google to create the response sheet
    const formResponseSheet = findSheetByFormId(spreadsheet, formId);
    
    if (!formResponseSheet) {
      throw new Error('Could not find the form response sheet after 6 attempts');
    }
    
    const originalName = formResponseSheet.getName();
    console.log(`Current name: "${originalName}"`);
    
    // Activate the sheet so user sees it
    spreadsheet.setActiveSheet(formResponseSheet);
    SpreadsheetApp.flush();
    
    // Attempt to rename
    try {
      formResponseSheet.setName(desiredSheetName);
      // Multiple flushes ensure rename is persisted
      SpreadsheetApp.flush();
      Utilities.sleep(500);
      SpreadsheetApp.flush();
      
      console.log(`✓ Renamed "${originalName}" → "${desiredSheetName}"`);
    } catch (renameError) {
      console.error(`Rename failed (sheet still usable):`, renameError);
    }
    
    return {
      success: true,
      sheetName: desiredSheetName
    };
  } catch (error) {
    console.error('Sheet rename failed:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to rename sheet: ${errorMessage}`);
  }
}
