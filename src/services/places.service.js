import fetch from "node-fetch";
import { env } from "../config/env.js";

const PLACES_TEXT_SEARCH_URL = "https://places.googleapis.com/v1/places:searchText";
const FIELD_MASK =
  "places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.googleMapsUri";

export async function searchPlaces({ textQuery, maxResultCount = 5 }) {
  const resp = await fetch(PLACES_TEXT_SEARCH_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": env.googleApiKey,
      "X-Goog-FieldMask": FIELD_MASK,
    },
    body: JSON.stringify({ textQuery, maxResultCount }),
  });

  const data = await resp.json();

  if (!resp.ok) {
    const message = data?.error?.message || JSON.stringify(data);
    const err = new Error(`Places API error: ${resp.status} ${message}`);
    err.status = resp.status;
    err.details = data;
    throw err;
  }

  return (data.places || []).map((p) => ({
    name: p.displayName?.text || "Unknown",
    address: p.formattedAddress || "-",
    rating: p.rating ?? "-",
    ratingsCount: p.userRatingCount ?? "-",
    mapsUrl: p.googleMapsUri || "",
  }));
}