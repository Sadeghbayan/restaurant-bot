import { Telegraf } from "telegraf";
import { env } from "../config/env.js";
import { registerBotHandlers } from "./handlers.js";

export function createBot() {
  const bot = new Telegraf(env.telegramToken);
  registerBotHandlers(bot);
  return bot;
}