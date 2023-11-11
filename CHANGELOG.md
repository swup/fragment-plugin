# Changelog

## [0.3.5] - 2023-11-11

- New API methods:
  - `getFragmentVisit()`
  - `prependRule()`
  - `appendRule()`
  - `getRules()`
  - `setRules()`
- Improve test coverage

## [0.3.4] - 2023-10-15

- Ignore fragment elements that are not children of swup's default `containers`

## [0.3.3] - 2023-10-05

- Refactor exports
- Ensure all type definitions make it into `/dist`
- Fix return type of `swup.getFragmentVisit()`

## [0.3.2] - 2023-09-26

- Use `@swup/cli` for bundling

## [0.3.1] - 2023-09-25

- Ignore fragment rules where any of the `containers` doesn't return a match

## [0.3.0] - 2023-09-07

- Make `visit.a11y.focus` adjustable

## [0.2.6] - 2023-08-09

- Support for fragment visits to the current URL (handy for @swup/fragment-plugin)

## [0.2.5] - 2023-08-04

- simplify `visit.fragmentVisit` #35
- new option `rule.scroll` #36

## [0.2.4] - 2023-07-31

- Optimize exported types

## [0.2.3] - 2023-07-28

- Sort the `"exports"` field in package.json in the recommended way

## [0.2.2] - 2023-07-28

- use an `interface` for augmenting swup, so that multiple plugins can augment it

## [0.2.1] - 2023-07-26

- Initial Release

[0.3.5]: https://github.com/swup/fragment-plugin/releases/tag/0.3.5
[0.3.4]: https://github.com/swup/fragment-plugin/releases/tag/0.3.4
[0.3.3]: https://github.com/swup/fragment-plugin/releases/tag/0.3.3
[0.3.2]: https://github.com/swup/fragment-plugin/releases/tag/0.3.2
[0.3.1]: https://github.com/swup/fragment-plugin/releases/tag/0.3.1
[0.3.0]: https://github.com/swup/fragment-plugin/releases/tag/0.3.0
[0.2.6]: https://github.com/swup/fragment-plugin/releases/tag/0.2.6
[0.2.5]: https://github.com/swup/fragment-plugin/releases/tag/0.2.5
[0.2.4]: https://github.com/swup/fragment-plugin/releases/tag/0.2.4
[0.2.3]: https://github.com/swup/fragment-plugin/releases/tag/0.2.3
[0.2.2]: https://github.com/swup/fragment-plugin/releases/tag/0.2.2
[0.2.1]: https://github.com/swup/fragment-plugin/releases/tag/0.2.1
