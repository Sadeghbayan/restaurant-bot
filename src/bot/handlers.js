import { searchPlaces } from "../services/places.service.js";
import { formatPlacesMessage } from "./format.js";

export function registerBotHandlers(bot) {
  bot.start((ctx) =>
    ctx.reply(
      "سلام! 👋\n" +
        "یک عبارت بفرست مثل:\n" +
        "• italian in berlin\n" +
        "• best burger near alexanderplatz\n\n" +
        "دستورها:\n" +
        "/top5 <query>\n" +
        "/top10 <query>"
    )
  );

  bot.command("help", (ctx) =>
    ctx.reply("مثال:\n/top10 italian in berlin\nیا فقط پیام بده: burger in berlin")
  );

  bot.command("top5", async (ctx) => {
    const query = ctx.message.text.replace("/top5", "").trim();
    if (!query) return ctx.reply("مثال: /top5 italian in berlin");
    return handleSearch(ctx, query, 5);
  });

  bot.command("top10", async (ctx) => {
    const query = ctx.message.text.replace("/top10", "").trim();
    if (!query) return ctx.reply("مثال: /top10 burger in berlin");
    return handleSearch(ctx, query, 10);
  });

  bot.on("text", async (ctx) => {
    const query = ctx.message.text.trim();
    if (!query) return;
    return handleSearch(ctx, query, 5);
  });
}

async function handleSearch(ctx, query, max) {
  try {
    await ctx.reply("دارم می‌گردم... 🔎");

    const places = await searchPlaces({ textQuery: query, maxResultCount: max });

    if (!places.length) return ctx.reply("چیزی پیدا نکردم 😕 یک عبارت دیگه امتحان کن.");

    return ctx.reply(formatPlacesMessage(places));
  } catch (err) {
    if (err?.status === 429) {
      return ctx.reply("به محدودیت درخواست‌ها (quota) رسیدیم ⛔️\nکمی بعد دوباره امتحان کن.");
    }
    console.error("Bot error:", err);
    return ctx.reply("یه خطا پیش اومد 😕 لطفاً دوباره امتحان کن.");
  }
}