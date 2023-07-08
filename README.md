# Swup Fragment Plugin

A [swup](https://swup.js.org) plugin for selectively updating dynamic fragments.

- Replace dynamic fragments instead of the main content container, based on custom rules
- Improve orientation by animating only the parts of the page that have actually changed
- Give your site the polish and snappiness of a single-page app

## Use cases

Both of the following two scenarios require updating only a small content fragment instead of
performing a full page transition.

- a filter UI that live-updates its list of results on every interaction
- a detail overlay that shows on top of the currently open content

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

## How it works

When a visit is determined to be a fragment visit, the plugin will:

- **update only** the contents of the elements defined in the rule's `fragments`
- **not update** the default content [containers](https://swup.js.org/options/#containers) replaced on all other visits
- **wait** for CSS transitions on those fragment elements using [scoped animations](https://swup.js.org/options/#animation-scope)
- **preserve** the current scroll position upon navigation
- add a `to-fragment-[name]` class to the elements if the current `rule` has a `name`  key
- **ignore** the visit completely if a fragment already matches the current visit's URL

## Example

### Content filter: only update list of results

Imagine a website with a `/users/` page that displays a list of users. Above the user list, there
is a filter UI to choose which users to display. Selecting a filter will trigger a visit
to the narrowed-down user list at `/users/filter/x/`. The only part that has changed is the
list of users, so that's what we'd like to replace and animate instead of the whole content
container.

```html
<body>
  <header>Website</header>
  <main id="swup" class="transition-main">
    <h1>Users</h1>
    <!-- A list of filters for the users: selecting one will update the list below -->
    <ul>
      <a href="/users/filter/1/">Filter 1</a>
      <a href="/users/filter/2/">Filter 2</a>
      <a href="/users/filter/3/">Filter 2</a>
    </ul>
    <!-- The list of users, filtered by the criteria above -->
    <ul id="users" class="transition-users">
      <li><a href="/user/1/">User 1</a></li>
      <li><a href="/user/2/">User 2</a></li>
      <li><a href="/user/3/">User 3</a></li>
    </ul>
  </main>
</body>
```

Using the Fragment Plugin, we can update **only** the `#users` list when clicking one of the filters.
The plugin expects an array of rules to recognize and handle fragment visits.

```js
const swup = new Swup({
  plugins: [
    new SwupFragmentPlugin({
      rules: [{
        from: '/users/:filter?',
        to: '/users/:filter?',
        fragments: ['#users']
      }]
    })
  ]
});
```

Now you can add custom animations for your fragment rule:

```css
/*
* The default animation, for visits without matching fragment rules
*/
html.is-changing .transition-main {
  transition: opacity 250ms;
  opacity: 1;
}
html.is-animating .transition-main {
  opacity: 0;
}

/*
* The animation for the fragment rule named "users"
*/
#users.is-changing {
  transition: opacity 250ms;
}
#users.is-changing {
  opacity: 0;
}
```

## Options

```typescript
export type PluginOptions = {
  rules: Array<{
    from: string | string[];
    to: string | string[];
    fragments: string[];
    name?: string;
  }>;
  debug?: boolean;
};
```

### rules

The rules that define whether a visit will be considered a fragment visit. Each rule consists of
mandatory `from` and `to` URL patterns, an array `fragments` of selectors, as well as an optional
`name` of this rule to allow precise styling. The from/to patterns are converted to regular
expressions by [path-to-regexp](https://www.npmjs.com/package/path-to-regexp).

```js
{
  rules: [
    {
      from: '/users/:filter?',
      to: '/users/:filter?',
      fragments: ['#users'],
      name: 'list'
    }
  ]
}
```

### (List)

- `from`, required, `string | string[]` — The pattern(s) to match against the previous URL
- `to`, required, `string | string[]` — The pattern(s) to match against the next URL
- `fragments`, required, `string[]` — Selectors of containers to be replaced if the visit matches
- `name`, optional, `string` — A name for this rule to allow scoped styling, ideally in kebab-case

### (Table)

|    Param    | Required |         Type         |                             Description                             |
| ----------- | -------- | -------------------- | ------------------------------------------------------------------- |
| `from`      | required | `string \| string[]` | The pattern(s) to match against the previous URL                    |
| `to`        | required | `string \| string[]` | The pattern(s) to match against the next URL                        |
| `fragments` | required | `string[]`           | Selectors of containers to be replaced if the visit matches         |
| `name`      | optional | `string`             | A name for this rule to allow scoped styling, ideally in kebab-case |

### (Headings)

#### from

**Required**. Type: `string | string[]`. The pattern to match against the previous URL. Converted
to a regular expression via [path-to-regexp](https://www.npmjs.com/package/path-to-regexp).

#### to

**Required**. Type: `string | string[]`. The pattern or regular expression to match against the next page.

#### fragments

**Required**. Type: `string[]`. An array of selectors for fragments to be replaced if the visit
matches the above patterns.

#### name

Optional. Type: `string`. An optional name for this rule to allow scoped styling, ideally in kebab-case.

### debug

Type: `boolean`. Set to `true` for debug information in the console. Defaults to `false`.

```js
{
  debug: true
}
```

## How rules are matched

- The first matching rule in your `rules` array will be used for the current visit
- The rule's `from` and `to` patterns are converted to a regular expression by [path-to-regexp](https://www.npmjs.com/package/path-to-regexp). If you want to create an either/or pattern, you can also provide an array of patterns, for example `['/users/', '/users/filter/:filter']`
- If no rule matches the current visit, the default content containers defined in swup's options will be replaced

## How fragment containers are found

- The `fragments` of the matching rule need to be present in **both the current and the incoming document**
- For each selector in the `fragments` array, the **first** matching element in the DOM will be selected
- The plugin will check if a fragment already matches the new URL before replacing it

## Advanced use cases

Creating the rules for your fragment visits should be enough to enable dynamic updates on most
sites. However, there are some advanced use cases that require adding certain attributes to the
fragments themselves or to links on the page. These tend to be situations where overlays are
involved and swup doesn't know which page the overlay was opened from.

### Fragment URL

Use the `data-swup-fragment-url` attribute to uniquely identify fragments.

In scenarios where overlays are rendered on top of other content, leaving or closing the overlay to
the same URL it was opened from should ideally not update the content below the overlay as
nothing has changed. The fragment plugin will normally do that by keeping track of URLs. However,
when swup was initialized on a subpage with a visible overlay, the plugin doesn't know which URL
the overlaid content corresponds to. Hence, we need to tell it manually so it can ignore content
updates without changes.

```html
<section data-swup-fragment-url="/users/">
  <ul>
    <li>User 1</li>
    <li>User 2</li>
    <li>User 3</li>
  </ul>
</section>
<article data-swup-fragment-url="/user/1/">
  <h1>User 1</h1>
  <p>Lorem ipsum dolor sit amet...</p>
</article>
```

### Link to fragment

Use the `data-swup-link-to-fragment` attribute to automatically update links pointing to a fragment.

Consider again an overlay rendered on top of other content. To implement a close button for that
overlay, we could ideally point a link at the URL of the content where the overlay is closed. The
fragment plugin will then handle the animation and replacing of the overlay. However, knowing
where to point that link requires knowing where the current overlay was opened from.

This attribute automates that by keeping the `href` attribute of any link in sync with the currently
tracked URL of the fragment matching that selector. The code below will make sure the close button
will always point at the last known URL of the `#list` fragment to allow easy closing of the overlay.

```html
<section id="list">
  <ul>
    <li>User 1</li>
    <li>User 2</li>
    <li>User 3</li>
  </ul>
</section>
<article id="overlay">
  <a href="" data-swup-link-to-fragment="#list">Close</a>
  <h1>User 1</h1>
  <p>Lorem ipsum dolor sit amet...</p>
</article>
