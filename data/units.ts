import { Unit } from '@/types/learning';

export const UNITS: Unit[] = [
  {
    id: 'es-unit-1',
    languageCode: 'es',
    title: 'Greetings & Basics',
    description: 'Start your Spanish journey with everyday phrases',
    order: 1,
    lessonIds: ['es-lesson-1', 'es-lesson-2', 'es-lesson-3'],
  },
  {
    id: 'fr-unit-1',
    languageCode: 'fr',
    title: 'Bonjour! Greetings',
    description: 'Learn how to greet and introduce yourself in French',
    order: 1,
    lessonIds: ['fr-lesson-1', 'fr-lesson-2'],
  },
  {
    id: 'ja-unit-1',
    languageCode: 'ja',
    title: 'はじめまして — First Steps',
    description: 'Learn essential Japanese phrases for meeting people',
    order: 1,
    lessonIds: ['ja-lesson-1', 'ja-lesson-2'],
  },
  {
    id: 'de-unit-1',
    languageCode: 'de',
    title: 'Hallo! German Basics',
    description: 'Master everyday German greetings and introductions',
    order: 1,
    lessonIds: ['de-lesson-1', 'de-lesson-2'],
  },
];
