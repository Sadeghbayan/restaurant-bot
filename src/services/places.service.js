import fetch from "node-fetch";
import { env } from "../config/env.js";

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

  return (data.places || []).map((p) => ({
    name: p.displayName?.text || "Unknown",
    address: p.formattedAddress || "-",
    rating: p.rating ?? 0,
    ratingsCount: p.userRatingCount ?? 0,
    mapsUrl: p.googleMapsUri || "",
    location: p.location || null,
  }));
}
