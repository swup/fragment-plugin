import SwupFragmentPlugin, { FragmentVisit } from '../SwupFragmentPlugin.js';
import type Logger from './Logger.js';
import SwupModalOrigin from './SwupModalOrigin.js';

/**
 * Handle fragments marked with [data-swup-fragment-modal]
 */
export function handleModals({ rules, swup, logger }: SwupFragmentPlugin): void {
	const url = swup.getCurrentUrl();
	rules
		.filter((rule) => rule.matchesTo(url))
		.forEach(({ fragments }) =>
			fragments.forEach((selector) => {
				// Bail early if the element doesn't exist
				const el = document.querySelector(selector);
				if (!el) return;

				// Bail early if the fragment isn't a modal
				if (!el.matches('[data-swup-fragment-modal]')) return;

				// Finally, handle the modal
				createModal(el, selector, logger);
			})
		);
}

/**
 * Creates a modal
 *
 * - moves the element to the root (body) of the document
 * - injects an origin for the modal, so that we can pull it back in later right before the next `content:replace`
 */
export const createModal = (el: Element, selector: string, logger: Logger): void => {
	// Create the origin
	const origin = document.createElement('swup-modal-origin') as SwupModalOrigin;
	origin.logger = logger;
	origin.selector = selector;
	el.before(origin);
	// Move the element to the <body>
	document.body.prepend(el);
};

/**
 * Pull modals back to their origins
 */
export const cleanupModals = (): void => {
	document.querySelectorAll<SwupModalOrigin>('swup-modal-origin').forEach((origin) => {
		if (!origin.selector) return;
		const target = document.querySelector(origin.selector);
		if (!target) return;
		origin.replaceWith(target);
	});
};
