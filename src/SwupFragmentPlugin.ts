import PluginBase from '@swup/plugin';
import ParsedRule from './inc/ParsedRule.js';
import type { Path, Visit } from 'swup';
import Logger from './inc/Logger.js';
import { handlePageView, cleanupFragmentElements, getFragmentVisit } from './inc/functions.js';

import * as handlers from './inc/handlers.js';

import { __DEV__ } from './inc/env.js';

declare module 'swup' {
	export interface Swup {
		getFragmentVisit?: (route: Route) => FragmentVisit | undefined;
	}
	export interface Visit {
		fragmentVisit?: FragmentVisit;
	}
	export interface CacheData {
		fragmentHtml?: string;
	}
}

// The interface for an augmented Fragment Element
export interface FragmentElement extends Element {
	__swupFragment?: {
		url?: string;
		selector?: string;
		modalShown?: boolean;
	};
}

/**
 * Represents a route from one to another URL
 */
export type Route = {
	from: string;
	to: string;
};

export type RuleConditionCallback = (visit: Visit) => boolean;

export type Rule = {
	from: Path;
	to: Path;
	containers: string[];
	name?: string;
	scroll?: boolean | string;
	focus?: boolean | string;
	if?: RuleConditionCallback;
};

export type Options = {
	rules: Rule[];
	debug: boolean;
};
type RequireKeys<T, K extends keyof T> = Partial<T> & Pick<T, K>;
type InitOptions = RequireKeys<Options, 'rules'>;

/**
 * The state of the current visit
 */
export type FragmentVisit = {
	name?: string;
	containers: string[];
	scroll: boolean | string;
	focus?: boolean | string;
};

/**
 * Re-exports
 */
export type { ParsedRule };

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
			({ from, to, containers, if: condition, name, scroll, focus }) => {
				return new ParsedRule(
					from,
					to,
					containers,
					condition,
					name,
					scroll,
					focus,
					this.logger
				);
			}
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

		swup.getFragmentVisit = getFragmentVisit.bind(this);

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
}
