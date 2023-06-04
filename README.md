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

- Both the current and the incoming DOM **must** contain all the fragments you have defind in the matching rule
- For each entry in the `fragments` array, **only the first** matching element will be selected

## Animations for fragments

During fragment visits, the atrribute `data-fragment` will be added to the `html` tag.
- If the current rule has a `name`, that name (e.g. "my-route") will be reflected as `data-fragment="my-route"`
- If the current rule matched in a distinct direction, that will be reflected using the attribute `[data-fragment-direction=forwards]` or `[data-fragment-direction=backwards]`

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
