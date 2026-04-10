import { Markup } from "telegraf";

export function startKeyboard() {
  return Markup.inlineKeyboard([
    [Markup.button.callback("📍 Share location", "home:nearme"), Markup.button.callback("🗼 Paris", "home:paris")],
  ]);
}

export function distanceKeyboard() {
  return Markup.inlineKeyboard([
    [Markup.button.callback("📍 Near me (3 km)", "range:3000"), Markup.button.callback("🚗 Wider area (8 km)", "range:8000")],
    [Markup.button.callback("🏙 City-wide (25 km)", "range:25000")],
    [Markup.button.callback("⬅️ Restart", "nav:home")],
  ]);
}

export function cuisineKeyboard() {
  const items = [
    ["🍕 Pizza", "cuisine:pizza"],
    ["🍝 Italian", "cuisine:italian restaurant"],
    ["🍔 Burger", "cuisine:burger"],
    ["🌮 Mexican", "cuisine:mexican restaurant"],
    ["🍛 Indian", "cuisine:indian restaurant"],
    ["🥡 Chinese", "cuisine:chinese restaurant"],
    ["🍣 Japanese", "cuisine:japanese restaurant"],
    ["🍜 Thai", "cuisine:thai restaurant"],
    ["🍲 Vietnamese", "cuisine:vietnamese restaurant"],
    ["🥙 Lebanese", "cuisine:lebanese restaurant"],
    ["🍗 Korean", "cuisine:korean restaurant"],
    ["🥘 French", "cuisine:french restaurant"],
    ["🍖 German", "cuisine:german restaurant"],
    ["🍢 Persian", "cuisine:persian restaurant"],
    ["🦞 Seafood", "cuisine:seafood restaurant"],
    ["🔥 BBQ", "cuisine:barbecue restaurant"],
    ["🥙 Turkish", "cuisine:turkish restaurant"],
    ["🥗 Greek", "cuisine:greek restaurant"],
    ["🥘 Spanish", "cuisine:spanish restaurant"],
    ["⭐ Any", "cuisine:"],
  ];

  const rows = [];
  for (let i = 0; i < items.length; i += 2) {
    const left = items[i];
    const right = items[i + 1];
    rows.push(
      right
        ? [Markup.button.callback(left[0], left[1]), Markup.button.callback(right[0], right[1])]
        : [Markup.button.callback(left[0], left[1])]
    );
  }

  return Markup.inlineKeyboard(
    [
      ...rows,
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
