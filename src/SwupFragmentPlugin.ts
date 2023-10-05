import PluginBase from '@swup/plugin';
import ParsedRule from './inc/ParsedRule.js';
import Logger from './inc/Logger.js';
import {
	handlePageView,
	cleanupFragmentElements,
	getFirstMatchingRule,
	getContainersForVisit
} from './inc/functions.js';
import type { Options, Route, FragmentVisit } from './inc/defs.js';
import * as handlers from './inc/handlers.js';
import { __DEV__ } from './inc/env.js';

type RequireKeys<T, K extends keyof T> = Partial<T> & Pick<T, K>;
type InitOptions = RequireKeys<Options, 'rules'>;

/**
 * The main plugin class
 */
export default class SwupFragmentPlugin extends PluginBase {
	name = 'SwupFragmentPlugin';

	requires = { swup: '>=4' };

	rules: ParsedRule[] = [];

	options: Options;

	defaults: Options = {
		rules: [],
		debug: false
	};

	logger?: Logger;

	/**
	 * Plugin Constructor
	 * The options are NOT optional and need to contain at least a `rules` property
	 */
	constructor(options: InitOptions) {
		super();

		this.options = { ...this.defaults, ...options };
		if (__DEV__) {
			if (this.options.debug) this.logger = new Logger();
		}

		this.rules = this.options.rules.map(
			({ from, to, containers, name, scroll, focus }) =>
				new ParsedRule(from, to, containers, name, scroll, focus, this.logger)
		);
	}

	/**
	 * Runs when the plugin is being mounted
	 */
	mount() {
		const swup = this.swup;

		this.before('link:self', handlers.onLinkToSelf);
		this.on('visit:start', handlers.onVisitStart);
		this.before('animation:out:await', handlers.maybeSkipOutAnimation);
		this.before('animation:in:await', handlers.maybeSkipInAnimation);
		this.before('content:replace', handlers.beforeContentReplace);
		this.on('content:replace', handlers.onContentReplace);
		this.on('visit:end', handlers.onVisitEnd);

		swup.getFragmentVisit = this.getFragmentVisit;

		if (__DEV__) {
			this.logger?.warnIf(
				!swup.options.cache,
				`fragment caching will only work with swup's cache being active`
			);
		}

		handlePageView(this);
	}

	/**
	 * Runs when the plugin is being unmounted
	 */
	unmount() {
		super.unmount();
		this.swup.getFragmentVisit = undefined;
		cleanupFragmentElements();
	}

	/**
	 * Get the fragment visit object for a given route
	 */
	getFragmentVisit(route: Route): FragmentVisit | undefined {
		const rule = getFirstMatchingRule(route, this.rules);

		// Bail early if no rule matched
		if (!rule) return;

		// Get containers that should be replaced for this visit
		const containers = getContainersForVisit(route, rule.containers, this.logger);
		// Bail early if there are no containers to be replaced for this visit
		if (!containers.length) return;

		// Pick properties from the current rule that should be projected into the fragmentVisit object
		const { name, scroll, focus } = rule;

		const fragmentVisit: FragmentVisit = {
			containers,
			name,
			scroll,
			focus
		};

		return fragmentVisit;
	}
}
