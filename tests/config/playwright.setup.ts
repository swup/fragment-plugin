import { cpSync } from 'node:fs';

export default () => {
	cpSync('./node_modules/swup/dist/Swup.umd.js', './tests/fixtures/dist/swup.umd.js', {
		recursive: true
	});
	cpSync('./dist/index.umd.js', './tests/fixtures/dist/fragment-plugin.umd.js', {
		recursive: true
	});
};
