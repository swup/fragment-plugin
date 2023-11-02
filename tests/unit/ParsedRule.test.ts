import { describe, expect, it, afterEach, vi } from 'vitest';
import ParsedRule from '../../src/inc/ParsedRule.js';
import Logger from '../../src/inc/Logger.js';
import Swup from 'swup';

describe('ParsedRule', () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});
	it('should have correct defaults', () => {
		const rule = new ParsedRule({
			from: '/users/',
			to: '/user/:slug',
			containers: [' #fragment-1'],
			swup: new Swup()
		});

		// expect valid matchesFrom and matchesTo functions
		expect(!!rule.matchesFrom('/users/')).toBe(true);
		expect(!!rule.matchesTo('/user/john')).toBe(true);
		expect(rule.matchesFrom('/')).toBe(false);
		expect(rule.matchesTo('/')).toBe(false);

		// expect sanitized selectors
		expect(rule.containers).toEqual(['#fragment-1']);

		expect(rule.scroll).toBe(false);
		expect(rule.name).toBe(undefined);
		expect(rule.focus).toBe(undefined);
		expect(rule.logger).toBe(undefined);
	});

	it('should parse all provided options', () => {
		const rule1 = new ParsedRule({
			from: '(.*)',
			to: '(.*)',
			containers: ['#fragment-1'],
			name: 'test',
			scroll: '#top',
			focus: 'main',
			swup: new Swup()
		});
		expect(rule1.name).toEqual('test');
		expect(rule1.scroll).toEqual('#top');
		expect(rule1.focus).toEqual('main');

		const rule2 = new ParsedRule({
			from: '(.*)',
			to: '(.*)',
			containers: ['#fragment-1'],
			scroll: true,
			focus: false,
			swup: new Swup()
		});
		expect(rule2.scroll).toEqual(true);
		expect(rule2.focus).toEqual(false);
	});

	it('should log an error if containers is empty', () => {
		const errorLog = vi.spyOn(console, 'error').mockImplementation(() => undefined);
		new ParsedRule({
			from: '(.*)',
			to: '(.*)',
			containers: [],
			swup: new Swup(),
			logger: new Logger()
		});
		expect(errorLog).toBeCalledWith(
			// expect.stringMatching(/^Every fragment rule must contain an array of containers/),
			'Every fragment rule must contain an array of containers',
			expect.any(Object)
		);
	});

	it('should validate container selectors and log errors', () => {
		const errorLog = vi.spyOn(console, 'error').mockImplementation(() => undefined);
		new ParsedRule({
			from: '(.*)',
			to: '(.*)',
			containers: ['.fragment-1', '#swup #fragment-2'],
			swup: new Swup(),
			logger: new Logger()
		});
		expect(errorLog).toBeCalledTimes(2);

		expect(errorLog).toBeCalledWith(new Error(`fragment selectors must be IDs: .fragment-1`));
		expect(errorLog).toBeCalledWith(new Error(`fragment selectors must not be nested: #swup #fragment-2`)); // prettier-ignore
	});
});
