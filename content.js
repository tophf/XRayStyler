'use strict';

const EVENT_ID = chrome.runtime.id + String(Math.random()).slice(1);

document.documentElement.appendChild(
  Object.assign(document.createElement('script'), {
    textContent: `document.currentScript.remove();(${inPage})('${EVENT_ID}')`,
  }));

window.dispatchEvent(new CustomEvent(EVENT_ID, {
  detail: (css => {
    const nonshadow = [];
    const bySelector = [];
    const selectors = [];
    const prefix = '_' + String(Math.random()).slice(2);
    const source = new CSSStyleSheet();
    source.replaceSync(css.replace(/@shadow\s+([^{]*)/g, (s, m1) =>
      `@media ${prefix}${selectors.push(m1.trim())}`));
    for (const /** @type CSSMediaRule */ rule of source.cssRules) {
      let {cssText: text} = rule;
      if (rule.media && rule.conditionText.startsWith(prefix)) {
        const sel = selectors[rule.conditionText.slice(prefix.length) - 1];
        text = text.slice(text.indexOf('{') + 1, -1);
        bySelector.push([sel, text]);
      } else {
        nonshadow.push(text);
      }
    }
    return {
      light: nonshadow.length && nonshadow.join(''),
      bySelector: bySelector.length && bySelector,
    };
  })(location.hostname === 'polymer2-chromium-review.googlesource.com' ? /* language=CSS */ `

    @shadow :not(gr-main-header):not(gr-endpoint-decorator) {
      a:visited {
        color: #e094f3;
      }
      a:link {
        color: #8dcfff;
      }
    }
    @shadow gr-linked-text {
      #output {
        font-family: sans-serif;
      }
    }

  ` : location.hostname === 'bugs.chromium.org' ? /* language=CSS */ `

    :root {
      --xray-header-color: #fff;
      --xray-header-input-bg: #66b3ff3d;
      --xray-header-input-bg-focus: #66b3ff55;
      --chops-main-font-size: 16px;
      --monorail-header-height: 50px;
    }
    @shadow mr-app {
      mr-header {
        background-color: hsl(205, 100%, 12%);
      }
    }
    @shadow mr-header {
      .project-logo {
        display: none;
      }
    }
    @shadow mr-dropdown.project-selector,
            mr-dropdown[\\.icon="arrow_drop_down"] { 
      button.anchor {
        color: var(--xray-header-color);
      }
    }
    @shadow mr-dropdown.project-selector,
            mr-dropdown[icon="settings"],
            mr-dropdown[\\.icon="arrow_drop_down"],
            mr-search-bar { 
      i.material-icons:not(#\\0) {
        color: #6eadd4 !important;
      }
    }
    @shadow mr-search-bar { 
      .select-container {
        background: none;
        border: none;
      }
      .select-container:focus-within select {
        background-color: orange;
        color: black;
      }
      .select-container select,
      #searchq,
      #searchq + button {
        background-color: var(--xray-header-input-bg);
        color: var(--xray-header-color);
        border: none;
      }
      #searchq:focus {
        background-color: var(--xray-header-input-bg-focus);
      }
      #searchq::placeholder {
        color: var(--xray-header-color);
        opacity: .5;
      }
    }

  ` : ''),
}));

function inPage(eventId) {
  let attachShadow;
  let light, bySelector;

  // save the Object methods just in case as they are most likely native at document_start
  const describe = Object.getOwnPropertyDescriptor;
  const define = Object.defineProperty;
  const docAss = describe(Document.prototype, 'adoptedStyleSheets');
  const shadowAss = describe(ShadowRoot.prototype, 'adoptedStyleSheets');

  window.addEventListener(eventId, onMessage, {once: true});

  function onAttach() {
    const root = attachShadow.apply(this, arguments);
    setOnShadow.call(root, []);
    return root;
  }

  function onMessage({detail: data}) {
    if (data.light) {
      light = new CSSStyleSheet();
      light.replaceSync(data.light);
      setOnDoc(document.adoptedStyleSheets);
      define(Document.prototype, 'adoptedStyleSheets', {...docAss, set: setOnDoc});
    }
    if (data.bySelector) {
      bySelector = data.bySelector;
      for (const kv of bySelector) {
        const shit = new CSSStyleSheet();
        shit.replaceSync(kv[1]);
        kv[1] = shit;
      }
      define(ShadowRoot.prototype, 'adoptedStyleSheets', {...shadowAss, set: setOnShadow});
      attachShadow = Element.prototype.attachShadow;
      Element.prototype.attachShadow = onAttach;
    }
  }

  function setOnDoc(sheets) {
    return docAss.set.call(document,
      light && !sheets.includes(light) ?
        [...sheets, light] :
        sheets);
  }

  function setOnShadow(sheets) {
    let cloned;
    for (const [selector, shit] of bySelector)
      if (!sheets.includes(shit))
        if (selector === '' ||
            selector === '*' ||
            this.host.localName === selector ||
            this.host.matches(selector))
          (cloned || (cloned = sheets.slice())).push(shit);
    return shadowAss.set.call(this, cloned || sheets);
  }
}
