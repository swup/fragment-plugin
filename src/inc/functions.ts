import { Location } from 'swup';
import type { Context } from 'swup';
import type { Rule, Route } from '../SwupFragmentPlugin.js';
import Logger from './Logger.js';

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
		return `Ignoring fragment as it already matches the URL`;

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
export const getRoute = (context: Context): Route | undefined => {
	const from = context.from.url;
	const to = context.to.url;
	if (!from || !to) return;
	return { from, to }
}
