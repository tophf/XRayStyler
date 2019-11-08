import {hosts} from './bg.js';

const contentScripts = ['/content/content.js'];

export async function onInstalled() {
  await clearStorage();
  reinjectContentScripts();
  registerContentScripts();
}

function clearStorage() {
  return new Promise(resolve =>
    chrome.storage.local.clear(resolve));
}

function registerContentScripts() {
  chrome.declarativeContent.onPageChanged.removeRules(() => {
    chrome.declarativeContent.onPageChanged.addRules([{
      conditions: hosts.map(urlPrefix =>
        new chrome.declarativeContent.PageStateMatcher({pageUrl: {urlPrefix}})),
      actions: [
        new chrome.declarativeContent.RequestContentScript({js: contentScripts}),
      ],
    }]);
  });
}

function reinjectContentScripts() {
  const ignoreRuntimeError = () => chrome.runtime.lastError;
  chrome.tabs.query({url: hosts.map(h => h + '*')}, tabs =>
    tabs.forEach(tab =>
      contentScripts.forEach(file =>
        chrome.tabs.executeScript(tab.id, {
          file,
          runAt: 'document_start',
        }, ignoreRuntimeError))));
}
