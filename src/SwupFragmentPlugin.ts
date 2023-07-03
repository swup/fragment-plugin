import PluginBase from '@swup/plugin';
import Rule, { Path } from './inc/Rule.js';
import Swup, { Handler, Plugin, Context, nextTick } from 'swup';
import Logger from './inc/Logger.js';
import {
	addClassToUnchangedFragments,
	cleanupAnimationAttributes,
	cleanupFragmentUrls,
	handleDynamicFragmentLinks,
	replaceFragments,
	setAnimationAttributes,
	updateFragmentUrlAttributes,
	validateFragment,
	getFragments,
	sleep
} from './inc/functions.js';

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
type PluginContext = {
	route?: Route;
	matchedRule?: Rule;
	fragments?: string[];
};

/**
 * The main plugin class
 */
export default class SwupFragmentPlugin extends PluginBase {
	name = 'SwupFragmentPlugin';

	// requires = { swup: '>=4' };

	rules: Rule[] = [];

	options: PluginOptions;

	privateContext: PluginContext = {};

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

	getSwup() {
		return this.swup as Swup;
	}

	/**
	 * Runs when the plugin is being mounted
	 */
	mount() {
		const swup = this.getSwup();

		swup.hooks.on('transitionStart', this.onTransitionStart);
		swup.hooks.on('transitionEnd', this.onTransitionEnd);
		swup.hooks.before('replaceContent', this.beforeReplaceContent);
		swup.hooks.on('replaceContent', this.afterReplaceContent);

		updateFragmentUrlAttributes(this.rules, this.swup.getCurrentUrl());
	}

	/**
	 * Runs when the plugin is being unmounted
	 */
	unmount() {
		const swup = this.getSwup();

		swup.hooks.off('transitionStart', this.onTransitionStart);
		swup.hooks.off('transitionEnd', this.onTransitionEnd);
		swup.hooks.off('replaceContent', this.beforeReplaceContent);
		swup.hooks.on('replaceContent', this.afterReplaceContent);

		cleanupFragmentUrls();
	}

	/**
	 * Handles a visit from a URL to another URL
	 */
	createContext(route: Route, logger?: Logger): PluginContext {
		const context: PluginContext = {
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
		const swup = this.getSwup();

		const currentRoute = {
			from: context.from.url,
			to: context.to!.url
		};
		// Create an immutable context for the current transition
		this.privateContext = Object.freeze(this.createContext(currentRoute, this.logger));

		// Add classes to fragments
		addClassToUnchangedFragments(currentRoute.to);

		// Bail early if the current route doesn't match any rule
		if (!this.privateContext.matchedRule) return;

		// Bail early if no fragments would be replaced for the current rule
		if (!this.privateContext.fragments?.length) return;

		// Disable the default animations
		// context.transition.animate = false;

		// swup.hooks.once('animationSkipped', async () => {
		// 	const fragments = getFragments(this.privateContext.fragments);
		// 	fragments.forEach((el) => el.classList.add('is-animating', 'is-leaving', 'is-changing'));

		// 	await nextTick();
		// 	await Promise.all(
		// 		swup.getAnimationPromises({
		// 			selector: swup.options.animationSelector,
		// 			elements: fragments
		// 		})
		// 	);
		// 	// await sleep(5000);
		// });

		// this.getSwup().hooks.once('replaceContent', async () => {
		// 	const fragments = getFragments(this.privateContext.fragments);
		// 	await nextTick();
		// 	fragments.forEach((el) => el.classList.remove('is-animating'));
		// 	await Promise.all(
		// 		swup.getAnimationPromises({
		// 			selector: swup.options.animationSelector,
		// 			elements: fragments
		// 		})
		// 	);
		// });

		// this.getSwup().hooks.once('transitionEnd', () => {
		// 	const fragments = getFragments(this.privateContext.fragments);
		// 	fragments.forEach((el) => el.classList.remove('is-rendering'));
		// });

		// Disable scrolling for this transition
		this.getSwup().context.scroll.reset = false;
		setAnimationAttributes(this.privateContext.matchedRule);
	};

	/**
	 * Reset everything after each transition
	 */
	onTransitionEnd = () => {
		cleanupAnimationAttributes();
	};

	/**
	 * Runs before replacing the content
	 */
	beforeReplaceContent: Handler<'replaceContent'> = (_context, args) => {
		const replacedFragments = replaceFragments(
			args.page.html,
			this.privateContext.fragments,
			this.logger
		);

		if (replacedFragments.length) args.containers = [];
	};

	/**
	 * Runs after replacing the content
	 */
	afterReplaceContent: Handler<'replaceContent'> = () => {
		updateFragmentUrlAttributes(this.rules, this.swup.getCurrentUrl());
		handleDynamicFragmentLinks(this.logger);
	}
}
