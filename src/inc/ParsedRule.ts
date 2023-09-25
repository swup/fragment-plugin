import { matchPath, classify, Location } from 'swup';
import type { Path, Visit } from 'swup';
import type { Route, RuleConditionCallback } from '../SwupFragmentPlugin.js';
import { dedupe } from './functions.js';
import Logger, { highlight } from './Logger.js';
import { __DEV__ } from './env.js';

/**
 * Represents a Rule
 */
export default class ParsedRule {
	readonly matchesFrom;
	readonly matchesTo;

	from: Path;
	to: Path;
	containers: string[];
	name?: string;
	if: RuleConditionCallback = () => true;
	scroll: boolean | string = false;
	focus?: boolean | string;
	logger?: Logger;

	constructor(
		from: Path,
		to: Path,
		rawContainers: string[],
		condition?: RuleConditionCallback,
		name?: string,
		scroll?: boolean | string,
		focus?: boolean | string,
		logger?: Logger
	) {
		this.logger = logger;
		this.from = from || '';
		this.to = to || '';

		if (name) this.name = classify(name);
		if (typeof scroll !== 'undefined') this.scroll = scroll;
		if (typeof focus !== 'undefined') this.focus = focus;
		if (typeof condition !== 'undefined') this.if = condition;

		this.containers = this.parseContainers(rawContainers);

		if (__DEV__) {
			logger?.errorIf(!to, `Every fragment rule must contain a 'to' path`, this);
			logger?.errorIf(!from, `Every fragment rule must contain a 'from' path`, this);
		}

		this.matchesFrom = matchPath(from);
		this.matchesTo = matchPath(to);
	}

	/**
	 * Parse provided fragment containers
	 */
	parseContainers(rawContainers: string[]): string[] {
		if (!Array.isArray(rawContainers)) {
			if (__DEV__)
				this.logger?.error(`Every fragment rule must contain an array of containers`, this);
			return [];
		}
		// trim selectors
		const containers = rawContainers.map((selector) => selector.trim());
		containers.forEach((selector) => {
			const result = this.validateSelector(selector);
			this.logger?.errorIf(result instanceof Error, result);
		});
		return dedupe(containers);
	}

	/**
	 * Validate a fragment selector
	 *
	 * - only IDs are allowed
	 * - no nested selectors
	 */
	validateSelector(selector: string): true | Error {
		if (!selector.startsWith('#'))
			return new Error(`fragment selectors must be IDs: ${selector}`);
		if (selector.match(/\s|>/))
			return new Error(`fragment selectors must not be nested: ${selector}`);
		return true;
	}

	/**
	 * Checks if a given route matches a this rule
	 */
	public matches(route: Route, visit: Visit): boolean {
		if (!this.if(visit)) {
			if (__DEV__) {
				this.logger?.log(`ignored fragment rule due to custom rule.if:`, this);
			}
			return false;
		}

		const { url: fromUrl } = Location.fromUrl(route.from);
		const { url: toUrl } = Location.fromUrl(route.to);

		const matches = !!this.matchesFrom(fromUrl) && !!this.matchesTo(toUrl);
		if (!matches) return false;

		/** Don't match if any of the selectors doesn't match an element */
		if (
			this.containers.find((selector) => {
				const isMissing = document.querySelector(selector) === null;
				if (__DEV__) {
					this.logger?.logIf(
						isMissing,
						`skipping fragment rule since ` +
							`${highlight(selector)} doesn't match anything`,
						route
					);
				}
				return isMissing;
			})
		)
			return false;

		return true;
	}
}
