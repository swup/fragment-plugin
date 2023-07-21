import PluginBase from '@swup/plugin';
import Rule from './inc/Rule.js';
import type { Path, Handler, Visit } from 'swup';
import Logger from './inc/Logger.js';
import {
	handlePageView,
	cleanupFragmentElements,
	getFragmentsForVisit,
	getRoute,
	addRuleNameClasses,
	removeRuleNameFromFragments,
	getFirstMatchingRule,
	cacheForeignFragments,
	shouldSkipAnimation,
	highlight
} from './inc/functions.js';

declare module 'swup' {
	export interface Visit {
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

type ParsedOptions = Required<Options>;

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

	options: ParsedOptions;

	defaults: ParsedOptions = {
		rules: [],
		debug: false
	};

	logger?: Logger;

	/**
	 * Plugin Constructor
	 * The options are NOT optional and need to contain at least a `rules` property
	 */
	constructor(options: Options) {
		super();

		this.options = { ...this.defaults, ...options };
		if (this.options.debug) this.logger = new Logger();

		this.rules = this.options.rules.map(
			({ from, to, fragments, name }) => new Rule(from, to, fragments, name, this.logger)
		);
	}

	/**
	 * Runs when the plugin is being mounted
	 */
	mount() {
		const swup = this.swup;

		this.before('link:self', this.onLinkToSelf);
		this.on('visit:start', this.onVisitStart);
		this.before('animation:out:await', this.maybeSkipOutAnimation);
		this.before('animation:in:await', this.maybeSkipInAnimation);
		this.on('content:replace', this.onContentReplace);
		this.on('visit:end', this.onVisitEnd);

		handlePageView(this);
	}

	/**
	 * Runs when the plugin is being unmounted
	 */
	unmount() {
		super.unmount();
		this.logger = undefined;
		cleanupFragmentElements();
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
	onLinkToSelf: Handler<'link:self'> = (visit) => {
		const route = getRoute(visit);
		if (!route) return;

		const rule = getFirstMatchingRule(route, this.rules);

		if (rule) visit.scroll.reset = false;
	};

	/**
	 * Do special things if this is a fragment visit
	 */
	onVisitStart: Handler<'visit:start'> = async (visit) => {
		const route = getRoute(visit);
		if (!route) return;

		const fragmentVisit = this.getFragmentVisit(route, this.logger);

		/**
		 * Bail early if the current route doesn't match
		 * a rule or wouldn't replace any fragments
		 */
		if (!fragmentVisit) return;

		visit.fragmentVisit = fragmentVisit;

		this.logger?.log(`fragment visit: ${highlight(visit.fragmentVisit.fragments.join(', '))}`);

		// Disable the out animation if there are only placeholders
		// visit.animation.animate = fragmentVisit.animate;

		// Disable scrolling for this transition
		visit.scroll.reset = false;

		// Add the transition classes directly to the fragments for this visit
		visit.animation.scope = visit.fragmentVisit.fragments;

		// Overwrite the containers for this visit
		visit.containers = visit.fragmentVisit.fragments;

		// Overwrite the animationSelector for this visit
		visit.animation.selector = visit.fragmentVisit.fragments.join(',');

		addRuleNameClasses(visit);
	};

	/**
	 * Skips the out-animation for empty fragments
	 */
	maybeSkipOutAnimation: Handler<'animation:out:await'> = (visit, args) => {
		if (visit.fragmentVisit && shouldSkipAnimation(this)) {
			this.logger?.log(
				`${highlight('out')}-animation skipped for ${highlight(visit.fragmentVisit?.fragments.toString())}`
			);
			args.skip = true;
		}
	};

	/**
	 * Skips the in-animation for empty fragments
	 */
	maybeSkipInAnimation: Handler<'animation:in:await'> = (visit, args) => {
		if (visit.fragmentVisit && shouldSkipAnimation(this)) {
			this.logger?.log(
				`${highlight('in')}-animation skipped for ${highlight(visit.fragmentVisit?.fragments.toString())}`
			);
			args.skip = true;
		}
	};

	/**
	 * Runs after the content was replaced
	 */
	onContentReplace: Handler<'content:replace'> = (visit) => {
		addRuleNameClasses(visit);
		handlePageView(this);
		cacheForeignFragments(this);
	};

	/**
	 * Remove the rule name from fragments
	 */
	onVisitEnd: Handler<'visit:end'> = (visit) => {
		if (visit.fragmentVisit) removeRuleNameFromFragments(visit.fragmentVisit);
		visit.fragmentVisit = undefined;
	};
}
