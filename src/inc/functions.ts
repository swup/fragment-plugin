import Swup, { Location } from 'swup';
import type { Context as SwupContext } from 'swup';
import type { Rule, Route, FragmentVisit, Fragment } from '../SwupFragmentPlugin.js';
import Logger from './Logger.js';
import SwupFragmentPlugin from '../SwupFragmentPlugin.js';

/**
 * Handles a page view. Runs on `mount` as well as on every content:replace
 */
export const handlePageView = (fragmentPlugin: SwupFragmentPlugin): void => {
	teleportFragments(fragmentPlugin);
	addFragmentAttributes(fragmentPlugin);
	handleLinksToFragments(fragmentPlugin);
};

/**
 * Updates the `href` of links matching [data-swup-link-to-fragment="#my-fragment"]
 */
function handleLinksToFragments({ logger, swup }: SwupFragmentPlugin): void {
	const targetAttribute = 'data-swup-link-to-fragment';
	const links = document.querySelectorAll<HTMLAnchorElement>(`a[${targetAttribute}]`);

	links.forEach((el) => {
		const selector = el.getAttribute(targetAttribute);
		if (!selector) {
			return logger.warn(`[${targetAttribute}] needs to contain a valid fragment selector`);
		}

		const fragment = document.querySelector(selector);
		if (!fragment) {
			return logger?.warn(`no element found for [${targetAttribute}="${selector}"]`);
		}

		const fragmentUrl = fragment.getAttribute('data-swup-fragment-url');

		if (!fragmentUrl)
			return logger.warn(
				`Can't get fragment URL of ${selector} as it doesn't exist`
			);

		// Help finding missing [data-swup-fragment-urls]
		if (isEqualUrl(fragmentUrl, swup.getCurrentUrl())) {
			return logger.warn(
				`The fragment URL of ${selector} is identical to the current URL. This could mean that [data-swup-fragment-url] needs to be provided by the server.`
			);
		}

		el.href = fragmentUrl;
	});
}

/**
 * Adds [data-swup-fragment-url] to all fragments that don't already contain that attribute
 */
function addFragmentAttributes({ rules, swup }: SwupFragmentPlugin): void {
	const url = swup.getCurrentUrl();

	rules
		.filter((rule) => rule.matchesFrom(url) || rule.matchesTo(url))
		.forEach((rule) => {
			rule.fragments.forEach((fragment) => {
				const element = document.querySelector(fragment.selector);
				// Bail early if this is a <template> element
				if (element?.tagName === 'TEMPLATE') return;
				// Save the selector that matched the element
				element?.setAttribute('data-swup-fragment-selector', fragment.selector);
				// Finally, add the fragment url attribute if not already present
				if (!element?.getAttribute('data-swup-fragment-url')) {
					element?.setAttribute('data-swup-fragment-url', url);
				}
			});
		});
}

/**
 * Get all fragments that should be replaced for a given visit's route
 */
export const getReplaceableFragments = (
	route: Route,
	fragments: Fragment[],
	logger: Logger | undefined
): Fragment[] => {
	return fragments.filter((fragment) => {
		const result = isReplaceableFragment(fragment.selector, route.to);
		if (result === true) return true;

		if (logger) logger.log(result);
		return false;
	});
};

/**
 * Checks if a fragment can should be replaced for a target URL. Returns either true or a string with the reason
 */
