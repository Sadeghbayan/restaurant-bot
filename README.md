# Restaurant Bot

Telegram restaurant discovery bot powered by Google Places.

## Hosting

This project is deployed on Render:

- Render dashboard: https://dashboard.render.com/
- Source repository: `github.com/Sadeghbayan/restaurant-bot`

## Telegram Webhook

The bot uses webhook mode (not polling).

Webhook path format:

`/telegram/<WEBHOOK_SECRET>`

Public webhook URL format on Render:

`https://<your-render-domain>/telegram/<WEBHOOK_SECRET>`

At startup, the server sets Telegram webhook to:

`<PUBLIC_BASE_URL or RENDER_EXTERNAL_URL> + /telegram/<WEBHOOK_SECRET>`

## Required Environment Variables

- `TELEGRAM_BOT_TOKEN`
- `GOOGLE_MAPS_API_KEY`
- `WEBHOOK_SECRET`
- `PORT` (default `3000`)

Optional:

- `REDIS_URL` or (`UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`)
- `PLACES_CACHE_TTL_SECONDS`
- `POSTHOG_API_KEY`
- `POSTHOG_HOST`
- `TRACKING_FEATURE_ENABLED`
