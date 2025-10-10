/**
 * Gets the interval in minutes for a given NotificationInterval
 */
function getIntervalMinutes(interval: NotificationInterval): number {
  switch (interval) {
    case '5min': return 5;
    case '15min': return 15;
    case '30min': return 30;
    case '1hr': return 60;
    case '2hr': return 120;
    case '24hr': return 1440;
    default: return 60;
  }
}

/**
 * Deletes all global tick triggers
 */
function deleteAllGlobalTickTriggers(): void {
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction() === 'globalTickHandler') {
      ScriptApp.deleteTrigger(trigger);
    }
  });
}

/**
 * Creates the global tick trigger (1 minute interval)
 * This can be created by any user - only one will exist
 */
function createGlobalTickTrigger(): void {
  // Delete existing tick triggers first (in case of duplicates)
  deleteAllGlobalTickTriggers();
  
  // Create new 1-minute tick trigger
  ScriptApp.newTrigger('globalTickHandler')
    .timeBased()
    .everyMinutes(1)
    .create();
  
  console.log('Created global tick trigger (1 minute interval)');
}

/**
 * Global tick handler - runs every minute
 * Checks each enabled sheet to see if it's time to send notifications
 */
function globalTickHandler(): void {
  console.log('Global tick - checking sheets...');
  
  try {
    const allConfigs = getAllSheetNotificationConfigs();
    const enabledConfigs = allConfigs.filter(c => c.enabled && c.emailRecipients.length > 0);
    
    if (enabledConfigs.length === 0) {
      console.log('No enabled sheets');
      return;
    }
    
    const now = new Date();
    const currentMinute = now.getTime();
    
    enabledConfigs.forEach(config => {
      // Check if it's time to notify this sheet
      if (shouldNotifySheet(config, currentMinute)) {
        console.log(`Time to notify sheet ${config.sheetId}`);
        processSheetNotification(config);
      }
    });
    
  } catch (error) {
    console.error('Global tick error:', error);
  }
}

/**
 * Calculates the next scheduled notification time based on start hour and interval
 */
function getNextScheduledTime(config: SheetNotificationConfig, currentTime: number): number {
  const now = new Date(currentTime);
  const intervalMinutes = getIntervalMinutes(config.interval);
  
  // For 24hr interval, always notify at start hour
  if (config.interval === '24hr') {
    const nextNotify = new Date(now);
    nextNotify.setHours(config.startHour, 0, 0, 0);
    
    // If we've passed today's start hour, schedule for tomorrow
    if (now.getHours() >= config.startHour) {
      nextNotify.setDate(nextNotify.getDate() + 1);
    }
    
    return nextNotify.getTime();
  }
  
  // For other intervals, align to start hour and interval boundaries
  // Example: start=8am, interval=2hr → notify at 8am, 10am, 12pm, 2pm, etc.
  const todayStart = new Date(now);
  todayStart.setHours(config.startHour, 0, 0, 0);
  
  // Calculate how many intervals have passed since start hour
  const msSinceStart = currentTime - todayStart.getTime();
  const intervalMs = intervalMinutes * 60 * 1000;
  
  // If before start hour today, next notification is at start hour
  if (msSinceStart < 0) {
    return todayStart.getTime();
  }
  
  // Calculate next interval boundary
  const intervalsPassed = Math.floor(msSinceStart / intervalMs);
  const nextInterval = intervalsPassed + 1;
  const nextNotifyTime = todayStart.getTime() + (nextInterval * intervalMs);
  
  return nextNotifyTime;
}

/**
 * Determines if a sheet should be notified based on its interval and last notification time
 */
function shouldNotifySheet(config: SheetNotificationConfig, currentTime: number): boolean {
  // Check time window
  const now = new Date(currentTime);
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  
  if (currentHour < config.startHour || currentHour > config.endHour) {
    return false;
  }
  
  // Get last notification time from db
  const lastNotifyTime = getLastNotificationTime(config.sheetId);
  
  if (lastNotifyTime === null) {
    // Never notified before - check if we're at a scheduled time
    const nextScheduled = getNextScheduledTime(config, currentTime);
    
    // For 24hr, only notify at start hour
    if (config.interval === '24hr') {
      return currentHour === config.startHour && currentMinute === 0;
    }
    
    // For other intervals, notify if we're at or past the next scheduled time
    return currentTime >= nextScheduled;
  }
  
  const nextScheduled = getNextScheduledTime(config, lastNotifyTime);
  
  // Notify if current time is at or past the next scheduled time
  return currentTime >= nextScheduled;
}

/**
 * Processes notification for a single sheet
 */
function processSheetNotification(config: SheetNotificationConfig): void {
  try {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = spreadsheet.getSheets().find(s => s.getSheetId() === config.sheetId);
    
    if (!sheet) {
      console.log(`Sheet ${config.sheetId} not found`);
      return;
    }
    
    const formUrl = sheet.getFormUrl();
    if (!formUrl) {
      console.log(`Sheet "${sheet.getName()}" has no form`);
      return;
    }
    
    const form = FormApp.openByUrl(formUrl);
    const formSheetInfo: FormSheetInfo = {
      sheetId: config.sheetId,
      sheetName: sheet.getName(),
      formEditUrl: form.getEditUrl(),
      notificationsEnabled: true,
      emailRecipients: config.emailRecipients,
      interval: config.interval,
      startHour: config.startHour,
      endHour: config.endHour
    };
    
    // Process the sheet (from tracker.ts)
    processTrackedSheet(formSheetInfo);
    
    // Update last notification time using db function
    setLastNotificationTime(config.sheetId, Date.now());
    
  } catch (error) {
    console.error(`Error processing sheet ${config.sheetId}:`, error);
  }
}

/**
 * Sets up the global tick trigger
 * Any user can call this - only one trigger will exist
 */
function setupNotificationTrigger(): boolean {
  try {
    const allConfigs = getAllSheetNotificationConfigs();
    const enabledConfigs = allConfigs.filter(c => c.enabled && c.emailRecipients.length > 0);
    
    if (enabledConfigs.length === 0) {
      console.log('No enabled sheets, not creating trigger');
      return false;
    }
    
    createGlobalTickTrigger();
    console.log('Global tick trigger created');
    return true;
  } catch (error) {
    console.error('Error setting up notification trigger:', error);
    return false;
  }
}

/**
 * Removes the global tick trigger
 */
function removeNotificationTrigger(): boolean {
  try {
    deleteAllGlobalTickTriggers();
    console.log('Removed global tick trigger');
    return true;
  } catch (error) {
    console.error('Error removing notification trigger:', error);
    return false;
  }
}

/**
 * Checks if current time is within the notification window
 */
function isWithinNotificationWindow(): boolean {
  const settings = getGlobalNotificationSettings();
  const now = new Date();
  const currentHour = now.getHours();
  
  // Handle cases where end hour is less than start hour (crosses midnight)
  if (settings.endHour < settings.startHour) {
    return currentHour >= settings.startHour || currentHour < settings.endHour;
  }
  
  return currentHour >= settings.startHour && currentHour < settings.endHour;
}

/**
 * Gets the status of the notification trigger
 */
function getNotificationTriggerStatus(): { active: boolean; interval: string } {
  const triggers = ScriptApp.getProjectTriggers();
  const notificationTrigger = triggers.find(t => t.getHandlerFunction() === 'NotifyTrackedSheets');
  const settings = getGlobalNotificationSettings();
  
  return {
    active: !!notificationTrigger,
    interval: settings.interval
  };
}
