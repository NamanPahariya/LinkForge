const urls = new Map();

export function createUrl({ shortCode, originalUrl }) {
  const record = {
    shortCode,
    originalUrl,
    createdAt: new Date().toISOString(),
    visits: 0,
  };

  urls.set(shortCode, record);
  return { ...record };
}

export function getUrl(shortCode) {
  const record = urls.get(shortCode);
  return record ? { ...record } : null;
}

export function hasShortCode(shortCode) {
  return urls.has(shortCode);
}

export function recordVisit(shortCode) {
  const record = urls.get(shortCode);

  if (!record) {
    return null;
  }

  record.visits += 1;
  return { ...record };
}

export function resetStore() {
  urls.clear();
}
