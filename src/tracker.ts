
/**
 * Gets the sheet data including headers and data rows
 * @param sheet - The Google Sheets sheet to extract data from
 * @returns Object containing headers and rows, or null if no data
 */
function getSheetData(sheet: GoogleAppsScript.Spreadsheet.Sheet): { headers: any[], currentRows: any[][] } | null {
  const range = sheet.getDataRange();
  const numRows = range.getNumRows();
  
  if (numRows <= 1) {
    console.log(`No data in "${sheet.getName()}"`);
    return null;
  }
  
  const allData = range.getValues();
  const headers = allData[0];
  const currentRows = allData.slice(1);
  
  console.log(`"${sheet.getName()}": ${currentRows.length} rows, ${headers.length} columns`);
  return { headers, currentRows };
}


/**
 * Finds new entries by comparing current rows with saved entries
 * Uses JSON comparison for exact matching
 * @param currentRows - Current rows from the sheet
 * @param savedEntries - Previously saved/notified rows
 * @returns Array of new entries that haven't been notified
 */
function findNewEntries(currentRows: any[][], savedEntries: any[][]): any[][] {
  const newEntries = currentRows.filter(currentRow => {
    return !savedEntries.some(savedRow => 
      JSON.stringify(currentRow) === JSON.stringify(savedRow)
    );
  });
  
  console.log(`Found ${newEntries.length} new of ${currentRows.length} total entries`);
  return newEntries;
}


/**
 * Processes a single tracked sheet configuration
 * Main workflow: get data → find new entries → send notifications → save state
 * @param config - Sheet configuration with notification settings
 */
function processTrackedSheet(config: FormSheetInfo): void {
  try {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = spreadsheet.getSheetByName(config.sheetName);
    
    if (!sheet) {
      console.warn(`Sheet "${config.sheetName}" not found`);
      return;
    }
    
    const sheetId = sheet.getSheetId();
    const sheetData = getSheetData(sheet);
    if (!sheetData) return;
    
    const { headers, currentRows } = sheetData;
    const savedEntries = getSavedEntries(sheetId);
    const newEntries = findNewEntries(currentRows, savedEntries);
    
    if (newEntries.length > 0) {
      console.log(`Notifying ${newEntries.length} new entries`);
      notifyEntries(config, headers, newEntries);
    }
    
    saveEntries(sheetId, currentRows);
    
  } catch (error) {
    console.error(`Error processing "${config.sheetName}":`, error);
    throw error;
  }
}

/**
 * Main function to notify recipients about new entries in tracked sheets
 * Processes each sheet configuration sequentially
 * @param trackedSheetConfigs - Array of sheet configurations to process
 */
function notifyTrackedSheets(trackedSheetConfigs: FormSheetInfo[]): void {
  console.log(`Processing ${trackedSheetConfigs.length} sheets`);
  
  let successCount = 0;
  let errorCount = 0;
  
  trackedSheetConfigs.forEach((config, index) => {
    try {
      console.log(`\n[${index + 1}/${trackedSheetConfigs.length}] "${config.sheetName}"`);
      processTrackedSheet(config);
      successCount++;
    } catch (error) {
      console.error(`Failed "${config.sheetName}":`, error);
      errorCount++;
    }
  });
  
  console.log(`\nComplete: ${successCount} success, ${errorCount} errors`);
}

