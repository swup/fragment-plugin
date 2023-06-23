type LoggerOptions = {
	prefix?: string;
	muted?: boolean;
};

export default class Logger {
	options: LoggerOptions = {};

	constructor(options?: LoggerOptions) {
		const defaults: LoggerOptions = {
			prefix: '',
			muted: false
		};

		this.options = {
			...defaults,
			...options
		};
	}

	/**
	 * Mute the logger
	 */
	mute() {
		this.options.muted = true;
	}

	/**
	 * Unmute the logger
	 */
	unmute() {
		this.options.muted = false;
	}

	/**
	 * Log to console, if not muted
	 */
	log(...args: any) {
		if (this.options.muted === true) return;
		console.log(this.options.prefix, ...args);
	}

	/**
	 * Warn if not muted
	 */
	warn(...args: any) {
		if (this.options.muted === true) return;
		console.warn(this.options.prefix, ...args);
	}

	/**
	 * Warn if not muted
	 */
	error(...args: any) {
		if (this.options.muted === true) return;
		console.error(this.options.prefix, ...args);
	}

	/**
	 * log a table if not muted
	 */
	table(...args: any) {
		if (this.options.muted === true) return;
		console.log(`${this.options.prefix}:`);
		console.table(...args);
	}
}
