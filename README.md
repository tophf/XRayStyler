Applies custom CSS to pages built with ShadowDOM (usually based on Polymer and other Web Components frameworks) that cannot be styled anymore in modern Chrome as it [removed Shadow-piercing support from stylesheets](https://www.chromestatus.com/features#deep).

### Styled sites:

**[bugs.chromium.org](https://bugs.chromium.org)** | **[www.chromestatus.com](https://www.chromestatus.com)**
---|---
[![crbug screenshot](https://i.imgur.com/B9XoAImm.png)](https://i.imgur.com/B9XoAIm.png) | [![crstatus screenshot](https://i.imgur.com/FH3iG1Um.png)](https://i.imgur.com/FH3iG1U.png)

And **[chromium-review.googlesource.com](https://chromium-review.googlesource.com)** where it simply changes :link and :visited colors, and hides some authoring-only stuff to facilitate casual browsing, requires you to choose the dark theme in site's prefs.

### Requirements

Chrome 73 or newer.

### How it works

The extension's `content script` adds a `page script` that runs in the page context and intercepts the built-in `attachShadow` and `adoptedStyleSheets` (see [Constructable Stylesheets: seamless reusable styles](https://developers.google.com/web/updates/2019/02/constructable-stylesheets)), the latter helps propagate the preparsed custom user CSS to every shadow root without re-evaluating it. In browsers without this API we would incur a performance penalty for creating a copy of stylesheet element that needs re-parsing inside each shadow (and there could be hundreds on a page), which is why such an extension didn't exist in the past.

The individual shadow roots are targeted using `@shadow` AT-rule:

```css
@shadow * {
  a:visited {
    color: #a88cff;
  }
}
@shadow mr-dropdown.project-selector,
        mr-dropdown[icon="settings"],
        mr-dropdown[\.icon="arrow_drop_down"],
        #searchq ~ mr-dropdown,
        mr-search-bar {
  i.material-icons:not(#\0) {
    color: #6eadd4 !important;
  }
}
```
