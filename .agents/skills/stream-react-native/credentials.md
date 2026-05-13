# Stream React Native - credentials, token, and demo data

Run this once per session for tracks A, B, and D before writing connected Chat code or creating requested demo data. Track C does not need credentials.

## Goal

Collect the Stream API key, user id, user token, and optional demo data so the app can connect to real Chat data on first run. For a brand-new app, scaffolding may happen before this file if the runtime or target directory must be resolved first.

This flow uses the **`stream`** CLI (binary name `stream`). It is the same CLI used by [`../stream-cli`](../stream-cli/SKILL.md). If the CLI is missing, use [`../stream-cli/bootstrap.md`](../stream-cli/bootstrap.md) for the install flow.

## Single upfront question (ask exactly once, then act immediately)

Post one message asking all relevant things together. Do not split into multiple rounds:

> To wire Chat RN with real data, I need a few quick answers:
>
> 1. **Credentials** - Should I fetch your API key via the Stream CLI and generate a token, or will you paste them yourself?
> 2. **User** - What user id and display name should the app connect as?
> 3. **Token expiry** - If I am generating the token: should it expire? (for example `1h`, `1d`, `30m`) or never expire?
> 4. **Demo data** - Do you want me to create demo channels? If you want more demo data, say whether to add demo users and messages too.
>
> If you want to handle credentials yourself, paste your API key and token and tell me whether to create demo data.

## After the user replies - act without further prompting

Once the user answers, execute the needed CLI steps in sequence without pausing between them. Narrate each step briefly, but do not ask "shall I continue?" between steps. Demo data calls are mutating; run them only when the user asked for them.

### Step A0 - Confirm CLI install and auth

Detect the binary:

```bash
command -v stream
```

If `stream` does not resolve, follow [`../stream-cli/bootstrap.md`](../stream-cli/bootstrap.md). Ask for explicit approval before installing. Do not continue until `command -v stream` resolves, unless the user chooses to paste API key and token manually.

Verify auth with a cheap read:

```bash
stream --safe api OrganizationRead
```

- Exit 0 -> authenticated, proceed.
- Exit 2 -> run `stream auth login` as its own terminal invocation, per [`../stream/RULES.md`](../stream/RULES.md) > CLI safety.
- Exit 4 -> run `stream api --refresh`, then retry.
- Other exit -> report the error and fall back to pasted credentials.

### Step A - API key

If the user wants CLI-based credentials, read the configured app:

```bash
stream --safe api GetApp
```

Extract the `api_key` field and hold it in context. If the wrong app is selected, list apps or set the default using the Stream CLI flow from `stream-cli`; then re-run `GetApp`.

If the user pastes an API key, hold it in context and skip this step.

### Step B - Token

Generate a token for the chosen user id. `stream token` accepts a duration string; omit `--ttl` for a never-expiring local dev token.

```bash
# Never-expiring local dev token
stream token <user_id>

# Expiring token
stream token <user_id> --ttl 1h
```

Hold the token in context for code edits. Do not print it in summaries.

If the user pastes a token, hold it in context and skip generation.

### Step C - Demo data (only if the user asked)

Create 3 to 5 channels with realistic usernames. Use `messaging` as the channel type. The connected user must be a member of at least one demo channel, or `ChannelList` will render empty.

These calls are mutating. Announce briefly:

> Creating requested demo data with mutating Stream API calls now.

Route demo data through [`../stream-cli/SKILL.md`](../stream-cli/SKILL.md) and [`../stream-cli/cli-cookbook.md`](../stream-cli/cli-cookbook.md). Keep the CLI safe-mode-first rule for endpoint discovery and only run mutating calls after the user's explicit demo-data request.

#### C1 - Create user records

User records must exist before channel membership can be added. Create the token user and demo users in one `UpdateUsers` batch:

```bash
stream api UpdateUsers --body '{"users":{"<token_user_id>":{"id":"<token_user_id>","name":"Token User"},"alice":{"id":"alice","name":"Alice"},"bob":{"id":"bob","name":"Bob"},"carol":{"id":"carol","name":"Carol"}}}'
```

Use the user's chosen display name for `<token_user_id>`.

#### C2 - Create each channel with members

Use `GetOrCreateChannel`. Put membership in `data.members` as objects with `user_id`.

```bash
stream api GetOrCreateChannel type=messaging id=general --body '{"data":{"name":"General","created_by_id":"<token_user_id>","members":[{"user_id":"<token_user_id>"},{"user_id":"alice"},{"user_id":"bob"}]}}'
```

Generate short channel ids such as `general`, `random`, `team-alpha`. Make sure the token user appears in `data.members`.

After creating demo channels, summarize without secrets:

> Created channels: `general` (<token_user_id>, alice, bob), `random` (<token_user_id>, carol), `team-alpha` (<token_user_id>, alice)

#### C3 - Send demo messages (only if the user asked for messages or more demo data)

Use `SendMessage` through the Stream CLI cookbook. Each message's `user_id` must belong to an existing user.

```bash
stream api SendMessage type=messaging id=<channel_id> --body '{"message":{"text":"Hello from Alex","user_id":"alex"}}'
```

Do not send demo messages when the user only asked for credentials or channels.

### Step D - Proceed automatically

After credentials and requested demo data succeed, return to [`SKILL.md`](SKILL.md) and continue into [`builder.md`](builder.md). No additional prompt is needed.

When generating a local demo form, prefill the editable API key, token, user, and channel values from this flow by default. Do not print user tokens in final summaries.

If any CLI step fails and cannot be recovered, ask the user to paste the missing API key or token manually before editing code.

## What NOT to do

- Never put the API secret in app code, Expo config, native files, or chat.
- Never invent credentials.
- Never ask "should I continue?" between Step A, B, C, and D after the upfront answers.
- Never use `CreateChannel`; use `GetOrCreateChannel`.
- Never use `CreateUser`; use `UpdateUsers`.
- Never assume `created_by_id` adds a member. Membership must be set through `data.members`.
- Never pass bare user id strings as channel members. Use `[{"user_id":"alice"}]`.
- Never put channel members at the top level of the `GetOrCreateChannel` body.
