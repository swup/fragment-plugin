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
          name: "items",
        },
        {
          between: "/items/filter/:filter",
          and: "/items/filter/:filter",
          replace: ["#items"],
          name: "items",
        },
      ],
    }),
  ],
});
```
### Notes

- The `name` of the current rule will be added to the html as a class `is-fragment--${rule.name}`, to allow for fine-grained animation control
- Only the first element will be matched for every entry in the `replace` array
- The last fragment that matches the current route wins

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
* The transition for a fragment with the name `items`
*/
html.is-fragment--items .transition-items {
  transition: opacity 250ms;
}
html.is-fragment--items.is-animating .transition-items {
  opacity: 0;
}
```
