import { pathToRegexp } from 'path-to-regexp';
import type { Route, Path, Direction } from './FragmentPlugin.js';

/**
 * Represents a route
 */
export default class Rule {
	from: Path = '';
	to: Path = '';
	fragments: string[] = [];
	name: string | undefined;
	direction: Direction | undefined;
	matchedDirection: Direction | undefined;
	revalidate: string[] = [];

	fromRegEx: RegExp;
	toRegEx: RegExp;

	constructor(
		from: Path,
		to: Path,
		direction: Direction | undefined,
		fragments: string[],
		name: string | undefined,
		revalidate: string[] = []
	) {
		this.from = from;
		this.to = to;
		this.direction = direction;
		this.name = name;

		this.fragments = fragments.map((selector) => selector.trim());
		this.revalidate = revalidate.map((selector) => selector.trim());

		this.fromRegEx = this.convertToRegexp(from);
		this.toRegEx = this.convertToRegexp(to);
	}

	/**
	 * Throw an error with a prefix
	 */
	logError(message: string, ...args: any): void {
		console.error(`[fragment-plugin] ${message}`, ...args);
	}

	/**
	 * Convert a string to a regex, with error handling
	 */
	convertToRegexp(path: Path): RegExp {
		try {
			return pathToRegexp(path) as RegExp;
		} catch (error) {
			this.logError(`Couldn't convert path to RegExp`, {
				path
			});
			throw new Error(error as string);
		}
	}

	/**
	 * Checks if a given route matches a this rule
	 */
	matches(route: Route): boolean {
		const matchesForwards = this.matchesForwards(route);
		const matchesBackwards = this.matchesBackwards(route);

		this.matchedDirection = this.getMatchedDirection(matchesForwards, matchesBackwards);

		// Only match forwards
		if (this.direction === 'forwards') return this.matchedDirection === 'forwards';

		// Only match backwards
		if (this.direction === 'backwards') return this.matchedDirection === 'backwards';

		// Match either direction
		return matchesForwards || matchesBackwards;
	}

	/**
	 * Detect in which direction the rule matched
	 */
	getMatchedDirection(
		matchesForwards: boolean,
		matchesBackwards: boolean
	): Direction | undefined {
		// The rule matches forwards
		if (matchesForwards && !matchesBackwards) return 'forwards';
		// The rule matches backwards
		if (matchesBackwards && !matchesForwards) return 'backwards';
		// nothing matched
		return undefined;
	}

	/**
	 * Check if a given route matches this rule forwards
	 */
	matchesForwards({ from, to }: Route): boolean {
		return this.fromRegEx!.test(from) && this.toRegEx!.test(to);
	}

	/**
	 * Check if a given route matches this rule backwards
	 */
	matchesBackwards({ from, to }: Route): boolean {
		return this.toRegEx.test(from) && this.fromRegEx.test(to);
	}
}
