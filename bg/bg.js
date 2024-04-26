import pageFunc from './bg-page.js';

if ((() => {
  try { return chrome.userScripts; } catch (e) { postOffscreen(); }
})()) chrome.runtime.onInstalled.addListener(async e => {
  if (e.reason !== 'update' && e.reason !== 'install')
    return;
  const hosts = chrome.runtime.getManifest().host_permissions;
  const funcStr = `${pageFunc}`;
  const themes = await postOffscreen(hosts);

  const old = await chrome.userScripts.getScripts();
  if (old[0]) await chrome.userScripts.unregister({ids: old.map(_ => _.id)});

  await chrome.userScripts.register(themes.map(([host, ...args]) => ({
    id: host,
    matches: [host + '*'],
    runAt: 'document_start',
    world: 'MAIN',
    js: [{code: `(${funcStr})(${JSON.stringify(args).slice(1, -1)})`}],
  })));

  for (const [host, ...args] of themes) {
    for (const tab of await chrome.tabs.query({url: host + '*'})) {
      chrome.scripting.executeScript({
        target: {tabId: tab.id},
        world: 'MAIN',
        injectImmediately: true,
        func: pageFunc,
        args,
      }).catch(() => 0);
    }
  }
});

async function postOffscreen(msg) {
  await chrome.offscreen.createDocument({
    url: '/bg/offscreen.html',
    reasons: ['DOM_PARSER'],
    justification: 'Yes',
  }).catch(() => 0);
  const [client] = await self.clients.matchAll({includeUncontrolled: true});
  const mc = new MessageChannel();
  const pr = Promise.withResolvers();
  mc.port1.onmessage = pr.resolve;
  client.postMessage(msg, [mc.port2]);
  const {data: res} = await pr.promise;
  chrome.offscreen.closeDocument();
  return res;
}
