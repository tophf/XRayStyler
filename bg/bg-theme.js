export async function fromSource(hostname) {
  const url = chrome.runtime.getURL(`themes/${hostname}.css`);
  const css = await (await fetch(url)).text();
  const nonshadow = [];
  const bySelector = [];
  const selectors = [];
  const prefix = '_' + String(Math.random()).slice(2);
  const source = new CSSStyleSheet();
  await source.replace(
    css.replace(/@shadow\s+([^{]*)/g, (s, m1) =>
      `@media ${prefix}${selectors.push(m1.trim())}`));
  for (const /** @type CSSMediaRule */ rule of source.cssRules) {
    let {cssText: text} = rule;
    if (rule.media && rule.conditionText.startsWith(prefix)) {
      const sel = selectors[rule.conditionText.slice(prefix.length) - 1];
      text = text.slice(text.indexOf('{') + 1, -1).trim();
      bySelector.push([sel, text]);
    } else {
      nonshadow.push(text);
    }
  }
  const theme = {
    light: nonshadow.length && nonshadow.join(''),
    bySelector: bySelector.length && bySelector,
  };
  chrome.storage.local.set({[hostname]: theme});
  return theme;
}
