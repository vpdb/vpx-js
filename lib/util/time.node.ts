
import { nowDouble } from 'microtime';

export function now() {
	return nowDouble() * 1000;
}
