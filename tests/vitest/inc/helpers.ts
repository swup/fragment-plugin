import { vi } from 'vitest';
import Swup from 'swup';
import { JSDOM } from 'jsdom';
import SwupFragmentPlugin from '../../../src/index.js';
import type { Options } from '../../../src/inc/defs.js';

type DocumentOptions = {
	url: string;
};

/**
 * Wrap <body> HTML inside a html string
 */
export const wrapBodyTag = (body: string): string => /*html*/ `<!DOCTYPE html><body>${body}</body>`;

/**
 * Stub the global document with
 *
 * - custom body HTML
 * - a custom URL
 *
 * @see https://github.com/jsdom/jsdom#reconfiguring-the-jsdom-with-reconfiguresettings
 */
export const stubGlobalDocument = (body: string, options: Partial<DocumentOptions> = {}): void => {
	const baseURI = 'https://example.com';
	const defaults: DocumentOptions = {
		url: '/'
	};
	const settings: DocumentOptions = { ...defaults, ...options };

	const dom = new JSDOM(wrapBodyTag(body));
	dom.reconfigure({ url: `${baseURI}${settings.url}` });

	vi.stubGlobal('location', dom.window.location);
	vi.stubGlobal('document', dom.window.document);
};

/**
 * Get an instance of FragmentPlugin, in the state after mount()
 */
export const getMountedPluginInstance = (options: Partial<Options> = {}): SwupFragmentPlugin => {
	const defaults = {
		rules: [],
		debug: true
	};
	const fragmentPlugin = new SwupFragmentPlugin({ ...defaults, ...options });
	new Swup({ plugins: [fragmentPlugin] });
	return fragmentPlugin;
};

/**
 * Spies on and optionally mutes console calls
 */
export const spyOnConsole = (mute: boolean = true) => {
	const console = {
		log: vi.spyOn(global.console, 'log'),
		warn: vi.spyOn(global.console, 'warn'),
		error: vi.spyOn(global.console, 'error')
	};
	if (mute) {
		for (const method of Object.keys(console)) {
			console[method] = console[method].mockImplementation(() => undefined);
		}
	}
	return console;
};
