import fetch from "node-fetch";
import { createHash } from "node:crypto";
import { env } from "../config/env.js";
import { cacheGet, cacheSet } from "./cache.service.js";

const URL = "https://places.googleapis.com/v1/places:searchText";

const FIELD_MASK =
  "places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.googleMapsUri,places.location";

export async function searchPlaces({
  textQuery,
  maxResultCount = 10,
  location = null, // { lat, lng }
  radiusMeters = 5000,
}) {
  const body = {
    textQuery,
    maxResultCount,
  };

  // If location is available, apply a configurable location bias radius.
  if (location?.lat && location?.lng) {
    body.locationBias = {
      circle: {
        center: {
          latitude: location.lat,
          longitude: location.lng,
        },
        radius: radiusMeters,
      },
    };
  }

  const cacheKey = buildPlacesCacheKey({
    textQuery,
    maxResultCount,
    location,
    radiusMeters,
  });
  const cachedRaw = await cacheGet(cacheKey);
  if (cachedRaw) {
    try {
      return JSON.parse(cachedRaw);
    } catch {
      // ignore invalid cache payload and continue with fresh fetch
    }
  }

  const resp = await fetch(URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": env.googleApiKey,
      "X-Goog-FieldMask": FIELD_MASK,
    },
    body: JSON.stringify(body),
  });

  const data = await resp.json();

  if (!resp.ok) {
    const message = data?.error?.message || JSON.stringify(data);
    const err = new Error(`Places API error: ${resp.status} ${message}`);
    err.status = resp.status;
    throw err;
  }

  const places = (data.places || []).map((p) => ({
    name: p.displayName?.text || "Unknown",
    address: p.formattedAddress || "-",
    rating: p.rating ?? 0,
    ratingsCount: p.userRatingCount ?? 0,
    mapsUrl: p.googleMapsUri || "",
    location: p.location || null,
  }));

  await cacheSet(cacheKey, JSON.stringify(places), env.placesCacheTtlSeconds);
  return places;
}

function buildPlacesCacheKey({ textQuery, maxResultCount, location, radiusMeters }) {
  const payload = JSON.stringify({
    textQuery,
    maxResultCount,
    location: location ? { lat: location.lat, lng: location.lng } : null,
    radiusMeters,
  });
  const digest = createHash("sha256").update(payload).digest("hex");
  return `places:search:${digest}`;
}
