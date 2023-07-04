import { Location } from '../SwupFragmentPlugin.js';
import type { Rule, Route } from '../SwupFragmentPlugin.js';
import Logger from './Logger.js';

/**
 * Add the class ".swup-fragment-unchanged" to fragments that match a given URL
 */
export const addClassToUnchangedFragments = (url: string) => {
	// First, remove the class from all elements
	document.querySelectorAll<HTMLElement>('.swup-fragment-unchanged').forEach((el) => {
		el.classList.remove('swup-fragment-unchanged');
	});
	// Then, add the class to every element that matches the given URL
	document.querySelectorAll<HTMLElement>('[data-swup-fragment-url]').forEach((el) => {
		const fragmentUrl = el.getAttribute('data-swup-fragment-url');
		el.classList.toggle('swup-fragment-unchanged', fragmentUrl === url);
	});
};

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
export const updateFragmentUrlAttributes = (rules: Rule[], url: string): void => {
	rules.forEach(({ fragments: selectors }) => {
		selectors.forEach((selector) => {
			const fragment = document.querySelector(selector);
			if (fragment?.matches('[data-swup-fragment-url]')) return;
			fragment?.setAttribute('data-swup-fragment-url', url);
		});
	});
};

/**
 * Removes all fragment-related animation attributes from the `html` element
 */
export const cleanupAnimationAttributes = () => {
	document.documentElement.removeAttribute('data-fragment-visit');
};

export const getValidFragments = (
	route: Route,
	fragments: string[],
	logger: Logger | undefined
): string[] => {
	return fragments.filter((selector) => {
		const result = validateFragment(selector, route.to);
		if (result === true) return true;

		if (logger) logger.log(result);
		return false;
	});
};

/**
 * Validate a fragment for a target URL. Returns either true or a string with the reason
 */
export const validateFragment = (selector: string, targetUrl: string): true | string => {
	const el = document.querySelector(selector);

	if (!el) return 'Fragment missing in current document';

	if (elementMatchesFragmentUrl(el, targetUrl))
		return `Ignoring fragment as it already matches the current URL`;

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
 * All these URLs would be considered the same:
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
 * Replace fragments for a given rule
 */
export function replaceFragments(html: string, fragments?: string[], logger?: Logger): Element[] {
	if (!fragments) return [];

	const incomingDocument = new DOMParser().parseFromString(html, 'text/html');
	const replacedFragments: Element[] = [];

	// Step 1: replace all fragments from the rule
	fragments.forEach((selector) => {
		const currentFragment = window.document.querySelector(selector);

		// Bail early if there is no match for the selector in the current dom
		if (!currentFragment) {
			logger?.warn('Fragment missing in current document:', selector);
			return;
		}

		const newFragment = incomingDocument.querySelector(selector);

		// Bail early if there is no match for the selector in the incoming dom
		if (!newFragment) {
			logger?.warn('Fragment missing in incoming document:', selector);
			return;
		}

		newFragment.classList.add('is-animating', 'is-entering');

		currentFragment.replaceWith(newFragment);

		replacedFragments.push(newFragment);
	});

	logger?.log('Replaced:', replacedFragments);

	return replacedFragments;
}

/**
 * Removes [data-swup-fragment-url] from all elements
 */
export const cleanupFragmentUrls = () => {
	document.querySelectorAll('[data-swup-fragment-url]').forEach((el) => {
		el.removeAttribute('data-swup-fragment-url');
	});
};
