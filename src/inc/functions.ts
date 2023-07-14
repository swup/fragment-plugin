import Swup, { Location } from 'swup';
import type { Context } from 'swup';
import type { Rule, Route, State, Fragment } from '../SwupFragmentPlugin.js';
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
export const addFragmentUrls = (rules: Rule[], url: string): void => {
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
export const getValidFragments = (
	route: Route,
	fragments: Fragment[],
	logger: Logger | undefined
): Fragment[] => {
	return fragments.filter((fragment) => {
		const result = validateFragment(fragment.selector, route.to);
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
export const getRoute = (context: Context): Route | undefined => {
	const from = context.from.url;
	const to = context.to.url;
	if (!from || !to) return;
	return { from, to };
};

/**
 * Add the rule name to fragments
 */
export const addRuleNameToFragments = ({ rule, fragments }: State): void => {
	if (!rule.name) return;
	fragments.forEach(({ selector }) => {
		document.querySelector(selector)?.classList.add(`to-${rule.name}`);
	});
};

/**
 * Remove the rule name from fragments
 */
export const removeRuleNameFromFragments = ({ rule, fragments }: State): void => {
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
export const cleanupTeleportedFragments = (context: Context) => {
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
const getParentsOfTeleportedFragment = ({ selector }: Fragment, swup: Swup): string[] => {
	const containers = swup.options.containers;

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
	const el = document.querySelector(fragment.selector);
	if (!el) return;

	if (!fragment.teleport) return;

	const parents = getParentsOfTeleportedFragment(fragment, swup);

	el.setAttribute('data-swup-fragment-parents', JSON.stringify(parents));
	document.body.prepend(el);
};
