import { Markup } from "telegraf";

export function startKeyboard() {
  return Markup.inlineKeyboard([
    [Markup.button.callback("📍 Share location", "home:nearme")],
  ]);
}

export function distanceKeyboard() {
  return Markup.inlineKeyboard([
    [Markup.button.callback("📌 Very near (1 km)", "range:1000"), Markup.button.callback("📍 Near me (3 km)", "range:3000")],
    [Markup.button.callback("🛵 Local area (5 km)", "range:5000"), Markup.button.callback("🚗 Wider area (10 km)", "range:10000")],
    [Markup.button.callback("🏙 City-wide (25 km)", "range:25000")],
    [Markup.button.callback("⬅️ Restart", "nav:home")],
  ]);
}

export function cuisineKeyboard() {
  const items = [
    ["🍕 Pizza", "cuisine:pizza"],
    ["🍝 Italian", "cuisine:italian restaurant"],
    ["🍔 Burger", "cuisine:burger"],
    ["🥙 Turkish", "cuisine:turkish restaurant"],
    ["🥗 Greek", "cuisine:greek restaurant"],
    ["🥘 Spanish", "cuisine:spanish restaurant"],
    ["⭐ Any", "cuisine:"],
  ];

  return Markup.inlineKeyboard(
    [
      [Markup.button.callback(items[0][0], items[0][1]), Markup.button.callback(items[1][0], items[1][1])],
      [Markup.button.callback(items[2][0], items[2][1]), Markup.button.callback(items[3][0], items[3][1])],
      [Markup.button.callback(items[4][0], items[4][1]), Markup.button.callback(items[5][0], items[5][1])],
      [Markup.button.callback(items[6][0], items[6][1])],
      [Markup.button.callback("⬅️ Back", "nav:home")],
    ]
  );
}

export function filterModeKeyboard() {
  return Markup.inlineKeyboard([
    [Markup.button.callback("⭐ Rating", "filter:rating"), Markup.button.callback("📝 Reviews", "filter:reviews")],
    [Markup.button.callback("⭐+📝 Both", "filter:both"), Markup.button.callback("⏭ Skip", "filter:none")],
    [Markup.button.callback("⬅️ Restart", "nav:home")],
  ]);
}

export function ratingKeyboard() {
  return Markup.inlineKeyboard([
    [Markup.button.callback("Any", "rating:0"), Markup.button.callback("4.0+", "rating:4.0")],
    [Markup.button.callback("4.3+", "rating:4.3"), Markup.button.callback("4.5+", "rating:4.5")],
    [Markup.button.callback("4.7+", "rating:4.7"), Markup.button.callback("4.8+", "rating:4.8")],
    [Markup.button.callback("⬅️ Back", "nav:home")],
  ]);
}

export function reviewsKeyboard() {
  return Markup.inlineKeyboard([
    [Markup.button.callback("Any", "reviews:0"), Markup.button.callback("200+", "reviews:200")],
    [Markup.button.callback("500+", "reviews:500"), Markup.button.callback("1000+", "reviews:1000")],
    [Markup.button.callback("2000+", "reviews:2000"), Markup.button.callback("5000+", "reviews:5000")],
    [Markup.button.callback("⬅️ Back", "nav:home")],
  ]);
}

export function resultsKeyboard() {
  return Markup.inlineKeyboard([
    [Markup.button.callback("🔄 Refresh", "results:refresh"), Markup.button.callback("🏠 Home", "nav:home")],
    [Markup.button.callback("⬅️ Prev", "results:prev"), Markup.button.callback("Next ➡️", "results:next")],
  ]);
}
