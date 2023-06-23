import PluginBase from '@swup/plugin';
import { Location } from 'swup';
import Rule from './Rule.js';
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
 * A union type for pathToRegexp. It accepts strings,
 * arrays of strings or regular expressions.
 * @see https://github.com/pillarjs/path-to-regexp#path-to-regexp-1
 */
export type Path = string | string[] | RegExp;

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
type PluginOptions = {
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
export default class FragmentPlugin extends PluginBase {
	name = 'FragmentPlugin';

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

		swup.on('popState', this.onPopState);
		swup.on('clickLink', this.onClickLink);
		swup.on('transitionStart', this.onTransitionStart);
		swup.on('transitionEnd', this.onTransitionEnd);
		swup.on('contentReplaced', this.onContentReplaced);

		updateFragmentUrlAttributes(this.rules, this.swup.getCurrentUrl());
	}

	/**
	 * Runs when the plugin is being unmounted
	 */
	unmount() {
		const { swup } = this;

		swup.replaceContent = this.originalReplaceContent!;
		this.originalReplaceContent = undefined;

		swup.off('popState', this.onPopState);
		swup.off('clickLink', this.onClickLink);
		swup.off('transitionStart', this.onTransitionStart);
		swup.off('transitionEnd', this.onTransitionEnd);
		swup.off('contentReplaced', this.onContentReplaced);

		cleanupFragmentUrls();
	}

	/**
	 * Set the current fragment on PopState.
	 * The browser URL has already changed during PopState
	 */
	onPopState = () => {
		this.preparePageVisit({
			from: this.swup.currentPageUrl,
			to: this.swup.getCurrentUrl()
		});
	};

	/**
	 * Set the current fragment when clicking a link
	 */
	onClickLink: Handler<'clickLink'> = (event) => {
		this.preparePageVisit({
			from: this.swup.getCurrentUrl(),
			to: Location.fromElement(event.delegateTarget as HTMLAnchorElement).url
		});
	};

	/**
	 * Prepares a page visit
	 */
	preparePageVisit({ from, to }: Route): void {
		this.context = Object.freeze(this.createContext({ from, to }));
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
	onTransitionStart = () => {
		if (!this.context.matchedRule) return;
		setAnimationAttributes(this.context.matchedRule);
		this.disableScrollPlugin();
	};

	/**
	 * Reset everything after each transition
	 */
	onTransitionEnd = () => {
		cleanupAnimationAttributes();
		this.restoreScrollPlugin();
	};

	/**
	 * Do stuff everytime swup replaces the content
	 */
	onContentReplaced = () => {
		updateFragmentUrlAttributes(this.rules, this.swup.getCurrentUrl());
		handleDynamicFragmentLinks(this.logger);
	};

	/**
	 * Disable ScrollPlugin for fragment visits
	 */
	disableScrollPlugin() {
		// We still want scrolling if there is a hash in the target link
		if (this.swup.scrollToElement) return;

		this.scrollPlugin = this.swup.findPlugin('ScrollPlugin');
		if (this.scrollPlugin) this.swup.unuse(this.scrollPlugin);
	}

	/**
	 * Re-enable ScrollPlugin after each transition
	 */
	restoreScrollPlugin() {
		if (this.scrollPlugin) this.swup.use(this.scrollPlugin);
		this.scrollPlugin = undefined;
	}

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
