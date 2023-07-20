import { Location } from 'swup';
import type { Visit } from 'swup';
import type { Rule, Route, FragmentVisit } from '../SwupFragmentPlugin.js';
import SwupFragmentPlugin from '../SwupFragmentPlugin.js';
import type { ConsolaInstance } from 'consola';
import { red } from 'console-log-colors';

export const prefix = (s: string) => `🧩 ${s}`;

declare global {
	interface HTMLDialogElement {
		__fragment_modal_shown: boolean;
	}
}

/**
 * Handles a page view. Runs on `mount` as well as on every content:replace
 */
export const handlePageView = (fragmentPlugin: SwupFragmentPlugin): void => {
	addFragmentAttributes(fragmentPlugin);
	handleLinksToFragments(fragmentPlugin);
	showDialogs(fragmentPlugin);
};

/**
 * Run `showModal` for all `<dialog[data-swup-fragment-selector]>` elements
 * This puts them on the top layer and makes them ignore css `transform`s on parent elements
 * @see https://developer.mozilla.org/en-US/docs/Glossary/Top_layer
 */
function showDialogs({ logger }: SwupFragmentPlugin): void {
	document
		.querySelectorAll<HTMLDialogElement>('dialog[data-swup-fragment-selector]')
		.forEach((el) => {
			if (el.__fragment_modal_shown) return;
			el.removeAttribute('open');
			el.showModal();
			el.__fragment_modal_shown = true;
			el.setAttribute('data-swup-modal-shown', '');
		});
}

/**
 * Updates the `href` of links matching [data-swup-link-to-fragment="#my-fragment"]
 */
function handleLinksToFragments({ logger, swup }: SwupFragmentPlugin): void {
	const targetAttribute = 'data-swup-link-to-fragment';
	const links = document.querySelectorAll<HTMLAnchorElement>(`a[${targetAttribute}]`);

	links.forEach((el) => {
		const selector = el.getAttribute(targetAttribute);
		if (!selector) {
			return logger?.warn(
				prefix(`[${targetAttribute}] needs to contain a valid fragment selector`)
			);
		}

		const fragment = document.querySelector(selector);
		if (!fragment) {
			return logger?.warn(prefix(`no element found for [${targetAttribute}="${selector}"]`));
		}

		const fragmentUrl = fragment.getAttribute('data-swup-fragment-url');

		if (!fragmentUrl)
			return logger?.warn(
				prefix(`Can't get fragment URL of ${selector} as it doesn't exist`)
			);

		// Help finding missing [data-swup-fragment-urls]
		if (isEqualUrl(fragmentUrl, swup.getCurrentUrl())) {
			return logger?.warn(
				prefix(
					`The fragment URL of ${selector} is identical to the current URL. This could mean that [data-swup-fragment-url] needs to be provided by the server.`
				)
			);
		}

		el.href = fragmentUrl;
	});
}

/**
 * Adds [data-swup-fragment-url] to all fragments that don't already contain that attribute
 */
function addFragmentAttributes({ rules, swup }: SwupFragmentPlugin): void {
	const currentUrl = swup.getCurrentUrl();

	rules
		.filter((rule) => rule.matchesFrom(currentUrl) || rule.matchesTo(currentUrl))
		.forEach((rule) => {
			rule.fragments.forEach((selector) => {
				const element = document.querySelector(selector) as HTMLElement | null;
				// No element
				if (!element) return;
				// Ignore <template> and <swup-fragment-placeholder>
				if (
					['template', 'swup-fragment-placeholder'].includes(
						element.tagName.toLowerCase()
					)
				)
					return;
				// Save the selector that matched the element
				element.setAttribute('data-swup-fragment-selector', selector);
				// Finally, add the fragment url attribute if not already present
				if (!element.getAttribute('data-swup-fragment-url')) {
					element.setAttribute('data-swup-fragment-url', currentUrl);
				}
			});
		});
}

/**
 * Get all fragments that should be replaced for a given visit's route
 */
export const getFragmentsForVisit = (
	route: Route,
	selectors: string[],
	logger?: ConsolaInstance
) => {
	return selectors.filter((selector) => {
		const el = document.querySelector(selector);

		if (!el) {
			logger?.info(prefix(`fragment "${selector}" missing in current document`));
			return false;
		}

		if (elementMatchesFragmentUrl(el, route.to)) {
			logger?.info(
				prefix(`ignored fragment ${red(selector)} as it already matches the current URL`)
			);
			return false;
		}

		return true;
	});
};

/**
 * Checks if an element's [data-swup-fragment-url] matches a given URL
 */
export const elementMatchesFragmentUrl = (el: Element, url: string): boolean => {
	const fragmentUrl = el.getAttribute('data-swup-fragment-url');
	return !fragmentUrl ? false : isEqualUrl(fragmentUrl, url);
};

/**
 * Checks if two URLs should be considered equal
 *
 * All these URLs would be considered to be equal:
 *
 * - /test
 * - /test/
 * - /test?foo=bar&baz=boo
 * - /test/?baz=boo&foo=bar
 */
const isEqualUrl = (url1: string, url2: string) => {
	return normalizeUrl(url1) === normalizeUrl(url2);
};

/**
 * Normalize a URL
 *
 * - removes the trailing slash
 * - sorts query params
 */
const normalizeUrl = (url: string) => {
	if (!url.trim()) return url;

	const removeTrailingSlash = (str: string) => (str.endsWith('/') ? str.slice(0, -1) : str);

	const location = Location.fromUrl(url);
	location.searchParams.sort();

	return removeTrailingSlash(location.pathname) + location.search;
};

