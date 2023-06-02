# Swup Fragment Plugin

Define fragments that should be replaced between selected page visits instead of the default swup `containers`

⚠️ **Please Note**: This plugin is not stable yet and should not be used in production.

## Preview site

https://swup.fragment-plugin.rassohilber.com/

## Installation

```bash
npm i swup/fragment-plugin
```

## Plugin API

This is a quick example on how to replace only the element `#items` when filtering a list of items:

```js
const swup = new Swup({
  plugins: [
    new SwupFragmentPlugin({
      rules: [
        {
          between: "/items/",
          and: "/items/filter/:filter",
          replace: ["#items"],
        },
        {
          between: "/items/filter/:filter",
          and: "/items/filter/:filter",
          replace: ["#items"],
        },
      ],
    }),
  ],
});
```
### Notes

- All selectors need to be distinct, e.g. `#my-fragment`.
- The last fragment that matches the current route wins.

## Animations for fragments

```css
/*
* The default transition (for visits without fragment)
*/
html:not(.is-fragment) .transition-main {
  transition: opacity 250ms;
  opacity: 1;
}
html:not(.is-fragment).is-animating .transition-main {
  opacity: 0;
}
/*
* The transition for a fragment
*/
html.is-fragment .transition-my-fragment {
  transition: opacity 250ms;
}
html.is-fragment.is-animating .transition-my-fragment {
  opacity: 0;
}
```

## Things I would like to discuss:

- [ ] Animations for fragments
- [ ] Right now, every selector in the `replace` array will be matched using `querySelector`, not `querySelectorAll`. That's the only reliable way I can think of to make sure both the incoming and current document contain the same elements.
