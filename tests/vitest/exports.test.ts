import { describe, expect, it } from 'vitest';

import * as IndexTS from '../../src/index.js';

describe('Exports', () => {
	it('UMD compatibility: index.ts should only have a default export', () => {
		expect(Object.keys(IndexTS)).toEqual(['default']);
	});
});
