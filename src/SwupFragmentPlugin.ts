import PluginBase from '@swup/plugin';
import ParsedRule from './inc/ParsedRule.js';
import Logger from './inc/Logger.js';
import {
	handlePageView,
	cleanupFragmentElements,
	getFirstMatchingRule,
	getFragmentVisitContainers
} from './inc/functions.js';
import type { Options, Rule, Route, FragmentVisit } from './inc/defs.js';
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
	}

	/**
	 * Runs when the plugin is being mounted
	 */
	mount() {
		const swup = this.swup;

		this.options.rules.forEach((rule) => this.addRule(rule));

		this.before('link:self', handlers.onLinkToSelf);
		this.on('visit:start', handlers.onVisitStart);
		this.before('animation:out:await', handlers.maybeSkipOutAnimation);
		this.before('animation:in:await', handlers.maybeSkipInAnimation);
		this.before('content:replace', handlers.beforeContentReplace);
		this.on('content:replace', handlers.onContentReplace);
		this.on('visit:end', handlers.onVisitEnd);

		swup.addRule = this.addRule.bind(this);
		swup.getFragmentVisit = this.getFragmentVisit.bind(this);

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
		this.rules = [];
		cleanupFragmentElements();
	}

	/**
	 * Add a fragment rule
	 * @param {Rule} rule 			The rule options
	 * @param {'start' | 'end'} at 	Should the rule be added to the beginning or end of the existing rules?
	 */
	addRule(
		{ from, to, containers, name, scroll, focus }: Rule,
		at: 'start' | 'end' = 'end'
	): ParsedRule[] {
		const parsedRule = new ParsedRule({
			from,
			to,
			containers,
			name,
			scroll,
			focus,
			logger: this.logger,
			swup: this.swup
		});

		switch (at) {
			case 'start':
				this.rules.unshift(parsedRule);
				break;
			case 'end':
				this.rules.push(parsedRule);
				break;
			default:
				this.logger?.error(new Error(`addRule(rule, at): 'at' must either be 'start' or 'end'`));
				break;
		}

		return this.rules;
	}

	/**
	 * Get the fragment visit object for a given route
	 */
	getFragmentVisit(route: Route): FragmentVisit | undefined {
		const rule = getFirstMatchingRule(route, this.rules);

		// Bail early if no rule matched
		if (!rule) return;

		// Get containers that should be replaced for this visit
		const containers = getFragmentVisitContainers(
			route,
			rule.containers,
			this.swup,
			this.logger
		);
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
