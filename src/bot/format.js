export function formatPlacesMessage(places) {
  return places
    .map((r, i) => {
      const line1 = `${i + 1}) ${escapeHtml(r.name)}${r.mapsUrl ? ` - <a href="${escapeHtml(r.mapsUrl)}">Open in Google Maps</a>` : ""}`;
      const line2 = `⭐️ ${r.rating} (${r.ratingsCount})`;
      const line3 = escapeHtml(r.address);
      return [line1, line2, line3].filter(Boolean).join("\n");
    })
    .join("\n\n")
    .slice(0, 3800);
}

function escapeHtml(text) {
  return String(text || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
