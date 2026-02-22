import dotenv from "dotenv";
dotenv.config();

function required(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

export const env = {
  port: Number(process.env.PORT || 3000),
  telegramToken: required("TELEGRAM_BOT_TOKEN"),
  googleApiKey: required("GOOGLE_MAPS_API_KEY"),

  // Make webhook path hard to guess
  webhookSecret: required("WEBHOOK_SECRET"),

  // Render sets this automatically (very helpful)
  publicBaseUrl: process.env.RENDER_EXTERNAL_URL || process.env.PUBLIC_BASE_URL || "",
};