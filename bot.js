import dotenv from "dotenv";
import fetch from "node-fetch";
import { Telegraf } from "telegraf";

dotenv.config();

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const GOOGLE_KEY = process.env.GOOGLE_MAPS_API_KEY;

if (!BOT_TOKEN) throw new Error("Missing TELEGRAM_BOT_TOKEN in .env");
if (!GOOGLE_KEY) throw new Error("Missing GOOGLE_MAPS_API_KEY in .env");

const bot = new Telegraf(BOT_TOKEN);

// --- helper: call Google Places (New) ---
async function searchPlaces(textQuery, maxResultCount = 5) {
  const url = "https://places.googleapis.com/v1/places:searchText";

  const resp = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": GOOGLE_KEY,
      "X-Goog-FieldMask":
        "places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.googleMapsUri",
    },
    body: JSON.stringify({
      textQuery,
      maxResultCount,
    }),
  });

  const data = await resp.json();
  if (!resp.ok) {
    const msg = data?.error?.message || JSON.stringify(data);
    const err = new Error(`Places API error: ${resp.status} ${msg}`);
    err.status = resp.status;
    throw err;
  }

  return (data.places || []).map((p) => ({
    name: p.displayName?.text || "Unknown",
    address: p.formattedAddress || "-",
    rating: p.rating ?? "-",
    ratingsCount: p.userRatingCount ?? "-",
    mapsUrl: p.googleMapsUri,
  }));
}

// --- bot commands ---
bot.start(async (ctx) => {
  await ctx.reply(
    "سلام! 👋\n" +
      "اسم غذا/نوع رستوران و شهر رو بفرست، مثل:\n" +
      "• italian in berlin\n" +
      "• burger near alexanderplatz\n\n" +
      "یا دستور /help رو بزن."
  );
});

bot.command("help", async (ctx) => {
  await ctx.reply(
    "راهنما:\n" +
      "فقط پیام بده مثل:\n" +
      "italian restaurant in Berlin\n\n" +
      "دستورها:\n" +
      "/top5 <query>  → 5 نتیجه اول\n" +
      "/top10 <query> → 10 نتیجه اول"
  );
});

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

// هر پیام معمولی => سرچ
bot.on("text", async (ctx) => {
  const query = ctx.message.text.trim();
  if (!query) return;
  return handleSearch(ctx, query, 5);
});

async function handleSearch(ctx, query, max) {
  try {
    await ctx.reply("دارم می‌گردم... 🔎");
    const results = await searchPlaces(query, max);

    if (!results.length) {
      return ctx.reply("چیزی پیدا نکردم 😕 یک عبارت دیگه امتحان کن.");
    }

    const msg = results
      .map((r, i) => {
        const line1 = `${i + 1}) ${r.name}`;
        const line2 = `⭐️ ${r.rating} (${r.ratingsCount})`;
        const line3 = `${r.address}`;
        const line4 = r.mapsUrl ? `📍 ${r.mapsUrl}` : "";
        return [line1, line2, line3, line4].filter(Boolean).join("\n");
      })
      .join("\n\n");

    // تلگرام محدودیت طول پیام دارد، پس اگر خیلی طولانی شد، کوتاهش کن
    await ctx.reply(msg.slice(0, 3800));
  } catch (err) {
    if (err?.status === 429) {
      return ctx.reply(
        "به محدودیت (quota) رسیدیم ⛔️\n" +
          "کمی بعد دوباره امتحان کن."
      );
    }
    console.error(err);
    await ctx.reply("یه خطا پیش اومد 😕 لطفاً دوباره امتحان کن.");
  }
}

// --- run bot ---
bot.launch();
console.log("Telegram bot is running (polling).");

// برای خروج تمیز
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));