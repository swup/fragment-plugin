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

## Simple Example

Imagine you have two pages:

1. A page that lists a bunch of users:

```html
<!-- Page URL: /users/ -->
<!-- The main content on the users list page: -->
<main>
  <ul>
    <li><a href="/user/user1/">User 1</a></li>
    <li><a href="/user/user2/">User 2</a></li>
    <li><a href="/user/user3/">User 3</a></li>
  </ul>
</main>
<!-- The overlay (empty on overview pages) -->
<div id="overlay"></div>
```

2. A page that shows a user's details in an overlay

```html
<!-- Page URL: /user/user1/ -->
<!-- The main content on the user detail page: -->
<div id="overlay">
  <main id="overlay__content">
    <h1>User 1</h1>
    <p>This is the detail page for User 1</p>
  </main>
</div>
<!-- The list of users is also there on the detail page: -->
<ul>
  <li><a href="/user/user1/">User 1</a></li>
  <li><a href="/user/user2/">User 2</a></li>
  <li><a href="/user/user3/">User 3</a></li>
</ul>
```

Now you can tell FragmentPlugin to **only** replace selected elements when navigating the site:

```js
const swup = new Swup({
  plugins: [
    new SwupFragmentPlugin({
      // The plugin expects an array of rules:
      rules: [
        /**
         * When navigating from the list to a single user:
         * - replace only that user's #overlay
         * - name the route "openOverlay" for styling
         */
        {
          from: '/users/',
          to: '/user/:user/',
          replace: ['#overlay'],
          name: 'openOverlay'
        },
        /**
         * When navigating from a single user back to the list:
         * - replcae only the user's #overlay
         * - name the route "closeOverlay" for styling
         */
        {
          from: '/user/:user/',
          to: '/users/',
          replace: ['#overlay'],
          name: 'closeOverlay'
        },
        /**
         * When navigating between users:
         * - replace only the #overlay__content
         * - name the route "switchUser" for styling
         */
        {
          from: '/user/:user/',
          to: '/user/:user/',
          replace: ['#overlay__content'],
          name: 'switchUser'
        }
        // ... more complex scenarios are possible!
      ],
    }),
  ],
});
```

By giving your rules names, you are now able to defining scoped transitions for each of your rules,
making use of swup's powerful animation system:

```css
/*
* The default transition, for visits without a matching rule
*/
html:not([data-fragment-visit]) .transition-main {
  transition: opacity 250ms;
  opacity: 1;
}
html:not([data-fragment-visit]).is-animating .transition-main {
  opacity: 0;
}
/*
* The transitions for the named rules "openOverlay" and "closeOverlay"
*/
html[data-fragment-visit=openOverlay] .transition-overlay,
html[data-fragment-visit=closeOverlay] .transition-overlay {
  transition: opacity 250ms;
}
html[data-fragment-visit=openOverlay].is-animating .transition-overlay,
html[data-fragment-visit=closeOverlay].is-animating .transition-overlay {
  opacity: 0;
}
/*
* Based on the name of the roule, we can make either the leaving or
* the rendering transition really short:
*/
html[data-fragment-visit=openOverlay].is-leaving .transition-overlay,
html[data-fragment-visit=closeOverlay].is-rendering .transition-overlay {
  transition-duration: 10ms;
}
/*
* The transition between single users
*/
html[data-fragment-visit=switchUser] .transition-user {
  transition: opacity 200ms, transform 200ms;
}
html[data-fragment-visit=switchUser].is-animating .transition-user {
  opacity: 0;
  transform: translateY(-20px);
}
html[data-fragment-visit=switchUser].is-leaving .transition-user {
  opacity: 0;
  transform: translateY(20px);
}

```
