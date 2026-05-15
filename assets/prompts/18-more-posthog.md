Read AGENTS.md first and follow it strictly.

Add PostHog event tracking to the existing app using the PostHog instance already initialized in lib/posthog.ts. Do not reinitialize PostHog and do not change the existing PostHogProvider setup.

User identification:

- After Clerk authentication completes (sign-in or sign-up), call posthog.identify() with the Clerk user's id as distinctId.
- On the first identify call after sign-up, set user properties: signup_date (current ISO date, via $set_once) and preferred_language (the language the user selected during onboarding, or null if not yet selected).
- On every subsequent identify, update preferred_language if it has changed.

Three custom events, captured at these moments:

1. language_selected — fires when the user confirms their language on the language selection screen.
   Properties: { language_code: string, language_name: string }

2. lesson_started — fires when the lesson screen mounts and the user begins the lesson.
   Properties: { lesson_id: string, language: string, lesson_number: number }

4. lesson_abandoned — fires when the user exits a lesson before lesson_completed fires (back navigation, screen unmount before completion).
   Properties: { lesson_id: string, time_into_lesson_seconds: number, last_question_index: number }


Implementation rules:
- Track lesson start time with a ref captured on mount so duration_seconds is accurate.
- Do not modify any UI.
- Do not expose any keys; PostHog is already configured via environment variables.
