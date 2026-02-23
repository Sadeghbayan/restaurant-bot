import { PostHog } from "posthog-node";
import { env } from "../config/env.js";

let client = null;

function getClient() {
  if (!env.posthogApiKey) return null;
  if (!client) {
    client = new PostHog(env.posthogApiKey, {
      host: env.posthogHost,
    });
  }
  return client;
}

export function trackTelegramEvent(ctx, event, properties = {}) {
  const ph = getClient();
  if (!ph) return;
  if (!ctx?.from?.id) return;

  const distinctId = `telegram_${ctx.from.id}`;
  const safeProperties = {
    ...properties,
    source: "telegram_bot",
    chat_type: ctx.chat?.type,
    language_code: ctx.from.language_code,
    username: ctx.from.username,
  };

  void ph.capture({
    distinctId,
    event,
    properties: safeProperties,
  });
}

export async function shutdownAnalytics() {
  if (!client) return;
  try {
    await client.shutdown();
  } catch {
    // analytics should never break process shutdown
  }
}
