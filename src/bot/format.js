export function formatPlacesMessage(places) {
  return places
    .map((r, i) => {
      const line1 = `${i + 1}) ${r.name}`;
      const line2 = `⭐️ ${r.rating} (${r.ratingsCount})`;
      const line3 = r.address;
      const line4 = r.mapsUrl ? "📍 Open in Google Maps" : "";
      return [line1, line2, line3, line4].filter(Boolean).join("\n");
    })
    .join("\n\n")
    .slice(0, 3800);
}
