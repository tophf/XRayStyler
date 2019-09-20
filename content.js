'use strict';

const EVENT_ID = chrome.runtime.id + String(Math.random()).slice(1);

document.documentElement.appendChild(
  Object.assign(document.createElement('script'), {
    textContent: `document.currentScript.remove();(${inPage})('${EVENT_ID}')`,
  }));

window.dispatchEvent(new CustomEvent(EVENT_ID, {
  detail: /* language=CSS */ `
    a:visited:not(.bigTitle):not([target="_blank"]) {
      color: #e094f3;
    }
    a:link:not(.bigTitle):not([target="_blank"]) {
      color: #8dcfff;
    }
    #output {
      font-family: sans-serif;
    }
  `,
}));

function inPage(eventId) {
  const style = new CSSStyleSheet();
  document.adoptedStyleSheets = [...document.adoptedStyleSheets, style];

  const {attachShadow} = Element.prototype;
  Element.prototype.attachShadow = onAttach;

  const describe = Object.getOwnPropertyDescriptor;
  const define = Object.defineProperty;
  const docAss = describe(Document.prototype, 'adoptedStyleSheets');
  const shadowAss = describe(ShadowRoot.prototype, 'adoptedStyleSheets');
  define(Document.prototype, 'adoptedStyleSheets', {...docAss, set: setOnDoc});
  define(ShadowRoot.prototype, 'adoptedStyleSheets', {...shadowAss, set: setOnShadow});

  window.addEventListener(eventId, onMessage);

  if (document.body)
    reassess(document, true, docAss);

  function onAttach() {
    const root = attachShadow.apply(this, arguments);
    setOnShadow.call(root, []);
    return root;
  }

  function onMessage(e) {
    style.replaceSync(e.detail);
  }

  function reassess(root, ass = shadowAss) {
    const sheets = ass.get.call(root);
    if (!sheets.includes(style))
      ass.set.call(root, [...sheets, style]);
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);
    for (let el; (el = walker.nextNode());)
      if (el.shadowRoot)
        reassess(el.shadowRoot);
  }

  function setOnDoc(sheets) {
    return docAss.set.call(this, setStyle(sheets));
  }

  function setOnShadow(sheets) {
    return shadowAss.set.call(this, setStyle(sheets));
  }

  function setStyle(sheets) {
    // TODO: make a few attempts to move our style to the end of the array
    return Array.isArray(sheets) && !sheets.includes(style) ?
      [...sheets, style] :
      sheets;
  }
}
