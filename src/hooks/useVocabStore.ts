import { useCallback, useEffect, useState } from 'react';
import { createSeedWords } from '../data/seedWords';
import {
  MasteryStatus,
  NewWordInput,
  StudyStats,
  VocabWord,
} from '../types/vocab';
import {
  addDaysToISO,
  applySpacedRepetition,
  getTodayISO,
} from '../utils/spacedRepetition';

const WORDS_STORAGE_KEY = 'vocabflow_words_v1';
const STATS_STORAGE_KEY = 'vocabflow_stats_v1';

function createInitialStats(): StudyStats {
  const today = getTodayISO();
  const yesterday = addDaysToISO(today, -1);
  const twoDaysAgo = addDaysToISO(today, -2);
  const threeDaysAgo = addDaysToISO(today, -3);

  return {
    streakDays: 3,
    lastActiveDate: yesterday,
    dailyGoal: 10,
    xp: 185,
    history: {
      [threeDaysAgo]: { date: threeDaysAgo, wordsStudied: 6, quizzesCompleted: 1 },
      [twoDaysAgo]: { date: twoDaysAgo, wordsStudied: 10, quizzesCompleted: 1 },
      [yesterday]: { date: yesterday, wordsStudied: 8, quizzesCompleted: 0 },
    },
  };
}

function loadStoredWords(): VocabWord[] {
  try {
    const raw = localStorage.getItem(WORDS_STORAGE_KEY);
    if (!raw) return createSeedWords();
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return createSeedWords();
  } catch {
    return createSeedWords();
  }
}

function loadStoredStats(): StudyStats {
  try {
    const raw = localStorage.getItem(STATS_STORAGE_KEY);
    if (!raw) return createInitialStats();
    const parsed = JSON.parse(raw) as StudyStats;
    if (parsed && typeof parsed.dailyGoal === 'number') {
      return parsed;
    }
    return createInitialStats();
  } catch {
    return createInitialStats();
  }
}

