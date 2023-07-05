import PluginBase from '@swup/plugin';
import Rule from './inc/Rule.js';

import type { Path, Handler } from 'swup';
import Logger from './inc/Logger.js';
import {
	addClassToUnchangedFragments,
	cleanupAnimationAttributes,
	cleanupFragmentUrls,
	handleDynamicFragmentLinks,
	updateFragmentUrlAttributes,
	getValidFragments
} from './inc/functions.js';

/**
 * Represents a route from one to another URL
 */
type Route = {
	from: string;
	to: string;
};

/**
 * This is being used in the type PluginOptions
 */
type RuleOptions = {
	from: Path;
	to: Path;
	fragments: string[];
	name?: string;
};

/**
 * The Plugin Options
 */
export type PluginOptions = {
	rules: RuleOptions[];
	debug?: boolean;
};

/**
 * The context, available throughout every transition
 */
type PluginContext = {
	matchedRule?: Rule;
	fragments?: string[];
};

/**
 * Re-exports
 */
export type { Route, Path, Rule };

/**
 * The main plugin class
 */
export default class SwupFragmentPlugin extends PluginBase {
	name = 'SwupFragmentPlugin';

	requires = { swup: '>=4' };

	rules: Rule[] = [];

	options: PluginOptions;

	logger: Logger;

	/**
	 * Plugin Constructor
	 * The options are NOT optional and need to contain at least a `rules` property
	 */
	constructor(options: PluginOptions) {
		super();

		const defaults: PluginOptions = {
			rules: [],
			debug: false
		};

		this.options = {
			...defaults,
			...options
		};
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

		swup.hooks.on('transitionStart', this.onTransitionStart);
		swup.hooks.on('transitionEnd', this.onTransitionEnd);
		swup.hooks.on('replaceContent', this.afterReplaceContent);

		updateFragmentUrlAttributes(this.rules, this.swup.getCurrentUrl());
	}

	/**
	 * Runs when the plugin is being unmounted
	 */
	unmount() {
		const swup = this.swup;

		swup.hooks.off('transitionStart', this.onTransitionStart);
		swup.hooks.off('transitionEnd', this.onTransitionEnd);
		swup.hooks.on('replaceContent', this.afterReplaceContent);

		cleanupFragmentUrls();
	}

	/**
	 * Handles a visit from a URL to another URL
	 */
	getContext(route: Route, logger?: Logger): PluginContext {
		const matchedRule = this.getFirstMatchingRule(route);

		// Bail early if no rule matched
		if (!matchedRule) return {};

		// Validate the fragments from the matched rule
		const fragments = getValidFragments(route, matchedRule.fragments, logger);

		const context = { matchedRule, fragments };

		if (logger) logger.log('Context:', context);

		return context;
	}

	/**
	 * Get the first matching rule for a given route
	 */
	getFirstMatchingRule = (route: Route): Rule | undefined => {
		return this.rules.find((rule) => rule.matches(route));
	};

	/**
	 * Do special things if this is a fragment visit
	 */
	onTransitionStart: Handler<'transitionStart'> = async (context) => {
		const swup = this.swup;

		const currentRoute = {
			from: context.from.url,
			to: context.to!.url
		};

		const { matchedRule, fragments } = this.getContext(currentRoute, this.logger);

		// Add classes to fragments
		addClassToUnchangedFragments(currentRoute.to);

		// Bail early if the current route doesn't match any rule
		if (!matchedRule) return;

		// Bail early if no fragments would be replaced for the current rule
		if (!fragments?.length) return;

		// Disable scrolling for this transition
		swup.context.scroll.reset = false;

		// Add a suffix to all transition classes, e.g. .is-animating--fragment, .is-leaving--fragment, ...
		swup.context.transition.name = matchedRule.name;

		// Add the transition classes directly to the fragments for this visit
		swup.context.transition.scope = 'containers';

		// Overwrite the containers for this visit
		swup.context.containers = fragments;
	};

	/**
	 * Reset everything after each transition
	 */
	onTransitionEnd = () => {
		cleanupAnimationAttributes();
	};

	/**
	 * Runs after the content was replaced
	 */
	afterReplaceContent: Handler<'replaceContent'> = () => {
		updateFragmentUrlAttributes(this.rules, this.swup.getCurrentUrl());
		handleDynamicFragmentLinks(this.logger);
	};
}
