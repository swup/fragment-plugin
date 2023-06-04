import { pathToRegexp } from 'path-to-regexp';
import type { Route, Path } from './FragmentPlugin.js';

/**
 * Represents a route
 */
export default class Rule {

	from: Path = '';
	to: Path = '';
	fragments: string[] = [];
	name: string | undefined;

	matchedDirection = '';

	fromRegEx: RegExp;
	toRegEx: RegExp;

	constructor(from: Path, to: Path, fragments: string[], name: string | undefined) {
		this.validate(from, to, fragments);

		this.from = from;
		this.to = to;
		if (name) this.name = name;

		this.fragments = fragments.map((selector) => selector.trim());

		this.fromRegEx = this.convertToRegexp(from);
		this.toRegEx = this.convertToRegexp(to);
	}

	/**
	 * Validates this rule
	 */
	validate(from: unknown, to: unknown, fragments: unknown) {
		if (!from) this.logError(`rule.from is required`);
		if (!to) this.logError(`rule.to is required`);
		if (!fragments) this.logError(`rule.fragments needs to contain at least one selector`);
		if (typeof from !== 'string') this.logError(`rule.from needs to be a path string`);
		if (typeof to !== 'string') this.logError(`rule.to needs to be a path string`);
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
			this.logError(`Something went wrong while trying to convert ${path} to a regex`);
			throw new Error(error as string);
		}
	}

	/**
	 * Checks if a given route matches a this rule
	 */
	matches(route: Route): boolean {
		const forwards = this.matchesForwards(route);
		const backwards = this.matchesBackwards(route);

		// Return false if the route doesn't match in either direction
		if (!forwards && !backwards) return false;

		this.matchedDirection = this.getMatchedDirection(forwards, backwards);

		return true;
	}

	/**
	 * Detect in which direction the rule matched
	 */
	getMatchedDirection(matchesForwards: boolean, matchesBackwards: boolean): string {
		// The rule matches in both directions
		if (matchesForwards && matchesBackwards) return '';
		// The rule matches forwards
		if (matchesForwards) return 'forwards';
		// The rule matches backwards
		if (matchesBackwards) return 'backwards';
		// nothing matched
		return '';
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
