import { describe, expect, it } from 'vitest';
import { adjustVisitScroll, stubVisit } from '../../src/inc/functions.js';
import Swup from 'swup';

describe('adjustVisitScroll()', () => {
	it('adjust visit.scroll', () => {
		const { scroll } = stubVisit({ to: '' });

		expect(adjustVisitScroll({ containers: [], scroll: true }, scroll)).toEqual({
			reset: true
		});

		expect(adjustVisitScroll({ containers: [], scroll: false }, scroll)).toEqual({
			reset: false
		});

		expect(adjustVisitScroll({ containers: [], scroll: '#top' }, scroll)).toEqual({
			reset: true,
			target: '#top'
		});
	});
});
