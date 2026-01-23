import { describe, expect, it } from 'vitest';
import { adjustVisitScroll, stubVisit } from '../../src/inc/functions.js';

describe('adjustVisitScroll()', () => {
	it('adjust visit.scroll with boolean values', () => {
		const visit = stubVisit({ to: '' });

		expect(adjustVisitScroll({ containers: [], scroll: true }, visit.scroll, visit)).toEqual({
			reset: true
		});

		expect(adjustVisitScroll({ containers: [], scroll: false }, visit.scroll, visit)).toEqual({
			reset: false
		});
	});

	it('adjust visit.scroll with string selector', () => {
		const visit = stubVisit({ to: '' });

		expect(adjustVisitScroll({ containers: [], scroll: '#top' }, visit.scroll, visit)).toEqual({
			reset: true,
			target: '#top'
		});
	});

	it('adjust visit.scroll with callback returning boolean', () => {
		const visit = stubVisit({ to: '/page' });

		// Callback returning true
		expect(
			adjustVisitScroll({ containers: [], scroll: () => true }, visit.scroll, visit)
		).toEqual({
			reset: true
		});

		// Callback returning false
		expect(
			adjustVisitScroll({ containers: [], scroll: () => false }, visit.scroll, visit)
		).toEqual({
			reset: false
		});
	});

	it('adjust visit.scroll with callback returning string selector', () => {
		const visit = stubVisit({ to: '/page' });

		expect(
			adjustVisitScroll({ containers: [], scroll: () => '#my-element' }, visit.scroll, visit)
		).toEqual({
			reset: true,
			target: '#my-element'
		});
	});

	it('callback receives correct Visit object', () => {
		const visit = stubVisit({ from: '/blog', to: '/blog/post-1' });
		let receivedVisit = visit;

		adjustVisitScroll(
			{
				containers: [],
				scroll: (v) => {
					receivedVisit = v;
					return true;
				}
			},
			visit.scroll,
			visit
		);

		expect(receivedVisit).toBe(visit);
		expect(receivedVisit.to.url).toBe('/blog/post-1');
		expect(receivedVisit.from.url).toBe('/blog');
	});

	it('callback can use visit properties for conditional logic', () => {
		// Test forward navigation
		const forwardVisit = stubVisit({ from: '/page1', to: '/page2' });
		forwardVisit.animation = {
			name: 'forward',
			native: false,
			animate: true,
			wait: false,
			scope: 'containers',
			selector: '[id="swup"]'
		};

		const resultForward = adjustVisitScroll(
			{
				containers: [],
				scroll: (v) => (v.animation.name === 'forward' ? true : false)
			},
			forwardVisit.scroll,
			forwardVisit
		);

		expect(resultForward).toEqual({ reset: true });

		// Test backward navigation
		const backwardVisit = stubVisit({ from: '/page2', to: '/page1' });
		backwardVisit.animation = {
			name: 'backward',
			native: false,
			animate: true,
			wait: false,
			scope: 'containers',
			selector: '[id="swup"]'
		};

		const resultBackward = adjustVisitScroll(
			{
				containers: [],
				scroll: (v) => (v.animation.name === 'forward' ? true : false)
			},
			backwardVisit.scroll,
			backwardVisit
		);

		expect(resultBackward).toEqual({ reset: false });
	});

	it('callback can return dynamic selector based on visit', () => {
		const visit = stubVisit({ to: '/products/123#reviews' });
		visit.to.hash = '#reviews';

		const result = adjustVisitScroll(
			{
				containers: [],
				scroll: (v) => {
					if (v.to.hash === '#reviews') {
						return '#reviews-section';
					}
					return true;
				}
			},
			visit.scroll,
			visit
		);

		expect(result).toEqual({
			reset: true,
			target: '#reviews-section'
		});
	});
});
