import { Markup } from "telegraf";

export function homeKeyboard() {
  return Markup.inlineKeyboard([
    [Markup.button.callback("📍 Near me", "home:nearme")],
    [Markup.button.callback("🏙 Berlin", "home:city:Berlin")],
    [Markup.button.callback("🍽 Choose cuisine", "nav:cuisine")],
    [Markup.button.callback("🍕 Choose dish", "nav:dish")],
    [Markup.button.callback("⭐ Rating", "nav:rating"), Markup.button.callback("📝 Reviews", "nav:reviews")],
    [Markup.button.callback("🔎 Show results", "nav:results")],
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
    ],
    { columns: 2 }
  );
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
    [Markup.button.callback("🔄 Refresh", "results:refresh")],
    [Markup.button.callback("⬅️ Prev", "results:prev"), Markup.button.callback("Next ➡️", "results:next")],
    [Markup.button.callback("🏠 Home", "nav:home")],
  ]);
}

export function dishKeyboard() {
  const items = [
    ["🍕 Pizza", "dish:pizza"],
    ["🍔 Burger", "dish:burger"],
    ["🍣 Sushi", "dish:sushi"],
    ["🥙 Kebab", "dish:kebab"],
    ["🍜 Ramen", "dish:ramen"],
    ["🥩 Steak", "dish:steak"],
    ["🥗 Vegan", "dish:vegan"],
    ["☕ Cafe", "dish:cafe"],
    ["🍻 Bar", "dish:bar"],
    ["⭐ Any", "dish:any"],
  ];

  return Markup.inlineKeyboard(
    [
      ...items.map(([label, data]) => Markup.button.callback(label, data)),
      [Markup.button.callback("⬅️ Back", "nav:home")],
    ],
    { columns: 2 }
  );
}