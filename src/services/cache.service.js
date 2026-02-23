import { createClient } from "redis";
import { env } from "../config/env.js";

let client = null;
let connectPromise = null;
let cacheDisabled = false;

function canUseRedis() {
  return Boolean(env.redisUrl) && !cacheDisabled;
}

async function getClient() {
  if (!canUseRedis()) return null;
  if (client?.isOpen) return client;
  if (!client) {
    client = createClient({ url: env.redisUrl });
    client.on("error", () => {
      // keep request flow resilient; cache should never break the bot
    });
  }

  if (!connectPromise) {
    connectPromise = client.connect().catch(() => {
      cacheDisabled = true;
      return null;
    });
  }

  await connectPromise;
  return client?.isOpen ? client : null;
}

export async function cacheGet(key) {
  const c = await getClient();
  if (!c) return null;

  try {
    return await c.get(key);
  } catch {
    return null;
  }
}

export async function cacheSet(key, value, ttlSeconds) {
  const c = await getClient();
  if (!c) return false;

  try {
    if (ttlSeconds > 0) {
      await c.set(key, value, { EX: ttlSeconds });
    } else {
      await c.set(key, value);
    }
    return true;
  } catch {
    return false;
  }
}
