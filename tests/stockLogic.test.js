import assert from 'node:assert/strict';
import {evaluateNotifications, formatQuoteLabel} from '../stockdock@etf/lib/stockLogic.js';

const formattedGain = formatQuoteLabel('aapl.us', 100, 110);
assert.ok(formattedGain, 'expected formatted quote for valid numbers');
assert.equal(formattedGain.isGain, true);
assert.equal(formattedGain.iconName, 'go-up-symbolic');
assert.equal(formattedGain.label, 'AAPL.US 110.00 (+10.00%)');

const formattedLoss = formatQuoteLabel('msft.us', 200, 180);
assert.ok(formattedLoss, 'expected formatted quote for valid numbers');
assert.equal(formattedLoss.isGain, false);
assert.equal(formattedLoss.iconName, 'go-down-symbolic');
assert.equal(formattedLoss.label, 'MSFT.US 180.00 (-10.00%)');

const formattedFlat = formatQuoteLabel('zero', 0, 0);
assert.ok(formattedFlat, 'expected formatted quote when open is zero');
assert.equal(formattedFlat.label, 'ZERO 0.00 (+0.00%)');

const initialState = {min: false, max: false};
const minHit = evaluateNotifications({
  ticker: 'aapl.us',
  price: 95,
  minThreshold: 100,
  maxThreshold: null,
  previousState: initialState,
});
assert.equal(minHit.notifications.length, 1);
assert.equal(minHit.notifications[0].type, 'min');
assert.equal(minHit.state.min, true);
assert.equal(minHit.state.max, false);

const minRepeat = evaluateNotifications({
  ticker: 'aapl.us',
  price: 90,
  minThreshold: 100,
  maxThreshold: null,
  previousState: minHit.state,
});
assert.equal(minRepeat.notifications.length, 0);
assert.equal(minRepeat.state.min, true);

const minReset = evaluateNotifications({
  ticker: 'aapl.us',
  price: 101,
  minThreshold: 100,
  maxThreshold: null,
  previousState: minHit.state,
});
assert.equal(minReset.notifications.length, 0);
assert.equal(minReset.state.min, false);

const maxHit = evaluateNotifications({
  ticker: 'msft.us',
  price: 250,
  minThreshold: null,
  maxThreshold: 240,
  previousState: initialState,
});
assert.equal(maxHit.notifications.length, 1);
assert.equal(maxHit.notifications[0].type, 'max');
assert.equal(maxHit.state.max, true);
assert.equal(maxHit.state.min, false);

console.log('stockLogic tests passed');
