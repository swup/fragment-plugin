import { pathToRegexp } from 'path-to-regexp';
import type { Route, Path } from './FragmentPlugin.js';
import { log } from './utils.js';

/**
 * Represents a route
 */
export default class Rule {
	from: Path = '';
	to: Path = '';
	fragments: string[] = [];
	name: string | undefined;

	fromRegEx: RegExp;
	toRegEx: RegExp;

	constructor(from: Path, to: Path, fragments: string[], name: string | undefined) {
		this.from = from;
		this.to = to;
		this.name = name;

		this.fragments = fragments.map((selector) => selector.trim());

		this.fromRegEx = this.convertToRegexp(from);
		this.toRegEx = this.convertToRegexp(to);
	}

	/**
	 * Convert a string to a regex, with error handling
	 */
	convertToRegexp(path: Path): RegExp {
		try {
			return pathToRegexp(path) as RegExp;
		} catch (error) {
			log('Error converting to RegExp:', path, 'error');
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
