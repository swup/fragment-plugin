import { describe, expect, it } from 'vitest';
import { validateRules } from '../../src/inc/functions.js';

describe('validateRules()', () => {
	it.only('should remove invalid rules', () => {
		expect(validateRules([{ from: '', to: '', containers: ['#foobar'] }])).toEqual([]);

		expect(validateRules([{ from: '', to: 'bar', containers: ['#foobar'] }])).toEqual([]);

		expect(validateRules([{ from: 'foo', to: '', containers: ['#foobar'] }])).toEqual([]);

		expect(validateRules([{ from: [], to: 'bar', containers: ['#foobar'] }])).toEqual([]);

		expect(validateRules([{ from: '', to: [], containers: ['#foobar'] }])).toEqual([]);

		expect(validateRules([{ from: [], to: [], containers: ['#foobar'] }])).toEqual([]);
	});
});
