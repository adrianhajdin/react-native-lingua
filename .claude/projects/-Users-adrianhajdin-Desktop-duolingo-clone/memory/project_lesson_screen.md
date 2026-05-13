---
name: Lesson Screen Implementation
description: Learn tab screen showing unit lessons with status indicators; LessonCard component; extended lesson data
type: project
---

Implemented the Lessons screen (app/(tabs)/learn.tsx) and the audio lesson screen (app/lesson/[id].tsx).

**Why:** Feature prompts 11-lesson-ui.md and 12-audio-lesson-ui.md — replicate designs exactly with real data.

**How to apply:** LessonCard.onPress now routes to /lesson/[id]. The audio lesson screen is the next logical UI step; future AI/audio integration builds on it.

Key decisions (learn.tsx):
- Extended fr/ja/de from 2 → 5 lessons each (fr-lesson-3..5, ja-lesson-3..5, de-lesson-3..5) and updated units.ts
- LessonCard extracted to components/LessonCard.tsx
- Lesson status: completed = green checkmark, in-progress = purple card + Picsum thumbnail, not-started = plain card
- Hero uses images.palace + images.mascotWelcome overlay
- Tabs (Lessons/Practice) are visual-only; Practice tab does nothing yet

Key decisions (app/lesson/[id].tsx):
- Audio-only experience: no real video, camera button is visual-only
- Fox mascot (images.mascotWelcome) fills the call area background
- Human teacher thumbnail uses Picsum seeded by lesson id
- Teacher intro message comes from lesson.aiTeacherPrompt.introMessage (currently shows static "¡Muy bien!" placeholder)
- Mic toggle, subtitles toggle are local state; End Call navigates back
- Session feedback (Speaking/Pronunciation/Grammar) is static mock UI
- Stack.Screen name="lesson" added to app/_layout.tsx
