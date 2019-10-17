export async function onInstalled() {
  await clearStorage();
  reinjectContentScripts();
}

function clearStorage() {
  return new Promise(resolve =>
    chrome.storage.local.clear(resolve));
}

async function reinjectContentScripts() {
  chrome.runtime.getManifest().content_scripts.forEach(cs =>
    chrome.tabs.query({url: cs.matches}, tabs =>
      tabs.forEach(tab =>
        cs.js.forEach(file =>
          chrome.tabs.executeScript(tab.id, {
            file,
            runAt: cs.run_at,
            allFrames: cs.all_frames,
            matchAboutBlank: cs.match_about_blank,
          }, () => chrome.runtime.lastError)))));
}
