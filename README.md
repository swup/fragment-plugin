# Swup Fragment Plugin

Replace page fragments instead of swup's default `containers`, based on user-defined rules

⚠️ **Please Note**: This plugin is not stable yet and should not be used in production.

### Demo

https://swup-fragment-plugin.netlify.app

## Installation

```shell
npm i swup/fragment-plugin --save
```

## Simple Example

Imagine you have an endpoint `/users/` on your site that lists a bunch of users:

```html
<!DOCTYPE html>
<html>
  <title>My Website</title>
</html>
<body>
  <h1>My Website</h1>
  <nav><!-- ... --></nav>
  <div id="swup" class="transition-main">
    <h2>Our users</h2>
    <main id="users" class="transition-users">
      <!-- A list of filters for the users -->
      <ul>
        <a href="/users/filter1">Filter 1</a>
        <a href="/users/filter2">Filter 2</a>
        <a href="/users/filter3">Filter 2</a>
      </ul>
      <!-- The list of users, different for each filter -->
      <ul>
        <li><a href="/user/user1/">User 1</a></li>
        <li><a href="/user/user2/">User 2</a></li>
        <li><a href="/user/user3/">User 3</a></li>
      </ul>
    </main>
  </div>
</body>
```

Now you can tell Fragment Plugin to **only** replace `#users` when clicking one of the filters:

```js
const swup = new Swup({
  plugins: [
    new SwupFragmentPlugin({
      // The plugin expects an array of rules:
      rules: [
        {
          from: '/users/:filter?',
          to: '/users/:filter?',
          fragments: ['#users'],
          name: 'filterUsers'
        },
        // ... more complex scenarios are possible!
      ]
    })
  ]
});
```
During fragment visits, the attribute `[data-fragment-visit]` will be added to the `html` tag. You can use that
attribute to disable your default transitions for fragment visits.

If the current `rule` has a `name` (e.g. "myRoute"), that will be reflected as `[data-fragment-visit=myRoute]`. Using that attribute, you can define custom transitions for your fragment visits:

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
* The transitions for the named rule "filterUsers"
*/
html[data-fragment-visit='filterUsers'] .transition-users {
  transition: opacity 250ms;
}
html[data-fragment-visit='filterUsers'].is-animating .transition-users {
  opacity: 0;
}
```

## JavaScript API

### Rules

Each rule consist of these properties:

#### `from: string | string[]`

The path before the current visit. Will be converted to a `RegExp`.

#### `to: string | string[]`

The new path of the current visit. Will be converted to a `RegExp`.

#### `fragments: string[]`

An array of selectors for fragments that should be replaced if the rule matches the current visit

### `name: string` (optional)

A name for the rule, for scoped styling

### Rule matching logic

- The first matching rule in your `rules` array will be used for the current visit
- If no `rule` matches the current visist, the default `swup.containers` will be replaced
- `rule.from` and `rule.to` are converted to a regular expression by [pathToRegexp](https://github.com/pillarjs/path-to-regexp). If you want to create an either/or-regex, you can also provide an array of paths, for example `['/users/', '/users/filter/:filter']`

### Fragments

- The `rule.fragments` selectors from the matching `rule` need to be present in **both the current and the incoming document**
- For each `rule.fragments` entry, the **first** matching element in the DOM will be selected
- The plugin will check if a fragment already matches the new URL before replacing it

## DOM API

- `[data-swup-fragment-url]` @TODO
- `.swup-fragment-unchanged` @TODO
