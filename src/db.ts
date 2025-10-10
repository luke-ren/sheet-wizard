const FORM_MANAGER_PREFIX = 'form_manager_';

type NotificationInterval = '5min' | '15min' | '30min' | '1hr' | '2hr' | '24hr';

type SheetNotificationConfig = {
  sheetId: number;
  enabled: boolean;
  emailRecipients: string[];
  interval: NotificationInterval;
  startHour: number; // 0-23
  endHour: number;   // 0-23
};

type GlobalNotificationSettings = {
  interval: NotificationInterval;
  startHour: number; // 0-23
  endHour: number;   // 0-23
};


/**
 * Gets previously saved entries for a sheet
 */
function getSavedEntries(sheetId: number): any[][] {
  const properties = PropertiesService.getScriptProperties();
  const savedEntriesKey = `${FORM_MANAGER_PREFIX}saved_entries_${sheetId}`;
  const savedEntriesJson = properties.getProperty(savedEntriesKey);
  return savedEntriesJson ? JSON.parse(savedEntriesJson) : [];
}

/**
 * Saves entries for a sheet
 */
function saveEntries(sheetId: number, entries: any[][]): void {
  const properties = PropertiesService.getScriptProperties();
  const savedEntriesKey = `${FORM_MANAGER_PREFIX}saved_entries_${sheetId}`;
  properties.setProperty(savedEntriesKey, JSON.stringify(entries));
  console.log(`Saved ${entries.length} entries for sheet ID ${sheetId}`);
}

/**
 * Gets notification configuration for a specific sheet
 */
function getSheetNotificationConfig(sheetId: number): SheetNotificationConfig | null {
  const properties = PropertiesService.getScriptProperties();
  const configKey = `${FORM_MANAGER_PREFIX}notification_config_${sheetId}`;
  const configJson = properties.getProperty(configKey);
  
  if (configJson) {
    const config = JSON.parse(configJson);
    // Provide defaults for new fields if they don't exist (backward compatibility)
    return {
      ...config,
      interval: config.interval || '1hr',
      startHour: config.startHour !== undefined ? config.startHour : 8,
      endHour: config.endHour !== undefined ? config.endHour : 22
    };
  }
  
  return null;
}

/**
 * Saves notification configuration for a specific sheet
 */
function saveSheetNotificationConfig(config: SheetNotificationConfig): void {
  const properties = PropertiesService.getScriptProperties();
  const configKey = `${FORM_MANAGER_PREFIX}notification_config_${config.sheetId}`;
  properties.setProperty(configKey, JSON.stringify(config));
}

/**
 * Gets all sheet notification configurations
 */
function getAllSheetNotificationConfigs(): SheetNotificationConfig[] {
  const properties = PropertiesService.getScriptProperties();
  const allProps = properties.getProperties();
  const configs: SheetNotificationConfig[] = [];
  
  Object.keys(allProps).forEach(key => {
    if (key.startsWith(`${FORM_MANAGER_PREFIX}notification_config_`)) {
      const config = JSON.parse(allProps[key]);
      configs.push(config);
    }
  });
  
  return configs;
}

/**
 * Deletes notification configuration for a specific sheet
 */
function deleteSheetNotificationConfig(sheetId: number): void {
  const properties = PropertiesService.getScriptProperties();
  const configKey = `${FORM_MANAGER_PREFIX}notification_config_${sheetId}`;
  properties.deleteProperty(configKey);
}

/**
 * Gets global notification settings
 */
function getGlobalNotificationSettings(): GlobalNotificationSettings {
  const properties = PropertiesService.getScriptProperties();
  const settingsKey = `${FORM_MANAGER_PREFIX}global_settings`;
  const settingsJson = properties.getProperty(settingsKey);
  
  if (settingsJson) {
    return JSON.parse(settingsJson);
  }
  
  // Return defaults
  return {
    interval: '1hr',
    startHour: 8,
    endHour: 22
  };
}

/**
 * Saves global notification settings
 */
function saveGlobalNotificationSettings(settings: GlobalNotificationSettings): void {
  const properties = PropertiesService.getScriptProperties();
  const settingsKey = `${FORM_MANAGER_PREFIX}global_settings`;
  properties.setProperty(settingsKey, JSON.stringify(settings));
}

/**
 * Gets the last notification time for a sheet
 * Returns null if never notified
 */
function getLastNotificationTime(sheetId: number): number | null {
  const properties = PropertiesService.getDocumentProperties();
  const lastNotifyKey = `${FORM_MANAGER_PREFIX}last_notify_${sheetId}`;
  const lastNotifyStr = properties.getProperty(lastNotifyKey);
  
  if (!lastNotifyStr) {
    return null;
  }
  
  return parseInt(lastNotifyStr, 10);
}

/**
 * Sets the last notification time for a sheet
 */
function setLastNotificationTime(sheetId: number, timestamp: number): void {
  const properties = PropertiesService.getDocumentProperties();
  const lastNotifyKey = `${FORM_MANAGER_PREFIX}last_notify_${sheetId}`;
  properties.setProperty(lastNotifyKey, timestamp.toString());
}
