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
          from: [
            "/users/",
            "/users/filter/:filter"
          ],
          // ...and any filtered state... (required)
          to: "/users/filter/:filter",
          // ...replace the following elements... (required)
          fragments: ["#users-list"],
          // ...and add an attribute [data-fragment-visit="users-list"]
          // to the html tag during the transition (optional).
          name: "users",
        },
        {
          // Rule 2: Between the root or any filtered state and a user detail page
          from: [
            "/users/",
            "/users/filter/:filter"
          ],
          to: "/user/:user",
          direction: "forwards",
          fragments: ["#user-overlay"],
          name: "overlay",
        },
        {
          // Rule 3: Between the a user detail page and the root or any filtered state
          from: [
            "/users/",
            "/users/filter/:filter"
          ],
          to: "/user/:user",
          direction: "backwards",
          fragments: ["#user-overlay", "#users-list"],
          name: "overlay",
        },
        {
          // Rule 4: Between user detail pages
          from: "/user/:user", // can also be a string for simple cases like this
          to: "/user/:user",
          fragments: ["#user-overlay__content"],
          // if we omit the name, this rule will be applied immediately, without animation
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
* The transition for the named rule "users"
*/
html[data-fragment-visit=users] .transition-items {
  transition: opacity 250ms;
}
html[data-fragment-visit=users].is-animating .transition-items {
  opacity: 0;
}
/*
* The transition for the named rule "overlay"
*/
html[data-fragment-visit=overlay] .transition-overlay {
  transition: opacity 250ms;
}
html[data-fragment-visit=overlay].is-animating .transition-overlay {
  opacity: 0;
}
/* Special case for opening an overlay, making use of data-fragment-direction */
html[data-fragment-visit=overlay][data-fragment-direction=forwards].is-leaving .transition-overlay,
html[data-fragment-visit=overlay][data-fragment-direction=backwards].is-rendering .transition-overlay {
  transition-duration: 10ms;
}

```

## Notes

### Rule Matching

- By default, rules are being matched in **both** directions, forwards as well as backwards. This can be customized by adding an option `direction` with either `forwards` or `backwards`
- The first matching rule in your rules array will be used for the current transition

### Fragments

- The fragments from the selected rule need to be present in **both the current and the incoming document**
- For each `fragments` entry, the first matching element in the DOM will be selected
- You can opt-out from replacing a fragment by giving both the incoming and current fragment the same `data-fragment-hash`

## Animations for fragments

During fragment visits, the attribute `[data-fragment-visit]` will be added to the `html` tag
- If the selected rule has a `name` (e.g. "my-route"), it will be reflected as `[data-fragment-visit="my-route"]`
- If the selected rule matches only in one direction, that will be reflected in the attribute `[data-fragment-direction=forwards]` or `[data-fragment-direction=backwards]`
- If the selected rute matches in both directions, `[data-fragment-direction]` will not be set

## Advanced

#### Persisting unchanged fragments

In more complex scenarios, the rules might not be enough to describe all possible navigation paths.

Rule 3, for example, will always replace both the overlay as well as the list.
To persist the list if it hasn't changed, we can add a globally unique attribute `data-fragment-hash` to the element.

You could, for example, use a hash of the page's URL where the fragment is being rendered. In PHP, this could look something like this:

```php
<div id="characters" data-fragment-hash="<?= md5($_SERVER['REQUEST_URI']) ?>"><!-- ... --></div>
```

The plugin will check for `data-fragment-hash` on both the incoming as well as the current fragment, and if they are identical, ignore the keep the current version of the fragment unchanged.
