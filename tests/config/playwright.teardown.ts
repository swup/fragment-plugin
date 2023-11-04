import { rmSync } from 'node:fs';

export default () => {
	rmSync('./tests/fixtures/dist', { recursive: true });
};
