import { pathToRegexp } from 'path-to-regexp';

/**
 * Represents a route
 */
export default class Route {

	from = '';
	to = '';
	fragments = [];
	name = 'unknown';

	matchedDirection = '';

	fromRegEx = '';
	toRegEx = '';

	constructor(from = '', to = '', fragments = [], name = '') {

		this.validate(from, to, fragments);

		this.from = from.trim();
		this.to = to.trim();
		this.name = name.trim();

		this.fragments = fragments.map((selector) => selector.trim());

		this.fromRegEx = this.isRegex(from) ? from : this.convertToRegexp(from);
		this.toRegEx = this.isRegex(to) ? to : this.convertToRegexp(to);


	}

	/**
	 * Validates this rule
	 */
	validate(from, to, fragments) {
		if (!from) this.logError(`rule.from is required`);
		if (!to) this.logError(`rule.to is required`);
		if (!fragments.length) this.logError(`rule.fragments needs to contain at least one selector`);
		if (!typeof this.from === 'string') this.logError(`rule.from needs to be a path string`);
		if (!typeof this.to === 'string') this.logError(`rule.to needs to be a path string`);
	}

	/**
	 * Throw an error with a prefix
	 * @param {string} message
	 */
	logError(message) {
		console.error(`[fragment-plugin] ${message}`);
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
	 * Checks if a given route matches a this rule
	 * @param {object} route
	 * @returns
	 */
	matches(route) {
		const forwards = this.matchesForwards(route);
		const backwards = this.matchesBackwards(route);

		// Return false if the route doesn't match in either direction
		if (!forwards && !backwards) return false;

		this.matchedDirection = this.getMatchedDirection(forwards, backwards);

		return true;
	}

	/**
	 * Detect in which direction the rule matched
	 *
	 * @param {boolean} matchesForwards
	 * @param {boolean} matchesBackwards
	 * @returns {string}
	 */
	getMatchedDirection(matchesForwards, matchesBackwards) {
		// The rule matches in both directions
		if (matchesForwards && matchesBackwards) return 'both';
		// The rule matches forwards
		if (matchesForwards) return 'forwards';
		// The rule matches backwards
		if (matchesBackwards) return 'backwards';
		return null;
	}

	/**
	 * Check if a given route matches this rule forwards
	 *
	 * @param {object} route
	 * @returns {boolean}
	 */
	matchesForwards({ from, to }) {
		return this.fromRegEx.test(from) && this.toRegEx.test(to);
	}

	/**
	 * Check if a given route matches this rule backwards
	 *
	 * @param {object} route
	 * @returns {boolean}
	 */
	matchesBackwards({ from, to }) {
		return this.toRegEx.test(from) && this.fromRegEx.test(to);
	}
}
