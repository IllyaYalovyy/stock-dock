import assert from 'node:assert/strict';
import {formatThresholdMap, parseThresholdMapText} from '../stockdock@etf/lib/thresholdMap.js';

const parsed = parseThresholdMapText('aapl.us=120.5, msft.us=300, bad=abc, =1, tsla=');
assert.deepEqual(parsed, { 'aapl.us': 120.5, 'msft.us': 300 });

const formatted = formatThresholdMap({ b: 2, a: 1, empty: NaN });
assert.equal(formatted, 'a=1, b=2');

const empty = parseThresholdMapText(null);
assert.deepEqual(empty, {});

console.log('thresholdMap tests passed');
