# Pauze Tickets

A modular Discord.js v14 ticket system focused on fast interactions, clean embeds, private support workflows, transcripts, and persistent ticket state.

## Features

- `/setup-panel` support hub with category select menu
- Modal-based ticket intake
- Channel mode or private-thread mode
- Sequential persistent ticket IDs
- Private creator/support permissions
- Claim, close, transcript export and ticket management controls
- `/ticket add`, `/ticket remove`, `/ticket rename`, `/ticket transfer`
- Dark HTML transcripts with avatars, timestamps, message content and attachments
- Closure DM with transcript and 1–5 CSAT buttons
- Staff ticket logs and CSAT reporting
- Restart-safe interaction handlers and persistent JSON state
- Custom Discord emoji configuration with no Unicode UI emojis

## Requirements

- Node.js 18.17+
- Discord bot with the required Gateway Intents
- `Manage Channels`, `Manage Roles` where applicable, `Send Messages`, `Embed Links`, `Attach Files`, `Read Message History`, and thread permissions

## Setup

```bash
npm install
cp .env.example .env
```

Set `DISCORD_TOKEN`, `CLIENT_ID`, and optionally `GUILD_ID` in `.env`.

Then edit:

```text
src/config/config.json
src/config/emojis.json
```

Replace all placeholder Discord IDs and custom emoji IDs before starting the bot.

```bash
npm start
```

For development:

```bash
npm run dev
```

## Ticket Modes

### Channel

Creates private text channels under `ticketCategoryId` with explicit creator/support permissions.

### Private Thread

Creates private threads under `intakeChannelId`. This mode is useful for high-volume communities that want to avoid consuming a large number of guild channels.

Set `mode` to `channel` or `thread` in `src/config/config.json`.

## Emoji Configuration

All bot-facing icons are loaded from `src/config/emojis.json`. Replace the mock IDs with emojis from your Discord server or application.

The bot intentionally does not use system or Unicode emojis for its interface.

## Persistence

Ticket metadata is stored in `data/tickets.json` at runtime. This includes the next sequential ticket ID, active ticket records, and CSAT ratings.

The runtime data file is ignored by Git. Back it up if you need long-term ticket state retention.

## Branch Strategy

The repository is organized around:

- `main` — production-ready code
- `develop` — integration branch
- `staging` — release validation
- `feature/core`
- `feature/database`
- `feature/setup-panel`
- `feature/ticket-provisioning`
- `feature/private-threads`
- `feature/ticket-controls`
- `feature/ticket-commands`
- `feature/transcripts`
- `feature/closure-csat`
- `feature/logging`
- `feature/security`
- `feature/restart-persistence`

Feature work should merge into `develop`, then `staging`, and finally `main`.

## Security

Never commit bot tokens, database credentials, API keys, or private Discord configuration. Use environment variables for secrets.

## License

See `LICENSE` for the project license.
