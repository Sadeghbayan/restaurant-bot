import { Markup } from "telegraf";
import { searchPlaces } from "../services/places.service.js";
import { formatPlacesMessage } from "./format.js";
import { getCtx, setCtx } from "./session.js";
import {
  cuisineKeyboard,
  ratingKeyboard,
  reviewsKeyboard,
  resultsKeyboard,
  startKeyboard,
  filterModeKeyboard,
  popularPlacesKeyboard,
} from "./ui.js";

export function registerBotHandlers(bot) {
  // --- START: explain and begin step-by-step flow ---
  bot.start(async (ctx) => {
    setCtx(ctx.from.id, {
      step: "ASK_LOCATION",
      cuisine: null,
      dish: null,
      minReviews: 0,
      minRating: 0,
      location: null,
      city: "Berlin",
      page: 0,
      lastResults: [],
      pendingFilterMode: null,
    });
    await ctx.reply(
      "👋 Welcome!\n\nLet's find restaurants step by step.\n1) Where do you want to explore?\nShare your live location or pick a popular country/city.",
      startKeyboard()
    );
  });

  bot.command("help", async (ctx) => {
    await ctx.reply(
      "Use /start to begin.\nThen follow the buttons:\n1) Location\n2) Cuisine\n3) Filter mode (rating/reviews/both)\n4) Results"
    );
  });

  // --- NAVIGATION ---
  bot.action("nav:home", async (ctx) => {
    await ctx.answerCbQuery();
    setCtx(ctx.from.id, {
      step: "ASK_LOCATION",
      cuisine: null,
      dish: null,
      minReviews: 0,
      minRating: 0,
      page: 0,
      lastResults: [],
      pendingFilterMode: null,
    });
    await ctx.editMessageText(
      "Where do you want to explore?\nShare your live location or pick a popular country/city.",
      startKeyboard()
    );
  });

  // --- HOME actions (location / city) ---
  bot.action(/^home:city:(.*)$/i, async (ctx) => {
    const city = ctx.match[1];
    setCtx(ctx.from.id, { city, location: null, step: "ASK_CUISINE" });
    await ctx.answerCbQuery(`City set: ${city}`);
    await ctx.editMessageText(
      `🏙 Great, exploring in ${city}.\n\nWhat cuisine do you want?`,
      cuisineKeyboard()
    );
  });

  bot.action("home:nearme", async (ctx) => {
    // ask for location using reply keyboard
    setCtx(ctx.from.id, { step: "ASK_LOCATION" });
    await ctx.answerCbQuery();
    await ctx.reply(
      "📍 Tap the button below to share your location.",
      Markup.keyboard([[Markup.button.locationRequest("📍 Share location")]])
        .resize()
        .persistent()
        .inputFieldPlaceholder("Tap to share your live location")
    );
    await ctx.reply(
      "If location sharing is unavailable on your device, choose a popular place:",
      popularPlacesKeyboard()
    );
  });

  bot.on("location", async (ctx) => {
    const { latitude, longitude } = ctx.message.location;
    setCtx(ctx.from.id, {
      location: { lat: latitude, lng: longitude },
      step: "ASK_CUISINE",
    });

    // remove the location keyboard
    await ctx.reply("✅ Location saved.", Markup.removeKeyboard());
    await ctx.reply("What cuisine do you want?", cuisineKeyboard());
  });

  // --- Cuisine / Rating / Reviews selection ---
  bot.action(/^cuisine:(.*)$/i, async (ctx) => {
    const cuisine = ctx.match[1] || null;
    setCtx(ctx.from.id, {
      cuisine: cuisine || null,
      step: "ASK_FILTER_MODE",
      minReviews: 0,
      minRating: 0,
    });
    await ctx.answerCbQuery(`Cuisine: ${cuisine || "Any"}`);
    await ctx.editMessageText(
      "How should I filter results?\nChoose rating, reviews, or both.",
      filterModeKeyboard()
    );
  });

  bot.action(/^filter:(.*)$/i, async (ctx) => {
    const mode = ctx.match[1];
    if (mode === "rating") {
      setCtx(ctx.from.id, { step: "PICK_RATING", pendingFilterMode: "rating" });
      await ctx.answerCbQuery();
      await ctx.editMessageText("⭐ Choose minimum rating:", ratingKeyboard());
      return;
    }

    if (mode === "reviews") {
      setCtx(ctx.from.id, { step: "PICK_REVIEWS", pendingFilterMode: "reviews" });
      await ctx.answerCbQuery();
      await ctx.editMessageText("📝 Choose minimum reviews:", reviewsKeyboard());
      return;
    }

    if (mode === "both") {
      setCtx(ctx.from.id, { step: "PICK_RATING", pendingFilterMode: "both" });
      await ctx.answerCbQuery();
      await ctx.editMessageText("⭐ Step 1/2: choose minimum rating:", ratingKeyboard());
      return;
    }

    setCtx(ctx.from.id, { minRating: 0, minReviews: 0, pendingFilterMode: "none" });
    await ctx.answerCbQuery();
    await showResults(ctx, { refresh: true, editMessage: true });
  });

  bot.action(/^rating:(.*)$/i, async (ctx) => {
    const r = Number(ctx.match[1]);
    const s = getCtx(ctx.from.id);
    setCtx(ctx.from.id, { minRating: Number.isFinite(r) ? r : 0 });
    await ctx.answerCbQuery(`Min rating: ${r || 0}`);

    if (s.pendingFilterMode === "both") {
      setCtx(ctx.from.id, { step: "PICK_REVIEWS" });
      await ctx.editMessageText("📝 Step 2/2: choose minimum reviews:", reviewsKeyboard());
      return;
    }

    await showResults(ctx, { refresh: true, editMessage: true });
  });

  bot.action(/^reviews:(.*)$/i, async (ctx) => {
    const n = Number(ctx.match[1]);
    setCtx(ctx.from.id, {
      minReviews: Number.isFinite(n) ? Math.floor(n) : 0,
      step: "RESULTS",
    });
    await ctx.answerCbQuery(`Min reviews: ${n || 0}`);
    await showResults(ctx, { refresh: true, editMessage: true });
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

  // --- Hint users toward the wizard flow
  bot.on("text", async (ctx) => {
    const t = ctx.message.text.trim();
    if (t.startsWith("/")) return; // ignore commands here
    return ctx.reply(
      "Use /start to begin the guided flow.\nI will ask location, cuisine, and filters step by step."
    );
  });
}

async function showResults(ctx, { refresh, editMessage = false }) {
  const userId = ctx.from.id;
  const s = getCtx(userId);

  // Build query from context (cuisine + best + city)
  const cuisine = s.cuisine ? `${s.cuisine} ` : "";
  const dish = s.dish ? `${s.dish} ` : "";
  const base = s.dish ? `best ${dish}` : "best restaurant";
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
    const text = "No more results 😕\nTry refresh or lower filters.";
    return editMessage ? ctx.editMessageText(text, resultsKeyboard()) : ctx.reply(text, resultsKeyboard());
  }

  const header =
    `🔎 Results (${results.length})\n` +
    `• Cuisine: ${s.cuisine || "Any"}\n` +
    `• Min rating: ${s.minRating || 0}\n` +
    `• Min reviews: ${s.minReviews || 0}\n` +
    `• Area: ${s.location ? "Near me" : s.city}\n\n`;

  const text = header + formatPlacesMessage(slice);
  return editMessage ? ctx.editMessageText(text, resultsKeyboard()) : ctx.reply(text, resultsKeyboard());
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
