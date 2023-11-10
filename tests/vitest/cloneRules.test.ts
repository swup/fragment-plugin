import { describe, expect, it } from 'vitest';
import { cloneRules } from '../../src/inc/functions.js';

describe('cloneRules()', () => {
	it('should clone rules', () => {
		const original = [
			{ from: 'foo', to: 'bar', containers: ['#foobar'] },
			{ from: 'baz', to: 'bat', containers: ['#bazbat'] }
		];
		/** test equality with a reference */
		const reference = original;
		expect(original === reference).toEqual(true);

		/** test inequality with a clone */
		const clone = cloneRules(original);
		expect(original === clone).toEqual(false);

		/** make sure the containers are also cloned */
		expect(original[0].containers === clone[0].containers).toEqual(false);
	});
});
