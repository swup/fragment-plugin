# Swup Fragment Plugin

Define fragments that should be replaced between selected page visits instead of the default swup `containers`

⚠️ **Please Note**: This plugin is not stable yet and should not be used in production.

### Demo

https://swup.fragment-plugin.rassohilber.com/

## Installation

```shell
npm i swup/fragment-plugin --save
```

## Rule Matching

- The first matching rule in your rules array will be used for the current visit

## Fragments

- The fragments from the selected rule need to be present in **both the current and the incoming document**
- For each `replace` entry, the first matching element in the DOM will be selected
- The plugin will check if a fragment has actually changed before replacing it

## Animations for fragments

During fragment visits, the attribute `[data-fragment-visit]` will be added to the `html` tag. You can use that
attribute to disable your default transitions.

If the current rule has a `name` (e.g. "myRoute"), that will be reflected as `[data-fragment-visit=myRoute]`. Using this attribute, you can scope your custom animation for only that visit.

## Example

The following code will replace:
 1. **only** the element `#users-list` when filtering a list of users
 2. **only** the element `#user-overlay` when clicking on one of the users in the list
 3. **only** the element `#user-overlay__content` when navigating between users

```js
const swup = new Swup({
  plugins: [
    new SwupFragmentPlugin({
      // The plugin expects an array of rules
      rules: [
        {
          // Rule 1: Between either all users or any filtered state... (required)
          from: ["/users/", "/users/filter/:filter"],
          to: ["/users/", "/users/filter/:filter"],
          // ...replace the following elements... (required)
          replace: ["#users-list"],
          // ...and add an attribute [data-fragment-visit="switchUsers"]
          // to the html tag during the transition (optional).
          name: "switchUsers",
        },
        {
          // Rule 2: Opening an overlay (after clicking one of the users)
          from: ["/users/", "/users/filter/:filter"],
          to: "/user/:user",
          replace: ["#user-overlay"],
          name: "openOverlay",
        },
        {
          // Rule 3: Closing an overlay. Note that in some scenarios, you might
          // also want to replace #users
          from: "/user/:user",
          to: ["/users/", "/users/filter/:filter"],
          replace: ["#user-overlay", "#users"],
          name: "closeOverlay",
        },
        {
          // Rule 3: Between user detail pages
          from: "/user/:user",
          to: "/user/:user",
          replace: ["#user-overlay__content"],
          name: "switchUser"
        },
        // ...
      ],
    }),
  ],
});
```

```css
/*
* The default transition (for visits without fragment)
*/
html:not([data-fragment-visit]) .transition-main {
  transition: opacity 250ms;
  opacity: 1;
}
html:not([data-fragment-visit]).is-animating .transition-main {
  opacity: 0;
}
/*
* The transition for the named rule "switchUsers"
*/
html[data-fragment-visit=switchUsers] .transition-items {
  transition: opacity 250ms;
}
html[data-fragment-visit=switchUsers].is-animating .transition-items {
  opacity: 0;
}
/*
* The transition for the named rule "overlay"
*/
html[data-fragment-visit=openOverlay] .transition-overlay,
html[data-fragment-visit=closeOverlay] .transition-overlay {
  transition: opacity 250ms;
}
html[data-fragment-visit=openOverlay].is-animating .transition-overlay,
html[data-fragment-visit=closeOverlay].is-animating .transition-overlay {
  opacity: 0;
}
html[data-fragment-visit=openOverlay].is-leaving .transition-overlay,
html[data-fragment-visit=closeOverlay].is-rendering .transition-overlay {
  transition-duration: 10ms;
}

```
