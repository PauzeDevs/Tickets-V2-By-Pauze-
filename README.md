# Pauze Tickets

<div align="center">

**A full-featured, modular Discord ticket system for Discord.js v14.**

Fast interactions. Custom panels. Persistent tickets. Forms. Claims. Transcripts. CSAT.

[Repository](https://github.com/PauzeDevs/Tickets-V2-By-Pauze-) · [Issues](https://github.com/PauzeDevs/Tickets-V2-By-Pauze-/issues)

</div>

---

## Overview

Pauze Tickets is an open-source Discord support platform designed around the feature set expected from modern ticket bots, with an original Pauze UI and implementation. The reference product that inspired the feature scope advertises reaction/button panels, transcripts, forms, user feedback, claiming, and support teams; Pauze Tickets implements its own configurable equivalents rather than copying proprietary code or branding. citeturn0view0

## Feature Set

### Ticket Panels

- `/setup-panel` deployment command
- Select-menu based ticket panels
- Custom Discord emoji icons
- Configurable panel title, description, color, footer, thumbnail, and image support in the embed layer
- Multiple support categories
- Category-specific questions and descriptions
- Runtime embed customization through `/ticket embed`

### Forms

Each category can define its own intake questions.

Supported fields include:

- Short text
- Paragraph text
- Required or optional questions
- Placeholders
- Maximum lengths

Form answers are stored with the ticket and displayed in the ticket control embed.

### Support Categories & Teams

Categories can define:

- Display name
- Internal value
- Description
- Custom emoji
- Intake questions
- Dedicated ticket category override

Support access can be configured through `supportRoleId` and `staffRoleIds`.

### Ticket Provisioning

Two creation engines are supported:

**Private channels**

Creates a locked Discord text channel with explicit creator and support permissions.

**Private threads**

Creates a private thread under the configured intake channel for communities that prefer a thread-based support architecture.

### Ticket Controls

Every ticket receives a persistent control center:

- Claim
- Export transcript
- Close
- Closure confirmation
- Closure reason modal

Claimed tickets record the responsible staff member and update ticket metadata.

### Staff Commands

```text
/ticket add <user>
/ticket remove <user>
/ticket rename <name>
/ticket transfer <user|role>
/ticket stats
/ticket embed <target> [title] [description] [color] [footer]
```

### Persistent State

Ticket state is stored in `data/tickets.json` and survives bot restarts.

Stored information includes:

- Sequential ticket ID
- Guild ID
- Channel/thread ID
- Creator
- Category
- Intake answers
- Creation time
- Claim assignment
- Closure time
- Closing staff member
- Closure reason
- Transcript filename
- CSAT rating

### Duplicate Protection

A user cannot open another active ticket in the same guild while an existing ticket is still open.

### Transcripts

Pauze Tickets generates standalone HTML transcripts containing:

- Message history
- Usernames
- Avatars
- Timestamps
- Message content
- Attachment links
- Ticket metadata
- Discord-inspired dark styling

Transcripts can be exported manually and are generated automatically during closure.

### Closure Workflow

The close flow is designed to avoid accidental ticket deletion:

```text
Close
  ↓
Confirmation
  ↓
Closure reason
  ↓
HTML transcript
  ↓
Creator DM
  ↓
CSAT rating
  ↓
Staff log
  ↓
Ticket archive/deletion
```

### CSAT

Closed tickets can send the creator a 1–5 rating interface. Ratings are persisted and included in ticket statistics.

`/ticket stats` reports:

- Total tickets
- Open tickets
- Closed tickets
- Number of ratings
- Average rating

### Restart Safety

Interactions use stable custom IDs rather than temporary in-memory listeners. Ticket metadata is persisted independently of the Discord process, allowing active tickets to remain manageable after a restart.

## Visual System

Pauze Tickets intentionally uses a clean Discord-native aesthetic:

- `#2B2D31` dark surfaces
- `#5865F2` accent styling
- Compact embeds
- Minimal visual clutter
- Custom Discord emojis
- No default Unicode/system emojis in the bot UI

Custom emoji mappings live in:

```text
src/config/emojis.json
```

Replace the placeholder emoji IDs with the custom emojis used by your server.

## Configuration

### `src/config/config.json`

Controls:

- Channel/thread mode
- Ticket category
- Intake channel
- Support roles
- Log channel
- Ticket deletion delay
- Per-user ticket limits
- Global theme
- Panel embed
- Ticket embed
- Category-specific forms

Example embed configuration:

```json
{
  "panel": {
    "color": "#2B2D31",
    "title": "Support Center",
    "description": "Select a department below to create a private support ticket.",
    "footer": "Pauze Tickets"
  }
}
```

### `src/config/emojis.json`

Example:

```json
{
  "support": "<:support:000000000000000000>",
  "technical": "<:technical:000000000000000000>",
  "billing": "<:billing:000000000000000000>",
  "report": "<:report:000000000000000000>",
  "claim": "<:claim:000000000000000000>",
  "close": "<:close:000000000000000000>",
  "transcript": "<:transcript:000000000000000000>",
  "cancel": "<:cancel:000000000000000000>",
  "star": "<:star:000000000000000000>"
}
```

The IDs above are intentionally placeholders.

## Requirements

- Node.js `18.17+`
- Discord.js `14.x`
- Discord application/bot
- Appropriate Gateway Intents
- Permissions to create and manage tickets

Recommended permissions:

- Manage Channels
- Manage Threads
- Send Messages
- Embed Links
- Attach Files
- Read Message History
- Manage Messages where required

## Installation

```bash
git clone https://github.com/PauzeDevs/Tickets-V2-By-Pauze-.git
cd Tickets-V2-By-Pauze-
npm install
cp .env.example .env
```

Configure `.env`:

```env
DISCORD_TOKEN=your_bot_token
CLIENT_ID=your_application_id
GUILD_ID=your_development_guild_id
```

Then configure:

```text
src/config/config.json
src/config/emojis.json
```

Start the bot:

```bash
npm start
```

Development mode:

```bash
npm run dev
```

Static syntax checks:

```bash
npm run check
```

## Project Structure

```text
src/
├── index.js
├── commands/
│   ├── setup-panel.js
│   └── ticket.js
├── interactions/
│   ├── buttons.js
│   ├── modals.js
│   └── selectMenus.js
├── services/
│   └── ticketManager.js
├── utils/
│   ├── components.js
│   ├── database.js
│   ├── embeds.js
│   └── transcript.js
└── config/
    ├── config.json
    └── emojis.json
```

## Architecture

**Commands** handle slash-command registration and administrative ticket operations.

**Interactions** handle persistent buttons, category menus, intake forms, and closure forms.

**Database** provides atomic-ish queued JSON persistence without requiring an external database service.

**Embeds** centralize the visual system and allow runtime customization.

**Transcript** renders a standalone HTML support record.

**Configuration** keeps server-specific IDs, category forms, branding, and emoji mappings outside core interaction logic.

## Security

Never commit:

- Discord bot tokens
- API keys
- Database credentials
- Webhook secrets
- Private server configuration
- User data
- Generated transcripts containing private information

Use `.env` for secrets and keep runtime data out of version control.

## Development Branches

The intended workflow is:

```text
feature/*
    ↓
develop
    ↓
staging
    ↓
main
```

Feature areas include:

```text
feature/core
feature/database
feature/setup-panel
feature/ticket-provisioning
feature/private-threads
feature/ticket-controls
feature/ticket-commands
feature/transcripts
feature/closure-csat
feature/logging
feature/security
feature/restart-persistence
```

## Attribution

Pauze Tickets is an original project maintained by **PauzeDevs**.

The project is publicly available under the MIT License. Redistribution and modification are permitted subject to the terms of that license, including retention of the original copyright and license notices.

Pauze branding, logos, original visual assets, and the names **Pauze**, **PauzeDevs**, and **Pauze Tickets** are not granted as software rights by the MIT License.

A modified or derivative project must not falsely represent itself as an official Pauze Tickets release.

## License

Copyright © 2026 PauzeDevs.

Pauze Tickets is licensed under the MIT License. See [`LICENSE`](LICENSE) for the complete terms.

## Disclaimer

This project is provided under the terms of its license without warranty. Discord API behavior, platform limits, permissions, and third-party services may change independently of the project.

---

<div align="center">

**Built and maintained by PauzeDevs.**

</div>
