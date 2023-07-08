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

The two prime use cases are content filters and detail overlays.

### Content filter: only update results

A website has a page `/users/` that displays a list of users. Above the user list, there
is a filter UI to choose which users to display. Selecting a filter will trigger a normal page visit
to the narrowed-down user list, e.g. `/users/filter/x/`. The only part that has changed is the
list of users, so that's what we'd like to replace and animate instead of the whole content
container. The Fragment Plugin automates this process of selectively updating page fragments.

```html
<!DOCTYPE html>
<html>
  <title>Our Users — My Website</title>
</html>
<body>
  <header>My Website</header>
  <nav><!-- ... --></nav>
  <main id="swup" class="transition-main">
    <h1>Our Users</h1>
    <!-- A list of filters for the users: selecting one will update the list below -->
    <ul>
      <a href="/users/filter/1/">Filter 1</a>
      <a href="/users/filter/2/">Filter 2</a>
      <a href="/users/filter/3/">Filter 2</a>
    </ul>
    <!-- The list of users, different for each filter -->
    <ul id="users" class="transition-users">
      <li><a href="/user/1/">User 1</a></li>
      <li><a href="/user/2/">User 2</a></li>
      <li><a href="/user/3/">User 3</a></li>
    </ul>
  </main>
</body>
```

Using the Fragment Plugin, we can **only** update the `#users` list when clicking one of the filters.
The plugin expects an array of rules to recognize and handle fragment visits.

```js
const swup = new Swup({
  plugins: [
    new SwupFragmentPlugin({
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

## How it works

When the current visit matches a fragment rule, the plugin will:

- **update** only the contents of the elements defined in the rule's `fragment` key
- **not update** the default content [containers](https://swup.js.org/options/#containers) replaced on all other visits
- **wait** for CSS transitions on those fragment elements using [scoped animations](https://swup.js.org/options/#animation-scope)
- add a `to-fragment-[name]` class to the elements if the current `rule` has a `name`  key
- **preserve** the current scroll position upon navigation

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
* The transitions for the named rule "users"
*/
.transition-users.is-changing {
  transition: opacity 250ms;
}
.transition-users.is-changing {
  opacity: 0;
}
```

## Options

### rules

The rules that define whether a visit will be considered as a fragment visit.

Each rule consists of mandatory `from` and `to` URL patterns, an array `fragments` of selectors, as
well as an optional `name` of this rule.

#### `from: string | string[]`

The pattern to match against the previous URL. Converted to a regular expression via
[path-to-regexp](https://www.npmjs.com/package/path-to-regexp).

#### `to: string | string[]`

The pattern or regular expression to match against the next page.

#### `fragments: string[]`

An array of selectors for fragments that should be replaced if the visit matches the above patterns.

#### `name: string` (optional)

An optional name for this rule to allow scoped styling.

### How rules are matched

- The first matching rule in your `rules` array will be used for the current visit
- If no `rule` matches the current visist, the default `swup.containers` will be replaced
- `rule.from` and `rule.to` are converted to a regular expression by [path-to-regexp](https://www.npmjs.com/package/path-to-regexp). If you want to create an either/or pattern, you can also provide an array of patterns, for example `['/users/', '/users/filter/:filter']`

### Fragment selectors

- The `rule.fragments` selectors from the matching `rule` need to be present in **both the current and the incoming document**
- For each `rule.fragments` entry, the **first** matching element in the DOM will be selected
- The plugin will check if a fragment already matches the new URL before replacing it

## Markup

- `[data-swup-fragment-url]` @TODO
- `[data-swup-link-to-fragment]` @TODO
