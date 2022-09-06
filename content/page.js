/* eslint strict: [2, function] */
function inPage(eventId) {
  'use strict';

  const MEDIA_ID = `screen, XRayStyler-${Math.random().toString(36).slice(2)}`.toLowerCase();
  const ASS = 'adoptedStyleSheets';

  let attachShadow;
  let light, bySelector;

  const describe = Object.getOwnPropertyDescriptor;
  const define = Object.defineProperty;
  const docAss = describe(Document.prototype, ASS);
  const shadowAss = describe(ShadowRoot.prototype, ASS);

  window.addEventListener(eventId, onMessage);

  function onAttach() {
    const root = attachShadow.apply(this, arguments);
    if (bySelector)
      setOnShadow.call(root, []);
    return root;
  }

  function onMessage({detail: data}) {
    if (!data)
      return;
    if (data.selfDestruct)
      selfDestruct();
    if (data.light) {
      light = new CSSStyleSheet({media: MEDIA_ID});
      light.replaceSync(data.light);
      setOnDoc(document[ASS]);
      define(Document.prototype, ASS, {...docAss, set: setOnDoc});
    }
    if (data.bySelector) {
      bySelector = data.bySelector;
      for (const kv of bySelector) {
        const shit = new CSSStyleSheet({media: MEDIA_ID});
        shit.replaceSync(kv[1]);
        kv[1] = shit;
      }
      define(ShadowRoot.prototype, ASS, {...shadowAss, set: setOnShadow});
      attachShadow = Element.prototype.attachShadow;
      Element.prototype.attachShadow = onAttach;
      if (document.body)
        reassess(document.body);
    }
  }

  function setOnDoc(sheets) {
    return docAss.set.call(document,
      light && !sheets.includes(light) ?
        [...sheets, light] :
        sheets);
  }

  function setOnShadow(sheets) {
    return shadowAss.set.call(this, augmentShadow(this.host, sheets) || sheets);
  }

  function augmentShadow(host, sheets) {
    let cloned;
    for (const [selector, shit] of bySelector || []) {
      if (!sheets.includes(shit))
        if (selector === '' ||
            selector === '*' ||
            host.localName === selector ||
            host.matches(selector))
          (cloned || (cloned = sheets.slice())).push(shit);
    }
    return cloned;
  }

  function removeSheets(root, ass = shadowAss) {
    const sheets = ass.get.call(root);
    if (!sheets.every(notMyShit))
      ass.set.call(root, sheets.filter(notMyShit));
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);
    for (let el; (el = walker.nextNode());)
      if (el.shadowRoot)
        removeSheets(el.shadowRoot);
  }

  function reassess(root) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);
    for (let el; (el = walker.nextNode());) {
      if ((root = el.shadowRoot)) {
        const sheets = augmentShadow(el, root[ASS]);
        if (sheets)
          shadowAss.set.call(root, sheets);
        reassess(root);
      }
    }
  }

  function notMyShit(shit) {
    return shit.media[0] !== MEDIA_ID;
  }

  async function selfDestruct() {
    window.removeEventListener(eventId, onMessage);

    // we can only restore the old state if no one else chained on us
    // otherwise our orphan will have to stay and serve as a no-op relay
    if (Element.prototype.attachShadow === onAttach)
      Element.prototype.attachShadow = attachShadow;

    const curAss = describe(ShadowRoot.prototype, ASS);
    if (curAss.set === setOnShadow &&
        curAss.get === shadowAss.get)
      define(ShadowRoot.prototype, ASS, shadowAss);

    // give the new instance some time to inject the styles
    await new Promise(resolve => setTimeout(resolve, 100));

    removeSheets(document, docAss);

    if (light) {
      light.replaceSync('');
      light = null;
    }
    if (bySelector) {
      bySelector.forEach(kv => kv[1].replaceSync(''));
      bySelector = null;
    }
  }
}
