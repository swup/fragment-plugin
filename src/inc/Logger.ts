import type Swup from 'swup';
import SwupFragmentPlugin from '../SwupFragmentPlugin.js';

/**
 * Represents a Rule
 */
export default class Logger {
	swup: Swup;
	debug: boolean;

	constructor({ debug, swup }: SwupFragmentPlugin) {
		this.debug = debug;
		this.swup = swup;
	}

	info(...args: any) {
		if (this.debug) return;
		this.swup?.log(args[0], args[1]);
	}
}