/**
 * Removes [data-swup-fragment-url] from all elements
 */
export const cleanupFragmentAttributes = () => {
	document.querySelectorAll('[data-swup-fragment-url]').forEach((el) => {
		el.removeAttribute('data-swup-fragment-url');
		el.removeAttribute('data-swup-fragment-selector');
	});
};

/**
 * Get the route from a given context
 */
export const getRoute = (visit: Visit): Route | undefined => {
	const from = visit.from.url;
	const to = visit.to.url;
	if (!from || !to) return;
	return { from, to };
};

/**
 * Add the rule name to fragments
 */
export const addRuleNameClasses = (visit: Visit): void => {
	if (!visit.fragmentVisit) return;

	const { rule, fragments } = visit.fragmentVisit;
	if (!rule.name) return;

	fragments.forEach((selector) => {
		document.querySelector(selector)?.classList.add(`to-${rule.name}`);
	});
};

/**
 * Remove the rule name from fragments
 */
export const removeRuleNameFromFragments = ({ rule, fragments }: FragmentVisit): void => {
	if (!rule.name) return;
	fragments.forEach((selector) => {
		document.querySelector(selector)?.classList.remove(`to-${rule.name}`);
	});
};

/**
 * Get the first matching rule for a given route
 */
export const getFirstMatchingRule = (route: Route, rules: Rule[]): Rule | undefined => {
	return rules.find((rule) => rule.matches(route));
};

/**
 * Makes sure unchanged fragments land in the cache of the current page
 */
export const cacheForeignFragments = ({ swup, logger }: SwupFragmentPlugin): void => {
	const currentUrl = swup.getCurrentUrl();
	const cache = swup.cache;

	// Get the cache entry for the current URL
	const currentCache = cache.get(currentUrl);
	if (!currentCache) return;
	const currentCachedDocument = new DOMParser().parseFromString(currentCache.html, 'text/html');

	// debug info
	const updatedFragments: {
		selector: string;
		url: string;
	}[] = [];

	// We only want to handle fragments that don't fit the current URL
	const foreignFragments = Array.from(
		document.querySelectorAll('[data-swup-fragment-url]')
	).filter((el) => !elementMatchesFragmentUrl(el, currentUrl));

	// Bail early if there are no foreign fragments
	if (!foreignFragments.length) return;

	foreignFragments.forEach((el) => {
		// Don't cache the fragment if it contains fragments of it's own
		const containsFragments = el.querySelector('[data-swup-fragment-url]') != null;
		if (containsFragments) return;

		// Get and validate `fragmentUrl`
		const rawFragmentUrl = el.getAttribute('data-swup-fragment-url');
		if (!rawFragmentUrl) {
			return logger?.warn(
				prefix(`invalid [data-swup-fragment-url] found on unchanged fragment:`),
				el
			);
		}
		const fragmentUrl = Location.fromUrl(rawFragmentUrl).url;

		// Get and validate `fragmentSelector`
		const fragmentSelector = el.getAttribute('data-swup-fragment-selector');
		if (!fragmentSelector) {
			return logger?.warn(
				prefix(`no [data-swup-fragment-selector] found on unchanged fragment:`),
				el
			);
		}

		// Get the cache entry for the fragment URL, bail early if it doesn't exist
		const fragmentCache = cache.get(fragmentUrl);
		if (!fragmentCache) return;

		// Check if the fragment exists in the current cached document
		const currentFragment = currentCachedDocument.querySelector(fragmentSelector);
		if (!currentFragment) return;

		// Get a fresh copy of the fragment from it's original cache
		const unchangedFragment = new DOMParser()
			.parseFromString(fragmentCache.html, 'text/html')
			.querySelector(fragmentSelector);
		if (!unchangedFragment) return;

		// Make sure the dynamic attributes make it to the cache
		unchangedFragment.setAttribute('data-swup-fragment-url', fragmentUrl);
		unchangedFragment.setAttribute('data-swup-fragment-selector', fragmentSelector);

		// Replace the current fragment with the unchanged fragment
		currentFragment.replaceWith(unchangedFragment);

		// For debugging
		updatedFragments.push({ selector: fragmentSelector, url: fragmentUrl });
	});

	if (!updatedFragments.length) return;

	// Update the cache of the current page with the updated html
	cache.update(currentUrl, {
		...currentCache,
		html: currentCachedDocument.documentElement.outerHTML
	});

	updatedFragments.forEach((f) => {
		logger?.info(prefix(`updated cache with ${red(f.selector)} from ${red(f.url)}`));
	});

	// Log the result
};

/**
 * Skips the animation if all current containers either
 *
 * - are empty
 * - contain only comments and/or empty text nodes
 */
export function shouldSkipAnimation({ swup }: SwupFragmentPlugin): boolean {
	const { fragmentVisit } = swup.visit;
	if (!fragmentVisit) return false;

	return fragmentVisit.fragments.every((selector) => {
		const childNodes = Array.from(document.querySelector(selector)?.childNodes || []);
		if (!childNodes.length) return true;
		return childNodes.every((node) => {
			// Check for comments
			if (node.nodeName === '#comment') return true;
			// Check for empty text nodes
			if (node.nodeName === '#text' && !Boolean(node.nodeValue?.trim())) return true;
			return false;
		});
	});
}

/**
 * Remove duplicates from an array
 * @see https://stackoverflow.com/a/67322087/586823
 */
export function dedupe<T>(arr: Array<T>): Array<T> {
	return arr.filter((current, index) => {
		return arr.findIndex((compare) => current === compare) === index;
	});
}
