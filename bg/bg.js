export {onNavigation};
export const cache = new Map();

const queue = new Map();
const filter = {
  url: chrome.runtime.getManifest().content_scripts[0].matches
    .map(m => ({urlPrefix: m.slice(0, -1)})),
};

chrome.webNavigation.onBeforeNavigate.addListener(onNavigation, filter);
chrome.webNavigation.onCommitted.addListener(onNavigation, filter);

chrome.runtime.onInstalled.addListener(async () => {
  (await import('./bg-install.js')).onInstalled();
});

async function onNavigation({url, id, tabId = id, frameId}) {
  const host = new URL(url).hostname;
  let tabs = queue.get(host);
  if (tabs) {
    tabs.add(tabId);
    return;
  }
  const msg = !cache ? {} : {
    code: cache.get('!code'),
    theme: cache.get(host),
  };
  if (!msg.code || !msg.theme) {
    queue.set(host, new Set([tabId]));
    await (await import('./bg-maker.js')).makeMessage(msg, host);
    tabs = queue.get(host);
    queue.delete(host);
  }
  for (const id of tabs || [tabId])
    chrome.tabs.sendMessage(id, msg, frameId >= 0 ? {frameId} : undefined);
}
