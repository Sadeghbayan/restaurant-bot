import { cacheGet, cacheSet } from "./cache.service.js";

const memoryStore = new Map();
const TTL_SECONDS = 60 * 60 * 24 * 30;
const MAX_TRACKED_PER_USER = 20;

function key(userId) {
  return `track:user:${userId}`;
}

function normalizeRestaurant(r) {
  return {
    placeId: r.placeId,
    name: r.name,
    address: r.address || "-",
    rating: typeof r.rating === "number" ? r.rating : 0,
    ratingsCount: typeof r.ratingsCount === "number" ? r.ratingsCount : 0,
    mapsUrl: r.mapsUrl || "",
    trackedAt: Date.now(),
  };
}

async function load(userId) {
  const k = key(userId);
  const raw = await cacheGet(k);
  if (raw) {
    try {
      const list = JSON.parse(raw);
      if (Array.isArray(list)) {
        memoryStore.set(k, list);
        return list;
      }
    } catch {
      // ignore parse failures and fallback to memory
    }
  }
  return memoryStore.get(k) || [];
}

async function persist(userId, list) {
  const k = key(userId);
  memoryStore.set(k, list);
  await cacheSet(k, JSON.stringify(list), TTL_SECONDS);
}

export async function listTrackedRestaurants(userId) {
  return load(userId);
}

export async function addTrackedRestaurant(userId, restaurant) {
  if (!restaurant?.placeId) return { ok: false, reason: "missing_place_id" };
  const list = await load(userId);
  if (list.some((x) => x.placeId === restaurant.placeId)) {
    return { ok: false, reason: "already_tracked" };
  }
  if (list.length >= MAX_TRACKED_PER_USER) {
    return { ok: false, reason: "limit_reached" };
  }

  const next = [normalizeRestaurant(restaurant), ...list];
  await persist(userId, next);
  return { ok: true };
}

export async function removeTrackedRestaurant(userId, placeId) {
  const list = await load(userId);
  const next = list.filter((x) => x.placeId !== placeId);
  if (next.length === list.length) return { ok: false, reason: "not_found" };
  await persist(userId, next);
  return { ok: true };
}
