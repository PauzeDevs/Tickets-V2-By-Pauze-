# Pauze Tickets

<div align="center">

**A production-oriented, modular Discord ticket system for Discord.js v14.**

Fast interactions. Private support workflows. Persistent tickets. Clean transcripts.

[Repository](https://github.com/PauzeDevs/Tickets-V2-By-Pauze-) · [Issues](https://github.com/PauzeDevs/Tickets-V2-By-Pauze-/issues)

</div>

---

## Overview

Pauze Tickets is an open-source Discord ticket system designed around a clean, low-clutter support experience. It provides a configurable ticket intake panel, modal-based forms, private ticket provisioning, staff controls, transcript generation, closure workflows, and customer satisfaction collection.

The project is intentionally modular so individual systems can be extended without rewriting the entire bot.

## Core Features

### Ticket Intake

- `/setup-panel` deployment command
- Interactive category selection
- Native Discord modal intake
- Short topic, detailed description, and optional identifier fields
- Automatic ticket numbering
- Immediate private ticket provisioning

### Provisioning Modes

The bot supports two configurable ticket engines:

**Channel mode**

Creates private text channels under a configured category with explicit creator and support-team permissions.

**Private-thread mode**

Creates private threads from a designated intake channel. This provides an alternative architecture for communities handling high ticket volume.

Configure the mode in `src/config/config.json`.

### Ticket Control Center

Every ticket receives a dedicated control interface with:

- Claim
- Close
- Transcript export
- Ticket metadata
- Creator and category information
- Intake responses

Staff can also manage tickets with:

```text
/ticket add <user>
/ticket remove <user>
/ticket rename <name>
/ticket transfer <role-or-user>
```

### Persistent Tickets

Ticket state is stored outside the Discord interaction lifecycle so active tickets survive bot restarts.

The runtime state includes:

- Sequential ticket counter
- Ticket ID
- Guild and channel/thread IDs
- Creator ID
- Category
- Staff assignment
- Creation timestamp
- Closure information
- CSAT rating

### Transcripts

Pauze Tickets generates standalone HTML transcripts containing ticket history, timestamps, message content, avatars, attachments, and supported Discord message formatting.

Transcripts can be generated from the ticket control panel and attached to closure notifications and staff logs.

### Closure & CSAT

Closing a ticket can:

1. Record the closing staff member.
2. Record the closure reason.
3. Generate the transcript.
4. DM the ticket creator.
5. Deliver the transcript file.
6. Present a 1–5 customer satisfaction rating.
7. Record the rating for staff reporting.
8. Log the completed ticket to the configured staff channel.

## Visual System

The bot is designed around a minimal Discord-native visual language:

- Dark embed backgrounds using `#2B2D31`
- Subtle Discord-style accent colors
- Compact layouts
- Minimal text decoration
- Custom Discord emojis for bot-facing controls
- No system or Unicode emojis in the bot interface

Custom emoji mappings are centralized in:

```text
src/config/emojis.json
```

The repository contains placeholder IDs so the visual system can be mapped to the custom emojis used by your server.

## Requirements

- Node.js `18.17+`
- Discord.js `14.x`
- A Discord application/bot
- A Discord server where the bot can create and manage tickets
- Required Gateway Intents
- Required permissions for the selected ticket mode

Recommended permissions include:

- Manage Channels
- Manage Roles where applicable
- Send Messages
- Embed Links
- Attach Files
- Read Message History
- Manage Threads where applicable
- Create Private Threads where applicable

## Installation

Clone the repository:

```bash
git clone https://github.com/PauzeDevs/Tickets-V2-By-Pauze-.git
cd Tickets-V2-By-Pauze-
```

Install dependencies:

```bash
npm install
```

Create the environment file:

```bash
cp .env.example .env
```

Configure the environment:

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

Replace all placeholder IDs with the IDs from your Discord server.

Start the bot:

```bash
npm start
```

Development mode:

```bash
npm run dev
```

## Configuration

### `config.json`

Controls the operational behavior of the ticket system, including:

- Ticket creation mode
- Ticket category
- Intake channel
- Support role
- Ticket log channel
- Naming format
- Transcript behavior
- CSAT behavior

### `emojis.json`

Contains the custom Discord emoji mapping used by the bot interface.

Example:

```json
{
  "claim": "<:claim:000000000000000000>",
  "close": "<:close:000000000000000000>",
  "transcript": "<:transcript:000000000000000000>"
}
```

Replace the placeholder IDs before deploying the bot.

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
│   ├── ticketManager.js
│   ├── transcriptService.js
│   └── csatService.js
├── utils/
│   ├── transcript.js
│   ├── database.js
│   ├── permissions.js
│   └── embeds.js
└── config/
    ├── config.json
    └── emojis.json
```

Runtime ticket data is stored under `data/` and is excluded from version control.

## Architecture

The application is separated into several responsibilities:

**Commands** handle slash-command registration and command execution.

**Interactions** process persistent buttons, select menus, and modal submissions.

**Services** contain ticket lifecycle, transcript, and CSAT logic.

**Utilities** provide shared persistence, permissions, transcript rendering, and embed helpers.

**Configuration** keeps server-specific IDs and custom emoji mappings outside the application logic.

This separation is intended to make the system easier to maintain, test, and extend.

## Restart Safety

Ticket controls are designed around persistent custom IDs rather than temporary in-memory listeners. Active ticket metadata is persisted so tickets remain manageable after a bot restart.

Do not delete the runtime ticket database while tickets are active unless you intentionally want to reset the ticket state.

## Branch Strategy

Development follows a staged workflow:

```text
feature/*
    ↓
develop
    ↓
staging
    ↓
main
```

### Main branches

| Branch | Purpose |
| --- | --- |
| `main` | Production-ready releases |
| `develop` | Feature integration |
| `staging` | Release validation |

### Feature branches

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

Feature branches should be merged into `develop` before release validation.

## Security

Never commit secrets to GitHub.

Do not commit:

- Discord bot tokens
- API keys
- Database credentials
- Webhook secrets
- Private server configuration
- User data or exported ticket transcripts

Use environment variables and keep runtime data outside source control.

If you discover a security vulnerability, please report it privately to the project maintainer rather than publishing exploit details in a public issue.

## Attribution

Pauze Tickets is an original project of **PauzeDevs**.

This repository is public and may be used, modified, and redistributed under the terms of the MIT License. If you redistribute this project or substantial portions of its source code, you must retain the original copyright and license notices.

When publishing a modified or derivative version, clearly identify it as a modified or independent project. Do not represent a derivative project as the official Pauze Tickets release.

The following names and branding are **not** licensed as part of the software license:

- Pauze
- PauzeDevs
- Pauze Tickets
- Project logos and original brand assets

Use of the source code does not imply endorsement, sponsorship, or affiliation with PauzeDevs.

Upstream repository:

https://github.com/PauzeDevs/Tickets-V2-By-Pauze-

## License

Pauze Tickets is licensed under the **MIT License**.

See [`LICENSE`](LICENSE) for the complete license text.

```text
Copyright © 2026 PauzeDevs
```

The MIT License permits use, copying, modification, merging, publishing, distribution, sublicensing, and sale of copies of the software, subject to the conditions stated in the license.

## Disclaimer

This software is provided under the terms of the MIT License without warranty. Discord API behavior, platform limits, permissions, and third-party services may change independently of this project.

---

<div align="center">

**Built and maintained by PauzeDevs.**

</div>
