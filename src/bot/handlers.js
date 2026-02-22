import { Markup } from "telegraf";
import { searchPlaces } from "../services/places.service.js";
import { formatPlacesMessage } from "./format.js";
import { getCtx, setCtx } from "./session.js";
import { homeKeyboard, cuisineKeyboard, ratingKeyboard, reviewsKeyboard, resultsKeyboard, dishKeyboard } from "./ui.js";

export function registerBotHandlers(bot) {
  // --- START: show home menu ---
  bot.start(async (ctx) => {
    setCtx(ctx.from.id, { step: "HOME" });
    await ctx.reply("👋 Welcome! Choose an option:", homeKeyboard());
  });

  // --- commands remain for power users, but UI is button-first ---
  bot.command("menu", async (ctx) => {
    setCtx(ctx.from.id, { step: "HOME" });
    await ctx.reply("🏠 Menu:", homeKeyboard());
  });

  // --- NAVIGATION ---
  bot.action("nav:home", async (ctx) => {
    setCtx(ctx.from.id, { step: "HOME" });
    await ctx.answerCbQuery();
    await ctx.editMessageText("🏠 Menu:", homeKeyboard());
  });

  bot.action("nav:cuisine", async (ctx) => {
    setCtx(ctx.from.id, { step: "PICK_CUISINE" });
    await ctx.answerCbQuery();
    await ctx.editMessageText("🍽 Choose cuisine:", cuisineKeyboard());
  });
bot.action("nav:dish", async (ctx) => {
  setCtx(ctx.from.id, { step: "PICK_DISH" });
  await ctx.answerCbQuery();
  await ctx.editMessageText("🍕 Choose dish:", dishKeyboard());
});

bot.action("nav:rating", async (ctx) => {
    setCtx(ctx.from.id, { step: "PICK_RATING" });
    await ctx.answerCbQuery();
    await ctx.editMessageText("⭐ Minimum rating:", ratingKeyboard());
});

bot.action("nav:reviews", async (ctx) => {
    setCtx(ctx.from.id, { step: "PICK_REVIEWS" });
    await ctx.answerCbQuery();
    await ctx.editMessageText("📝 Minimum reviews:", reviewsKeyboard());
  });

  bot.action("nav:results", async (ctx) => {
    await ctx.answerCbQuery();
    return showResults(ctx, { refresh: true });
  });

  // --- HOME actions (location / city) ---
  bot.action(/^home:city:(.*)$/i, async (ctx) => {
    const city = ctx.match[1];
    setCtx(ctx.from.id, { city, location: null });
    await ctx.answerCbQuery(`City set: ${city}`);
    await ctx.editMessageText(`🏙 City set to ${city}\n\nWhat next?`, homeKeyboard());
  });

  bot.action("home:nearme", async (ctx) => {
    // ask for location using reply keyboard
    setCtx(ctx.from.id, { step: "HOME" });
    await ctx.answerCbQuery();
    await ctx.reply(
      "📍 Please share your location:",
      Markup.keyboard([[Markup.button.locationRequest("📍 Share location")]]).oneTime().resize()
    );
  });

  bot.on("location", async (ctx) => {
    const { latitude, longitude } = ctx.message.location;
    setCtx(ctx.from.id, { location: { lat: latitude, lng: longitude } });

    // remove the location keyboard
    await ctx.reply("✅ Location saved. Now choose cuisine/rating/reviews or show results.", Markup.removeKeyboard());
    await ctx.reply("🏠 Menu:", homeKeyboard());
  });

  bot.action(/^dish:(.*)$/i, async (ctx) => {
  const dish = ctx.match[1];
  setCtx(ctx.from.id, { dish: dish === "any" ? null : dish });
  await ctx.answerCbQuery(`Dish: ${dish === "any" ? "Any" : dish}`);
  await ctx.editMessageText("✅ Saved. What next?", homeKeyboard());
});
  // --- Cuisine / Rating / Reviews selection ---
  bot.action(/^cuisine:(.*)$/i, async (ctx) => {
    const cuisine = ctx.match[1] || null;
    setCtx(ctx.from.id, { cuisine: cuisine || null });
    await ctx.answerCbQuery(`Cuisine: ${cuisine || "Any"}`);
    await ctx.editMessageText("✅ Saved. What next?", homeKeyboard());
  });

  bot.action(/^rating:(.*)$/i, async (ctx) => {
    const r = Number(ctx.match[1]);
    setCtx(ctx.from.id, { minRating: Number.isFinite(r) ? r : 0 });
    await ctx.answerCbQuery(`Min rating: ${r || 0}`);
    await ctx.editMessageText("✅ Saved. What next?", homeKeyboard());
  });

  bot.action(/^reviews:(.*)$/i, async (ctx) => {
    const n = Number(ctx.match[1]);
    setCtx(ctx.from.id, { minReviews: Number.isFinite(n) ? Math.floor(n) : 0 });
    await ctx.answerCbQuery(`Min reviews: ${n || 0}`);
    await ctx.editMessageText("✅ Saved. What next?", homeKeyboard());
  });

  // --- Results pagination controls ---
  bot.action("results:refresh", async (ctx) => {
    await ctx.answerCbQuery();
    return showResults(ctx, { refresh: true });
  });

  bot.action("results:next", async (ctx) => {
    await ctx.answerCbQuery();
    const s = getCtx(ctx.from.id);
    setCtx(ctx.from.id, { page: s.page + 1 });
    return showResults(ctx, { refresh: false });
  });

  bot.action("results:prev", async (ctx) => {
    await ctx.answerCbQuery();
    const s = getCtx(ctx.from.id);
    setCtx(ctx.from.id, { page: Math.max(0, s.page - 1) });
    return showResults(ctx, { refresh: false });
  });

  // --- Optional: ignore normal text to make it “buttons only”
  bot.on("text", async (ctx) => {
    const t = ctx.message.text.trim();
    if (t.startsWith("/")) return; // ignore commands here
    return ctx.reply("👆 لطفاً از منو استفاده کن. /menu");
  });
}

