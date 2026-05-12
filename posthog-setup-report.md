<wizard-report>
# PostHog post-wizard report

The wizard has completed a deep integration of PostHog analytics into the Lingua language learning app (Expo / React Native). Here is a summary of every change made:

- **`app.config.js`** — Created to replace `app.json` as the Expo config, adding an `extra` block that reads `POSTHOG_PROJECT_TOKEN` and `POSTHOG_HOST` from environment variables and exposes them to the app via `expo-constants`.
- **`.env`** — Created with `POSTHOG_PROJECT_TOKEN` and `POSTHOG_HOST` values (covered by `.gitignore`).
- **`lib/posthog.ts`** — New PostHog client module. Reads credentials from `Constants.expoConfig.extra`, disables analytics if the token is not configured, enables lifecycle event capture, debug logging in dev, and optimised batching settings.
- **`app/_layout.tsx`** — Wrapped the app tree with `<PostHogProvider>` (autocapture touches on, manual screen tracking). Added a `useEffect` that calls `posthog.screen(pathname)` on every Expo Router navigation to track screen views.
- **`app/onboarding.tsx`** — Captures `onboarding_get_started_tapped` when the user presses the CTA.
- **`app/(auth)/sign-up.tsx`** — Captures `sign_up_submitted`, `sign_up_completed`, `sign_up_sso_started`, and `$exception` on errors. Calls `posthog.identify(createdUserId)` with `sign_up_date` on completion.
- **`app/(auth)/sign-in.tsx`** — Captures `sign_in_submitted`, `sign_in_completed`, `sign_in_sso_started`, and `$exception` on errors. Calls `posthog.identify(createdUserId)` on successful sign-in.
- **`app/language-select.tsx`** — Captures `language_selected` with `language_code` property when the user confirms their language.
- **`app/(tabs)/index.tsx`** — Captures `continue_learning_tapped` with `language_code`, `unit_order`, `xp_today`, and `streak` properties.
- **`app/(tabs)/ai-teacher.tsx`** — Captures `ai_teacher_viewed` on mount.
- **`app/(tabs)/chat.tsx`** — Captures `chat_viewed` on mount.

## Events instrumented

| Event | Description | File |
|---|---|---|
| `onboarding_get_started_tapped` | User taps the 'Get Started' CTA on the onboarding screen — top of the conversion funnel | `app/onboarding.tsx` |
| `sign_up_submitted` | User submits the sign-up form with email and password | `app/(auth)/sign-up.tsx` |
| `sign_up_completed` | User successfully verifies their email and completes account creation | `app/(auth)/sign-up.tsx` |
| `sign_up_sso_started` | User initiates SSO sign-up via Google, Facebook, or Apple | `app/(auth)/sign-up.tsx` |
| `sign_in_submitted` | User submits the sign-in form with their email address | `app/(auth)/sign-in.tsx` |
| `sign_in_completed` | User successfully verifies their email code and signs in | `app/(auth)/sign-in.tsx` |
| `sign_in_sso_started` | User initiates SSO sign-in via Google, Facebook, or Apple | `app/(auth)/sign-in.tsx` |
| `language_selected` | User confirms their chosen language on the language selection screen | `app/language-select.tsx` |
| `continue_learning_tapped` | User taps the 'Continue' button on the home screen's continue-learning card | `app/(tabs)/index.tsx` |
| `ai_teacher_viewed` | User navigates to the AI Teacher tab — entry point for AI-assisted lessons | `app/(tabs)/ai-teacher.tsx` |
| `chat_viewed` | User navigates to the Chat tab — entry point for conversation practice | `app/(tabs)/chat.tsx` |

## Next steps

We've built a dashboard and five insights for you to keep an eye on user behavior, based on the events we just instrumented:

- [Analytics basics dashboard](/project/177300/dashboard/675192)
- [Onboarding → Sign-Up Conversion Funnel](/project/177300/insights/z3gaemD5)
- [Sign-Up Method Breakdown](/project/177300/insights/6TM6srd6)
- [Language Selection — Most Popular Languages](/project/177300/insights/sHcInUG5)
- [Daily Engagement — Key Tab Views](/project/177300/insights/4KHZoSzN)
- [New Users — Sign-Ups vs Sign-Ins Over Time](/project/177300/insights/SIMnOGNj)

### Agent skill

We've left an agent skill folder in your project. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

</wizard-report>
