import PluginBase from '@swup/plugin';
import Rule from './inc/Rule.js';

import type { Path, Handler, Context } from 'swup';
import Logger from './inc/Logger.js';
import {
	handlePageView,
	cleanupFragmentAttributes,
	getFragmentsForVisit,
	getRoute,
	addRuleNameClasses,
	removeRuleNameFromFragments,
	getFirstMatchingRule,
	cacheForeignFragments,
	shouldSkipAnimation
} from './inc/functions.js';

import SwupFragmentPlaceholder from './inc/SwupFragmentPlaceholder.js';

declare module 'swup' {
	export interface Context {
		fragmentVisit?: FragmentVisit;
	}
}

/**
 * Represents a route from one to another URL
 */
export type Route = {
	from: string;
	to: string;
};

export type RuleOptions = {
	from: Path;
	to: Path;
	fragments: string[];
	name?: string;
};

export type Options = {
	rules: RuleOptions[];
	debug?: boolean;
};

/**
 * The state of the current visit
 */
export type FragmentVisit = {
	rule: Rule;
	fragments: string[];
};

/**
 * Re-exports
 */
export type { Rule };

/**
 * The main plugin class
 */
export default class SwupFragmentPlugin extends PluginBase {
	name = 'SwupFragmentPlugin';

	requires = { swup: '>=4' };

	rules: Rule[] = [];

	options: Options;

	logger: Logger;

	defaults: Options = {
		rules: [],
		debug: false
	};

	/**
	 * Plugin Constructor
	 * The options are NOT optional and need to contain at least a `rules` property
	 */
	constructor(options: Options) {
		super();

		this.options = { ...this.defaults, ...options };

		this.logger = new Logger({
			prefix: '🧩',
			muted: this.options.debug !== true
		});

		this.rules = this.options.rules.map(
			({ from, to, fragments, name }) => new Rule(from, to, fragments, name, this.logger)
		);

		this.defineCustomElements();
	}

	/**
	 * Defines custom elements
	 */
	defineCustomElements(): void {
		if (!window.customElements.get('swup-fragment-placeholder')) {
			window.customElements.define('swup-fragment-placeholder', SwupFragmentPlaceholder);
		}
	}

	/**
	 * Runs when the plugin is being mounted
	 */
	mount() {
		const swup = this.swup;

		swup.hooks.before('link:self', this.onLinkToSelf);
		swup.hooks.on('visit:start', this.onVisitStart);
		swup.hooks.replace('animation:await', this.maybeSkipAnimation);
		swup.hooks.on('content:replace', this.onContentReplace);
		swup.hooks.on('visit:end', this.onVisitEnd);

		handlePageView(this);
	}

	/**
	 * Runs when the plugin is being unmounted
	 */
	unmount() {
		const swup = this.swup;

		swup.hooks.off('link:self', this.onLinkToSelf);
		swup.hooks.off('visit:start', this.onVisitStart);
		swup.hooks.off('animation:await', this.maybeSkipAnimation);
		swup.hooks.off('content:replace', this.onContentReplace);
		swup.hooks.off('visit:end', this.onVisitEnd);

		cleanupFragmentAttributes();
	}

	/**
	 * Get the state for a given route
	 */
	getFragmentVisit(route: Route, logger?: Logger): FragmentVisit | undefined {
		const rule = getFirstMatchingRule(route, this.rules);

		// Bail early if no rule matched
		if (!rule) return;

		// Validate the fragments from the matched rule
		const fragments = getFragmentsForVisit(route, rule.fragments, logger);
		// Bail early if there are no valid fragments for the rule
		if (!fragments.length) return;

		const visit: FragmentVisit = {
			rule,
			fragments
		};

		return visit;
	}

	/**
	 * Do not scroll if clicking on a link to the same page
	 * and the route matches a fragment rule
	 */
	onLinkToSelf: Handler<'link:self'> = (context) => {
		const route = getRoute(context);
		if (!route) return;

		const rule = getFirstMatchingRule(route, this.rules);

		if (rule) context.scroll.reset = false;
	};

	/**
	 * Do special things if this is a fragment visit
	 */
	onVisitStart: Handler<'visit:start'> = async (context) => {
		const route = getRoute(context);
		if (!route) return;

		const fragmentVisit = this.getFragmentVisit(route, this.logger);

		/**
		 * Bail early if the current route doesn't match
		 * a rule or wouldn't replace any fragments
		 */
		if (!fragmentVisit) return;

		context.fragmentVisit = fragmentVisit;

		this.logger.log(
			`fragment visit: %c${context.fragmentVisit.fragments.join(', ')}%c`,
			this.logger.RED,
			this.logger.RESET
		);

		// Disable the out animation if there are only placeholders
		// context.animation.animate = fragmentVisit.animate;

		// Disable scrolling for this transition
		context.scroll.reset = false;

		// Add the transition classes directly to the fragments for this visit
		context.animation.scope = context.fragmentVisit.fragments;

		// Overwrite the containers for this visit
		context.containers = context.fragmentVisit.fragments;

		// Overwrite the animationSelector for this visit
		context.animation.selector = context.fragmentVisit.fragments.join(',');

		addRuleNameClasses(context);
	};

	/**
	 * Skips the animation for empty fragments
	 */
	maybeSkipAnimation: Handler<'animation:await'> = (context, args, defaultHandler) => {
		if (context.fragmentVisit && shouldSkipAnimation(this)) {
			this.logger.log(
				`${args.direction}-animation skipped for %c${context.fragmentVisit?.fragments}%c`,
				this.logger.RED,
				this.logger.RESET
			);
			return Promise.resolve();
		}
		return defaultHandler?.(context, args);
	};

	/**
	 * Runs after the content was replaced
	 */
	onContentReplace: Handler<'content:replace'> = (context) => {
		addRuleNameClasses(context);
		handlePageView(this);
		cacheForeignFragments(this);
	};

	/**
	 * Remove the rule name from fragments
	 */
	onVisitEnd: Handler<'visit:end'> = (context) => {
		if (context.fragmentVisit) removeRuleNameFromFragments(context.fragmentVisit);
		context.fragmentVisit = undefined;
	};
}
