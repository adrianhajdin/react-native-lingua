# Stream CLI - cookbook (load for tricky queries)

Load this file when **`cli.md`** workflow is not enough: tricky **`--body`** values, filters, or query examples.

---

## Body Examples for Tricky Endpoints

These endpoints need specific body structures that aren't obvious from the name alone.

| User asks | Endpoint | Key detail |
|---|---|---|
| "Create a channel" | `GetOrCreateChannel` | NOT CreateChannel. `--body '{"data":{"name":"My Channel","created_by_id":"admin"}}'` |
| "Create a 1-to-1 DM" | `GetOrCreateDistinctChannel` | ID auto-generated from member hash. `--body '{"members":{"user_ids":["user1","user2"]}}'` |
| "Add members to channel" | `UpdateChannel` | `--body '{"add_members":["user1","user2"]}'` |
| "Add channel moderators" | `UpdateChannel` | `--body '{"add_moderators":["user1"]}'` |
| "Search messages" | `Search` | `--body '{"payload":{"filter_conditions":{"type":"messaging"},"query":"hello","limit":10}}'` |
| "Send a message" / "Seed messages" | `SendMessage` | Mutating. Only run after explicit user request. `type=messaging id=<channel_id> --body '{"message":{"text":"Hello from Alex","user_id":"alex"}}'` |
| "Create/update users" | `UpdateUsers` | NOT CreateUser. `--body '{"users":{"john":{"id":"john","name":"John"}}}'` |
| "Create a call" | `GetOrCreateCall` | NOT CreateCall. |
| "Create a call with ringing" | `GetOrCreateCall` | `ring=true` + `data.members` in body |
| "Update call settings" | `UpdateCall` | `--body '{"settings_override":{"recording":{"mode":"auto_on"}}}'` |
| "Shadow ban a user" | `ban` | `shadow=true` flag |
| "Ban via review queue" | `submit_action` | `action_type=ban`, NOT the `ban` endpoint |
| "Create a post" | `AddActivity` | Must specify `feeds:["user:john"]` - target feeds required |
| "Follow a feed" | `Follow` | `source=timeline:john target=user:jane` - source follows target |
| "Get app settings" | `GetApp` | SDK endpoint (not AppRead). Auto-resolves org/app. |

## Filter & Sort Cookbook

All Query endpoints accept `filter_conditions` + `sort` + `limit` + `next`/`prev` (cursor pagination).

**Operators:** `$eq`, `$ne`, `$gt`, `$gte`, `$lt`, `$lte`, `$in`, `$nin`, `$exists`, `$and`, `$or`, `$autocomplete`, `$q`, `$contains`

**Sort syntax:** `"sort":[{"field":"created_at","direction":-1}]` - `-1` descending, `1` ascending

### QueryChannels
Fields: `type`, `id`, `cid`, `members`, `member_count`, `created_at`, `updated_at`, `last_message_at`, `frozen`, `disabled`, `created_by_id`, `filter_tags`, `has_unread`, `hidden`, `muted`, `joined`

```bash
# Channels where user is a member, newest messages first
stream api QueryChannels --body '{"filter_conditions":{"members":{"$in":["john"]}},"sort":[{"field":"last_message_at","direction":-1}],"limit":10}'

# Frozen channels
stream api QueryChannels --body '{"filter_conditions":{"frozen":true},"limit":20}'

# Combine filters with $and
stream api QueryChannels --body '{"filter_conditions":{"$and":[{"type":"messaging"},{"member_count":{"$gt":5}}]},"limit":10}'
```

### SendMessage

Use only after the user explicitly asks to send or seed messages. Discover endpoint help first, then run the mutating call.

```bash
stream --safe api SendMessage --help

stream api SendMessage type=messaging id=<channel_id> --body '{"message":{"text":"Hello from Alex","user_id":"alex"}}'
```

The `user_id` must belong to an existing user and should be a channel member for normal demo conversations.

### QueryUsers
Fields: `id`, `name`, `role`, `banned`, `shadow_banned`, `created_at`, `updated_at`, `last_active`, `teams`

```bash
# Autocomplete search
stream api QueryUsers --body '{"payload":{"filter_conditions":{"name":{"$autocomplete":"joh"}},"limit":10}}'

# Banned users
stream api QueryUsers --body '{"payload":{"filter_conditions":{"banned":true},"limit":10}}'
```

### QueryCalls
Fields: `id`, `type`, `cid`, `created_by_user_id`, `created_at`, `updated_at`, `starts_at`, `ended_at`, `ongoing`, `backstage`, `members`

```bash
# Last 10 calls, newest first
stream api QueryCalls --body '{"sort":[{"field":"created_at","direction":-1}],"limit":10}'

# Active calls only
stream api QueryCalls --body '{"filter_conditions":{"ongoing":true},"limit":10}'
```

---

## Endpoint reference

The full endpoint list is generated from OpenAPI specs and saved to `~/.stream/cache/API.md`. Read that file for endpoint discovery (names, descriptions, grouped by product).

**Regenerate if missing or stale:**
```bash
stream api --refresh
```

For parameter details on a specific endpoint:
```bash
stream --safe api <EndpointName> --help
```
