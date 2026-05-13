# Stream Chat React Native - llms.txt docs lookup

Use `llms.txt` manifests as the only docs entrypoint. Do not maintain direct page URLs in this skill. The manifest is an index, not the source: fetch the selected markdown page from the manifest before coding or making API-specific claims.

---

## Manifests

| Manifest | Use for |
|---|---|
| `https://getstream.io/chat/docs/sdk/react-native/llms.txt` | Primary source for Stream Chat React Native UI SDK: installation, packages, components, contexts, theming, customization, UI cookbook, offline, push, New Architecture, native handlers, migration guides. |
| `https://getstream.io/chat/docs/react-native/llms.txt` | Secondary source for low-level Chat API/client topics: tokens, users, channels, messages, query syntax, permissions, events, webhooks, push provider setup, imports/exports. |

The primary manifest should identify itself as the current React Native docs. If it does not, treat that as a docs-version problem and verify from the manifest title before continuing.

---

## Lookup workflow

1. Fetch the primary manifest.
2. Search manifest link text for the exact component, hook, guide, or feature name.
3. Fetch the selected markdown URL from the manifest.
4. Confirm the markdown page matches the current React Native UI SDK docs when doing UI SDK work.
5. Code from the fetched markdown page plus this skill's rules and blueprints.
6. If the primary manifest does not contain the topic and the request is low-level Chat API/client behavior, repeat the lookup in the secondary manifest.
7. If multiple titles match, prefer the exact component or guide title over generic `Overview` pages.

Do not code from the manifest list alone. Do not paste or rely on direct docs URLs outside the manifests.

Before installing, also verify current npm tags:

```bash
npm view stream-chat-react-native version dist-tags --json
npm view stream-chat-expo version dist-tags --json
```

Install `@latest` when the npm dist-tag matches the selected docs. If it does not, use the tag or exact version recommended by the manifest-selected installation page.

---

## Manifest search strategy

Do not maintain a feature-to-page table in this skill. The manifest is the live table of contents, and agents should search it at task time.

Build search terms from the current request and codebase:

1. Exact SDK symbols, packages, props, hooks, and component names already present in the prompt or code.
2. Exact user phrases for the requested feature or behavior.
3. Runtime words from the request or codebase when setup differs by runtime or architecture.
4. Broad domain words from the request only when exact terms do not hit.

Search order:

1. Search the primary manifest for exact symbols and exact phrases first.
2. If no exact result exists, search with split feature nouns from the user's request.
3. If several manifest entries match, fetch the two or three most relevant markdown pages and choose from their contents.
4. For cookbook or customization requests, find the current cookbook/customization entries in the primary manifest instead of assuming page names.
5. For low-level Chat API/client behavior, repeat the same search process in the secondary manifest only after deciding the UI SDK manifest is not the right source.
6. If neither manifest has a clear match, say the manifest has no exact match, fetch the closest overview or API page, and inspect installed package source only when code-level verification is still needed.

Do not convert these heuristics into a static mapping. If the docs add, rename, move, or split a page, the next agent should discover that from the manifest.

---

## Source selection

Use the primary manifest for React Native UI SDK work: package installation, providers, components, hooks, theming, customization, native handlers, offline UI behavior, push UI setup, migration, and cookbook-style UI recipes.

Use the secondary manifest for Chat API/client work: tokens, auth, users, channels, messages, reactions, query syntax, permissions, events, typing, webhooks, import/export, rate limits, and API errors.
