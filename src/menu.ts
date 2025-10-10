/**
 * Creates custom menu when spreadsheet opens
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('Form Manager')
    .addItem('Open Form Manager', 'openSidebar')
    .addToUi();
}