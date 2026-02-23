import { createClient } from "redis";
import { Redis as UpstashRedis } from "@upstash/redis";
import { env } from "../config/env.js";

let tcpClient = null;
let tcpConnectPromise = null;
let upstashClient = null;
let cacheDisabled = false;

function hasUpstashConfig() {
  return Boolean(env.upstashRedisRestUrl && env.upstashRedisRestToken);
}

function hasTcpRedisConfig() {
  return Boolean(env.redisUrl);
}

function canUseCache() {
  return (hasUpstashConfig() || hasTcpRedisConfig()) && !cacheDisabled;
}

function getUpstashClient() {
  if (!hasUpstashConfig() || cacheDisabled) return null;
  if (!upstashClient) {
    upstashClient = new UpstashRedis({
      url: env.upstashRedisRestUrl,
      token: env.upstashRedisRestToken,
    });
  }
  return upstashClient;
}

async function getTcpClient() {
  if (!hasTcpRedisConfig() || cacheDisabled) return null;
  if (tcpClient?.isOpen) return tcpClient;
  if (!tcpClient) {
    tcpClient = createClient({ url: env.redisUrl });
    tcpClient.on("error", () => {
      // keep request flow resilient; cache should never break the bot
    });
  }

  if (!tcpConnectPromise) {
    tcpConnectPromise = tcpClient.connect().catch(() => {
      cacheDisabled = true;
      return null;
    });
  }

  await tcpConnectPromise;
  return tcpClient?.isOpen ? tcpClient : null;
}

export async function cacheGet(key) {
  if (!canUseCache()) return null;

  try {
    const upstash = getUpstashClient();
    if (upstash) {
      const value = await upstash.get(key);
      return typeof value === "string" ? value : value == null ? null : JSON.stringify(value);
    }

    const tcp = await getTcpClient();
    if (!tcp) return null;
    return await tcp.get(key);
  } catch {
    return null;
  }
}

export async function cacheSet(key, value, ttlSeconds) {
  if (!canUseCache()) return false;

  try {
    const upstash = getUpstashClient();
    if (upstash) {
      if (ttlSeconds > 0) {
        await upstash.set(key, value, { ex: ttlSeconds });
      } else {
        await upstash.set(key, value);
      }
      return true;
    }

    const tcp = await getTcpClient();
    if (!tcp) return false;
    if (ttlSeconds > 0) {
      await tcp.set(key, value, { EX: ttlSeconds });
    } else {
      await tcp.set(key, value);
    }
    return true;
  } catch {
    return false;
  }
}
