import { bold } from 'console-log-colors';

/**
 * A slim wrapper around console statements
 */
export default class Logger {
	prefix(s: string): string {
		return bold(`🧩 ${s}`);
	}
	log(...args: any) {
		const msg = args.shift();
		console.log(this.prefix(msg), ...args);
	}
	warn(...args: any) {
		const msg = args.shift();
		console.warn(this.prefix(msg), ...args);
	}
	error(...args: any) {
		const msg = args.shift();
		console.error(this.prefix(msg), ...args);
	}
}
