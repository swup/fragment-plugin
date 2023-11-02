import { describe, expect, it, vi } from 'vitest';
import { addRuleNameClasses, getRoute } from '../../src/inc/functions.js';
import { stubGlobalDocument } from './inc/helpers.js';
import Swup from 'swup';

describe('addRuleNameClasses()', () => {
	it('should add a rule\'s name class', () => {
		stubGlobalDocument(
			/*html*/ `
			<div id="swup">
				<div id="fragment-1"></div>
				<div id="fragment-2"></div>
			</div>`
		);
		const swup = new Swup();
		// @ts-expect-error createVisit is protected
		const visit = swup.createVisit({});
		visit.fragmentVisit = {
			name: 'test',
			containers: ['#fragment-1', '#fragment-2'],
			scroll: false
		}
		addRuleNameClasses(visit);
		expect(document.querySelector('#fragment-1')?.classList.contains(`to-test`)).toBe(true);
		expect(document.querySelector('#fragment-2')?.classList.contains(`to-test`)).toBe(true);
	});
});
