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
	readonly name = 'SwupFragmentPlugin';
	readonly requires = { swup: '>=4' };

	protected _rawRules: Rule[] = [];
	protected _parsedRules: ParsedRule[] = [];

	get parsedRules() {
		return this._parsedRules;
	}

	options: Options;

	protected defaults: Options = {
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
	}

	/**
	 * Runs when the plugin is being mounted
	 */
	mount() {
		const swup = this.swup;

		this.setRules(this.options.rules);
		if (__DEV__) {
			if (this.options.debug) this.logger = new Logger();
		}

		this.before('link:self', handlers.onLinkToSelf);
		this.on('visit:start', handlers.onVisitStart);
		this.before('animation:out:await', handlers.maybeSkipOutAnimation);
		this.before('animation:in:await', handlers.maybeSkipInAnimation);
		this.before('content:replace', handlers.beforeContentReplace);
		this.on('content:replace', handlers.onContentReplace);
		this.on('visit:end', handlers.onVisitEnd);

		swup.getFragmentVisit = this.getFragmentVisit.bind(this);
		swup.getFragmentRules = this.getRules.bind(this);
		swup.setFragmentRules = this.setRules.bind(this);
		swup.prependFragmentRule = this.prependRule.bind(this);
		swup.appendFragmentRule = this.appendRule.bind(this);

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
		const { swup } = this;
		swup.getFragmentVisit = undefined;
		swup.getFragmentRules = undefined;
		swup.setFragmentRules = undefined;
		swup.prependFragmentRule = undefined;
		swup.appendFragmentRule = undefined;
		cleanupFragmentElements();
	}

	setRules(rules: Rule[]) {
		this._rawRules = structuredClone(rules);
		this._parsedRules = rules.map((rule) => this.parseRule(rule));
		if (__DEV__) this.logger?.log('Updated fragment rules', this.getRules());
	}

	getRules() {
		return structuredClone(this._rawRules);
	}

	prependRule(rule: Rule) {
		this.setRules([rule, ...this.getRules()]);
	}

	appendRule(rule: Rule) {
		this.setRules([...this.getRules(), rule]);
	}

	/**
	 * Add a fragment rule
	 * @param {Rule} rule 			The rule options
	 * @param {'start' | 'end'} at 	Should the rule be added to the beginning or end of the existing rules?
	 */
	parseRule({ from, to, containers, name, scroll, focus }: Rule): ParsedRule {
		return new ParsedRule({
			from,
			to,
			containers,
			name,
			scroll,
			focus,
			logger: this.logger,
			swup: this.swup
		});
	}

	/**
	 * Get the fragment visit object for a given route
	 */
	getFragmentVisit(route: Route): FragmentVisit | undefined {
		const rule = getFirstMatchingRule(route, this.parsedRules);

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
