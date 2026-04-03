// TagTag — Background Service Worker

// Open options page when extension icon is clicked (fallback if no popup)
chrome.action.onClicked.addListener(() => {
  chrome.runtime.openOptionsPage();
});

// Listen for install to seed default data
chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    // Open options page on first install
    chrome.runtime.openOptionsPage();
  }
});

// Message handler for communication between popup/options/content
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'openOptions') {
    chrome.runtime.openOptionsPage();
    sendResponse({ ok: true });
  }
  if (message.action === 'getTabCount') {
    chrome.tabs.query({}, (tabs) => {
      sendResponse({ count: tabs.length });
    });
    return true; // async sendResponse
  }
});
