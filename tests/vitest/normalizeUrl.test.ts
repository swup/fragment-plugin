import { describe, expect, it } from 'vitest';
import { normalizeUrl } from '../../src/inc/functions.js';

describe('normalizeUrl()', () => {
	it('should strip any amount of trailing slashes from the pathname', () => {
		expect(normalizeUrl('/foo')).toEqual('/foo');
		expect(normalizeUrl('/foo/')).toEqual('/foo');
		expect(normalizeUrl('/foo/bar/')).toEqual('/foo/bar');
		expect(normalizeUrl('/foo///')).toEqual('/foo');
		expect(normalizeUrl('/foo/?bar=baz')).toEqual('/foo?bar=baz');
	});
	it('should ignore empty URLs', () => {
		expect(normalizeUrl('')).toEqual('');
	});
	it('should sort the query string', () => {
		expect(normalizeUrl('/foo?b=b&a=a')).toEqual('/foo?a=a&b=b');
	});
});
