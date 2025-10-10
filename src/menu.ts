/**
 * Creates the custom menu when the spreadsheet opens
 * This is called automatically by Google Sheets
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('Form Manager')
    .addItem('Open Form Manager', 'openSidebar')
    .addToUi();
}

/**
 * Called when the add-on is installed
 */
function onInstall(e: any) {
  onOpen();
}