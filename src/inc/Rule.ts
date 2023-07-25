import { matchPath, classify, type Path } from 'swup';
import type { Route } from '../SwupFragmentPlugin.js';
import { dedupe } from './functions.js';
import Logger from './Logger.js';
import { __DEV__ } from './env.js';

/**
 * Represents a Rule
 */
export default class Rule {
	readonly matchesFrom;
	readonly matchesTo;

	from: Path;
	to: Path;
	containers: string[];
	name?: string;

	constructor(from: Path, to: Path, rawContainers: string[], name?: string, logger?: Logger) {
		this.from = from || '';
		this.to = to || '';

		if (name) this.name = classify(name);

		this.containers = this.parseContainers(rawContainers, logger);

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
	parseContainers(rawContainers: string[], logger?: Logger): string[] {
		if (!Array.isArray(rawContainers)) {
			if (__DEV__) logger?.error(`Every fragment rule must contain an array of containers`, this);
			return [];
		}
		// trim selectors
		const containers = rawContainers.map((selector) => selector.trim());
		containers.forEach((selector) => {
			const result = this.validateSelector(selector);
			if (result instanceof Error) logger?.error(result);
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
	public matches(route: Route): boolean {
		return this.matchesFrom(route.from) !== false && this.matchesTo(route.to) !== false;
	}
}
