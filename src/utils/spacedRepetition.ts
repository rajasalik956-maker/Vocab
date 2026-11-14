import { MasteryStatus, VocabWord } from '../types/vocab';

export function getTodayISO(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function addDaysToISO(baseISO: string, days: number): string {
  const [y, m, d] = baseISO.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function isDueForReview(word: VocabWord, todayISO = getTodayISO()): boolean {
  if (word.masteryStatus === 'new') return false;
  if (word.masteryStatus === 'learning') {
    return word.nextReviewDate <= todayISO;
  }
  return word.nextReviewDate <= todayISO;
}

export function applySpacedRepetition(
  word: VocabWord,
  outcome: 'got_it' | 'needs_practice',
  todayISO = getTodayISO()
): VocabWord {
  if (outcome === 'needs_practice') {
    return {
      ...word,
      masteryStatus: 'learning',
      repetitions: 0,
      intervalDays: 1,
      easeFactor: Math.max(1.3, Number((word.easeFactor - 0.2).toFixed(2))),
      nextReviewDate: todayISO, // Keep due today for immediate reinforcement
      lastReviewedAt: new Date().toISOString(),
      timesIncorrect: word.timesIncorrect + 1,
    };
  }

  // outcome === 'got_it'
  const nextReps = word.repetitions + 1;
  let nextInterval = 1;
  if (nextReps === 1) {
    nextInterval = 1;
  } else if (nextReps === 2) {
    nextInterval = 3;
  } else {
    nextInterval = Math.min(30, Math.round(word.intervalDays * word.easeFactor));
  }

  const nextStatus: MasteryStatus = nextReps >= 2 ? 'mastered' : 'learning';

  return {
    ...word,
    masteryStatus: nextStatus,
    repetitions: nextReps,
    intervalDays: nextInterval,
    easeFactor: Math.min(2.8, Number((word.easeFactor + 0.08).toFixed(2))),
    nextReviewDate: addDaysToISO(todayISO, nextInterval),
    lastReviewedAt: new Date().toISOString(),
    timesCorrect: word.timesCorrect + 1,
  };
}

export function getLast7Days(): { date: string; label: string; isToday: boolean }[] {
  const today = getTodayISO();
  const days: { date: string; label: string; isToday: boolean }[] = [];
  const weekdayFormatter = new Intl.DateTimeFormat('en-US', { weekday: 'short' });

  for (let i = -6; i <= 0; i++) {
    const iso = addDaysToISO(today, i);
    const [y, m, d] = iso.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    days.push({
      date: iso,
      label: weekdayFormatter.format(dateObj),
      isToday: iso === today,
    });
  }
  return days;
}

export function maskWordInSentence(sentence: string, word: string): string {
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`\\b${escaped}[a-z]*\\b`, 'gi');
  if (regex.test(sentence)) {
    return sentence.replace(regex, '________');
  }
  return `${sentence} (Missing word: ________)`;
}

export function speakWord(text: string): boolean {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return false;
  }
  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.92;
    window.speechSynthesis.speak(utterance);
    return true;
  } catch {
    return false;
  }
}
