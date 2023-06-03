import Plugin from '@swup/plugin';
import { Location } from 'swup';
import Rule from './Rule.js';
import type { Handler } from 'swup';

export type Route = {
	from: string;
	to: string;
}

type RuleOptions = {
	from: string;
	to: string;
	fragments: string[];
	name: string;
};

type PluginOptions = {
	rules: RuleOptions[];
};

export default class FragmentPlugin extends Plugin {
	name = 'FragmentPlugin';

	matchingRule: Rule | undefined = undefined;
	rules: Rule[] = [];
	options: PluginOptions = {
		rules: []
	};
	// @TODO use proper type
	originalReplaceContent: any;

	/**
	 * Constructor
	 * @param {?object} options the plugin options
	 */
	constructor(options: Partial<PluginOptions> = {}) {
		super();

		this.options = {
			...this.options,
			...options
		};

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
	}

	/**
	 * Runs when the plugin is being unmounted
	 */
	unmount() {
		const { swup } = this;

		swup.replaceContent = this.originalReplaceContent;

		swup.off('popState', this.onPopState);
		swup.off('clickLink', this.onClickLink);
		swup.off('transitionStart', this.onTransitionStart);
		swup.off('transitionEnd', this.onTransitionEnd);
	}

	/**
	 * Set the current fragment on PopState.
	 * The browser URL has already changed during PopState
	 */
	onPopState = () => {
		this.matchingRule = this.findMatchingRule({
			from: this.swup.currentPageUrl,
			to: this.swup.getCurrentUrl()
		});
	};

	/**
	 * Set the current fragment when clicking a link
	 */
	onClickLink: Handler<"clickLink"> = (event) => {
		this.matchingRule = this.findMatchingRule({
			from: this.swup.getCurrentUrl(),
			to: Location.fromElement((event.delegateTarget as HTMLAnchorElement)).url
		});
	};

	/**
	 * Do special things if this is a fragment visit
	 */
	onTransitionStart = () => {
		if (!this.matchingRule) return;

		// Add an attribute `[data-fragment-rule]` for scoped styling
		document.documentElement.setAttribute('data-fragment', this.matchingRule.name);

		// Add an attribute `[data-fragment-direction]` for directional styling
		if (this.matchingRule.matchedDirection) {
			document.documentElement.setAttribute(
				'data-fragment-direction',
				this.matchingRule.matchedDirection
			);
		}

		this.disableScrollPluginForCurrentVisit();
	};

	/**
	 * Disable the scroll plugin for fragment visits
	 */
	disableScrollPluginForCurrentVisit() {
		// We still want scrolling if there is a hash in the target link
		if (this.swup.scrollToElement) return;

		const scrollPlugin = this.swup.findPlugin('ScrollPlugin') as any;
		if (scrollPlugin) scrollPlugin.ignorePageVisit = true;
	}

	/**
	 * Reset everything after each transition
	 */
	onTransitionEnd = () => {
		if (!this.matchingRule) return;

		// Remove the current rule's attribute
		document.documentElement.removeAttribute('data-fragment');

		// Remove the fragment direction attribute
		document.documentElement.removeAttribute('data-fragment-direction');

		// Reset the current rule
		this.matchingRule = undefined;
	};

	/**
	 * Set the current Rule if any matches
	 */
	findMatchingRule(route: Route): Rule | undefined {
		return this.rules.findLast((fragment) => fragment.matches(route));
	}

	/**
	 * Replace the content
	 */
	replaceContent = async (page /* @TODO fix type */) => {
		// If one of the rules matched, replace only the fragments from that rule
		if (this.matchingRule != null) {
			this.replaceFragments(page, this.matchingRule);
			// Update the browser title
			document.title = page.title;
			return Promise.resolve();
		}

		// No rule matched. Run the default replaceContent
		await this.originalReplaceContent(page);
		return Promise.resolve();
	};

	/**
	 * Replace fragments from a given rule
	 * @returns
	 */
	replaceFragments(page /* @TODO fix type */, rule: Rule): void {
		const incomingDocument = new DOMParser().parseFromString(page.originalContent, 'text/html');

		rule.fragments.forEach((selector, index) => {
			const incomingElement = incomingDocument.querySelector(selector);
			if (!incomingElement) {
				console.warn('[swup] Container missing in incoming document:', selector);
				return;
			}
			const currentElement = window.document.querySelector(selector);
			if (!currentElement) {
				console.warn('[swup] Container missing in current document:', selector);
				return;
			}
			currentElement.replaceWith(incomingElement);
		});
	}
}
