import express from "express";
import { env } from "./config/env.js";

export function createApp(bot) {
  const app = express();

  // Health endpoint (for Render / uptime checks)
  app.get("/", (req, res) => res.status(200).send("OK"));

  // Webhook endpoint (secret path)
  const webhookPath = `/telegram/${env.webhookSecret}`;

  // Telegraf webhook needs JSON body
  app.use(express.json());
  app.post(webhookPath, bot.webhookCallback(webhookPath));

  return { app, webhookPath };
}