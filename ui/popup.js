'use strict';

try {
  if (chrome.userScripts)
    document.body.textContent = 'OK';
} catch (e) {
  document.body.style.cssText += ';min-width:200px; cursor: pointer;';
  onclick = () => chrome.tabs.update({url: 'chrome://extensions'});
}
