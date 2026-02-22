import { env } from "./config/env.js";
import { createBot } from "./bot/bot.js";
import { createApp } from "./app.js";

async function main() {
  const bot = createBot();
  const { app, webhookPath } = createApp(bot);

  app.listen(env.port, async () => {
    console.log(`Server running on port ${env.port}`);

    // Webhook URL needs a public base URL
    if (!env.publicBaseUrl) {
      console.warn(
        "No PUBLIC base URL found. On Render it should exist as RENDER_EXTERNAL_URL.\n" +
          "Bot webhook NOT set. If running locally, use polling or set PUBLIC_BASE_URL."
      );
      return;
    }

    const webhookUrl = `${env.publicBaseUrl}${webhookPath}`;
    await bot.telegram.setWebhook(webhookUrl);
    console.log("Webhook set to:", webhookUrl);
  });

  process.once("SIGINT", () => bot.stop("SIGINT"));
  process.once("SIGTERM", () => bot.stop("SIGTERM"));
}

main().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});