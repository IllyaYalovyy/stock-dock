export function parseThresholdMapText(text) {
  const entries = {};
  if (typeof text !== 'string') {
    return entries;
  }

  text
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
    .forEach((item) => {
      const [rawKey, rawValue] = item.split('=').map((part) => part.trim());
      const number = Number.parseFloat(rawValue);
      if (rawKey && Number.isFinite(number)) {
        entries[rawKey] = number;
      }
    });

  return entries;
}

export function formatThresholdMap(map) {
  if (!map || typeof map !== 'object') {
    return '';
  }

  return Object.keys(map)
    .filter((key) => key && Number.isFinite(map[key]))
    .sort()
    .map((key) => `${key}=${map[key]}`)
    .join(', ');
}
