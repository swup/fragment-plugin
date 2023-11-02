import type { Handler } from 'swup';
import { highlight } from './Logger.js';
import type { default as FragmentPlugin } from '../SwupFragmentPlugin.js';

import {
	handlePageView,
	getRoute,
	applyRuleNameClass,
	getFirstMatchingRule,
	cacheForeignFragmentElements,
	shouldSkipAnimation,
	adjustVisitScroll
} from './functions.js';

import { __DEV__ } from './env.js';

/**
 * Do not scroll if clicking on a link to the same page
 * and the route matches a fragment rule
 */
export const onLinkToSelf: Handler<'link:self'> = function (this: FragmentPlugin, visit) {
	const route = getRoute(visit);
	if (!route) return;

	const rule = getFirstMatchingRule(route, this.rules);

	if (rule) visit.scroll.reset = false;
};

/**
 * Prepare fragment visits
 */
export const onVisitStart: Handler<'visit:start'> = async function (this: FragmentPlugin, visit) {
	const route = getRoute(visit);
	if (!route) return;

	const fragmentVisit = this.getFragmentVisit(route);

	/**
	 * Bail early if the current route doesn't match
	 * a rule or wouldn't replace any fragment elements
	 */
	if (!fragmentVisit) return;

	visit.fragmentVisit = fragmentVisit;

	if (__DEV__) {
		this.logger?.log(`fragment visit: ${highlight(visit.fragmentVisit.containers.join(', '))}`);
	}

	visit.scroll = adjustVisitScroll(fragmentVisit, visit.scroll);

	// Fragment Plugin can't know if Accesssibilty Plugin is installed
	// @ts-expect-error
	const a11y = visit.a11y as { focus?: boolean | string };
	if (typeof fragmentVisit.focus !== 'undefined') {
		if (__DEV__) {
			this.logger?.errorIf(
				!a11y,
				"Can't set visit.a11y.focus. Is @swup/a11y-plugin installed?"
			);
		}
		if (a11y) a11y.focus = fragmentVisit.focus;
	}

	// Add the transition classes directly to the containers for this visit
	visit.animation.scope = visit.fragmentVisit.containers;

	// Overwrite the containers for this visit
	visit.containers = visit.fragmentVisit.containers;

	// Overwrite the animationSelector for this visit
	visit.animation.selector = visit.fragmentVisit.containers.join(',');

	applyRuleNameClass(visit, 'add');
};

/**
 * Skips the out-animation for <template> fragment elements
 */
export const maybeSkipOutAnimation: Handler<'animation:out:await'> = function (
	this: FragmentPlugin,
	visit,
	args
) {
	if (visit.fragmentVisit && shouldSkipAnimation(this)) {
		if (__DEV__)
			this.logger?.log(
				`${highlight('out')}-animation skipped for ${highlight(
					visit.fragmentVisit?.containers.toString()
				)}`
			);
		args.skip = true;
	}
};

/**
 * Skips the in-animation for <template> fragment elements
 */
export const maybeSkipInAnimation: Handler<'animation:in:await'> = function (
	this: FragmentPlugin,
	visit,
	args
) {
	if (visit.fragmentVisit && shouldSkipAnimation(this)) {
		if (__DEV__)
			this.logger?.log(
				`${highlight('in')}-animation skipped for ${highlight(
					visit.fragmentVisit?.containers.toString()
				)}`
			);
		args.skip = true;
	}
};

/**
 * Runs directly before replacing the content
 */
export const beforeContentReplace: Handler<'content:replace'> = function (
	this: FragmentPlugin,
	visit,
	args
) {
	/**
	 * Only use the fragment cache if navigating without a trigger (e.g. link click)
	 * (PopStateEvent, swup.navigate)
	 */
	if (visit.trigger.el || !visit.to.url) return;

	const cache = this.swup.cache.get(visit.to.url);
	if (!cache || !cache.fragmentHtml) return;

	args.page.html = cache.fragmentHtml;
	if (__DEV__) this.logger?.log(`fragment cache used for ${highlight(visit.to.url!)}`);
};

/**
 * Runs after the content was replaced
 */
export const onContentReplace: Handler<'content:replace'> = function (this: FragmentPlugin, visit) {
	applyRuleNameClass(visit, 'add');
	handlePageView(this);
	cacheForeignFragmentElements(this);
};

/**
 * Remove possible fragment rule names from fragment elements
 */
export const onVisitEnd: Handler<'visit:end'> = function (this: FragmentPlugin, visit) {
	applyRuleNameClass(visit, 'remove');
};
