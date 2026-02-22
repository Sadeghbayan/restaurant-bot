import express from "express";
import dotenv from "dotenv";
import fetch from "node-fetch";

dotenv.config();

const app = express();
app.use(express.json());

const GOOGLE_KEY = process.env.GOOGLE_MAPS_API_KEY;

if (!GOOGLE_KEY) {
  console.error("Missing GOOGLE_MAPS_API_KEY in .env");
  process.exit(1);
}

/**
 * GET /search?query=italian%20restaurant%20in%20Berlin&max=5
 */
app.get("/search", async (req, res) => {
  try {
    const query = String(req.query.query || "").trim();
    const max = Math.min(Number(req.query.max || 5), 20);

    if (!query) {
      return res.status(400).json({ error: "Missing query param: query" });
    }

    const url = "https://places.googleapis.com/v1/places:searchText";

    const resp = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_KEY,
        "X-Goog-FieldMask":
          "places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.googleMapsUri,places.location",
      },
      body: JSON.stringify({
        textQuery: query,
        maxResultCount: max,
      }),
    });

    const data = await resp.json();

    if (!resp.ok) {
      return res.status(resp.status).json({
        error: "Google Places API error",
        status: resp.status,
        details: data,
      });
    }

    const places = (data.places || []).map((p) => ({
      name: p.displayName?.text,
      address: p.formattedAddress,
      rating: p.rating,
      ratingsCount: p.userRatingCount,
      mapsUrl: p.googleMapsUri,
      location: p.location, 
    }));

    res.json({ query, count: places.length, places });
  } catch (e) {
    res.status(500).json({ error: "Server error", details: String(e) });
  }
});

app.listen(process.env.PORT || 3000, () => {
  console.log(`Server running on http://localhost:${process.env.PORT || 3000}`);
});
