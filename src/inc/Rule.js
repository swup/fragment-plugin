import { pathToRegexp } from 'path-to-regexp';

/**
 * Represents a route
 */
export default class Route {

	from = '';
	to = '';
	fromRegEx = '';
	toRegEx = '';
	selectors = [];

	constructor(from = '', to = '', selectors = []) {
		this.from = from;
		this.to = to;
		this.selectors = selectors;

		this.fromRegEx = this.isRegex(from) ? from : this.convertToRegexp(from);
		this.toRegEx = this.isRegex(to) ? to : this.convertToRegexp(to);
	}

	/**
	 * Tests if the given value is a regex
	 *
	 * @param {unknown} x
	 * @returns
	 */
	isRegex = (x) => x instanceof RegExp;

	/**
	 * Convert a string to a regex, with error handling
	 *
	 * @see https://github.com/pillarjs/path-to-regexp
	 *
	 * @param {string}
	 * @returns {RegExp}
	 */
	convertToRegexp(string) {
		try {
			return pathToRegexp(string);
		} catch (error) {
			console.warn(`Something went wrong while trying to convert ${string} to a regex:`);
			console.warn(error);
		}

		return string;
	}

	/**
	 * Checks if this route matches a given route
	 * @param {object} route
	 * @returns
	 */
	matches({ from, to }) {
		// Return true if the route matches forwards
		if (this.fromRegEx.test(from) && this.toRegEx.test(to)) return true;
		// Return true if the route matches backwards
		if (this.toRegEx.test(from) && this.fromRegEx.test(to)) return true;
		// Finally, return false
		return false;
	}
}
