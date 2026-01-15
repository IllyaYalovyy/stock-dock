export function parseStooqCsv(csv) {
  const lines = csv.trim().split('\n');
  if (lines.length < 2) {
    return null;
  }

  const data = lines[1].split(',');
  if (data.length < 8) {
    return null;
  }

  const open = Number.parseFloat(data[3]);
  const close = Number.parseFloat(data[6]);

  if (!Number.isFinite(open) || !Number.isFinite(close)) {
    return null;
  }

  return {open, close};
}
