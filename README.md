# Swup Fragment Plugin

Replace page fragments instead of swup's default `containers`, based on user-defined rules

⚠️ **Please Note**: This plugin is not stable yet and should not be used in production.

### Demo

https://swup-fragment-plugin.netlify.app

## Installation

```shell
npm i @swup/fragment-plugin --save
```

## Simple Example

Suppose you have an endpoint `/users/` on your site that lists a bunch of users:

### HTML

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
    <main id="users">
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

### JavaScript

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

[See a more complex example](https://swup-fragment-plugin.netlify.app/how-it-works/#javascript)

When a rule matches for a visit, the plugin will

- **change** the [`containers`](https://swup.js.org/options/#containers) to the rule's `fragments`
- **preserve** the current scroll position
- set the [`animationScope`](https://swup.js.org/options/#animation-scope) to `containers` for **scoped animations** on the fragments only (see [CSS](#css) below)
- if the current `rule` has a `name` (e.g. "my-route"), that will be reflected as a class `.to-my-route` on the fragment.
- If a fragment already matches the current visit's URL, it **will be ignored for that visit**

### CSS

Now you can add custom animations for your fragment rule:

```css
/*
* The default animation, for visits without a matching rule
*/
.transition-main {
  transition: opacity 250ms;
  opacity: 1;
}
html.is-animating .transition-main {
  opacity: 0;
}
/*
* The animation when filtering users
*/
#users.is-changing {
  transition: opacity 250ms;
}
#users.is-changing {
  opacity: 0;
}
```

[See a more complex example](https://swup-fragment-plugin.netlify.app/how-it-works/#css)

## Options

```typescript
export type PluginOptions = {
	rules: Array<{
		from: Path;
		to: Path;
		fragments: string[];
		name?: string;
	}>;
	debug?: boolean;
};
```

### rules

An array of rules consisting of these properties:

#### from (required)

Type: `string | string[]`

The path before the current visit. Will be converted to a `RegExp`.

#### to (required)

Type: `string | string[]`

The new path of the current visit. Will be converted to a `RegExp`.

#### fragments (required)

Type: `string[]`

An array of selectors for fragments that should be replaced if the rule matches the current visit

#### name (optional)

Type: `string`

A name for the rule for scoped styling, ideally in kebab-case.

### debug

Type: `boolean`, default: 'false'

Set this to `true` for debug information in the console.

## Rule matching logic

- The first matching rule in your `rules` array will be used for the current visit
- If no `rule` matches the current visist, the default `swup.containers` will be replaced
- `rule.from` and `rule.to` are converted to a regular expression by [pathToRegexp](https://github.com/pillarjs/path-to-regexp). If you want to create an either/or-regex, you can also provide an array of paths, for example `['/users/', '/users/filter/:filter']`

## Fragments

- The `rule.fragments` elements from the matching `rule` need to be present in **both the current and the incoming document**
- For each `rule.fragments` entry, the **first** matching element in the DOM will be selected
- The plugin will check if a fragment already matches the new URL before replacing it

## DOM API

### `[data-swup-fragment-url="/path/to/page/"]`

If you provide this attribute on one of your fragments from the server, you can tell the plugin to persist that fragment when navigating to the given URL. For example: `[data-swup-fragment-url="/users/"]`


### `a[data-swup-link-to-fragment="#my-fragment"]`

Tell a link to be synced to a fragment's URL on every visit.

[See example code here](https://swup-fragment-plugin.netlify.app/how-it-works/#dom)
