# Swup Fragment Plugin

Define fragments that should be replaced between selected page visits instead of the default swup `containers`

⚠️ **Please Note**: This plugin is not stable yet and should not be used in production.

## Demo

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
          fragments: ["#user-profile"],
          name: "user-profile",
        },
        // ...
      ],
    }),
  ],
});
```

### Notes

- Both the current and the incoming `DOM` **must** contain the fragment you want to replace for a route
- The last rule that matches the current route wins
- For each entry in the `fragments` array, only the first matching element will be selected

## Animations for fragments

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
