import PluginBase from '@swup/plugin';
import { Location } from 'swup';
import Rule, { Path } from './Rule.js';
import Swup, { Handler, Plugin } from 'swup';
import Logger from './Logger.js';
import {
	addClassToUnchangedFragments,
	cleanupAnimationAttributes,
	cleanupFragmentUrls,
	handleDynamicFragmentLinks,
	replaceFragments,
	setAnimationAttributes,
	updateFragmentUrlAttributes,
	validateFragment
} from './functions.js';

/**
 * Re-Export the Rule class
 */
export type { Rule };

/**
 * Represents a route from one to another URL
 */
export type Route = {
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
type Context = {
	route?: Route;
	matchedRule?: Rule;
	fragments?: string[];
};

/**
 * The main plugin class
 */
export default class SwupFragmentPlugin extends PluginBase {
	name = 'SwupFragmentPlugin';

	requires = { swup: '>=4' };

	rules: Rule[] = [];

	options: PluginOptions;
	originalReplaceContent?: Swup['replaceContent'];
	scrollPlugin?: Plugin;

	context: Context = {};

	logger: Logger;

	// Make selected functions public
	validateFragment = validateFragment;

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
		const { swup } = this;

		this.originalReplaceContent = swup.replaceContent;
		swup.replaceContent = this.replaceContent;

		swup.hooks.on('transitionStart', this.onTransitionStart);
		swup.hooks.on('transitionEnd', this.onTransitionEnd);
		swup.hooks.on('replaceContent', this.onContentReplaced);

		updateFragmentUrlAttributes(this.rules, this.swup.getCurrentUrl());
	}

	/**
	 * Runs when the plugin is being unmounted
	 */
	unmount() {
		const { swup } = this;

		swup.replaceContent = this.originalReplaceContent!;
		this.originalReplaceContent = undefined;

		swup.hooks.off('transitionStart', this.onTransitionStart);
		swup.hooks.off('transitionEnd', this.onTransitionEnd);
		swup.hooks.off('replaceContent', this.onContentReplaced);

		cleanupFragmentUrls();
	}

	/**
	 * Prepares a page visit
	 */
	preparePageVisit({ from, to }: Route): void {
		this.context = Object.freeze(this.createContext({ from, to }));
		if (this.context.matchedRule) this.swup.context.scroll.reset = false;
		addClassToUnchangedFragments(to);
	}

	/**
	 * Handles a visit from a URL to another URL
	 */
	createContext(route: Route, logger?: Logger): Context {
		const context: Context = {
			route,
			matchedRule: this.getFirstMatchingRule(route)
		};

		if (!context.matchedRule) return context;

		context.fragments = context.matchedRule.fragments.filter((selector) => {
			const result = validateFragment(selector, route.to);
			if (result === true) return true;

			if (logger) logger.log(result);
			return false;
		});

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
	onTransitionStart: Handler<'transitionStart'> = (context) => {
		const currentRoute = {
			from: context.from.url,
			to: context.to!.url
		};
		// Create an immutable context for the current transition
		this.context = Object.freeze(this.createContext(currentRoute));

		// Add classes to fragments
		addClassToUnchangedFragments(currentRoute.to);

		if (!this.context.matchedRule) return;

		// Disable scrolling for this transition
		this.swup.context.scroll.reset = false;
		setAnimationAttributes(this.context.matchedRule);
	};

	/**
	 * Reset everything after each transition
	 */
	onTransitionEnd = () => {
		cleanupAnimationAttributes();
	};

	/**
	 * Do stuff everytime swup replaces the content
	 */
	onContentReplaced = () => {
		updateFragmentUrlAttributes(this.rules, this.swup.getCurrentUrl());
		handleDynamicFragmentLinks(this.logger);
	};

	/**
	 * Replace the content
	 */
	replaceContent = async (page: any /* @TODO fix type */) => {
		const replacedFragments = replaceFragments(page, this.context.fragments, this.logger);

		if (replacedFragments.length) {
			document.title = page.title;
			return Promise.resolve();
		}

		// No rule matched. Run the default replaceContent
		await this.originalReplaceContent!(page);
		return Promise.resolve();
	};
}
