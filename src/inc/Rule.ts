import { pathToRegexp } from 'path-to-regexp';
import type { Route, Path, Direction } from './FragmentPlugin.js';

/**
 * Represents a route
 */
export default class Rule {
	from: Path = '';
	to: Path = '';
	replace: string[] = [];
	name: string | undefined;
	matchedDirection: Direction | undefined;

	fromRegEx: RegExp;
	toRegEx: RegExp;

	constructor(
		from: Path,
		to: Path,
		replace: string[],
		name: string | undefined,
	) {
		this.from = from;
		this.to = to;
		this.name = name;

		this.replace = replace.map((selector) => selector.trim());

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
		return this.fromRegEx!.test(route.from) && this.toRegEx!.test(route.to);
	}
}
