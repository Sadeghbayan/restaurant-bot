const store = new Map();

export function getCtx(userId) {
  if (!store.has(userId)) {
    store.set(userId, {
      cuisine: null,
      minReviews: 0,
      minRating: 0,
      location: null,
      city: "Berlin",
    });
  }
  return store.get(userId);
}

export function setCtx(userId, patch) {
  const cur = getCtx(userId);
  const next = { ...cur, ...patch };
  store.set(userId, next);
  return next;
}