export const isReplaceableFragment = (selector: string, targetUrl: string): true | string => {
	const el = document.querySelector(selector);

	if (!el) return `fragment "${selector}" missing in current document`;

	if (elementMatchesFragmentUrl(el, targetUrl))
		return `ignoring fragment "${selector}" as it already matches the URL`;

	return true;
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
export const getRoute = (context: SwupContext): Route | undefined => {
	const from = context.from.url;
	const to = context.to.url;
	if (!from || !to) return;
	return { from, to };
};

/**
 * Add the rule name to fragments
 */
export const addRuleNameToFragments = ({ rule, fragments }: FragmentVisit): void => {
	if (!rule.name) return;
	fragments.forEach(({ selector }) => {
		document.querySelector(selector)?.classList.add(`to-${rule.name}`);
	});
};

/**
 * Remove the rule name from fragments
 */
export const removeRuleNameFromFragments = ({ rule, fragments }: FragmentVisit): void => {
	if (!rule.name) return;
	fragments.forEach(({ selector }) => {
		document.querySelector(selector)?.classList.remove(`to-${rule.name}`);
	});
};

/**
 * Extract the selectors of an array of fragment objects
 */
export const getFragmentSelectors = (fragments: Fragment[]): string[] => {
	return fragments.map((fragment) => fragment.selector);
};

/**
 * Get the parents of a teleported fragment
 */
const getParentContainers = ({ selector }: Fragment, swup: Swup): string[] => {
	const containers = [...new Set([...swup.options.containers, ...swup.context.containers])];

	const doc = swup.context.to?.html
		? new DOMParser().parseFromString(swup.context.to.html, 'text/html')
		: document;

	const el = doc.querySelector(selector);
	if (!el) return [];

	const parents = containers.filter(
		(containerSelector) => !el.matches(containerSelector) && el.closest(containerSelector)
	);

	return parents;
};

/**
 * Teleport a fragment
 */
export const teleportFragment = (fragment: Fragment, swup: Swup): void => {
	// Bail early if the fragment shouldn't be teleported
	if (!fragment.teleport) return;

	// Bail early if the fragment doesn't exist
	const el = document.querySelector(fragment.selector);
	if (!el) return;

	/**
	 * Insert a slot for the teleported fragment.
	 * Allows us to teleport the fragment back to it's original position
	 * in the DOM just before the next `content:replace`
	 */
	const slot = document.createElement('template');
	slot.setAttribute('data-swup-teleport-slot', fragment.selector);
	el.before(slot);

	document.body.prepend(el);
};

/**
 * Get the first matching rule for a given route
 */
export const getFirstMatchingRule = (route: Route, rules: Rule[]): Rule | undefined => {
	return rules.find((rule) => rule.matches(route));
};

/**
 * Teleport fragments to the body
 */
export function teleportFragments({ rules, swup }: SwupFragmentPlugin): void {
	const url = swup.getCurrentUrl();
	rules
		.filter((rule) => rule.matchesTo(url))
		.forEach((rule) => rule.fragments.forEach((fragment) => teleportFragment(fragment, swup)));
}

/**
 * Teleports fragments back to their placeholders
 */
export const teleportFragmentsBack = (): void => {
	document.querySelectorAll('[data-swup-teleport-slot]').forEach((el) => {
		const selector = el.getAttribute('data-swup-teleport-slot');
		if (!selector) return;
		const teleported = document.querySelector(selector);
		if (!teleported) return;
		el.replaceWith(teleported);
	});
};

/**
 * Makes sure unchanged fragments land in the cache of the current page
 */
export const cacheUnchangedFragments = ({ rules, swup, logger }: SwupFragmentPlugin): void => {
	const currentUrl = swup.getCurrentUrl();
	const cache = swup.cache;

	// Get the cache entry for the current URL
	const currentCache = cache.get(currentUrl);
	if (!currentCache) return;
	const currentCachedDocument = new DOMParser().parseFromString(currentCache.html, 'text/html');

	// debug info
	const updatedFragments: {
		fragmentSelector: string;
		fragmentUrl: string;
	}[] = [];

	// We only want to handle fragments that don't fit the current URL
	const unchangedFragments = Array.from(
		document.querySelectorAll('[data-swup-fragment-url]')
	).filter((el) => !elementMatchesFragmentUrl(el, currentUrl));

	unchangedFragments.forEach((el) => {
		// Get and validate `fragmentUrl`
		const rawFragmentUrl = el.getAttribute('data-swup-fragment-url');
		if (!rawFragmentUrl) {
			return logger.warn(`invalid [data-swup-fragment-url] found on unchanged fragment:`, el);
		}
		const fragmentUrl = Location.fromUrl(rawFragmentUrl).url;

		// Get and validate `fragmentSelector`
		const fragmentSelector = el.getAttribute('data-swup-fragment-selector');
		if (!fragmentSelector) {
			return logger.warn(`no [data-swup-fragment-selector] found on unchanged fragment:`, el);
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
		updatedFragments.push({ fragmentSelector, fragmentUrl });
	});

	if (!updatedFragments.length) return;

	// Update the cache of the current page with the updated html
	cache.update(currentUrl, {
		...currentCache,
		html: currentCachedDocument.documentElement.outerHTML
	});

	// Log the result
	logger.log(`updated cache for unchanged fragment(s):`, updatedFragments);
};
