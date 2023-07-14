import Swup, { Location } from 'swup';
import type { Context as SwupContext } from 'swup';
import type { Rule, Route, FragmentVisit, Fragment } from '../SwupFragmentPlugin.js';
import Logger from './Logger.js';
import SwupFragmentPlugin from '../SwupFragmentPlugin.js';

/**
 * Updates the `href` of links matching [data-swup-link-to-fragment="#my-fragment"]
 */
export function handleDynamicFragmentLinks(logger?: Logger): void {
	const targetAttribute = 'data-swup-link-to-fragment';
	const links = document.querySelectorAll<HTMLAnchorElement>(`a[${targetAttribute}]`);

	links.forEach((el) => {
		const selector = el.getAttribute(targetAttribute);
		if (!selector)
			return logger?.warn(
				`[${targetAttribute}] needs to contain a valid CSS selector`,
				selector
			);

		const fragment = document.querySelector(selector);
		if (!fragment) return logger?.warn(`No element found for [${targetAttribute}]:`, selector);

		const fragmentUrl = fragment.getAttribute('data-swup-fragment-url');
		if (!fragmentUrl)
			return logger?.warn("Targeted element doesn't have a [data-swup-fragme-url]", fragment);

		el.href = fragmentUrl;
	});
}

/**
 * Adds [data-swup-fragment-url] to all fragments that don't already contain that attribute
 */
export const addFragmentUrls = ({ rules, swup }: SwupFragmentPlugin): void => {
	const url = swup.getCurrentUrl();
	rules.forEach((rule) => {
		if (!rule.matchesFrom(url)) return;

		rule.fragments.forEach((fragment) => {
			const element = document.querySelector(fragment.selector);
			// Bail early if the fragment already has the attribute
			if (element?.matches('[data-swup-fragment-url]')) return;
			// Finally, add the attribute
			element?.setAttribute('data-swup-fragment-url', url);
		});
	});
};

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
export const cleanupFragmentUrls = () => {
	document.querySelectorAll('[data-swup-fragment-url]').forEach((el) => {
		el.removeAttribute('data-swup-fragment-url');
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
 * Cleanup existing teleported fragments
 */
export const cleanupTeleportedFragments = (context: SwupContext) => {
	document.querySelectorAll('[data-swup-fragment-parents]').forEach((el) => {
		const parentSelectors = JSON.parse(
			String(el.getAttribute('data-swup-fragment-parents'))
		) as string[];

		const shouldBeRemoved = parentSelectors.some((selector) =>
			context.containers.includes(selector)
		);

		if (shouldBeRemoved) el.remove();
	});
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

	const parents = getParentContainers(fragment, swup);

	el.setAttribute('data-swup-fragment-parents', JSON.stringify(parents));
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
export const teleportFragments = ({ rules, swup }: SwupFragmentPlugin): void => {
	const url = swup.getCurrentUrl();

	rules.forEach((rule) => {
		const matchesFrom = rule.matchesFrom(url);
		const matchesTo = rule.matchesTo(url);

		if (!matchesFrom && !matchesTo) return;

		rule.fragments.forEach((fragment) => teleportFragment(fragment, swup));
	});
};

/**
 * Get a flattened array of all available fragments for all rules
 */
const getAllFragmentSelectors = (rules: Rule[]): string[] => {
	const result: string[] = [];
	rules.forEach((rule) => {
		rule.fragments.forEach((fragment) => {
			result.push(fragment.selector);
		});
	});
	return [...new Set([...result])];
};

/**
 * Makes sure persisted fragments land in the cache of the current page
 */
export const cachePersistedFragments = ({ rules, swup }: SwupFragmentPlugin): void => {
	const currentUrl = swup.getCurrentUrl();
	const cache = swup.cache;

	const availableSelectors = getAllFragmentSelectors(rules);

	const persisted = Array.from(document.querySelectorAll('[data-swup-fragment-url]')).filter(
		(el) => !elementMatchesFragmentUrl(el, currentUrl)
	);

	persisted.forEach((el) => {
		const selector = availableSelectors.find((s) => el.matches(s));
		if (!selector) return;

		const fragmentUrl = Location.fromUrl(String(el.getAttribute('data-swup-fragment-url'))).url;

		const fragmentCache = cache.get(fragmentUrl);
		if (!fragmentCache) return;

		const currentCache = cache.get(currentUrl);
		if (!currentCache) return;

		const originalCachedFragment = new DOMParser()
			.parseFromString(fragmentCache.html, 'text/html')
			.querySelector(selector);
		if (!originalCachedFragment) return;

		// We don't want a possibly dynamic `data-swup-fragment-url` to end up in the cache
		originalCachedFragment.removeAttribute('data-swup-fragment-url');

		const currentCachedDocument = new DOMParser().parseFromString(currentCache.html, 'text/html');
		const currentCachedFragment = currentCachedDocument.querySelector(selector);
		if (!currentCachedFragment) return;

		// Preserve `data-swup-fragment-url` if already set on the current fragment
		const currentFragmentUrl = currentCachedFragment.getAttribute('data-swup-fragment-url');
		if (currentFragmentUrl) {
			originalCachedFragment.setAttribute('data-swup-fragment-url', currentFragmentUrl);
		}

		// Replace the current fragment with the preserved fragment
		currentCachedFragment.replaceWith(originalCachedFragment);

		// Mutate the cache of the current page with the updated html
		currentCache.html = currentCachedDocument.documentElement.outerHTML;
	});
};
