'use strict';

/** @param {MessageEvent} e */
navigator.serviceWorker.onmessage = async e => {
  const jobs = e.data.map(makeCode);
  const res = await Promise.all(jobs);
  e.ports[0].postMessage(res);
};
navigator.serviceWorker.startMessages();

async function makeCode(host) {
  const name = host.match(/\/\/(?:\*\.)?([^/]+)/)[1];
  const css = await (await fetch(`/themes/${name}.css`)).text();
  const light = [];
  const shadow = [];
  const selectors = [];
  const prefix = '_' + String(Math.random()).slice(2);
  const source = new CSSStyleSheet();
  source.replaceSync(
    css.replace(/@shadow\s+([^{]*)/g, (s, m1) =>
      `@media ${prefix}${selectors.push(m1.trim())}`));
  for (const /** @type CSSMediaRule */ rule of source.cssRules) {
    let {cssText: text} = rule;
    if (rule.media && rule.conditionText.startsWith(prefix)) {
      const sel = selectors[rule.conditionText.slice(prefix.length) - 1];
      text = text.slice(text.indexOf('{') + 1, -1).trim();
      shadow.push([sel, text]);
    } else {
      light.push(text);
    }
  }
  return [
    host,
    chrome.runtime.id,
    light.join(''),
    shadow.length && shadow,
  ];
}
