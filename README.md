### Proof-of-Concept

Apply custom CSS to pages built with ShadowDOM (usually based on Polymer and other Web Components frameworks) that cannot be styled anymore in modern Chrome as it [removed Shadow-piercing support from stylesheets](https://www.chromestatus.com/features#deep).

Currently the CSS is embedded in the content script that's hardwired to one particular site ([example page](https://polymer2-chromium-review.googlesource.com/q/status:open)) so it's not customizable via UI, but hey this is a PoC.

### How it works

The extension's *content script* adds a *page script* that runs in the page context and intercepts the built-in attachShadow and adoptedStyleSheets (see [Constructable Stylesheets: seamless reusable styles](https://developers.google.com/web/updates/2019/02/constructable-stylesheets)), the latter helps propagate the preparsed custom user CSS to every shadow root unaltered without incurring a performance penalty for creating a copy of stylesheet element that needs re-parsing inside each shadow (there could be hundreds on a page), which is why such support wasn't implemented in the past.
