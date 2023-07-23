import { redBright, bold } from 'console-log-colors';
const prepare = (s: string): string => `🧩 ${bold(s)}`;

export const highlight = (s: string): string => redBright(s);

/**
 * A slim wrapper around console statements
 */
export default class Logger {
	log(...args: any) {
		const msg = args.shift();
		console.log(prepare(msg), ...args);
	}
	warn(...args: any) {
		const msg = args.shift();
		console.warn(prepare(msg), ...args);
	}
	error(...args: any) {
		const msg = args.shift();
		console.error(prepare(msg), ...args);
	}
}
