import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, PanInfo } from 'motion/react';
import {
  ArrowLeft,
  Bookmark,
  Check,
  CheckCircle2,
  GraduationCap,
  RefreshCw,
  RotateCcw,
  Sparkles,
  Volume2,
} from 'lucide-react';
import { FlashcardStudyMode, VocabWord } from '../types/vocab';
import {
  getTodayISO,
  isDueForReview,
  speakWord,
} from '../utils/spacedRepetition';

interface FlashcardsViewProps {
  words: VocabWord[];
  initialMode: FlashcardStudyMode;
  initialCategory: string;
  customFocusIds?: string[] | null;
  onClearFocusIds: () => void;
  onRecordReview: (wordId: string, outcome: 'got_it' | 'needs_practice') => void;
  onToggleBookmark: (wordId: string) => void;
  onStartQuizFromDeck: (category: string) => void;
  onBackToDashboard: () => void;
}

const MODE_LABELS: { id: FlashcardStudyMode; label: string }[] = [
  { id: 'review', label: 'Daily Review' },
  { id: 'new', label: 'New Words' },
  { id: 'bookmarked', label: 'Bookmarked' },
  { id: 'all', label: 'All Words' },
];

function highlightTerm(sentence: string, word: string) {
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(\\b${escaped}[a-z]*\\b)`, 'gi');
  const parts = sentence.split(regex);
  return parts.map((part, idx) =>
    regex.test(part) ? (
      <span
        key={idx}
        className="font-semibold text-indigo-700 underline decoration-indigo-300 underline-offset-4"
      >
        {part}
      </span>
    ) : (
      <span key={idx}>{part}</span>
    )
  );
}

export function FlashcardsView({
  words,
  initialMode,
  initialCategory,
  customFocusIds,
  onClearFocusIds,
  onRecordReview,
  onToggleBookmark,
  onStartQuizFromDeck,
  onBackToDashboard,
}: FlashcardsViewProps) {
  const [mode, setMode] = useState<FlashcardStudyMode>(initialMode);
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [deckIds, setDeckIds] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [swipeFeedback, setSwipeFeedback] = useState<'got_it' | 'needs_practice' | null>(null);
  const [sessionStats, setSessionStats] = useState<{
    gotIt: number;
    needsPracticeIds: string[];
    xpEarned: number;
  }>({ gotIt: 0, needsPracticeIds: [], xpEarned: 0 });
  const [isComplete, setIsComplete] = useState(false);

  const categories = useMemo(
    () => ['All Categories', ...Array.from(new Set(words.map((w) => w.category)))],
    [words]
  );

  const buildDeck = useCallback(
    (
      targetMode: FlashcardStudyMode,
      targetCategory: string,
      overrideIds?: string[] | null
    ) => {
      const today = getTodayISO();
      let filtered = words;

      if (overrideIds && overrideIds.length > 0) {
        filtered = words.filter((w) => overrideIds.includes(w.id));
      } else {
        if (targetCategory !== 'All Categories') {
          filtered = filtered.filter((w) => w.category === targetCategory);
        }

        if (targetMode === 'review') {
          const dueOrLearning = filtered.filter(
            (w) => isDueForReview(w, today) || w.masteryStatus === 'learning'
          );
          filtered = dueOrLearning;
        } else if (targetMode === 'new') {
          filtered = filtered.filter((w) => w.masteryStatus === 'new');
        } else if (targetMode === 'bookmarked') {
          filtered = filtered.filter((w) => w.isBookmarked);
        }
      }

      setDeckIds(filtered.map((w) => w.id));
      setCurrentIndex(0);
      setIsFlipped(false);
      setIsComplete(false);
      setSwipeFeedback(null);
      setSessionStats({ gotIt: 0, needsPracticeIds: [], xpEarned: 0 });
    },
    [words]
  );

  useEffect(() => {
    setMode(initialMode);
    setSelectedCategory(initialCategory);
    buildDeck(initialMode, initialCategory, customFocusIds);
    // Only rebuild when explicit entry parameters change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialMode, initialCategory, customFocusIds]);

  const activeDeckWords = useMemo(() => {
    const wordMap = new Map(words.map((w) => [w.id, w]));
    return deckIds
      .map((id) => wordMap.get(id))
      .filter((w): w is VocabWord => Boolean(w));
  }, [deckIds, words]);

  const currentWord = activeDeckWords[currentIndex] ?? null;

  const handleModeChange = (nextMode: FlashcardStudyMode) => {
    onClearFocusIds();
    setMode(nextMode);
    buildDeck(nextMode, selectedCategory, null);
  };

  const handleCategoryChange = (nextCat: string) => {
    onClearFocusIds();
    setSelectedCategory(nextCat);
    buildDeck(mode, nextCat, null);
  };

  const handleOutcome = useCallback(
    (outcome: 'got_it' | 'needs_practice') => {
      if (!currentWord || isComplete) return;
      onRecordReview(currentWord.id, outcome);

      setSessionStats((prev) => ({
        gotIt: outcome === 'got_it' ? prev.gotIt + 1 : prev.gotIt,
        needsPracticeIds:
          outcome === 'needs_practice'
            ? [...prev.needsPracticeIds, currentWord.id]
            : prev.needsPracticeIds,
        xpEarned: prev.xpEarned + (outcome === 'got_it' ? 15 : 5),
      }));

      setSwipeFeedback(outcome);
      setTimeout(() => {
        setSwipeFeedback(null);
        setIsFlipped(false);
        if (currentIndex + 1 >= activeDeckWords.length) {
          setIsComplete(true);
        } else {
          setCurrentIndex((prev) => prev + 1);
        }
      }, 170);
    },
    [currentWord, isComplete, onRecordReview, currentIndex, activeDeckWords.length]
  );

  const handleDragEnd = (
    _event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    if (info.offset.x > 110 || info.velocity.x > 500) {
      handleOutcome('got_it');
    } else if (info.offset.x < -110 || info.velocity.x < -500) {
      handleOutcome('needs_practice');
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT')
      ) {
        return;
      }
      if (!currentWord || isComplete) return;

      if (e.code === 'Space' || e.key === 'Enter') {
        e.preventDefault();
        setIsFlipped((prev) => !prev);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleOutcome('got_it');
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handleOutcome('needs_practice');
      } else if (e.key.toLowerCase() === 'b') {
        e.preventDefault();
        onToggleBookmark(currentWord.id);
      } else if (e.key.toLowerCase() === 's') {
        e.preventDefault();
        speakWord(currentWord.word);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentWord, isComplete, handleOutcome, onToggleBookmark]);

  const progressPct =
    activeDeckWords.length > 0
      ? Math.round(
          ((isComplete ? activeDeckWords.length : currentIndex) /
            activeDeckWords.length) *
            100
        )
      : 0;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Toolbar: Mode & Category Controls */}
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center">
        <div className="flex flex-wrap items-center gap-1 rounded-xl bg-slate-100 p-1">
          {MODE_LABELS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleModeChange(item.id)}
              className={`shrink-0 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                !customFocusIds && mode === item.id
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {customFocusIds && customFocusIds.length > 0 && (
            <button
              type="button"
              onClick={() => {
                onClearFocusIds();
                buildDeck(mode, selectedCategory, null);
              }}
              className="whitespace-nowrap text-xs font-medium text-indigo-600 hover:text-indigo-700"
            >
              Exit Focused Deck
            </button>
          )}
          <select
            aria-label="Filter flashcards by category"
            value={selectedCategory}
            onChange={(e) => handleCategoryChange(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 focus:border-indigo-600 focus:outline-none sm:w-auto"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Empty Deck State */}
      {activeDeckWords.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-14 text-center">
          <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="h-6 w-6" aria-hidden="true" />
          </div>
          <h2 className="font-display mt-4 text-xl font-semibold text-slate-900">
            {mode === 'review'
              ? 'You are all caught up on reviews'
              : mode === 'new'
                ? 'No new words remaining in this category'
                : mode === 'bookmarked'
                  ? 'No bookmarked words yet'
                  : 'No words in this deck'}
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
            {mode === 'review'
              ? 'Every word scheduled for spaced repetition has been reviewed. Learn new words or practice the full deck.'
              : 'Try switching to another category or study mode above to continue your session.'}
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => handleModeChange('new')}
              className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
            >
              Learn New Words
            </button>
            <button
              type="button"
              onClick={() => handleModeChange('all')}
              className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
            >
              Study All Words
            </button>
          </div>
        </div>
      ) : isComplete ? (
        /* Session Complete Summary */
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
          <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
            <Sparkles className="h-7 w-7" aria-hidden="true" />
          </div>
          <h2 className="font-display mt-4 text-2xl font-bold text-slate-900">
            Session Complete
          </h2>
          <p className="mt-1.5 text-sm text-slate-600">
            You reviewed {activeDeckWords.length}{' '}
            {activeDeckWords.length === 1 ? 'word' : 'words'} and earned{' '}
            <span className="font-semibold text-indigo-700 tabular-nums">
              +{sessionStats.xpEarned} XP
            </span>
            .
          </p>

          <div className="mx-auto mt-6 grid max-w-md grid-cols-3 divide-x divide-slate-200 rounded-xl border border-slate-200 bg-slate-50 py-4">
            <div>
              <div className="text-xs font-medium text-slate-500">Got It</div>
              <div className="font-display mt-1 text-xl font-bold text-emerald-700 tabular-nums">
                {sessionStats.gotIt}
              </div>
            </div>
            <div>
              <div className="text-xs font-medium text-slate-500">
                Needs Practice
              </div>
              <div className="font-display mt-1 text-xl font-bold text-amber-700 tabular-nums">
                {sessionStats.needsPracticeIds.length}
              </div>
            </div>
            <div>
              <div className="text-xs font-medium text-slate-500">Accuracy</div>
              <div className="font-display mt-1 text-xl font-bold text-slate-900 tabular-nums">
                {Math.round(
                  (sessionStats.gotIt / activeDeckWords.length) * 100
                )}
                %
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            {sessionStats.needsPracticeIds.length > 0 && (
              <button
                type="button"
                onClick={() =>
                  buildDeck(mode, selectedCategory, sessionStats.needsPracticeIds)
                }
                className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-amber-700"
              >
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                <span>
                  Practice Missed ({sessionStats.needsPracticeIds.length})
                </span>
              </button>
            )}
            <button
              type="button"
              onClick={() => buildDeck(mode, selectedCategory, customFocusIds)}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              <span>Study Again</span>
            </button>
            <button
              type="button"
              onClick={() => onStartQuizFromDeck(selectedCategory)}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
            >
              <GraduationCap className="h-4 w-4" aria-hidden="true" />
              <span>Quiz This Deck</span>
            </button>
            <button
              type="button"
              onClick={onBackToDashboard}
              className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              <span>Dashboard</span>
            </button>
          </div>
        </div>
      ) : (
        /* Active 3D Flashcard Stage */
        currentWord && (
          <div className="space-y-5">
            {/* Progress Row */}
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm font-medium text-slate-600 tabular-nums">
                Card {currentIndex + 1} of {activeDeckWords.length}
              </span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-indigo-600 transition-all duration-300"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <span className="text-xs font-medium text-slate-500 tabular-nums">
                +{sessionStats.xpEarned} XP
              </span>
            </div>

            {/* 3D Flip + Swipe Container */}
            <div className="relative">
              {swipeFeedback && (
                <div
                  className={`pointer-events-none absolute inset-0 z-20 flex items-center justify-center rounded-2xl border-2 bg-white/85 backdrop-blur-xs ${
                    swipeFeedback === 'got_it'
                      ? 'border-emerald-500 text-emerald-700'
                      : 'border-amber-500 text-amber-700'
                  }`}
                >
                  <div className="flex items-center gap-2 font-display text-xl font-bold">
                    {swipeFeedback === 'got_it' ? (
                      <>
                        <Check className="h-6 w-6" aria-hidden="true" />
                        <span>Got It</span>
                      </>
                    ) : (
                      <>
                        <RotateCcw className="h-6 w-6" aria-hidden="true" />
                        <span>Needs Practice</span>
                      </>
                    )}
                  </div>
                </div>
              )}

              <motion.div
                key={currentWord.id}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.35}
                onDragEnd={handleDragEnd}
                whileDrag={{ scale: 0.99, cursor: 'grabbing' }}
                className="perspective-1200 cursor-pointer select-none"
                onClick={() => setIsFlipped((prev) => !prev)}
              >
                <div
                  className={`preserve-3d relative min-h-[380px] w-full transition-transform duration-500 sm:min-h-[420px] ${
                    isFlipped ? 'rotate-y-180' : ''
                  }`}
                >
                  {/* FRONT FACE */}
                  <div className="backface-hidden absolute inset-0 flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                    <div className="flex items-center justify-between gap-4">
                      <div className="text-xs font-medium text-slate-500">
                        <span>{currentWord.category}</span>
                        <span aria-hidden="true" className="mx-1.5">
                          ·
                        </span>
                        <span>{currentWord.partOfSpeech}</span>
                        <span aria-hidden="true" className="mx-1.5">
                          ·
                        </span>
                        <span
                          className={
                            currentWord.masteryStatus === 'mastered'
                              ? 'text-emerald-700'
                              : currentWord.masteryStatus === 'learning'
                                ? 'text-amber-700'
                                : 'text-indigo-700'
                          }
                        >
                          {currentWord.masteryStatus === 'mastered'
                            ? 'Mastered'
                            : currentWord.masteryStatus === 'learning'
                              ? 'Learning'
                              : 'New'}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            speakWord(currentWord.word);
                          }}
                          aria-label={`Pronounce ${currentWord.word}`}
                          className="rounded-lg p-2.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-indigo-700"
                        >
                          <Volume2 className="h-5 w-5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleBookmark(currentWord.id);
                          }}
                          aria-label={
                            currentWord.isBookmarked
                              ? 'Remove bookmark'
                              : 'Bookmark word'
                          }
                          className={`rounded-lg p-2.5 transition-colors hover:bg-slate-100 ${
                            currentWord.isBookmarked
                              ? 'text-amber-500'
                              : 'text-slate-400 hover:text-slate-700'
                          }`}
                        >
                          <Bookmark
                            className="h-5 w-5"
                            fill={
                              currentWord.isBookmarked ? 'currentColor' : 'none'
                            }
                          />
                        </button>
                      </div>
                    </div>

                    <div className="my-auto py-8 text-center">
                      <h2 className="font-display text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
                        {currentWord.word}
                      </h2>
                      <p className="mt-3 font-mono text-base text-slate-500 sm:text-lg">
                        {currentWord.pronunciation}
                      </p>
                      <p className="mt-2 text-sm font-medium text-indigo-600">
                        {currentWord.partOfSpeech}
                      </p>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-100 pt-4 text-xs text-slate-400">
                      <span>Swipe left to review · Swipe right if mastered</span>
                      <span className="font-medium text-slate-500">
                        Tap card or press Space to flip
                      </span>
                    </div>
                  </div>

                  {/* BACK FACE */}
                  <div className="backface-hidden rotate-y-180 absolute inset-0 flex flex-col justify-between overflow-y-auto rounded-2xl border border-indigo-200 bg-white p-6 shadow-sm sm:p-8">
                    <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-4">
                      <div>
                        <h3 className="font-display text-2xl font-bold text-slate-900">
                          {currentWord.word}
                        </h3>
                        <p className="font-mono text-xs text-slate-500">
                          {currentWord.pronunciation} · {currentWord.partOfSpeech}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            speakWord(currentWord.word);
                          }}
                          aria-label={`Pronounce ${currentWord.word}`}
                          className="rounded-lg p-2.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-indigo-700"
                        >
                          <Volume2 className="h-5 w-5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleBookmark(currentWord.id);
                          }}
                          aria-label={
                            currentWord.isBookmarked
                              ? 'Remove bookmark'
                              : 'Bookmark word'
                          }
                          className={`rounded-lg p-2.5 transition-colors hover:bg-slate-100 ${
                            currentWord.isBookmarked
                              ? 'text-amber-500'
                              : 'text-slate-400 hover:text-slate-700'
                          }`}
                        >
                          <Bookmark
                            className="h-5 w-5"
                            fill={
                              currentWord.isBookmarked ? 'currentColor' : 'none'
                            }
                          />
                        </button>
                      </div>
                    </div>

                    <div className="my-auto space-y-5 py-4">
                      <div>
                        <div className="text-xs font-semibold text-slate-400">
                          Definition
                        </div>
                        <p className="mt-1 text-base leading-relaxed font-medium text-slate-900 sm:text-lg">
                          {currentWord.definition}
                        </p>
                      </div>

                      <div>
                        <div className="text-xs font-semibold text-slate-400">
                          In Context
                        </div>
                        <p className="mt-1 text-sm leading-relaxed text-slate-700 sm:text-base">
                          &ldquo;
                          {highlightTerm(
                            currentWord.exampleSentence,
                            currentWord.word
                          )}
                          &rdquo;
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-4">
                        <div>
                          <div className="text-xs font-semibold text-emerald-700">
                            Synonym
                          </div>
                          <p className="mt-1 text-sm font-medium text-slate-900">
                            {currentWord.synonym}
                          </p>
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-amber-700">
                            Antonym
                          </div>
                          <p className="mt-1 text-sm font-medium text-slate-900">
                            {currentWord.antonym}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-400">
                      <span>
                        Current interval:{' '}
                        {currentWord.intervalDays > 0
                          ? `${currentWord.intervalDays}d`
                          : 'New word'}
                      </span>
                      <span>Press Space to return to front</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Spaced Repetition Action Controls */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <button
                type="button"
                onClick={() => handleOutcome('needs_practice')}
                className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-5 py-3 text-sm font-semibold text-amber-800 transition-colors hover:bg-amber-100"
              >
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                <span>Needs Practice</span>
                <span className="hidden font-mono text-xs text-amber-600 sm:inline">
                  ←
                </span>
              </button>

              <button
                type="button"
                onClick={() => setIsFlipped((prev) => !prev)}
                className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
              >
                <RefreshCw className="h-4 w-4" aria-hidden="true" />
                <span>{isFlipped ? 'Show Word' : 'Reveal Answer'}</span>
                <span className="hidden font-mono text-xs text-slate-400 sm:inline">
                  Space
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleOutcome('got_it')}
                className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
              >
                <Check className="h-4 w-4" aria-hidden="true" />
                <span>Got It</span>
                <span className="hidden font-mono text-xs text-emerald-200 sm:inline">
                  →
                </span>
              </button>
            </div>
          </div>
        )
      )}
    </div>
  );
}
