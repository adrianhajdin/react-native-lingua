import { Lesson } from '@/types/learning';

export const LESSONS: Lesson[] = [
  // ─── Spanish ───────────────────────────────────────────────────────────────

  {
    id: 'es-lesson-1',
    unitId: 'es-unit-1',
    title: 'Hola! Greetings',
    description: 'Learn how to say hello and goodbye in Spanish',
    icon: '👋',
    xpReward: 10,
    goals: [
      { description: 'Learn 5 greeting words', xpReward: 5 },
      { description: 'Complete all activities', xpReward: 5 },
    ],
    vocabulary: [
      { word: 'Hola', translation: 'Hello', pronunciation: 'OH-lah', emoji: '👋' },
      { word: 'Adiós', translation: 'Goodbye', pronunciation: 'ah-DYOHS', emoji: '👋' },
      { word: 'Buenos días', translation: 'Good morning', pronunciation: 'BWEH-nohs DEE-ahs', emoji: '🌅' },
      { word: 'Buenas tardes', translation: 'Good afternoon', pronunciation: 'BWEH-nahs TAR-dehs', emoji: '☀️' },
      { word: 'Buenas noches', translation: 'Good night', pronunciation: 'BWEH-nahs NOH-chehs', emoji: '🌙' },
    ],
    phrases: [
      { text: '¿Cómo estás?', translation: 'How are you?', pronunciation: 'KOH-moh ehs-TAHS' },
      { text: 'Estoy bien, gracias.', translation: 'I am fine, thank you.', pronunciation: 'ehs-TOY BYEHN, GRAH-syahs' },
      { text: 'Mucho gusto.', translation: 'Nice to meet you.', pronunciation: 'MOO-choh GOOS-toh' },
    ],
    activities: [
      {
        id: 'es-lesson-1-act-1',
        type: 'multiple-choice',
        question: 'What does "Hola" mean?',
        correctAnswer: 'Hello',
        options: ['Hello', 'Goodbye', 'Thank you', 'Please'],
      },
      {
        id: 'es-lesson-1-act-2',
        type: 'multiple-choice',
        question: 'How do you say "Good morning" in Spanish?',
        correctAnswer: 'Buenos días',
        options: ['Buenas noches', 'Buenos días', 'Buenas tardes', 'Adiós'],
      },
      {
        id: 'es-lesson-1-act-3',
        type: 'translate',
        question: 'Translate: "Good night"',
        correctAnswer: 'Buenas noches',
        hint: 'Think about when you go to sleep.',
      },
      {
        id: 'es-lesson-1-act-4',
        type: 'multiple-choice',
        question: 'What does "¿Cómo estás?" mean?',
        correctAnswer: 'How are you?',
        options: ['How are you?', 'What is your name?', 'Where are you from?', 'Nice to meet you.'],
      },
    ],
    aiTeacherPrompt: {
      systemPrompt:
        'You are Luna, a warm and encouraging Spanish teacher. You are conducting a beginner audio lesson about Spanish greetings. Speak naturally and at a comfortable pace. Introduce each greeting clearly, repeat it twice, and ask the student to repeat after you. Give positive reinforcement. Keep the session fun and approachable. Focus only on: Hola, Adiós, Buenos días, Buenas tardes, Buenas noches, ¿Cómo estás?, and Mucho gusto.',
      introMessage:
        '¡Hola! I\'m Luna, your Spanish teacher. Today we\'re going to learn how to greet people in Spanish. Ready? Let\'s begin!',
      topics: ['greetings', 'farewells', 'time-of-day phrases', 'asking how someone is'],
    },
  },

  {
    id: 'es-lesson-2',
    unitId: 'es-unit-1',
    title: 'Introductions',
    description: 'Introduce yourself and ask for names',
    icon: '🙋',
    xpReward: 10,
    goals: [
      { description: 'Learn how to say your name', xpReward: 5 },
      { description: 'Ask someone else\'s name', xpReward: 5 },
    ],
    vocabulary: [
      { word: 'Me llamo', translation: 'My name is', pronunciation: 'meh YAH-moh', emoji: '🙋' },
      { word: 'Soy', translation: 'I am', pronunciation: 'SOY', emoji: '👤' },
      { word: 'Nombre', translation: 'Name', pronunciation: 'NOHM-breh', emoji: '🏷️' },
      { word: 'De', translation: 'From', pronunciation: 'DEH', emoji: '📍' },
      { word: 'Encantado/a', translation: 'Pleased to meet you', pronunciation: 'ehn-kahn-TAH-doh', emoji: '😊' },
    ],
    phrases: [
      { text: '¿Cómo te llamas?', translation: 'What is your name?', pronunciation: 'KOH-moh teh YAH-mahs' },
      { text: 'Me llamo Ana.', translation: 'My name is Ana.', pronunciation: 'meh YAH-moh AH-nah' },
      { text: '¿De dónde eres?', translation: 'Where are you from?', pronunciation: 'deh DOHN-deh EH-rehs' },
      { text: 'Soy de México.', translation: 'I am from Mexico.', pronunciation: 'SOY deh MEH-hee-koh' },
    ],
    activities: [
      {
        id: 'es-lesson-2-act-1',
        type: 'multiple-choice',
        question: 'How do you say "My name is" in Spanish?',
        correctAnswer: 'Me llamo',
        options: ['Me llamo', 'Soy de', 'Cómo te', 'Encantado'],
      },
      {
        id: 'es-lesson-2-act-2',
        type: 'multiple-choice',
        question: 'What does "¿Cómo te llamas?" mean?',
        correctAnswer: 'What is your name?',
        options: ['What is your name?', 'How are you?', 'Where are you from?', 'Nice to meet you.'],
      },
      {
        id: 'es-lesson-2-act-3',
        type: 'translate',
        question: 'Translate: "Where are you from?"',
        correctAnswer: '¿De dónde eres?',
        hint: 'You use "dónde" for where.',
      },
    ],
    aiTeacherPrompt: {
      systemPrompt:
        'You are Luna, a warm and encouraging Spanish teacher. You are conducting a beginner audio lesson about Spanish introductions. Help the student practice saying their name and asking others for theirs. Use simple sentences. Repeat phrases slowly and clearly. Encourage the student to respond out loud. Focus on: Me llamo, ¿Cómo te llamas?, Soy de, and ¿De dónde eres?',
      introMessage:
        '¡Hola de nuevo! Today we\'ll practice introducing ourselves in Spanish. I\'ll show you how to say your name and ask someone else for theirs. Let\'s go!',
      topics: ['introductions', 'saying your name', 'asking names', 'where you are from'],
    },
  },

  {
    id: 'es-lesson-3',
    unitId: 'es-unit-1',
    title: 'Numbers 1–10',
    description: 'Count from one to ten in Spanish',
    icon: '🔢',
    xpReward: 10,
    goals: [
      { description: 'Learn numbers 1 to 10', xpReward: 7 },
      { description: 'Complete all activities', xpReward: 3 },
    ],
    vocabulary: [
      { word: 'Uno', translation: '1 — One', pronunciation: 'OO-noh', emoji: '1️⃣' },
      { word: 'Dos', translation: '2 — Two', pronunciation: 'DOHS', emoji: '2️⃣' },
      { word: 'Tres', translation: '3 — Three', pronunciation: 'TREHS', emoji: '3️⃣' },
      { word: 'Cuatro', translation: '4 — Four', pronunciation: 'KWAH-troh', emoji: '4️⃣' },
      { word: 'Cinco', translation: '5 — Five', pronunciation: 'SEEN-koh', emoji: '5️⃣' },
      { word: 'Seis', translation: '6 — Six', pronunciation: 'SAYS', emoji: '6️⃣' },
      { word: 'Siete', translation: '7 — Seven', pronunciation: 'SYEH-teh', emoji: '7️⃣' },
      { word: 'Ocho', translation: '8 — Eight', pronunciation: 'OH-choh', emoji: '8️⃣' },
      { word: 'Nueve', translation: '9 — Nine', pronunciation: 'NWEH-beh', emoji: '9️⃣' },
      { word: 'Diez', translation: '10 — Ten', pronunciation: 'DYEHS', emoji: '🔟' },
    ],
    phrases: [
      { text: '¿Cuántos son?', translation: 'How many are there?', pronunciation: 'KWAHN-tohs SOHN' },
      { text: 'Son cinco.', translation: 'There are five.', pronunciation: 'SOHN SEEN-koh' },
    ],
    activities: [
      {
        id: 'es-lesson-3-act-1',
        type: 'multiple-choice',
        question: 'What is "cinco" in English?',
        correctAnswer: 'Five',
        options: ['Three', 'Four', 'Five', 'Six'],
      },
      {
        id: 'es-lesson-3-act-2',
        type: 'multiple-choice',
        question: 'How do you say "eight" in Spanish?',
        correctAnswer: 'Ocho',
        options: ['Siete', 'Nueve', 'Ocho', 'Seis'],
      },
      {
        id: 'es-lesson-3-act-3',
        type: 'translate',
        question: 'Translate: "Ten"',
        correctAnswer: 'Diez',
        hint: 'It sounds like "dyehs".',
      },
    ],
    aiTeacherPrompt: {
      systemPrompt:
        'You are Luna, a fun and enthusiastic Spanish teacher. You are conducting a beginner audio lesson about numbers 1 through 10 in Spanish. Say each number clearly, repeat it twice, and use simple counting exercises. Ask the student to count along with you. Keep energy high and celebrate every correct answer.',
      introMessage:
        '¡Hola! Today we\'re going to learn to count in Spanish — ¡uno, dos, tres! Follow along and say the numbers out loud with me.',
      topics: ['numbers 1-10', 'counting', 'how many'],
    },
  },

  // ─── French ────────────────────────────────────────────────────────────────

  {
    id: 'fr-lesson-1',
    unitId: 'fr-unit-1',
    title: 'Bonjour! Greetings',
    description: 'Learn everyday French greetings',
    icon: '👋',
    xpReward: 10,
    goals: [
      { description: 'Learn 5 French greetings', xpReward: 5 },
      { description: 'Complete all activities', xpReward: 5 },
    ],
    vocabulary: [
      { word: 'Bonjour', translation: 'Hello / Good day', pronunciation: 'bohn-ZHOOR', emoji: '☀️' },
      { word: 'Bonsoir', translation: 'Good evening', pronunciation: 'bohn-SWAHR', emoji: '🌙' },
      { word: 'Au revoir', translation: 'Goodbye', pronunciation: 'oh ruh-VWAHR', emoji: '👋' },
      { word: 'Salut', translation: 'Hi (informal)', pronunciation: 'sah-LÜ', emoji: '🙋' },
      { word: 'Merci', translation: 'Thank you', pronunciation: 'mehr-SEE', emoji: '🙏' },
    ],
    phrases: [
      { text: 'Comment allez-vous ?', translation: 'How are you? (formal)', pronunciation: 'koh-MAHN tah-lay-VOO' },
      { text: 'Ça va bien, merci.', translation: 'I\'m doing well, thank you.', pronunciation: 'sah VAH BYAHN, mehr-SEE' },
      { text: 'Enchanté(e).', translation: 'Nice to meet you.', pronunciation: 'ahn-shahn-TAY' },
    ],
    activities: [
      {
        id: 'fr-lesson-1-act-1',
        type: 'multiple-choice',
        question: 'What does "Bonjour" mean?',
        correctAnswer: 'Hello / Good day',
        options: ['Hello / Good day', 'Goodbye', 'Good evening', 'Thank you'],
      },
      {
        id: 'fr-lesson-1-act-2',
        type: 'multiple-choice',
        question: 'How do you say "Goodbye" in French?',
        correctAnswer: 'Au revoir',
        options: ['Bonjour', 'Salut', 'Au revoir', 'Merci'],
      },
      {
        id: 'fr-lesson-1-act-3',
        type: 'translate',
        question: 'Translate: "Thank you"',
        correctAnswer: 'Merci',
        hint: 'It ends with "-ci".',
      },
    ],
    aiTeacherPrompt: {
      systemPrompt:
        'You are Claire, a charming and patient French teacher. You are conducting a beginner audio lesson about French greetings. Pronounce each word with authentic French accent. Repeat each phrase twice. Ask the student to repeat after you. Be encouraging and warm. Focus on: Bonjour, Bonsoir, Au revoir, Salut, Merci, and Comment allez-vous.',
      introMessage:
        'Bonjour ! I\'m Claire, your French teacher. Today we\'re learning French greetings. French pronunciation can be a bit tricky at first, but I\'ll guide you every step of the way!',
      topics: ['greetings', 'farewells', 'politeness expressions', 'asking how someone is'],
    },
  },

  {
    id: 'fr-lesson-2',
    unitId: 'fr-unit-1',
    title: 'Introductions',
    description: 'Say your name and learn about others in French',
    icon: '🙋',
    xpReward: 10,
    goals: [
      { description: 'Say your name in French', xpReward: 5 },
      { description: 'Ask for someone\'s name', xpReward: 5 },
    ],
    vocabulary: [
      { word: 'Je m\'appelle', translation: 'My name is', pronunciation: 'zhuh mah-PELL', emoji: '🙋' },
      { word: 'Je suis', translation: 'I am', pronunciation: 'zhuh SWEE', emoji: '👤' },
      { word: 'De', translation: 'From', pronunciation: 'duh', emoji: '📍' },
      { word: 'Français(e)', translation: 'French', pronunciation: 'frahn-SAY', emoji: '🇫🇷' },
      { word: 'Enchanté(e)', translation: 'Pleased to meet you', pronunciation: 'ahn-shahn-TAY', emoji: '😊' },
    ],
    phrases: [
      { text: 'Comment vous appelez-vous ?', translation: 'What is your name? (formal)', pronunciation: 'koh-MAHN voo zah-play-VOO' },
      { text: 'Je m\'appelle Marie.', translation: 'My name is Marie.', pronunciation: 'zhuh mah-PELL mah-REE' },
      { text: 'D\'où venez-vous ?', translation: 'Where are you from?', pronunciation: 'doo vuh-nay-VOO' },
    ],
    activities: [
      {
        id: 'fr-lesson-2-act-1',
        type: 'multiple-choice',
        question: 'How do you say "My name is" in French?',
        correctAnswer: 'Je m\'appelle',
        options: ['Je suis', 'Je m\'appelle', 'Comment vous', 'D\'où venez'],
      },
      {
        id: 'fr-lesson-2-act-2',
        type: 'translate',
        question: 'Translate: "Where are you from?"',
        correctAnswer: 'D\'où venez-vous ?',
        hint: 'Starts with "D\'où".',
      },
    ],
    aiTeacherPrompt: {
      systemPrompt:
        'You are Claire, a charming and patient French teacher. You are conducting a beginner audio lesson about French introductions. Guide the student to say their name and ask for others\' names. Use formal and informal variations. Speak slowly and clearly. Focus on: Je m\'appelle, Comment vous appelez-vous, Je suis, and D\'où venez-vous.',
      introMessage:
        'Bonjour ! Today we\'ll practice introducing ourselves in French. I\'ll help you say your name the French way and have your first conversation!',
      topics: ['introductions', 'saying your name', 'asking names', 'where you are from'],
    },
  },

  // ─── Japanese ──────────────────────────────────────────────────────────────

  {
    id: 'ja-lesson-1',
    unitId: 'ja-unit-1',
    title: 'こんにちは — Greetings',
    description: 'Learn essential Japanese greetings',
    icon: '🎌',
    xpReward: 10,
    goals: [
      { description: 'Learn 5 Japanese greetings', xpReward: 5 },
      { description: 'Complete all activities', xpReward: 5 },
    ],
    vocabulary: [
      { word: 'こんにちは', translation: 'Hello', pronunciation: 'kon-ni-chi-wa', emoji: '👋' },
      { word: 'おはようございます', translation: 'Good morning', pronunciation: 'o-ha-yo go-zai-mas', emoji: '🌅' },
      { word: 'こんばんは', translation: 'Good evening', pronunciation: 'kon-ban-wa', emoji: '🌙' },
      { word: 'さようなら', translation: 'Goodbye', pronunciation: 'sa-yo-na-ra', emoji: '👋' },
      { word: 'ありがとう', translation: 'Thank you', pronunciation: 'a-ri-ga-to', emoji: '🙏' },
    ],
    phrases: [
      { text: 'お元気ですか？', translation: 'How are you?', pronunciation: 'o-gen-ki des-ka' },
      { text: '元気です、ありがとう。', translation: 'I\'m fine, thank you.', pronunciation: 'gen-ki des, a-ri-ga-to' },
      { text: 'はじめまして。', translation: 'Nice to meet you.', pronunciation: 'ha-ji-me-ma-shi-te' },
    ],
    activities: [
      {
        id: 'ja-lesson-1-act-1',
        type: 'multiple-choice',
        question: 'What does "こんにちは" mean?',
        correctAnswer: 'Hello',
        options: ['Hello', 'Goodbye', 'Good morning', 'Thank you'],
      },
      {
        id: 'ja-lesson-1-act-2',
        type: 'multiple-choice',
        question: 'How do you say "Good morning" in Japanese?',
        correctAnswer: 'おはようございます',
        options: ['こんにちは', 'おはようございます', 'こんばんは', 'さようなら'],
      },
      {
        id: 'ja-lesson-1-act-3',
        type: 'translate',
        question: 'Translate: "Thank you"',
        correctAnswer: 'ありがとう',
        hint: 'Pronounced "a-ri-ga-to".',
      },
    ],
    aiTeacherPrompt: {
      systemPrompt:
        'You are Yuki, a friendly and enthusiastic Japanese teacher. You are conducting a beginner audio lesson about Japanese greetings. Pronounce each word clearly in natural Japanese. Explain any cultural context briefly (e.g. bowing). Repeat each phrase twice and ask the student to repeat. Focus on: こんにちは, おはようございます, こんばんは, さようなら, ありがとう, and はじめまして.',
      introMessage:
        'こんにちは！I\'m Yuki, your Japanese teacher. Japanese might look different from languages you know, but don\'t worry — we\'ll take it step by step. Let\'s start with greetings!',
      topics: ['greetings', 'farewells', 'politeness', 'time-of-day phrases'],
    },
  },

  {
    id: 'ja-lesson-2',
    unitId: 'ja-unit-1',
    title: 'Self Introduction',
    description: 'Introduce yourself in Japanese',
    icon: '🙋',
    xpReward: 10,
    goals: [
      { description: 'Say your name in Japanese', xpReward: 5 },
      { description: 'Complete all activities', xpReward: 5 },
    ],
    vocabulary: [
      { word: 'わたしは', translation: 'I am / As for me', pronunciation: 'wa-ta-shi-wa', emoji: '👤' },
      { word: 'なまえ', translation: 'Name', pronunciation: 'na-ma-e', emoji: '🏷️' },
      { word: 'です', translation: 'Am / Is / Are (polite)', pronunciation: 'des', emoji: '✅' },
      { word: 'どうぞよろしく', translation: 'Please treat me well', pronunciation: 'do-zo yo-ro-shi-ku', emoji: '🤝' },
      { word: 'から来ました', translation: 'I came from', pronunciation: 'ka-ra ki-ma-shi-ta', emoji: '📍' },
    ],
    phrases: [
      { text: 'わたしは アナ です。', translation: 'I am Ana.', pronunciation: 'wa-ta-shi-wa A-na des' },
      { text: 'おなまえは？', translation: 'What is your name?', pronunciation: 'o-na-ma-e-wa' },
      { text: 'アメリカから来ました。', translation: 'I came from America.', pronunciation: 'A-me-ri-ka ka-ra ki-ma-shi-ta' },
    ],
    activities: [
      {
        id: 'ja-lesson-2-act-1',
        type: 'multiple-choice',
        question: 'How do you say "I am" in Japanese?',
        correctAnswer: 'わたしは',
        options: ['わたしは', 'なまえ', 'どうぞ', 'から'],
      },
      {
        id: 'ja-lesson-2-act-2',
        type: 'multiple-choice',
        question: 'What does "おなまえは？" mean?',
        correctAnswer: 'What is your name?',
        options: ['How are you?', 'Where are you from?', 'What is your name?', 'Nice to meet you.'],
      },
    ],
    aiTeacherPrompt: {
      systemPrompt:
        'You are Yuki, a friendly and encouraging Japanese teacher. You are conducting a beginner audio lesson about self-introductions in Japanese. Teach the student to say their name using the わたしは...です pattern. Pronounce clearly and slowly. Explain that です makes the sentence polite. Focus on: わたしは, です, おなまえは, and どうぞよろしく.',
      introMessage:
        'こんにちは！Today we\'re going to learn how to introduce ourselves in Japanese. I\'ll teach you a simple pattern you can use to tell people your name right away!',
      topics: ['self-introduction', 'saying your name', 'where you are from', 'polite expressions'],
    },
  },

  // ─── German ────────────────────────────────────────────────────────────────

  {
    id: 'de-lesson-1',
    unitId: 'de-unit-1',
    title: 'Hallo! Greetings',
    description: 'Learn how to greet people in German',
    icon: '👋',
    xpReward: 10,
    goals: [
      { description: 'Learn 5 German greetings', xpReward: 5 },
      { description: 'Complete all activities', xpReward: 5 },
    ],
    vocabulary: [
      { word: 'Hallo', translation: 'Hello', pronunciation: 'HAH-loh', emoji: '👋' },
      { word: 'Guten Morgen', translation: 'Good morning', pronunciation: 'GOO-ten MOR-gen', emoji: '🌅' },
      { word: 'Guten Abend', translation: 'Good evening', pronunciation: 'GOO-ten AH-bent', emoji: '🌙' },
      { word: 'Auf Wiedersehen', translation: 'Goodbye', pronunciation: 'owf VEE-der-zayn', emoji: '👋' },
      { word: 'Danke', translation: 'Thank you', pronunciation: 'DAHN-keh', emoji: '🙏' },
    ],
    phrases: [
      { text: 'Wie geht es Ihnen?', translation: 'How are you? (formal)', pronunciation: 'vee gayt es EE-nen' },
      { text: 'Mir geht es gut, danke.', translation: 'I\'m doing well, thank you.', pronunciation: 'meer gayt es GOOT, DAHN-keh' },
      { text: 'Schön, Sie kennenzulernen.', translation: 'Nice to meet you.', pronunciation: 'shern zee KEN-en-tsu-ler-nen' },
    ],
    activities: [
      {
        id: 'de-lesson-1-act-1',
        type: 'multiple-choice',
        question: 'What does "Guten Morgen" mean?',
        correctAnswer: 'Good morning',
        options: ['Good morning', 'Good evening', 'Goodbye', 'Hello'],
      },
      {
        id: 'de-lesson-1-act-2',
        type: 'multiple-choice',
        question: 'How do you say "Thank you" in German?',
        correctAnswer: 'Danke',
        options: ['Hallo', 'Bitte', 'Danke', 'Ja'],
      },
      {
        id: 'de-lesson-1-act-3',
        type: 'translate',
        question: 'Translate: "Goodbye"',
        correctAnswer: 'Auf Wiedersehen',
        hint: 'It literally means "until we see each other again".',
      },
    ],
    aiTeacherPrompt: {
      systemPrompt:
        'You are Max, a clear and friendly German teacher. You are conducting a beginner audio lesson about German greetings. Speak with proper German pronunciation. Point out any tricky sounds like the German "ch" or umlauts. Repeat each word twice and ask the student to repeat. Keep it approachable and fun. Focus on: Hallo, Guten Morgen, Guten Abend, Auf Wiedersehen, Danke, and Wie geht es Ihnen.',
      introMessage:
        'Hallo! I\'m Max, your German teacher. German can sound very different at first, but greetings are a great place to start. Let\'s jump in!',
      topics: ['greetings', 'farewells', 'time-of-day phrases', 'politeness'],
    },
  },

  {
    id: 'de-lesson-2',
    unitId: 'de-unit-1',
    title: 'Introductions',
    description: 'Say your name and meet new people in German',
    icon: '🙋',
    xpReward: 10,
    goals: [
      { description: 'Say your name in German', xpReward: 5 },
      { description: 'Ask for someone\'s name', xpReward: 5 },
    ],
    vocabulary: [
      { word: 'Ich heiße', translation: 'My name is', pronunciation: 'ikh HY-seh', emoji: '🙋' },
      { word: 'Ich bin', translation: 'I am', pronunciation: 'ikh BIN', emoji: '👤' },
      { word: 'Name', translation: 'Name', pronunciation: 'NAH-meh', emoji: '🏷️' },
      { word: 'Aus', translation: 'From', pronunciation: 'OWS', emoji: '📍' },
      { word: 'Freut mich', translation: 'Pleased to meet you', pronunciation: 'froyt mikh', emoji: '😊' },
    ],
    phrases: [
      { text: 'Wie heißen Sie?', translation: 'What is your name? (formal)', pronunciation: 'vee HY-sen zee' },
      { text: 'Ich heiße Thomas.', translation: 'My name is Thomas.', pronunciation: 'ikh HY-seh TOH-mas' },
      { text: 'Woher kommen Sie?', translation: 'Where are you from?', pronunciation: 'vo-HAYR KOM-en zee' },
      { text: 'Ich komme aus Deutschland.', translation: 'I come from Germany.', pronunciation: 'ikh KOM-eh ows DOYCH-lant' },
    ],
    activities: [
      {
        id: 'de-lesson-2-act-1',
        type: 'multiple-choice',
        question: 'How do you say "My name is" in German?',
        correctAnswer: 'Ich heiße',
        options: ['Ich bin', 'Ich heiße', 'Wie heißen', 'Freut mich'],
      },
      {
        id: 'de-lesson-2-act-2',
        type: 'multiple-choice',
        question: 'What does "Woher kommen Sie?" mean?',
        correctAnswer: 'Where are you from?',
        options: ['What is your name?', 'How are you?', 'Where are you from?', 'Nice to meet you.'],
      },
      {
        id: 'de-lesson-2-act-3',
        type: 'translate',
        question: 'Translate: "Pleased to meet you"',
        correctAnswer: 'Freut mich',
        hint: 'It\'s a short expression of pleasure.',
      },
    ],
    aiTeacherPrompt: {
      systemPrompt:
        'You are Max, a clear and friendly German teacher. You are conducting a beginner audio lesson about German introductions. Teach the student the difference between "Ich heiße" and "Ich bin" for saying their name. Keep explanations brief and practical. Repeat key phrases and encourage the student to say them aloud. Focus on: Ich heiße, Wie heißen Sie, Ich bin, Woher kommen Sie, and Freut mich.',
      introMessage:
        'Hallo wieder! Today we\'re going to practice introducing ourselves auf Deutsch — in German! You\'ll learn how to tell someone your name and find out theirs.',
      topics: ['introductions', 'saying your name', 'asking names', 'where you are from'],
    },
  },
];
