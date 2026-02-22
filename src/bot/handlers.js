import { Markup } from "telegraf";
import { searchPlaces } from "../services/places.service.js";
import { formatPlacesMessage } from "./format.js";
import { getCtx, setCtx } from "./session.js";

export function registerBotHandlers(bot) {
  bot.start((ctx) =>
    ctx.reply(
      "سلام! 👋\n" +
        "یک عبارت بفرست مثل:\n" +
        "• pizza\n" +
        "• best burger\n" +
        "• italian in berlin\n\n" +
        "دستورها:\n" +
        "/cuisine  انتخاب نوع غذا\n" +
        "/nearme   جستجو نزدیک من\n" +
        "/minreviews 1000\n" +
        "/minrating 4.5\n" +
        "/filters  نمایش تنظیمات\n" +
        "/top5 <query>\n" +
        "/top10 <query>"
    )
  );

  bot.command("help", (ctx) =>
    ctx.reply(
      "مثال‌ها:\n" +
        "/cuisine\n" +
        "/minreviews 1000\n" +
        "/minrating 4.5\n" +
        "/nearme\n\n" +
        "و بعدش فقط بنویس:\n" +
        "pizza\n" +
        "best pizza\n" +
        "burger"
    )
  );

  // ---------- cuisine selection ----------
  bot.command("cuisine", async (ctx) => {
    const buttons = [
      ["🍕 Pizza", "cuisine:pizza"],
      ["🍝 Italian", "cuisine:italian restaurant"],
      ["🍔 Burger", "cuisine:burger"],
      ["🥙 Turkish", "cuisine:turkish restaurant"],
      ["🥗 Greek", "cuisine:greek restaurant"],
      ["🥘 Spanish", "cuisine:spanish restaurant"],
      ["⭐️ Any", "cuisine:"],
    ];

    await ctx.reply(
      "Cuisine را انتخاب کن:",
      Markup.inlineKeyboard(
        buttons.map(([label, data]) => Markup.button.callback(label, data)),
        { columns: 2 }
      )
    );
  });

  bot.action(/^cuisine:(.*)$/i, async (ctx) => {
    const cuisine = ctx.match[1] || null;
    setCtx(ctx.from.id, { cuisine: cuisine || null });
    await ctx.answerCbQuery();
    await ctx.reply(`Cuisine set to: ${cuisine || "Any"}`);
  });

  // ---------- filters ----------
  bot.command("minreviews", async (ctx) => {
    const n = Number(ctx.message.text.replace("/minreviews", "").trim());
    if (!Number.isFinite(n) || n < 0) return ctx.reply("Example: /minreviews 1000");
    setCtx(ctx.from.id, { minReviews: Math.floor(n) });
    return ctx.reply(`Min reviews set to: ${Math.floor(n)}`);
  });

  bot.command("minrating", async (ctx) => {
    const r = Number(ctx.message.text.replace("/minrating", "").trim());
    if (!Number.isFinite(r) || r < 0 || r > 5) return ctx.reply("Example: /minrating 4.5");
    setCtx(ctx.from.id, { minRating: r });
    return ctx.reply(`Min rating set to: ${r}`);
  });

  bot.command("filters", async (ctx) => {
    const s = getCtx(ctx.from.id);
    return ctx.reply(
      `Current filters:\n` +
        `• Cuisine: ${s.cuisine || "Any"}\n` +
        `• Min rating: ${s.minRating || 0}\n` +
        `• Min reviews: ${s.minReviews || 0}\n` +
        `• Location: ${s.location ? "Near me" : s.city}`
    );
  });

  // ---------- location ----------
  bot.command("nearme", async (ctx) => {
    await ctx.reply(
      "لوکیشن رو بفرست 📍",
      Markup.keyboard([[Markup.button.locationRequest("📍 Share location")]])
        .oneTime()
        .resize()
    );
  });

  bot.on("location", async (ctx) => {
    const { latitude, longitude } = ctx.message.location;
    setCtx(ctx.from.id, { location: { lat: latitude, lng: longitude } });
    await ctx.reply("Got it ✅ حالا بنویس مثلاً: pizza یا best pizza");
  });

  // ---------- top commands ----------
  bot.command("top5", async (ctx) => {
    const userText = ctx.message.text.replace("/top5", "").trim();
    if (!userText) return ctx.reply("مثال: /top5 pizza");
    return handleSearch(ctx, userText, 5);
  });

  bot.command("top10", async (ctx) => {
    const userText = ctx.message.text.replace("/top10", "").trim();
    if (!userText) return ctx.reply("مثال: /top10 burger");
    return handleSearch(ctx, userText, 10);
  });

  // ---------- normal text search ----------
  bot.on("text", async (ctx) => {
    const userText = ctx.message.text.trim();
    if (!userText) return;
    return handleSearch(ctx, userText, 5);
  });
}

async function handleSearch(ctx, userText, max) {
  try {
    await ctx.reply("دارم می‌گردم... 🔎");

    const state = getCtx(ctx.from.id);
    const textQuery = buildTextQuery(state, userText);

    // Fetch more then filter/sort ourselves
    const raw = await searchPlaces({
    textQuery,
    maxResultCount: 20,
    location: state.location, // 👈 این اضافه شد
    });
    const filtered = applyFiltersAndRank(raw, state).slice(0, max);

    if (!filtered.length) {
      return ctx.reply(
        "بعد از اعمال فیلترها چیزی پیدا نشد 😕\n" +
          "فیلترها رو سبک‌تر کن:\n" +
          "/minreviews 0\n" +
          "/minrating 0"
      );
    }

    return ctx.reply(formatPlacesMessage(filtered));
  } catch (err) {
    if (err?.status === 429) {
      return ctx.reply("به محدودیت درخواست‌ها (quota) رسیدیم ⛔️\nکمی بعد دوباره امتحان کن.");
    }
    console.error("Bot error:", err);
    return ctx.reply("یه خطا پیش اومد 😕 لطفاً دوباره امتحان کن.");
  }
}

function buildTextQuery(userCtx, userText) {
  const cuisine = userCtx.cuisine ? `${userCtx.cuisine} ` : "";
  const base = userText.toLowerCase().includes("best") ? userText : `best ${userText}`;

  // MVP: if location exists, we keep text (and later we can bias by location)
  if (userCtx.location) return `${cuisine}${base}`;

  return `${cuisine}${base} in ${userCtx.city || "Berlin"}`;
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