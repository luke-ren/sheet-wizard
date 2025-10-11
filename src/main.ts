/**
 * Main entry point for Form Manager
 * This file is loaded by Google Apps Script
 */

/**
 * Add-on homepage trigger - opens the sidebar
 */
function onHomepage(e: any) {
  return showSidebar();
}

/**
 * Called when file scope is granted
 */
function onFileScopeGranted(e: any) {
  return showSidebar();
}

/**
 * Shows the sidebar (used by add-on triggers)
 */
function showSidebar() {
  const html = HtmlService.createHtmlOutputFromFile('sidebar')
    .setTitle('Form Manager')
    .setWidth(350);
  
  SpreadsheetApp.getUi().showSidebar(html);
  
  // Return card for add-on (though sidebar is preferred)
  return CardService.newCardBuilder()
    .setHeader(CardService.newCardHeader().setTitle('Form Manager'))
    .addSection(
      CardService.newCardSection()
        .addWidget(
          CardService.newTextParagraph()
            .setText('Please use the sidebar for full functionality.')
        )
    )
    .build();
}

/**
 * Serves the documentation web app
 * This is the entry point for the web app deployment
 */
function doGet(e: any) {
  return HtmlService.createHtmlOutputFromFile('docs')
    .setTitle('Form Manager Documentation')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * Notifies recipients about new entries in tracked sheets
 */
function NotifyTrackedSheets() {
  // Get enabled notification configs from database
  const enabledConfigs = getEnabledNotificationConfigs();
  
  if (enabledConfigs.length === 0) {
    console.log('No sheets have notifications enabled');
    return;
  }
  
  // Filter configs based on their individual time windows
  const now = new Date();
  const currentHour = now.getHours();
  
  const configsInWindow = enabledConfigs.filter(config => {
    // Check if current time is within this sheet's notification window
    if (config.endHour < config.startHour) {
      // Crosses midnight
      return currentHour >= config.startHour || currentHour < config.endHour;
    }
    return currentHour >= config.startHour && currentHour < config.endHour;
  });
  
  if (configsInWindow.length === 0) {
    console.log(`All ${enabledConfigs.length} sheets are outside their notification windows`);
    return;
  }
  
  console.log(`Processing ${configsInWindow.length} of ${enabledConfigs.length} sheets within their notification windows`);
  notifyTrackedSheets(configsInWindow);
}