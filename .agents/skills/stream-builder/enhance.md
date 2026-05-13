# Enhance an existing app (Track E)

For adding Stream products to an **existing Next.js project**. Reuses the references files and SDK patterns from the scaffold flow but skips the scaffold entirely.

**Rules:** the `stream` skill's [`RULES.md`](../stream/RULES.md) (secrets, no auto-seeding, login screen first, package manager).
**Preflight:** hand off to the `stream-cli` skill before any npm installs, `stream api` setup, or token routes - it owns install, credentials, and auth. Wait for its `OK` readout, then continue here. Do not inline-read its files; the hand-off primes its endpoint cache + cookbook for any ad-hoc query you need later (RULES.md > CLI safety).
**SDK wiring (shared with the scaffold flow):** [`sdk.md`](sdk.md) and the relevant [`references/<Product>.md`](references/) - enhance uses the same wiring patterns as scaffold; only the surrounding setup differs.

---

## E1: Audit the existing project

Before writing any code, understand what's already in place:

1. **Packages:** check `package.json` for `stream-chat`, `stream-chat-react`, `@stream-io/video-react-sdk`, `@stream-io/node-sdk`.
2. **Auth:** does the app already have a `/api/token` route? If so, **extend** it with the new product's token - don't create a second token route.
3. **Credentials:** check for `.env` with `STREAM_API_KEY` / `STREAM_API_SECRET`. If missing, hand off to the `stream-cli` skill to resolve them (it runs `stream env` against the active app), then resume here.
4. **UI framework:** confirm Tailwind, Shadcn, or whatever the project uses. Do **not** install Shadcn or change the styling setup unless the user asks.
5. **Directory structure:** note whether the project uses `app/` or `src/app/` - match the existing convention.

## E2: Install + configure

1. **Install** only the new SDKs: `npm install <new-packages> --legacy-peer-deps` (the `stream` skill's [`RULES.md`](../stream/RULES.md) > Package manager).
2. **Configure via CLI:** run setup commands from the relevant `references/<Product>.md` (App Integration -> Setup). Feeds needs feed groups created; Moderation needs blocklist + config.
3. **Import CSS** if the product needs it (Chat: `stream-chat-react/dist/css/v2/index.css`, Video: `@stream-io/video-react-sdk/dist/css/styles.css`).

## E3: Integrate

1. **Token route:** extend the existing `/api/token` to return the new product's token alongside existing ones. Follow [`sdk.md`](sdk.md) for server-side instantiation patterns.
2. **API routes:** add product-specific routes from `references/<Product>.md` (App Integration -> API Routes). Feeds needs several (`/api/feed/get`, `/api/feed/post`, etc.); Chat and Video typically only need the token route.
3. **Components:** load the relevant `references/<Product>-blueprints.md` sections and build components using the existing project's patterns and styling conventions - not the [`builder-ui.md`](builder-ui.md) defaults.
4. **State:** if the app already manages user state (auth context, session), wire Stream tokens into that - don't add a separate Login Screen unless the app has no auth.

## E4: Verify

```bash
npx tsc --noEmit
npx next build
```

Fix any errors.

---

## Key constraints

- Do **not** re-scaffold, re-initialize Shadcn, install frontend skills, or modify `globals.css` / `layout.tsx`.
- Do **not** overwrite or restructure existing files - add new files alongside them.
- Do **not** change the existing auth flow. Adapt Stream's token generation to fit the app's existing auth, not the other way around.
- If the project uses a different package manager (yarn, pnpm), match what it already uses - the npm-only rule applies to new scaffolds, not existing projects.