async function showResults(ctx, { refresh }) {
  const userId = ctx.from.id;
  const s = getCtx(userId);

  // Build query from context (cuisine + best + city)
const cuisine = s.cuisine ? `${s.cuisine} ` : "";
const dish = s.dish ? `${s.dish} ` : "";
const base = s.dish ? `best ${dish}` : "best restaurant"; // button-only version
const textQuery = s.location
  ? `${cuisine}${base}`
  : `${cuisine}${base} in ${s.city || "Berlin"}`;
  
  let results = s.lastResults;

  if (refresh || !results.length) {
    // fetch more then filter/sort ourselves
    const raw = await searchPlaces({
      textQuery,
      maxResultCount: 20,
      location: s.location,
    });
    results = applyFiltersAndRank(raw, s);
    setCtx(userId, { lastResults: results, lastQuery: textQuery, page: 0 });
  }

  const page = getCtx(userId).page;
  const pageSize = s.pageSize || 5;

  const start = page * pageSize;
  const slice = results.slice(start, start + pageSize);

  if (!slice.length) {
    // if user paged too far
    setCtx(userId, { page: 0 });
    return ctx.reply(
      "No more results 😕\nTry refresh or lower filters.",
      resultsKeyboard()
    );
  }

  const header =
    `🔎 Results (${results.length})\n` +
    `• Cuisine: ${s.cuisine || "Any"}\n` +
    `• Min rating: ${s.minRating || 0}\n` +
    `• Min reviews: ${s.minReviews || 0}\n` +
    `• Area: ${s.location ? "Near me" : s.city}\n\n`;

  return ctx.reply(header + formatPlacesMessage(slice), resultsKeyboard());
}

function rankScore(p) {
  const rating = typeof p.rating === "number" ? p.rating : 0;
  const count = typeof p.ratingsCount === "number" ? p.ratingsCount : 0;
  return rating * 10 + Math.log10(count + 1) * 3;
}

function applyFiltersAndRank(places, { minReviews, minRating }) {
  const minR = minRating || 0;
  const minC = minReviews || 0;

  return places
    .filter((p) => (typeof p.ratingsCount === "number" ? p.ratingsCount : 0) >= minC)
    .filter((p) => (typeof p.rating === "number" ? p.rating : 0) >= minR)
    .sort((a, b) => rankScore(b) - rankScore(a));
}