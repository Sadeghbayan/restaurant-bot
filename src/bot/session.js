const store = new Map();

export function getCtx(userId) {
  if (!store.has(userId)) {
    store.set(userId, {
      step: "HOME",            // HOME | PICK_CUISINE | PICK_RATING | PICK_REVIEWS | RESULTS
      cuisine: null,
      dish: null,
      minReviews: 0,
      minRating: 0,
      location: null,
      city: "Berlin",

      lastQuery: null,
      lastResults: [],
      page: 0,                 // pagination
      pageSize: 5,
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