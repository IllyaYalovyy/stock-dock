import assert from 'node:assert/strict';
import {parseStooqCsv} from '../stockdock@etf/lib/quoteParser.js';

const sample = [
  'Symbol,Date,Time,Open,High,Low,Close,Volume',
  'AAPL.US,2025-01-01,22:00:01,100,110,90,105,1000',
].join('\n');

const quote = parseStooqCsv(sample);
assert.deepEqual(quote, {open: 100, close: 105});

const multipleRows = [
  'Symbol,Date,Time,Open,High,Low,Close,Volume',
  'AAPL.US,2025-01-01,22:00:01,100,110,90,105,1000',
  'MSFT.US,2025-01-01,22:00:01,200,210,190,205,2000',
].join('\n');
assert.deepEqual(parseStooqCsv(multipleRows), {open: 100, close: 105});

const bad = 'Symbol,Date,Time,Open,High,Low,Close,Volume\nAAPL.US,2025-01-01,22:00:01,NaN,110,90,105,1000';
assert.equal(parseStooqCsv(bad), null);

const withWhitespace = [
  'Symbol,Date,Time,Open,High,Low,Close,Volume',
  'AAPL.US,2025-01-01,22:00:01, 101 ,110,90, 99 ,1000',
  '',
].join('\n');
assert.deepEqual(parseStooqCsv(withWhitespace), {open: 101, close: 99});

const missingColumns = 'Symbol,Date,Time,Open,High,Low\nAAPL.US,2025-01-01,22:00:01,100,110,90';
assert.equal(parseStooqCsv(missingColumns), null);

const headerOnly = 'Symbol,Date,Time,Open,High,Low,Close,Volume';
assert.equal(parseStooqCsv(headerOnly), null);

const empty = '';
assert.equal(parseStooqCsv(empty), null);

console.log('quoteParser tests passed');
