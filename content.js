'use strict';

(() => {
  const GENERAL_BAND = chrome.runtime.id;
  const PRIVATE_BAND = chrome.runtime.id + String(Math.random()).slice(1);

  // kick out an orphaned content script
  window.dispatchEvent(new Event(GENERAL_BAND));
  window.addEventListener(GENERAL_BAND, function onGeneralBand() {
    try {
      // if the API succeeds it means someone tried to kick us out so we'll ignore it
      chrome.i18n.getUILanguage();
    } catch (e) {
      window.removeEventListener(GENERAL_BAND, onGeneralBand);
      window.dispatchEvent(new CustomEvent(PRIVATE_BAND, {detail: {selfDestruct: true}}));
    }
  });

  document.documentElement.appendChild(
    Object.assign(document.createElement('script'), {
      textContent: `document.currentScript.remove();(${inPage})('${PRIVATE_BAND}')`,
    }));

  window.dispatchEvent(new CustomEvent(PRIVATE_BAND, {
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
    let style = new CSSStyleSheet();
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
      if (style)
        setOnShadow.call(root, []);
      return root;
    }

    function onMessage(e) {
      if (typeof e.detail === 'string') {
        style.replaceSync(e.detail);
      } else if (e.detail && e.detail.selfDestruct) {
        selfDestruct();
      }
    }

    function reassess(root, state, ass = shadowAss) {
      const sheets = ass.get.call(root);
      if (sheets.includes(style) !== state)
        ass.set.call(root, state ?
          [...sheets, style] :
          sheets.filter(s => s !== style));
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);
      for (let el; (el = walker.nextNode());)
        if (el.shadowRoot)
          reassess(el.shadowRoot, state);
    }

    function setOnDoc(sheets) {
      return docAss.set.call(this, setStyle(sheets));
    }

    function setOnShadow(sheets) {
      return shadowAss.set.call(this, setStyle(sheets));
    }

    function setStyle(sheets) {
      // TODO: make a few attempts to move our style to the end of the array
      return style && Array.isArray(sheets) && !sheets.includes(style) ?
        [...sheets, style] :
        sheets;
    }

    function selfDestruct() {
      window.removeEventListener(eventId, onMessage);

      // we can only restore the old state if no one else chained on us
      // otherwise our orphan will have to stay and serve as a no-op relay
      if (Element.prototype.attachShadow === onAttach)
        Element.prototype.attachShadow = attachShadow;

      const curAss = describe(ShadowRoot.prototype, 'adoptedStyleSheets');
      if (curAss.set === setOnShadow &&
          curAss.get === shadowAss.get)
        define(ShadowRoot.prototype, 'adoptedStyleSheets', shadowAss);

      reassess(document, false, docAss);

      style.replaceSync('');
      style = null;
    }
  }
})();
