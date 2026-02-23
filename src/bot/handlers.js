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
  distanceKeyboard,
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
      searchRadiusMeters: 5000,
      radiusLabel: "Local area (5 km)",
      page: 0,
      lastResults: [],
      pendingFilterMode: null,
    });
    await ctx.reply(
      "👋 Welcome!\n\nLet's find restaurants step by step.\n1) Share your location to begin.",
      startKeyboard()
    );
  });

  bot.command("help", async (ctx) => {
    await ctx.reply(
      "Use /start to begin.\nThen follow the buttons:\n1) Location\n2) Search range (near me / city-wide)\n3) Cuisine\n4) Filter mode (rating/reviews/both)\n5) Results"
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
      location: null,
      city: "Berlin",
      searchRadiusMeters: 5000,
      radiusLabel: "Local area (5 km)",
      page: 0,
      lastResults: [],
      pendingFilterMode: null,
    });
    await ctx.editMessageText(
      "Where do you want to explore?\nShare your location to continue.",
      startKeyboard()
    );
  });

  // --- HOME actions (location only) ---
  bot.action("home:nearme", async (ctx) => {
    setCtx(ctx.from.id, { step: "ASK_LOCATION" });
    await ctx.answerCbQuery();
    await ctx.reply(
      "Tap the button below to share your location:",
      Markup.keyboard([[Markup.button.locationRequest("📍 Share location")]]).oneTime().resize()
    );
  });

  bot.on("location", async (ctx) => {
    const { latitude, longitude } = ctx.message.location;
    setCtx(ctx.from.id, {
      location: { lat: latitude, lng: longitude },
      step: "ASK_RANGE",
    });

    await ctx.reply("✅ Location saved.", Markup.removeKeyboard());
    await ctx.reply("2) How far should I search from your location?", distanceKeyboard());
  });

  bot.action(/^range:(\d+)$/i, async (ctx) => {
    const meters = Number(ctx.match[1]);
    const labelMap = {
      1000: "Very near (1 km)",
      3000: "Near me (3 km)",
      5000: "Local area (5 km)",
      10000: "Wider area (10 km)",
      25000: "City-wide (25 km)",
    };

    const radiusLabel = labelMap[meters] || "Local area (5 km)";
    setCtx(ctx.from.id, {
      searchRadiusMeters: Number.isFinite(meters) ? meters : 5000,
      radiusLabel,
      step: "ASK_CUISINE",
    });
    await ctx.answerCbQuery(`Range: ${radiusLabel}`);
    await ctx.editMessageText(`✅ Range set: ${radiusLabel}\n\n3) What cuisine do you want?`, cuisineKeyboard());
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

  // --- Hint users toward the wizard flow ---
  bot.on("text", async (ctx) => {
    const t = ctx.message.text.trim();
    if (t.startsWith("/")) return;

    return ctx.reply(
      "Use /start to begin.\nStep 1 is sharing your location."
    );
  });
}

async function showResults(ctx, { refresh, editMessage = false }) {
  const userId = ctx.from.id;
  const s = getCtx(userId);

  const cuisine = s.cuisine ? `${s.cuisine} ` : "";
  const dish = s.dish ? `${s.dish} ` : "";
  const base = s.dish ? `best ${dish}` : "best restaurant";
  const textQuery = s.location
    ? `${cuisine}${base}`
    : `${cuisine}${base} in ${s.city || "Berlin"}`;

  let results = s.lastResults;

  if (refresh || !results.length) {
    const raw = await searchPlaces({
      textQuery,
      maxResultCount: 20,
      location: s.location,
      radiusMeters: s.searchRadiusMeters || 5000,
    });
    results = applyFiltersAndRank(raw, s);
    setCtx(userId, { lastResults: results, lastQuery: textQuery, page: 0 });
  }

  const page = getCtx(userId).page;
  const pageSize = s.pageSize || 5;

  const start = page * pageSize;
  const slice = results.slice(start, start + pageSize);

  if (!slice.length) {
    setCtx(userId, { page: 0 });
    const text = "No more results 😕\nTry refresh or lower filters.";
    return editMessage ? ctx.editMessageText(text, resultsKeyboard()) : ctx.reply(text, resultsKeyboard());
  }

  const header =
    `🔎 Results (${results.length})\n` +
    `• Cuisine: ${s.cuisine || "Any"}\n` +
    `• Min rating: ${s.minRating || 0}\n` +
    `• Min reviews: ${s.minReviews || 0}\n` +
    `• Area: ${s.location ? s.radiusLabel || "Near me (3 km)" : s.city}\n\n`;

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
