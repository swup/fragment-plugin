import PluginBase from '@swup/plugin';
import Rule from './inc/Rule.js';

import type { Path, Handler } from 'swup';
import Logger from './inc/Logger.js';
import {
	addFragmentUrls,
	cleanupFragmentUrls,
	handleDynamicFragmentLinks,
	getValidFragments,
	getRoute,
	addRuleNameToFragments,
	removeRuleNameFromFragments,
	getFragmentSelectors,
	cleanupTeleportedFragments,
	teleportFragments
} from './inc/functions.js';

declare module "swup" {
	export interface Context {
		fragmentVisit?: FragmentVisit
	}
}


/**
 * Represents a route from one to another URL
 */
export type Route = {
	from: string;
	to: string;
};

export type FragmentOptions = string | {
	selector: string;
	teleport?: boolean;
};

export type RuleOptions = {
	from: Path;
	to: Path;
	fragments: FragmentOptions[];
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
	fragments: Fragment[];
};

/**
 * Represents a fragment object
 */
export type Fragment = {
	selector: string;
	teleport: boolean;
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
			prefix: '[@swup/fragment-plugin]',
			muted: this.options.debug !== true
		});

		this.rules = this.options.rules.map(
			({ from, to, fragments, name }) => new Rule(from, to, fragments, name)
		);
	}

	/**
	 * Runs when the plugin is being mounted
	 */
	mount() {
		const swup = this.swup;

		swup.hooks.before('link:self', this.onLinkToSelf);
		swup.hooks.on('visit:start', this.onVisitStart);
		swup.hooks.on('content:replace', this.onContentReplace);
		swup.hooks.on('visit:end', this.onVisitEnd);

		addFragmentUrls(this.rules, this.swup);
		teleportFragments(this.rules, this.swup);
	}

	/**
	 * Runs when the plugin is being unmounted
	 */
	unmount() {
		const swup = this.swup;

		swup.hooks.off('link:self', this.onLinkToSelf);
		swup.hooks.off('visit:start', this.onVisitStart);
		swup.hooks.off('content:replace', this.onContentReplace);
		swup.hooks.off('visit:end', this.onVisitEnd);

		cleanupFragmentUrls();
	}

	/**
	 * Get the state for a given route
	 */
	getFragmentVisit(route: Route, logger?: Logger): FragmentVisit | undefined {
		const rule = this.getFirstMatchingRule(route);

		// Bail early if no rule matched
		if (!rule) return;

		// Validate the fragments from the matched rule
		const fragments = getValidFragments(route, rule.fragments, logger);
		// Bail early if there are no valid fragments for the rule
		if (!fragments.length) return;

		const state = { rule, fragments };

		return state;
	}

	/**
	 * Get the first matching rule for a given route
	 */
	getFirstMatchingRule = (route: Route): Rule | undefined => {
		return this.rules.find((rule) => rule.matches(route));
	};

	/**
	 * Do not scroll if clicking on a link to the same page
	 * and the route matches a fragment rule
	 */
	onLinkToSelf: Handler<'link:self'> = (context) => {
		const route = getRoute(context);
		if (!route) return;

		const rule = this.getFirstMatchingRule(route);

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

		this.logger.log('fragment visit:', context.fragmentVisit);

		const fragmentSelectors = getFragmentSelectors(context.fragmentVisit.fragments);

		// Disable scrolling for this transition
		context.scroll.reset = false;

		// Add the transition classes directly to the fragments for this visit
		context.animation.scope = fragmentSelectors;

		// Overwrite the containers for this visit
		context.containers = fragmentSelectors;

		// Overwrite the animationSelector for this visit
		context.animation.selector = fragmentSelectors.join(',');

		addRuleNameToFragments(context.fragmentVisit);
	};

	/**
	 * Runs after the content was replaced
	 */
	onContentReplace: Handler<'content:replace'> = (context) => {
		if (context.fragmentVisit) addRuleNameToFragments(context.fragmentVisit);
		addFragmentUrls(this.rules, this.swup);
		handleDynamicFragmentLinks(this.logger);
		cleanupTeleportedFragments(context);
		teleportFragments(this.rules, this.swup);
	};

	/**
	 * Remove the rule name from fragments
	 */
	onVisitEnd: Handler<'visit:end'> = (context) => {
		if (context.fragmentVisit) removeRuleNameFromFragments(context.fragmentVisit);
		context.fragmentVisit = undefined;
	};
}
