import { describe, expect, it } from 'vitest';
import { stubGlobalDocument } from './inc/helpers.js';
import { queryFragmentElementSelectorList } from '../../src/inc/functions.js';
import Swup from 'swup';

describe('queryFragmentElementSelectorList()', () => {
	it('should return first element when first selector matches', () => {
		const swup = new Swup();
		stubGlobalDocument(/*html*/ `
			<div id="swup" class="transition-main">
				<div id="fragment-1"></div>
				<div id="fragment-2"></div>
			</div>
		`);

		const result = queryFragmentElementSelectorList(['#fragment-2', '#fragment-1'], swup);
		expect(result?.id).toBe('fragment-2');
	});

	it('should fallthrough selectors until first match', () => {
		const swup = new Swup();
		stubGlobalDocument(/*html*/ `
			<div id="swup" class="transition-main">
				<div id="fragment-2"></div>
			</div>
		`);

		const result = queryFragmentElementSelectorList(['#fragment-1', '#fragment-2'], swup);
		expect(result?.id).toBe('fragment-2');
	});

	it('should return undefined when no selectors match', () => {
		const swup = new Swup();
		stubGlobalDocument(/*html*/ `
			<div id="swup" class="transition-main">
				<div id="fragment-1"></div>
				<div id="fragment-2"></div>
			</div>
		`);

		const result = queryFragmentElementSelectorList(
			['#non-existing', '#also-non-existing'],
			swup
		);
		expect(result).toBeUndefined();
	});

	it('should handle empty selectors', () => {
		const swup = new Swup();
		stubGlobalDocument(/*html*/ `
			<div id="swup" class="transition-main">
				<div id="fragment-1"></div>
				<div id="fragment-2"></div>
			</div>
		`);

		const result = queryFragmentElementSelectorList([], swup);
		expect(result).toBeUndefined();
	});
});
