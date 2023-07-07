import PluginBase from '@swup/plugin';
import Rule from './inc/Rule.js';

import type { Path, Handler } from 'swup';
import Logger from './inc/Logger.js';
import {
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
type State = {
	rule: Rule;
	fragments: string[];
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

	defaults: PluginOptions = {
		rules: [],
		debug: false
	};

	/**
	 * Plugin Constructor
	 * The options are NOT optional and need to contain at least a `rules` property
	 */
	constructor(options: PluginOptions) {
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

		swup.hooks.before('samePage', this.onSamePage);
		swup.hooks.on('transitionStart', this.onTransitionStart);
		swup.hooks.on('replaceContent', this.afterReplaceContent);

		updateFragmentUrlAttributes(this.rules, this.swup.getCurrentUrl());
	}

	/**
	 * Runs when the plugin is being unmounted
	 */
	unmount() {
		const swup = this.swup;

		swup.hooks.off('samePage', this.onSamePage);
		swup.hooks.off('transitionStart', this.onTransitionStart);
		swup.hooks.on('replaceContent', this.afterReplaceContent);

		cleanupFragmentUrls();
	}

	/**
	 * Get the state for a given route
	 */
	getState(route: Route, logger?: Logger): State | undefined {
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
	onSamePage: Handler<'samePage'> = (context) => {
		const rule = this.getFirstMatchingRule({
			from: context.from.url,
			to: context.to!.url
		});

		if (rule) context.scroll.reset = false;
	};

	/**
	 * Do special things if this is a fragment visit
	 */
	onTransitionStart: Handler<'transitionStart'> = async (context) => {
		const route = {
			from: context.from.url,
			to: context.to!.url
		};

		const state = this.getState(route, this.logger);

		this.logger.log("fragment visit:", state);

		/**
		 * Bail early if the current route doesn't match
		 * a rule or wouldn't replace any fragments
		 */
		if (!state) return;

		// Disable scrolling for this transition
		context.scroll.reset = false;

		// Add a suffix to all transition classes, e.g. .is-animating--fragment, .is-leaving--fragment, ...
		context.transition.name = state.rule.name;

		// Add the transition classes directly to the fragments for this visit
		context.transition.scope = 'containers';

		// Overwrite the containers for this visit
		context.containers = state.fragments;

		// Overwrite the animationSelector for this visit
		context.transition.selector = state.fragments.join(',');
	};

	/**
	 * Runs after the content was replaced
	 */
	afterReplaceContent: Handler<'replaceContent'> = () => {
		updateFragmentUrlAttributes(this.rules, this.swup.getCurrentUrl());
		handleDynamicFragmentLinks(this.logger);
	};
}
