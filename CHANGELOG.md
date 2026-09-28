# Changelog

All notable changes to Pauze Tickets are documented here.

The project follows semantic versioning:

- **MAJOR** — breaking changes
- **MINOR** — new backwards-compatible features
- **PATCH** — backwards-compatible fixes and maintenance

## [2.0.0] - 2026-09-28

### Added

- Modular Discord.js v14 ticket architecture.
- Discord-native ticket panel deployment.
- Category-specific intake forms.
- Private-channel and private-thread ticket modes.
- Persistent ticket records and sequential ticket IDs.
- Claim, close, transcript, add, remove, rename and transfer workflows.
- HTML transcript generation.
- Creator closure notifications and CSAT support.
- Ticket statistics and persistent lifecycle metadata.
- Discord-native embed customization.
- Ticket logs and configurable CSAT.
- Inactivity/automation foundation.
- Custom Discord emoji configuration.
- Open-source Pauze licensing and developer documentation.
- Automated GitHub release workflow triggered by semantic version tags.

### Release process

To publish a release, update `package.json`, update this changelog, commit the changes, then push a matching tag:

```bash
npm version minor
git push origin main --follow-tags
```

The release workflow validates that the Git tag matches `package.json`, runs the project's JavaScript checks, and publishes the GitHub Release automatically.

## Unreleased

Future feature work will be recorded here before the next version is tagged.
