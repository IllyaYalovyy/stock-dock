export function formatQuoteLabel(ticker, open, close) {
  if (!Number.isFinite(open) || !Number.isFinite(close)) {
    return null;
  }

  const normalizedTicker = typeof ticker === 'string' ? ticker.trim() : '';
  const displayTicker = normalizedTicker.length ? normalizedTicker.toUpperCase() : 'UNKNOWN';
  const change = close - open;
  const pct = open > 0 ? (change / open) * 100 : 0;
  const isGain = change >= 0;
  const sign = change >= 0 ? '+' : '';

  return {
    label: `${displayTicker} ${close.toFixed(2)} (${sign}${pct.toFixed(2)}%)`,
    isGain,
    iconName: isGain ? 'go-up-symbolic' : 'go-down-symbolic',
    displayTicker,
    change,
    pct,
  };
}

export function evaluateNotifications({
  ticker,
  price,
  minThreshold,
  maxThreshold,
  previousState,
}) {
  const state = {
    min: previousState?.min === true,
    max: previousState?.max === true,
  };
  const notifications = [];

  const normalizedTicker = typeof ticker === 'string' ? ticker.trim() : '';
  const displayTicker = normalizedTicker.length ? normalizedTicker.toUpperCase() : 'UNKNOWN';
  const priceValue = Number.isFinite(price) ? price : null;
  const minValue = Number.isFinite(minThreshold) ? minThreshold : null;
  const maxValue = Number.isFinite(maxThreshold) ? maxThreshold : null;

  if (priceValue !== null && minValue !== null) {
    if (priceValue <= minValue) {
      if (!state.min) {
        notifications.push({
          type: 'min',
          title: `Stock Dock: ${displayTicker}`,
          body: `Price ${priceValue.toFixed(2)} is below ${minValue.toFixed(2)}`,
        });
      }
      state.min = true;
    } else {
      state.min = false;
    }
  } else {
    state.min = false;
  }

  if (priceValue !== null && maxValue !== null) {
    if (priceValue >= maxValue) {
      if (!state.max) {
        notifications.push({
          type: 'max',
          title: `Stock Dock: ${displayTicker}`,
          body: `Price ${priceValue.toFixed(2)} is above ${maxValue.toFixed(2)}`,
        });
      }
      state.max = true;
    } else {
      state.max = false;
    }
  } else {
    state.max = false;
  }

  return {state, notifications};
}
