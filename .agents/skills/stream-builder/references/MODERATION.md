# Moderation - CLI setup + end-user actions

Cross-product moderation for Chat, Feeds, and Video. **Moderation review (queue, flagged items, approve/ban) is handled exclusively in the [Stream Dashboard](https://beta.dashboard.getstream.io) - never build review UI in the app** (RULES.md > Moderation is Dashboard-only).

Rules: [../../stream/RULES.md](../../stream/RULES.md) (moderation is Dashboard-only).

## Quick ref

- **Builder default:** Use **Setup** below for **CLI-only** config during scaffold. Do **not** build any moderation review UI.
- **End-user actions** (report, block, mute): see [MODERATION-blueprints.md](MODERATION-blueprints.md) - Report Modal + Block/Mute Controls sections only.
- **Review Queue, Flagged Item, Auto-Mod Status blueprints** exist in the blueprints file as reference material but **must not be used by the builder**. Review happens in the Dashboard.

---

## App Integration

### Setup

**Packages:** `@stream-io/node-sdk` (server), `stream-chat` (server - for chat message deletion)

**CLI commands (run when moderation is included):**
```bash
# Create blocklist (NOT idempotent - check first to avoid 400 error):
stream api ListBlockLists 2>&1 | grep -q '"profanity"' || \
  stream api CreateBlockList name=profanity --body '{"words":[<generate a comprehensive list of common profanity>]}'

# Attach blocklist to the channel type being used (e.g., livestream, team, messaging):
stream api UpdateChannelType name=livestream --body '{"blocklist":"profanity","blocklist_behavior":"flag"}' automod=disabled automod_behavior=flag

# Enable blocklist in moderation config (required for review queue population):
stream api upsert_config --body '{"key":"chat","block_list_config":{"enabled":true,"rules":[{"name":"profanity","action":"flag"}]}}'
# If Feeds is also used - chat config does NOT cover feeds:
stream api upsert_config --body '{"key":"feeds","block_list_config":{"enabled":true,"rules":[{"name":"profanity","action":"flag"}]}}'
```

**IMPORTANT:** Do NOT use `2>/dev/null || true` to suppress CreateBlockList errors - this also swallows CLI confirmation prompts (exit code 5), causing silent failure. The blocklist must exist before `upsert_config` runs, or it will fail with "Blocklist not found".

### Server Routes

No moderation-specific server routes needed - review happens in the Dashboard. The app only needs the standard `/api/token` route from the primary product (Chat, Feeds, etc.).

### Gotchas

- Blocklist alone doesn't populate review queue - MUST also `upsert_config` with `block_list_config.enabled: true`
- Need BOTH `key: "chat"` AND `key: "feeds"` configs if both products are used - chat config doesn't cover feeds
- Use `flag` not `block` for `blocklist_behavior` - flag delivers content AND flags it in review queue
- `CreateBlockList` is NOT idempotent - returns 400 if exists. Check with `ListBlockLists` first. Do NOT use `2>/dev/null || true` - it swallows CLI confirmation prompts
- Generate real profanity for the blocklist - not placeholders like "badword1"
- Custom rules (`upsert_moderation_rule`) return 403 on free plans - use blocklist + config instead
- Flagged content review: [Stream Dashboard](https://beta.dashboard.getstream.io) - never in-app
