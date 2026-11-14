export type MasteryStatus = 'new' | 'learning' | 'mastered';

export type PartOfSpeech =
  | 'Noun'
  | 'Verb'
  | 'Adjective'
  | 'Adverb'
  | 'Other';

export const PRESET_CATEGORIES = [
  'GRE High-Frequency',
  'Literary & Advanced',
  'Science & Tech',
  'SAT Essentials',
] as const;

export type PresetCategory = (typeof PRESET_CATEGORIES)[number];

export interface VocabWord {
  id: string;
  word: string;
  pronunciation: string;
  partOfSpeech: PartOfSpeech;
  definition: string;
  exampleSentence: string;
  synonym: string;
  antonym: string;
  category: string;
  isCustom: boolean;
  isBookmarked: boolean;
  masteryStatus: MasteryStatus;
  repetitions: number;
  intervalDays: number;
  easeFactor: number;
  nextReviewDate: string; // YYYY-MM-DD
  lastReviewedAt?: string;
  timesCorrect: number;
  timesIncorrect: number;
}

export interface DailyActivity {
  date: string; // YYYY-MM-DD
  wordsStudied: number;
  quizzesCompleted: number;
}

export interface StudyStats {
  streakDays: number;
  lastActiveDate: string | null; // YYYY-MM-DD
  dailyGoal: number;
  xp: number;
  history: Record<string, DailyActivity>;
}

export type ActiveView = 'dashboard' | 'flashcards' | 'quiz' | 'library';

export type FlashcardStudyMode = 'review' | 'new' | 'all' | 'bookmarked';

export type QuizQuestionType = 'definition' | 'context' | 'synonym';

export interface QuizQuestion {
  id: string;
  wordId: string;
  targetWord: VocabWord;
  type: QuizQuestionType;
  prompt: string;
  contextSentence?: string;
  options: string[];
  correctAnswer: string;
}

export interface NewWordInput {
  word: string;
  pronunciation: string;
  partOfSpeech: PartOfSpeech;
  definition: string;
  exampleSentence: string;
  synonym: string;
  antonym: string;
  category: string;
}
