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
```
const swup = new Swup({
  plugins: [
    new SwupFragmentPlugin({
      routes: [
        {
          from: "/items/",
          to: "/items/filter/:filter",
          containers: ["#items"],
        },
        {
          from: "/items/filter/:filter",
          to: "/items/filter/:filter",
          containers: ["#items"],
        },
      ],
    }),
  ],
});
```

## Animations for fragments

The default swup animations should be disabled for fragment visits. There is no built-in animation system, yet.

```css
.transition-main {
  transition-property: opacity;
  transition-duration: 250ms;
  opacity: 1;
}
html.is-animating .transition-main {
  opacity: 0;
}
/*
 * Disable animations for fragment visits,
 * without swup complaining about it:
 */
html.is-fragment .transition-main {
  transition-duration: 1ms;
  opacity: 1;
}
```

## Things I would like to discuss:

- [ ] The general API (wording, structure)
- [ ] `containers` as an array of single element selectors (`querySelector`, not `querySelectorAll`). That's the only reliable way I can think of to make sure both the incoming and current document contain the same elements
- [ ] Animations for fragments
