import {
  ArrowRight,
  Award,
  BookOpen,
  CheckCircle2,
  Flame,
  GraduationCap,
  RotateCcw,
  Sparkles,
  Target,
} from 'lucide-react';
import { FlashcardStudyMode, StudyStats, VocabWord } from '../types/vocab';
import { getLast7Days, getTodayISO, isDueForReview } from '../utils/spacedRepetition';

interface DashboardViewProps {
  words: VocabWord[];
  stats: StudyStats;
  onStartFlashcards: (mode: FlashcardStudyMode, category?: string) => void;
  onStartQuiz: (category?: string) => void;
  onOpenLibrary: () => void;
  onChangeDailyGoal: (goal: number) => void;
  onResetProgress: () => void;
}

const GOAL_OPTIONS = [5, 10, 15, 20];

export function DashboardView({
  words,
  stats,
  onStartFlashcards,
  onStartQuiz,
  onOpenLibrary,
  onChangeDailyGoal,
  onResetProgress,
}: DashboardViewProps) {
  const today = getTodayISO();
  const todayStudied = stats.history[today]?.wordsStudied ?? 0;
  const goalProgress = Math.min(100, Math.round((todayStudied / stats.dailyGoal) * 100));
  const goalMet = todayStudied >= stats.dailyGoal;

  const masteredCount = words.filter((w) => w.masteryStatus === 'mastered').length;
  const learningCount = words.filter((w) => w.masteryStatus === 'learning').length;
  const newCount = words.filter((w) => w.masteryStatus === 'new').length;
  const dueCount = words.filter((w) => isDueForReview(w, today)).length;
  const bookmarkedCount = words.filter((w) => w.isBookmarked).length;

  const categories = Array.from(new Set(words.map((w) => w.category)));
  const last7Days = getLast7Days();

  return (
    <div className="space-y-8">
      {/* Top Hero & Daily Goal Strip */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs sm:p-8">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <div className="max-w-xl">
            <p className="text-sm font-medium text-indigo-700">
              Daily Study Overview
            </p>
            <h1 className="font-display mt-1 text-2xl font-bold tracking-tight text-slate-900 text-balance sm:text-3xl">
              Build lasting mastery, one session at a time.
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 sm:text-base">
              Review words scheduled by spaced repetition or unlock fresh academic vocabulary for your upcoming exams.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={() => onStartFlashcards('review')}
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              <span>Daily Review ({dueCount > 0 ? dueCount : learningCount})</span>
            </button>
            <button
              type="button"
              onClick={() => onStartFlashcards('new')}
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800 transition-colors hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              <BookOpen className="h-4 w-4 text-indigo-600" aria-hidden="true" />
              <span>Learn New Words ({newCount})</span>
            </button>
          </div>
        </div>

        {/* Daily Goal Progress Bar */}
        <div className="mt-8 border-t border-slate-200 pt-6">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2.5">
              <Target className="h-5 w-5 text-indigo-600" aria-hidden="true" />
              <span className="text-sm font-semibold text-slate-900">
                Today&apos;s Daily Goal
              </span>
              <span className="text-sm text-slate-500 tabular-nums">
                {todayStudied} / {stats.dailyGoal} words
              </span>
              {goalMet && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                  <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                  Goal Complete
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <span className="mr-1 text-xs font-medium text-slate-500">
                Target:
              </span>
              {GOAL_OPTIONS.map((goal) => (
                <button
                  key={goal}
                  type="button"
                  onClick={() => onChangeDailyGoal(goal)}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium tabular-nums transition-colors ${
                    stats.dailyGoal === goal
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                  }`}
                >
                  {goal}
                </button>
              ))}
            </div>
          </div>

          <div
            className="mt-3 h-3 w-full overflow-hidden rounded-full bg-slate-100"
            role="progressbar"
            aria-valuenow={goalProgress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Daily vocabulary goal progress"
          >
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                goalMet ? 'bg-emerald-600' : 'bg-indigo-600'
              }`}
              style={{ width: `${goalProgress}%` }}
            />
          </div>
        </div>
      </section>

      {/* 4-Column Metric Strip */}
      <section aria-label="Study Statistics" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-sm font-medium">Daily Streak</span>
            <Flame className="h-5 w-5 text-amber-600" aria-hidden="true" />
          </div>
          <p className="font-display mt-2 text-2xl font-bold text-slate-900 tabular-nums sm:text-3xl">
            {stats.streakDays} {stats.streakDays === 1 ? 'day' : 'days'}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {todayStudied > 0 ? 'Active today' : 'Study 1 word to extend'}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-sm font-medium">Words Mastered</span>
            <CheckCircle2 className="h-5 w-5 text-emerald-600" aria-hidden="true" />
          </div>
          <p className="font-display mt-2 text-2xl font-bold text-slate-900 tabular-nums sm:text-3xl">
            {masteredCount}
            <span className="text-base font-normal text-slate-400">
              {' '}
              / {words.length}
            </span>
          </p>
          <p className="mt-1 text-xs text-slate-500 tabular-nums">
            {learningCount} currently in learning
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-sm font-medium">Study Experience</span>
            <Award className="h-5 w-5 text-indigo-600" aria-hidden="true" />
          </div>
          <p className="font-display mt-2 text-2xl font-bold text-slate-900 tabular-nums sm:text-3xl">
            {stats.xp.toLocaleString()} XP
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Earned via flashcards &amp; quizzes
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-sm font-medium">Saved Bookmarks</span>
            <Sparkles className="h-5 w-5 text-indigo-600" aria-hidden="true" />
          </div>
          <p className="font-display mt-2 text-2xl font-bold text-slate-900 tabular-nums sm:text-3xl">
            {bookmarkedCount}
          </p>
          <button
            type="button"
            onClick={() =>
              bookmarkedCount > 0
                ? onStartFlashcards('bookmarked')
                : onOpenLibrary()
            }
            className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
          >
            <span>
              {bookmarkedCount > 0 ? 'Review bookmarked' : 'Browse library'}
            </span>
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>
      </section>

      {/* Weekly Consistency + Quick Practice Quiz */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-lg font-semibold text-slate-900">
                7-Day Study Activity
              </h2>
              <p className="text-sm text-slate-500">
                Words reviewed per day across flashcards and quizzes
              </p>
            </div>
            <span className="text-xs font-medium text-slate-500 tabular-nums">
              Goal: {stats.dailyGoal}/day
            </span>
          </div>

          <div className="mt-6 grid grid-cols-7 gap-2 sm:gap-3">
            {last7Days.map((day) => {
              const count = stats.history[day.date]?.wordsStudied ?? 0;
              const pct = Math.min(100, Math.round((count / stats.dailyGoal) * 100));
              const hitGoal = count >= stats.dailyGoal;

              return (
                <div key={day.date} className="flex flex-col items-center gap-2">
                  <div className="flex h-24 w-full items-end justify-center rounded-lg bg-slate-50 p-1.5">
                    <div
                      className={`w-full max-w-[28px] rounded-md transition-all ${
                        count === 0
                          ? 'h-1.5 bg-slate-200'
                          : hitGoal
                            ? 'bg-emerald-600'
                            : 'bg-indigo-600'
                      }`}
                      style={{
                        height: count === 0 ? '6px' : `${Math.max(16, pct)}%`,
                      }}
                      title={`${day.date}: ${count} words`}
                    />
                  </div>
                  <div className="text-center">
                    <div
                      className={`text-xs font-medium ${
                        day.isToday ? 'text-indigo-700' : 'text-slate-600'
                      }`}
                    >
                      {day.isToday ? 'Today' : day.label}
                    </div>
                    <div className="text-[11px] text-slate-400 tabular-nums">
                      {count}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6">
          <div>
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <GraduationCap className="h-5 w-5" aria-hidden="true" />
            </div>
            <h2 className="font-display mt-4 text-lg font-semibold text-slate-900">
              Adaptive Practice Quiz
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
              Test retention across definitions, sentence context, and synonyms with instant feedback.
            </p>
          </div>

          <div className="mt-6 space-y-2.5">
            <button
              type="button"
              onClick={() => onStartQuiz()}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
            >
              <span>Start Mixed Quiz</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={onOpenLibrary}
              className="flex w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
            >
              Search All {words.length} Words
            </button>
          </div>
        </div>
      </section>

      {/* Curated & Custom Categories */}
      <section aria-labelledby="categories-heading">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2
              id="categories-heading"
              className="font-display text-xl font-semibold text-slate-900"
            >
              Study Decks by Category
            </h2>
            <p className="text-sm text-slate-500">
              Select a curated track or custom deck to study flashcards or launch a focused quiz.
            </p>
          </div>
          <button
            type="button"
            onClick={onResetProgress}
            className="text-xs font-medium text-slate-500 underline-offset-4 hover:text-slate-800 hover:underline"
          >
            Reset demo progress
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {categories.map((category) => {
            const catWords = words.filter((w) => w.category === category);
            const catMastered = catWords.filter(
              (w) => w.masteryStatus === 'mastered'
            ).length;
            const catLearning = catWords.filter(
              (w) => w.masteryStatus === 'learning'
            ).length;
            const catNew = catWords.filter((w) => w.masteryStatus === 'new').length;
            const pct =
              catWords.length > 0
                ? Math.round((catMastered / catWords.length) * 100)
                : 0;

            return (
              <div
                key={category}
                className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 transition-colors hover:border-slate-300"
              >
                <div>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-display text-base font-semibold text-slate-900">
                        {category}
                      </h3>
                      <p className="mt-1 text-xs text-slate-500 tabular-nums">
                        {catWords.length} words · {catMastered} mastered ·{' '}
                        {catLearning} learning · {catNew} new
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-indigo-700 tabular-nums">
                      {pct}%
                    </span>
                  </div>

                  <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-emerald-600 transition-all duration-300"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                <div className="mt-5 flex items-center gap-3 border-t border-slate-100 pt-4">
                  <button
                    type="button"
                    onClick={() => onStartFlashcards('all', category)}
                    className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700 transition-colors hover:bg-indigo-100"
                  >
                    <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Flashcards</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onStartQuiz(category)}
                    className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                  >
                    <GraduationCap className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Quiz Deck</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
