/**
 * Utility functions for Form Manager
 */

/**
 * Validates an email address
 */
function isValidEmail(email: string): boolean {
  if (!email || email.trim().length === 0) {
    return false;
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Parses a comma or semicolon-separated list of emails
 */
function parseEmailList(emailString: string): string[] {
  if (!emailString || emailString.trim().length === 0) {
    return [];
  }
  
  // Split by comma or semicolon
  const emails = emailString
    .split(/[,;]/)
    .map(email => email.trim())
    .filter(email => email.length > 0);
  
  return emails;
}

/**
 * Checks if current time is within the specified hour window
 */
function isWithinTimeWindow(date: Date, startHour: number, endHour: number): boolean {
  const currentHour = date.getHours();
  return currentHour >= startHour && currentHour <= endHour;
}

/**
 * Validates notification interval
 */
function isValidInterval(interval: string): boolean {
  const validIntervals: NotificationInterval[] = ['5min', '15min', '30min', '1hr', '2hr', '24hr'];
  return validIntervals.includes(interval as NotificationInterval);
}

/**
 * Converts interval string to milliseconds
 */
function intervalToMilliseconds(interval: NotificationInterval): number {
  const intervalMap: Record<NotificationInterval, number> = {
    '5min': 5 * 60 * 1000,
    '15min': 15 * 60 * 1000,
    '30min': 30 * 60 * 1000,
    '1hr': 60 * 60 * 1000,
    '2hr': 2 * 60 * 60 * 1000,
    '24hr': 24 * 60 * 60 * 1000
  };
  
  return intervalMap[interval];
}

/**
 * Formats interval for display
 */
function formatInterval(interval: NotificationInterval): string {
  const intervalNames: Record<NotificationInterval, string> = {
    '5min': '5 minutes',
    '15min': '15 minutes',
    '30min': '30 minutes',
    '1hr': '1 hour',
    '2hr': '2 hours',
    '24hr': '24 hours'
  };
  
  return intervalNames[interval];
}

/**
 * Sanitizes sheet name for use in keys
 */
function sanitizeSheetName(sheetName: string): string {
  return sheetName.replace(/[^a-zA-Z0-9_]/g, '_');
}

/**
 * Validates hour range (0-23)
 */
function isValidHour(hour: number): boolean {
  return Number.isInteger(hour) && hour >= 0 && hour <= 23;
}

/**
 * Validates time window (start < end)
 */
function isValidTimeWindow(startHour: number, endHour: number): boolean {
  return isValidHour(startHour) && isValidHour(endHour) && startHour <= endHour;
}