export function useVocabStore() {
  const [words, setWords] = useState<VocabWord[]>(loadStoredWords);
  const [stats, setStats] = useState<StudyStats>(loadStoredStats);

  useEffect(() => {
    try {
      localStorage.setItem(WORDS_STORAGE_KEY, JSON.stringify(words));
    } catch {
      // Ignore storage quota errors
    }
  }, [words]);

  useEffect(() => {
    try {
      localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(stats));
    } catch {
      // Ignore storage quota errors
    }
  }, [stats]);

  const bumpActivity = useCallback(
    (wordsDelta: number, xpDelta: number, quizDelta = 0) => {
      const today = getTodayISO();
      const yesterday = addDaysToISO(today, -1);

      setStats((prev) => {
        let nextStreak = prev.streakDays;
        if (prev.lastActiveDate !== today) {
          if (prev.lastActiveDate === yesterday) {
            nextStreak = prev.streakDays + 1;
          } else {
            nextStreak = 1;
          }
        }

        const existingToday = prev.history[today] ?? {
          date: today,
          wordsStudied: 0,
          quizzesCompleted: 0,
        };

        return {
          ...prev,
          streakDays: nextStreak,
          lastActiveDate: today,
          xp: prev.xp + xpDelta,
          history: {
            ...prev.history,
            [today]: {
              date: today,
              wordsStudied: existingToday.wordsStudied + wordsDelta,
              quizzesCompleted: existingToday.quizzesCompleted + quizDelta,
            },
          },
        };
      });
    },
    []
  );

  const recordCardReview = useCallback(
    (wordId: string, outcome: 'got_it' | 'needs_practice') => {
      const today = getTodayISO();
      setWords((prev) =>
        prev.map((w) =>
          w.id === wordId ? applySpacedRepetition(w, outcome, today) : w
        )
      );
      bumpActivity(1, outcome === 'got_it' ? 15 : 5, 0);
    },
    [bumpActivity]
  );

  const recordQuizAnswer = useCallback(
    (wordId: string, isCorrect: boolean) => {
      const today = getTodayISO();
      setWords((prev) =>
        prev.map((w) =>
          w.id === wordId
            ? applySpacedRepetition(
                w,
                isCorrect ? 'got_it' : 'needs_practice',
                today
              )
            : w
        )
      );
      bumpActivity(1, isCorrect ? 20 : 5, 0);
    },
    [bumpActivity]
  );

  const completeQuizSession = useCallback(
    (correctCount: number) => {
      bumpActivity(0, correctCount * 10 + 25, 1);
    },
    [bumpActivity]
  );

  const toggleBookmark = useCallback((wordId: string) => {
    setWords((prev) =>
      prev.map((w) =>
        w.id === wordId ? { ...w, isBookmarked: !w.isBookmarked } : w
      )
    );
  }, []);

  const setMasteryStatus = useCallback(
    (wordId: string, status: MasteryStatus) => {
      const today = getTodayISO();
      setWords((prev) =>
        prev.map((w) => {
          if (w.id !== wordId) return w;
          return {
            ...w,
            masteryStatus: status,
            repetitions: status === 'mastered' ? 3 : status === 'learning' ? 1 : 0,
            intervalDays: status === 'mastered' ? 14 : status === 'learning' ? 1 : 0,
            nextReviewDate:
              status === 'mastered' ? addDaysToISO(today, 14) : today,
          };
        })
      );
    },
    []
  );

  const addCustomWord = useCallback((input: NewWordInput): VocabWord => {
    const today = getTodayISO();
    const newWord: VocabWord = {
      id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      word: input.word.trim(),
      pronunciation: input.pronunciation.trim() || `/${input.word.trim().toLowerCase()}/`,
      partOfSpeech: input.partOfSpeech,
      definition: input.definition.trim(),
      exampleSentence: input.exampleSentence.trim(),
      synonym: input.synonym.trim() || '—',
      antonym: input.antonym.trim() || '—',
      category: input.category.trim() || 'Custom Deck',
      isCustom: true,
      isBookmarked: false,
      masteryStatus: 'new',
      repetitions: 0,
      intervalDays: 0,
      easeFactor: 2.5,
      nextReviewDate: today,
      timesCorrect: 0,
      timesIncorrect: 0,
    };

    setWords((prev) => [newWord, ...prev]);
    return newWord;
  }, []);

  const updateWord = useCallback((wordId: string, updates: Partial<NewWordInput>) => {
    setWords((prev) =>
      prev.map((w) =>
        w.id === wordId
          ? {
              ...w,
              ...(updates.word !== undefined ? { word: updates.word.trim() } : {}),
              ...(updates.pronunciation !== undefined
                ? { pronunciation: updates.pronunciation.trim() }
                : {}),
              ...(updates.partOfSpeech !== undefined
                ? { partOfSpeech: updates.partOfSpeech }
                : {}),
              ...(updates.definition !== undefined
                ? { definition: updates.definition.trim() }
                : {}),
              ...(updates.exampleSentence !== undefined
                ? { exampleSentence: updates.exampleSentence.trim() }
                : {}),
              ...(updates.synonym !== undefined
                ? { synonym: updates.synonym.trim() || '—' }
                : {}),
              ...(updates.antonym !== undefined
                ? { antonym: updates.antonym.trim() || '—' }
                : {}),
              ...(updates.category !== undefined
                ? { category: updates.category.trim() || 'Custom Deck' }
                : {}),
            }
          : w
      )
    );
  }, []);

  const deleteCustomWord = useCallback((wordId: string) => {
    setWords((prev) => prev.filter((w) => w.id !== wordId));
  }, []);

  const setDailyGoal = useCallback((dailyGoal: number) => {
    setStats((prev) => ({
      ...prev,
      dailyGoal: Math.max(1, Math.min(50, dailyGoal)),
    }));
  }, []);

  const resetProgress = useCallback(() => {
    setWords(createSeedWords());
    setStats(createInitialStats());
  }, []);

  return {
    words,
    stats,
    recordCardReview,
    recordQuizAnswer,
    completeQuizSession,
    toggleBookmark,
    setMasteryStatus,
    addCustomWord,
    updateWord,
    deleteCustomWord,
    setDailyGoal,
    resetProgress,
  };
}
