import {cache} from './bg.js';

export async function makeMessage(msg, host) {
  const [code, theme] = await Promise.all([
    msg.code ||
      readFile('/content/page.js'),
    msg.theme ||
      readStorage(host).then(async theme =>
        theme || (await import('./bg-theme.js')).fromSource(host)),
  ]);
  if (!msg.code)
    cache.set('!code', (msg.code = code));
  if (!msg.theme)
    cache.set(host, (msg.theme = theme));
}

export async function readFile(path) {
  return (await fetch(path)).text();
}

export function readStorage(key) {
  return new Promise(resolve =>
    chrome.storage.local.get(key, _ =>
      resolve(typeof key === 'string' ? _[key] : _)));
}
