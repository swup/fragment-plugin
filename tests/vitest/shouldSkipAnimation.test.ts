import { describe, expect, it } from 'vitest';
import { shouldSkipAnimation } from '../../src/inc/functions.js';
import { stubGlobalDocument } from './inc/helpers.js';

describe('shouldSkipAnimation()', () => {
	it('should skip the animation if all fragments are <template> elements', () => {
		const fragmentVisit = {
			containers: ['#fragment-1', '#fragment-2'],
			scroll: false
		};
		/** all are <template> elements */
		stubGlobalDocument(/*html*/ `<div id="swup" class="transition-main">
			<template id="fragment-1"></template>
			<template id="fragment-2"></template>
		</div>`);
		expect(shouldSkipAnimation(fragmentVisit)).toBe(true);

		/** some are not <template> elements */
		stubGlobalDocument(/*html*/ `<div id="swup" class="transition-main">
			<template id="fragment-1"></template>
			<div id="fragment-2"></div>
		</div>`);
		expect(shouldSkipAnimation(fragmentVisit)).toBe(false);
	});
});
