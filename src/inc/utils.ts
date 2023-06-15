export function log(message: string, context: any, type: 'log' | 'warn' | 'error' = 'log') {
	console[type](`[@swup/fragment-plugin] ${message}`, context);
}
