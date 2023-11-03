import { describe, expect, it, afterEach, vi } from 'vitest';
import ParsedRule from '../../src/inc/ParsedRule.js';
import Logger from '../../src/inc/Logger.js';
import { spyOnConsole, stubGlobalDocument } from './inc/helpers.js';
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
		expect(Boolean(rule.matchesFrom('/users/'))).toBe(true);
		expect(Boolean(rule.matchesTo('/user/john'))).toBe(true);
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
		const console = spyOnConsole();
		new ParsedRule({
			from: '(.*)',
			to: '(.*)',
			containers: [],
			swup: new Swup(),
			logger: new Logger()
		});
		expect(console.error).toBeCalledWith('Every fragment rule must contain an array of containers', expect.any(Object)); // prettier-ignore
	});

	it('should validate container selectors and log errors', () => {
		const console = spyOnConsole();
		const rule = new ParsedRule({
			from: '(.*)',
			to: '(.*)',
			containers: ['.fragment-1', '#swup #fragment-2'],
			swup: new Swup(),
			logger: new Logger()
		});
		expect(console.error).toBeCalledTimes(2);
		expect(rule.containers).toEqual([]);

		expect(console.error).toBeCalledWith(new Error(`fragment selectors must be IDs: .fragment-1`)); // prettier-ignore
		expect(console.error).toBeCalledWith(new Error(`fragment selectors must not be nested: #swup #fragment-2`)); // prettier-ignore
	});

	it('should correctly match a rule', () => {
		stubGlobalDocument(/*html*/ `<div id="swup"><div id="fragment-1"></div></div>`);
		const rule = new ParsedRule({
			from: '/users/',
			to: '/user/:slug',
			containers: ['#fragment-1'],
			swup: new Swup()
		});
		expect(rule.matches({ from: '/users/', to: '/user/jane' })).toBe(true);
		expect(rule.matches({ from: '/users/', to: '/users/' })).toBe(false);
		expect(rule.matches({ from: '/user/jane', to: '/users/' })).toBe(false);
		expect(rule.matches({ from: '/user/jane', to: '/user/john' })).toBe(false);
	});

	it('should validate selectors if matching a rule', () => {
		const console = spyOnConsole();
		const rule = new ParsedRule({
			from: '(.*)',
			to: '(.*)',
			containers: ['#fragment-1'],
			swup: new Swup(),
			logger: new Logger()
		});

		/** fragment element missing */
		stubGlobalDocument(/*html*/ `<div id="swup"></div>`);
		expect(rule.matches({ from: '/foo/', to: '/bar/' })).toBe(false);
		expect(console.error).toBeCalledWith(new Error('skipping rule since #fragment-1 doesn\'t exist in the current document'), expect.any(Object)) // prettier-ignore

		/** fragment element outside of swup's default containers */
		stubGlobalDocument(/*html*/ `<div id="swup"></div><div id="fragment-1"></div>`);
		expect(rule.matches({ from: '/foo/', to: '/bar/' })).toBe(false);
		expect(console.error).toBeCalledWith(new Error('skipping rule since #fragment-1 is outside of swup\'s default containers'), expect.any(Object)) // prettier-ignore
	});
});
