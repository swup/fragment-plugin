import PluginBase from '@swup/plugin';
import Rule from './inc/Rule.js';
import type { Path } from 'swup';
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

export type RuleOptions = {
	from: Path;
	to: Path;
	containers: string[];
	name?: string;
};

export type Options = {
	rules: RuleOptions[];
	debug: boolean;
};

type InitOptions = Partial<Options> & {
	rules: RuleOptions[];
};

/**
 * The state of the current visit
 */
export type FragmentVisit = {
	rule: Rule;
	containers: string[];
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
			({ from, to, containers, name }) => new Rule(from, to, containers, name, this.logger)
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
