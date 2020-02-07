### Proof-of-Concept

Apply custom CSS to pages built with ShadowDOM (usually based on Polymer and other Web Components frameworks) that cannot be styled anymore in modern Chrome as it [removed Shadow-piercing support from stylesheets](https://www.chromestatus.com/features#deep).

### Requirements

Chrome 73 or newer.

### How it works

The extension's `content script` adds a `page script` that runs in the page context and intercepts the built-in `attachShadow` and `adoptedStyleSheets` (see [Constructable Stylesheets: seamless reusable styles](https://developers.google.com/web/updates/2019/02/constructable-stylesheets)), the latter helps propagate the preparsed custom user CSS to every shadow root without re-evaluating it. In browsers without this API we would incur a performance penalty for creating a copy of stylesheet element that needs re-parsing inside each shadow (and there could be hundreds on a page), which is why such an extension didn't exist in the past.
