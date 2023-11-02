import { describe, expect, it } from 'vitest';
import { stubGlobalDocument } from './inc/helpers.js';
import { queryFragmentElement } from '../../src/inc/functions.js';
import Swup from 'swup';

describe('queryFragmentElement()', () => {
	it('should correctly query fragment elements', () => {
		const swup = new Swup();
		stubGlobalDocument(/*html*/ `
			<div id="swup"><div id="fragment-1"></div></div>
			<div id="fragment-2"></div>
		`);
		expect(queryFragmentElement('#swup', swup)).toBeDefined();
		expect(queryFragmentElement('#fragment-1', swup)).toBeDefined();
		expect(queryFragmentElement('#missing', swup)).toBeUndefined();
		expect(queryFragmentElement('#fragment-2', swup)).toBeUndefined();

	});
});
