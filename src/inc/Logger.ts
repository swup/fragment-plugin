/**
 * Wrap a string in an escape sequence
 * @see https://stackoverflow.com/a/68373080/586823
 */
const wrapInEscapeSequence = (s: string, open: number, close: number): string => {
	if (s == null) return s;
	return `\x1b[${open}m${String(s)}\x1b[${close}m`;
}
/**
 * @see https://github.com/lzwme/console-log-colors/blob/56a41b352bf9ed327cc864f588b831d92ee6390e/src/index.js#L4C3-L4C16
 */
const bold = (s: string): string => wrapInEscapeSequence(s, 1, 22);
/**
 * @see https://github.com/lzwme/console-log-colors/blob/56a41b352bf9ed327cc864f588b831d92ee6390e/src/index.js#L23
 */
const redBright = (s: string): string => wrapInEscapeSequence(s, 91, 39);

const prepare = (s: string): string => `🧩 ${bold(s)}`;
export const highlight = (s: string): string => redBright(s);

const __DEV__ = process.env.NODE_ENV !== 'production';

/**
 * A slim wrapper around console statements
 */
export default class Logger {
	log(...args: any) {
		if (!__DEV__) return;
		const msg = args.shift();
		console.log(prepare(msg), ...args);
	}
	warn(...args: any) {
		if (!__DEV__) return;
		const msg = args.shift();
		console.warn(prepare(msg), ...args);
	}
	error(...args: any) {
		if (!__DEV__) return;
		const msg = args.shift();
		console.error(prepare(msg), ...args);
	}
	logIf(condition: boolean, ...args: any) {
		if (condition) this.log(...args);
	}
	warnIf(condition: boolean, ...args: any) {
		if (condition) this.warn(...args);
	}
	errorIf(condition: boolean, ...args: any) {
		if (condition) this.error(...args);
	}
}
