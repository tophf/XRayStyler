'use strict';

// reinject
chrome.runtime.getManifest().content_scripts.forEach(cs =>
  chrome.tabs.query({url: cs.matches}, tabs =>
    tabs.forEach(tab =>
      cs.js.forEach(file =>
        chrome.tabs.executeScript(tab.id, {
          file,
          runAt: cs.run_at,
          allFrames: cs.all_frames,
          matchAboutBlank: cs.exclude_matches,
        }, () => chrome.runtime.lastError)))));
