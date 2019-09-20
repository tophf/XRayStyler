'use strict';

const EVENT_ID = chrome.runtime.id + String(Math.random()).slice(1);

document.documentElement.appendChild(
  Object.assign(document.createElement('script'), {
    textContent: `document.currentScript.remove();(${inPage})('${EVENT_ID}')`,
  }));

window.dispatchEvent(new CustomEvent(EVENT_ID, {
  detail: /* language=CSS */ `
    .text .gr-account-label {
      max-width: 10em;
      white-space: nowrap;
      text-overflow: ellipsis;
      overflow: hidden;
      display: block;
    }
    .gr-account-label[title] {
      display: flex;
      flex-direction: row;
    }
    .gr-linked-text-0 {
      font-family: sans-serif;
    }
    gr-limited-text.style-scope.gr-account-label,
    span.name.style-scope.gr-account-label {
      display: inline;
    }
    .subject a:visited {
      color: #e094f3;
    }
    .subject a:link {
      color: #8dcfff;
    }
    .gr-change-view-2 .commitMessage.gr-change-view {
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
