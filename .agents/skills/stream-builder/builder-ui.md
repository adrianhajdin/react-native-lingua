# Builder - UI shell and theme (Step 4)

Load when executing **Step 4** (after scaffold). Rules: the `stream` skill's [`RULES.md`](../stream/RULES.md) (login screen first, theme, reference authority).

### Step 4: Generate ALL code files
Write every file sequentially. Follow the UI Guidelines below for all visual styling. See **RULES.md > Reference authority** - reference files are the only source of truth for SDK wiring. Before writing each component, load the relevant `references/<Product>-blueprints.md` section.

#### Login Screen (required for every app - RULES.md > Login Screen first)

Centered card on a neutral background. No sidebar, no nav - just the login form.

**Layout (top to bottom, all centered inside the card):**
- App icon / logo
- App name (use-case label)
- Single `username` input (required, full card width)
- `Continue` primary button (no arrow glyph in label - see UI Guidelines > Button labels)
- Hint text below the button, in `text-muted-foreground text-sm`: "Open this URL in another tab with a different username to test multi-user features."

**Behavior:**
- Username input is **required**
- On submit: `GET /api/token?user_id={username}` -> store credentials in **React state** (not localStorage - each tab must be independent)
- After successful token fetch, render the main app UI (state gate, not redirect)
- App name / use-case label above the input

#### App Header (required for every app)

Once logged in, every app MUST show a persistent header bar:

- **Left:** App name (derived from use case)
- **Right:** Avatar circle (initial letter) + username + "Switch User" button
- "Switch User" clears all token/client state and returns to the Login Screen
- The header sits above all product UI (chat sidebar, video player, feed, etc.)

This ensures the developer always knows which user they are operating as.

---

## UI Guidelines

### Stack
- Next.js 16, Tailwind v4, TypeScript (match scaffold defaults).
- **Shadcn/ui with Base UI** - scaffolded via `shadcn init -t next -b base -p <preset>` (random preset per project - see builder.md Task A). Use Shadcn components (`Button`, `Input`, `Textarea`, `Card`, etc.) for all standard UI. Add more via `npx shadcn@latest add <component>` as needed.
- **Icons:** Use whichever icon package the scaffold installed (check `package.json`). If none present, `lucide-react` is installed during Step 3 Task C. Standard PascalCase imports:
  `import { Heart, Send, Bookmark, MoreHorizontal } from "lucide-react"`. If the project uses a different icon package (e.g. `@phosphor-icons/react`), use that one instead - do not mix icon packages.
- Tailwind utility classes for custom styling beyond Shadcn components - never inline styles.
- **Theme:** RULES.md > Theme - `next-themes` with system default (class-based dark mode, scaffolded automatically).
- `-webkit-font-smoothing: antialiased` on html (set by scaffold).

### Theme

Use whatever `globals.css` Shadcn generates. Do not add custom variables, custom themes, or dark mode overrides. The scaffold includes `next-themes` with `ThemeProvider` (system default, class-based toggle) - use it as-is.

### Design

Use Shadcn components, Tailwind utilities, and - if the user approved them in Step 3 Task A.2 - the frontend skills to build a polished UI. No further opinions; use your best judgement. Stream references provide structure and wiring; frontend skills (when present) provide generic design guidance.

### Button labels

**Never put arrow characters in button text** - no ASCII arrow sequences (like `->`, `>>`) and no unicode arrow glyphs (any codepoint that renders as an arrow or chevron) in the label. If a button needs an arrow visually, use a proper icon component (e.g. `lucide-react`'s `<ArrowRight />`, `<ChevronRight />`) rendered alongside the label. Otherwise, leave the label plain (e.g. `Continue`, not `Continue ->`).

### Stream SDK CSS & Providers

- **Chat:** Import `stream-chat-react/dist/css/index.css` (v14+; v13 used `dist/css/v2/index.css`). Use `useCreateChatClient` from `stream-chat-react` to instantiate. Match theme: `useTheme()` -> `str-chat__theme-dark` or `str-chat__theme-light` to `<Chat>`.
- **Video:** Import `@stream-io/video-react-sdk/dist/css/styles.css`. Instantiate `StreamVideoClient` with the canonical `useState` + `useEffect` pattern (NOT `useMemo` - see `references/VIDEO.md`).
- **Feeds:** No CSS import - headless SDK. Wrap app in `<StreamFeeds client={client}>`, then per-feed in `<StreamFeed feed={feed}>`. Use `useCreateFeedsClient()` for client creation - **gate rendering on `client !== null`** (returns `null` until connected). Call `feed.getOrCreate({ watch: true })` inside `setTimeout(50ms)` + `mounted` guard (strict mode protection) before passing to `<StreamFeed>`. See `references/FEEDS.md` for complete patterns.

**Provider hierarchy:** mount **all** Stream providers - `<Chat>`, `<StreamVideo>`, `<StreamFeeds>` - once at AppShell, in any order. Per-screen components render `<Channel>`, `<StreamCall>`, or `<StreamFeed>` from the existing root providers. **Never re-instantiate Stream clients per screen** - the cleanup of one screen's effect will disconnect a client another screen is still using. For multi-product apps, see [`references/CROSS-PRODUCT.md`](references/CROSS-PRODUCT.md) for the full skeleton.

### Moderation

**Never build moderation review UI in the app** (RULES.md > Moderation is Dashboard-only). All review happens in the [Stream Dashboard](https://beta.dashboard.getstream.io). The app's role is **CLI setup only** (blocklists, automod config in Step 3).

### Reference Blueprints

See RULES.md > Reference authority. Load `references/<Product>.md` (header) for setup + gotchas, and `references/<Product>-blueprints.md` for structure and wiring of each component. Load only the product(s) relevant to the current use case.
