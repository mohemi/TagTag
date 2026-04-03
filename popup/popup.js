// TagTag — Popup Script

document.addEventListener('DOMContentLoaded', async () => {
  const $tabCount = document.getElementById('tabCount');
  const $openBtn = document.getElementById('openBtn');

  // Show tab count
  try {
    const tabs = await chrome.tabs.query({});
    $tabCount.textContent = `${tabs.length} tabs open`;
  } catch {
    $tabCount.textContent = '-- tabs open';
  }

  // Open options page
  $openBtn.addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
    window.close();
  });
});
