# Swup Fragment Plugin

A [swup](https://swup.js.org) plugin for selectively updating dynamic fragments.

- Replace dynamic fragments instead of swup's default containers, based on custom rules
- Whereas content containers typically encompass the main content areas, fragments focus on smaller more dynamic elements within those containers, holding atomic pieces of information
- Useful for scenarios like filter results or detail overlays, where only certain parts of the page need refreshing on each visit

## Demo

[See the plugin in action](https://swup-fragment-plugin.netlify.app) in this interactive demo.

## Installation

Install the plugin from npm and import it into your bundle.

```bash
npm install @swup/fragment-plugin
```

```js
import SwupFragmentPlugin from '@swup/fragment-plugin';
```

Or include the minified production file from a CDN:

```html
<script src="https://unpkg.com/@swup/fragment-plugin@1"></script>
```

## Example

Suppose you have a route `/users/` on your site that renders a list of users. A filter UI
allows selecting criteria for filtering the user list. Selecting a filter ideally won't
trigger a full page reload — the only thing that has changed is the list of users itself. This is
where the Fragment Plugin comes in.

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
          fragments: ['#users']
        },
        // ... more complex scenarios are possible!
      ]
    })
  ]
});
```
When a rule matches for a visit, the plugin will

- **change** the [`containers`](https://swup.js.org/options/#containers) to the rule's `fragments`
- **preserve** the current scroll position
- set the [`animationScope`](https://swup.js.org/options/#animation-scope) to `containers` for **scoped animations** on the fragments only
- if the current `rule` has a `name` (e.g. "my-route"), that will be reflected as a class `.to-my-route` on the fragment.

```css
/*
* The default transition, for visits without a matching rule
*/
html.is-changing .transition-main {
  transition: opacity 250ms;
  opacity: 1;
}
html.is-animating .transition-main {
  opacity: 0;
}
/*
* The transitions for the named rule "filterUsers"
*/
.transition-users.is-changing {
  transition: opacity 250ms;
}
.transition-users.is-changing {
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

#### `name: string` (optional)

A name for the rule, for scoped styling.

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
- `[data-swup-link-to-fragment]` @TODO
