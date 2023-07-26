# Swup Fragment Plugin

A [swup](https://swup.js.org) plugin for dynamically replacing containers based on rules 🧩

- Selectively replace containers instead of the main swup containers, based on custom rules
- Improve orientation by animating only the parts of the page that have actually changed
- Give your site the polish and snappiness of a single-page app

## Use cases

Both of the following two scenarios require updating only a small content fragment instead of
performing a full page transition:

- a filter UI that live-updates its list of results on every interaction
- a detail overlay that shows on top of the currently open content

## Demo

See the plugin in action in [this interactive demo](https://swup-fragment-plugin.netlify.app)

<div x-data="Video">
  
https://user-images.githubusercontent.com/869813/256012207-1d12f061-2a9c-443b-9bf0-e37a7e559852.mp4

</div>

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

- **update only** the contents of the elements matching the rule's `containers`
- **not update** the default [containers](https://swup.js.org/options/#containers) replaced on all other visits
- **wait** for CSS transitions on those fragment elements using [scoped animations](https://swup.js.org/options/#animation-scope)
- **preserve** the current scroll position upon navigation
- add a `to-[name]` class to the elements if the current `rule` has a `name` key
- **ignore** elements that already match the current visit's URL

## Example

### Content filter: only update a list of results

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
    <ul id="users">
      <li><a href="/user/1/">User 1</a></li>
      <li><a href="/user/2/">User 2</a></li>
      <li><a href="/user/3/">User 3</a></li>
    </ul>
  </main>
</body>
```

Using the Fragment Plugin, we can update **only** the `#users` list when clicking one of the filters.
The plugin expects an array of rules to recognize and handle fragment visits:

```js
const swup = new Swup({
  plugins: [
    new SwupFragmentPlugin({
      rules: [
        {
          from: '/users/:filter?',
          to: '/users/:filter?',
          containers: ['#users']
        }
      ]
    })
  ]
});
```

Now we can add custom animations for our fragment rule:

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
* The animation when filtering users
*/
#users.is-changing {
  transition: opacity 250ms;
}
#users.is-animating {
  opacity: 0;
}
```

## Options

```typescript
export type Options = {
  rules: Array<{
    from: string | string[];
    to: string | string[];
    containers: string[];
    name?: string;
  }>;
  debug?: boolean;
};
```

### rules

The rules that define whether a visit will be considered a fragment visit. Each rule consists of
mandatory `from` and `to` URL paths, an array of selectors `containers`, as well as an optional
`name` of this rule to allow scoped styling.

The rule's `from`/`to` paths are converted to a regular expression by [path-to-regexp](https://github.com/pillarjs/path-to-regexp) and matched against the current browser URL. If you want to create an either/or path, you can also provide an array of paths, for example `['/users/', '/users/filter/:filter']`.

```js
{
  rules: [
    {
      from: '/users/:filter?',
      to: '/users/:filter?',
      containers: ['#users'],
      name: 'list'
    }
  ];
}
```

#### rule.from

Required, Type: `string | string[]` – The path(s) to match against the previous URL

#### rule.to

Required, Type: `string | string[]` – The path(s) to match against the next URL

#### rule.containers

Required, Type: `string[]` – Selectors of containers to be replaced if the visit matches.

> **Note** **only IDs and no nested selectors are allowed**. `#my-element` is valid, while
> `.my-element` or `#wrap #child` both will throw an error.

#### rule.name

Optional, Type: `string` – A name for this rule to allow scoped styling, ideally in kebab-case

### debug

Type: `boolean`. Set to `true` for debug information in the console. Defaults to `false`.

```js
{
  debug: true;
}
```

> **Note** to keep the bundle size small, UMD builds are stripped from all debug messages, so `debug` won't have an effect there.

## How rules are matched

- The first matching rule in your `rules` array will be used for the current visit
- If no rule matches the current visit, the default content containers defined in swup's options will be replaced

## How fragment containers are found

- The `containers` of the matching rule **need to be shared between the current and the incoming document**
- For each selector in the `containers` array, the **first** matching element in the DOM will be selected
- The plugin will check if an element already matches the new URL before replacing it

## Advanced use cases

Creating the rules for your fragment visits should be enough to enable dynamic updates on most
sites. However, there are some advanced use cases that require adding certain attributes to the
fragment elements themselves or to links on the page. These tend to be situations where overlays are
involved and swup doesn't know which page the overlay was opened from.

### Fragment URL

Use the `data-swup-fragment-url` attribute to uniquely identify fragment elements.

In scenarios where overlays are rendered on top of other content, leaving or closing the overlay to
the same URL it was opened from should ideally not update the content below the overlay as
nothing has changed. The fragment plugin will normally do that by keeping track of URLs. However,
when swup was initialized on a subpage with a visible overlay, the plugin doesn't know which URL
the overlaid content corresponds to. Hence, we need to tell it manually so it can ignore content
updates without changes.

```diff
<section id="list"
+  data-swup-fragment-url="/users/">
  <ul>
    <li>User 1</li>
    <li>User 2</li>
    <li>User 3</li>
  </ul>
</section>
<article id="overlay">
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

`data-swup-link-to-fragment` automates that by keeping the `href` attribute of a link in sync with the currently
tracked URL of the fragment matching the selector provided by the attribute. The code below will make sure the close button will always point at the last known URL of the `#list` fragment to allow seamlessly closing the overlay:

```diff
<section id="list"
  data-swup-fragment-url="/users/">
  <ul>
    <li>User 1</li>
    <li>User 2</li>
    <li>User 3</li>
  </ul>
</section>
<article id="overlay">
  <!-- `href` will be synced to the fragment URL of #list at runtime: -->
+  <a href="" data-swup-link-to-fragment="#list">Close</a>
  <h1>User 1</h1>
  <p>Lorem ipsum dolor sit amet...</p>
</article>
```

> **Note** To keep your markup semantic and accessible, we recommend you **always provide a default value** for the link's `href` attribute, even though it will be updated automatically at runtime:

```diff
<a
+ href="/users/"
  data-swup-link-to-fragment="#list">Close</a>
```

## Skip out/in animations using `<template>`

If all elements of a visit are `<template>` elements, the `out`/`in`-animation will automatically be skipped. This can come in handy for modals:

```js
{
  from: '/overview/',
  to: '/detail/:id',
  containers: ['#modal']
},
{
  from: '/detail/:id',
  to: '/overview/',
  containers: ['#modal']
}
```

```html
<!-- /overview/: provide a <template> as a placeholder for the modal -->
<template id="modal"></template>
```

```html
<!-- /detail/1 -->
<main id="modal">
  <h1>Detail 1</h1>
</main>
```

## Modals as children of `transform`ed parents

Suppose you have an overlay that you want to present like a modal, above all other content:

```html
<div id="swup" class="transition-main">
  <section>
    <ul>
      <li><a href="/user/1/">User 1</a></li>
      <li><a href="/user/2/">User 2</a></li>
      <li><a href="/user/3/">User 3</a></li>
    </ul>
  </section>
  <!-- This should be placed above everything else -->
  <div id="user" class="modal">
    <main>
      <h1>User 1</h1>
      <p>Lorem ipsum dolor...</p>
    </main>
  </div>
</div>
```

You might have this (minimal) CSS to make the `#user` appear as a modal above everything else:

```css
.modal {
  position: fixed;
  inset: 0;
  z-index: 99999;
}
```

This will work fine, until you apply a `transform` to one of the modal's parent elements:

```css
html.is-changing .transition-main {
  transition: opacity 250ms, transform 250ms;
}
html.is-animating .transition-main {
  opacity: 0;
  /* `transform` will misplace the .modal's positioning during an animated page visit */
  transform: translateY(20px);
}
```

The reason for this is that `transform` establishes a [containing block for all descendants](https://www.w3.org/TR/css-transforms-1/#containing-block-for-all-descendants).

You have two options to fix this:

1. Don't apply CSS `transform`s to any of the parents of a modal
2. Use `<detail open>` for the modal:

```diff
- <div id="overlay" class="modal">
+ <dialog open id="overlay" aria-role="article">
    <main>
      <h1>User 1</h1>
      <p>Lorem ipsum dolor...</p>
    </main>
- </div>
+ </dialog>
```

Fragment Plugin will detect `<detail>` fragment elements automatically on every page view and run [`showModal()`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLDialogElement/showModal) on them, putting them on the [top layer](https://developer.mozilla.org/en-US/docs/Glossary/Top_layer) and thus allows them to not be affected by parent element styles, anymore.

> **Note** The second solution will produce [semantically incorrect markup](https://stackoverflow.com/a/75007908/586823), so you should only use it if you think you really have to. It's the cleanest solution for now, until the [Popover API](https://developer.mozilla.org/en-US/docs/Web/API/Popover_API) reaches [wider browser support](https://caniuse.com/?search=popover).
