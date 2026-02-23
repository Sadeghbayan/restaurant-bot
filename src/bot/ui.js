import { Markup } from "telegraf";

export function startKeyboard() {
  return Markup.inlineKeyboard([
    [Markup.button.callback("🏙 Berlin", "home:city:Berlin")],
    [Markup.button.callback("📍 Share location", "home:nearme")],
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
      ...items.map(([label, data]) => [Markup.button.callback(label, data)]),
      [Markup.button.callback("⬅️ Back", "nav:home")],
    ]
  );
}

export function filterModeKeyboard() {
  return Markup.inlineKeyboard([
    [Markup.button.callback("⭐ Filter by rating", "filter:rating")],
    [Markup.button.callback("📝 Filter by reviews", "filter:reviews")],
    [Markup.button.callback("⭐+📝 Rating and reviews", "filter:both")],
    [Markup.button.callback("⏭ Skip filters", "filter:none")],
    [Markup.button.callback("⬅️ Restart", "nav:home")],
  ]);
}

export function ratingKeyboard() {
  return Markup.inlineKeyboard([
    [Markup.button.callback("Any", "rating:0")],
    [Markup.button.callback("4.0+", "rating:4.0")],
    [Markup.button.callback("4.3+", "rating:4.3")],
    [Markup.button.callback("4.5+", "rating:4.5")],
    [Markup.button.callback("4.7+", "rating:4.7")],
    [Markup.button.callback("4.8+", "rating:4.8")],
    [Markup.button.callback("⬅️ Back", "nav:home")],
  ]);
}

export function reviewsKeyboard() {
  return Markup.inlineKeyboard([
    [Markup.button.callback("Any", "reviews:0")],
    [Markup.button.callback("200+", "reviews:200")],
    [Markup.button.callback("500+", "reviews:500")],
    [Markup.button.callback("1000+", "reviews:1000")],
    [Markup.button.callback("2000+", "reviews:2000")],
    [Markup.button.callback("5000+", "reviews:5000")],
    [Markup.button.callback("⬅️ Back", "nav:home")],
  ]);
}

export function resultsKeyboard() {
  return Markup.inlineKeyboard([
    [Markup.button.callback("🔄 Refresh", "results:refresh")],
    [Markup.button.callback("⬅️ Prev", "results:prev")],
    [Markup.button.callback("Next ➡️", "results:next")],
    [Markup.button.callback("🏠 Home", "nav:home")],
  ]);
}
