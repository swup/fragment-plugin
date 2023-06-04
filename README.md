# Swup Fragment Plugin

Define fragments that should be replaced between selected page visits instead of the default swup `containers`

⚠️ **Please Note**: This plugin is not stable yet and should not be used in production.

### Demo

https://swup.fragment-plugin.rassohilber.com/

## Installation

```shell
npm i swup/fragment-plugin --save
```

## Example

The following code will replace **only** the element `#users-list` when filtering a list of users and **only** the element `#user-profile` when clicking on one of the users in the list:

```js
const swup = new Swup({
  plugins: [
    new SwupFragmentPlugin({
      // The plugin expects an array of rules
      rules: [
        {
          // Between either the root or any filtered state... (required)
          from: [
            "/users/",
            "/users/filter/:filter"
          ],
          // ...and any filtered state... (required)
          to: "/users/filter/:filter",
          // ...replace the following elements... (required)
          fragments: ["#users-list"],
          // ...and add an attribute [data-fragment="users-list"]
          // to the html tag during the transition (optional).
          name: "users-list",
        },
        {
          from: [
            "/users/",
            "/users/filter/:filter"
          ],
          to: "/user/:user",
          fragments: ["#user-overlay"],
          name: "user-overlay",
        },
        {
          from: "/user/:user", // can also be a string for simple cases
          to: "/user/:user",
          fragments: [".user-overlay__content"],
          name: "user",
        },
        // ...
      ],
    }),
  ],
});
```

## Notes

### Rule Matching

- Rules are being matched in **both** directions, forwards as well as backwards
- The last matching rule in your rules array will be selected for the current transition

### Fragments

- The fragments from the selected rule need to be present in **both the current and the incoming document**
- For each `fragments` entry, the first matching element in the DOM will be selected

## Animations for fragments

During fragment visits, the attribute `[data-fragment]` will be added to the `html` tag
- If the selected rule has a `name` (e.g. "my-route"), it will be reflected as `[data-fragment="my-route"]`
- If the selected rule matches only in one direction, that will be reflected in the attribute `[data-fragment-direction=forwards]` or `[data-fragment-direction=backwards]`
- If the selected rute matches in both directions, `[data-fragment-direction]` will not be set

```css
/*
* The default transition (for visits without fragment)
*/
html:not([data-fragment]) .transition-main {
  transition: opacity 250ms;
  opacity: 1;
}
html:not([data-fragment]).is-animating .transition-main {
  opacity: 0;
}
/*
* The transition for a fragment with the name `items`
*/
html[data-fragment=items] .transition-items {
  transition: opacity 250ms;
}
html[data-fragment=items].is-animating .transition-items {
  opacity: 0;
}
```
