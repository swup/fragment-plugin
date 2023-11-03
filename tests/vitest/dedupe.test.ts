import { describe, expect, it } from 'vitest';
import { dedupe } from '../../src/inc/functions.js';

describe('dedupe()', () => {
	it('remove duplicates from an array', () => {
		expect(dedupe([1, 1, 2, 2, 3])).toEqual([1, 2, 3]);
		expect(dedupe(['foo', 'foo', 'bar'])).toEqual(['foo', 'bar']);
	});
});
