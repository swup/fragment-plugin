import Plugin from '@swup/plugin';

export default class extends Plugin {
	name = 'FragmentPlugin';

	/**
	* Constructor
	* @param {?object} options the plugin options
	*/
	constructor(options = {}) {
		super();

		const defaultOptions = {
			fragments: []
		};

		this.options = {
			...defaultOptions,
			...options
		};
	}
}
