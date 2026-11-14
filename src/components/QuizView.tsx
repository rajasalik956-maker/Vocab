import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  GraduationCap,
  RefreshCw,
  Volume2,
  XCircle,
} from 'lucide-react';
import { QuizQuestion, QuizQuestionType, VocabWord } from '../types/vocab';
import { maskWordInSentence, speakWord } from '../utils/spacedRepetition';

interface QuizViewProps {
  words: VocabWord[];
  initialCategory: string;
  onRecordQuizAnswer: (wordId: string, isCorrect: boolean) => void;
  onCompleteQuizSession: (correctCount: number) => void;
  onPracticeMissedInFlashcards: (wordIds: string[]) => void;
}

type QuizFocus = 'mixed' | QuizQuestionType;

interface AnsweredRecord {
  question: QuizQuestion;
  selectedAnswer: string;
  isCorrect: boolean;
}

function shuffleArray<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function generateQuizQuestions(
  pool: VocabWord[],
  allWords: VocabWord[],
  focus: QuizFocus,
  count: number
): QuizQuestion[] {
  const selectedTargets = shuffleArray(pool).slice(0, Math.min(count, pool.length));
  const typesOrder: QuizQuestionType[] = ['definition', 'context', 'synonym'];

  return selectedTargets.map((target, index) => {
    let qType: QuizQuestionType =
      focus === 'mixed' ? typesOrder[index % typesOrder.length] : focus;

    // Fallback to definition if synonym is missing
    if (qType === 'synonym' && (!target.synonym || target.synonym === '—')) {
      qType = 'definition';
    }

    const otherWords = shuffleArray(
      allWords.filter((w) => w.id !== target.id)
    );

    if (qType === 'definition') {
      const distractors = otherWords
        .filter((w) => w.definition !== target.definition)
        .slice(0, 3)
        .map((w) => w.definition);
      return {
        id: `q-${target.id}-${index}`,
        wordId: target.id,
        targetWord: target,
        type: 'definition',
        prompt: `Which definition best describes "${target.word}"?`,
        options: shuffleArray([target.definition, ...distractors]),
        correctAnswer: target.definition,
      };
    }

    if (qType === 'context') {
      const distractors = otherWords
        .filter((w) => w.word !== target.word)
        .slice(0, 3)
        .map((w) => w.word);
      return {
        id: `q-${target.id}-${index}`,
        wordId: target.id,
        targetWord: target,
        type: 'context',
        prompt: 'Select the word that best completes the sentence:',
        contextSentence: maskWordInSentence(target.exampleSentence, target.word),
        options: shuffleArray([target.word, ...distractors]),
        correctAnswer: target.word,
      };
    }

    // synonym
    const validSynonymPool = otherWords.filter(
      (w) => w.synonym && w.synonym !== '—' && w.synonym !== target.synonym
    );
    const distractors = validSynonymPool.slice(0, 3).map((w) => w.synonym);
    while (distractors.length < 3 && otherWords[distractors.length]) {
      distractors.push(otherWords[distractors.length].word);
    }

    return {
      id: `q-${target.id}-${index}`,
      wordId: target.id,
      targetWord: target,
      type: 'synonym',
      prompt: `Which word is closest in meaning to "${target.word}"?`,
      options: shuffleArray([target.synonym, ...distractors]),
      correctAnswer: target.synonym,
    };
  });
}

export function QuizView({
  words,
  initialCategory,
  onRecordQuizAnswer,
  onCompleteQuizSession,
  onPracticeMissedInFlashcards,
}: QuizViewProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [quizFocus, setQuizFocus] = useState<QuizFocus>('mixed');
  const [questionCount, setQuestionCount] = useState<number>(10);
  const [phase, setPhase] = useState<'setup' | 'active' | 'summary'>('setup');

  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [answers, setAnswers] = useState<AnsweredRecord[]>([]);

  const categories = useMemo(
    () => [
      'All Categories',
      'Bookmarked Words',
      'Needs Practice',
      ...Array.from(new Set(words.map((w) => w.category))),
    ],
    [words]
  );

  const filteredPool = useMemo(() => {
    if (selectedCategory === 'All Categories') return words;
    if (selectedCategory === 'Bookmarked Words') {
      return words.filter((w) => w.isBookmarked);
    }
    if (selectedCategory === 'Needs Practice') {
      return words.filter((w) => w.masteryStatus !== 'mastered');
    }
    return words.filter((w) => w.category === selectedCategory);
  }, [words, selectedCategory]);

  const startQuiz = useCallback(
    (categoryOverride?: string) => {
      const cat = categoryOverride ?? selectedCategory;
      let pool = words;
      if (cat === 'Bookmarked Words') {
        pool = words.filter((w) => w.isBookmarked);
      } else if (cat === 'Needs Practice') {
        pool = words.filter((w) => w.masteryStatus !== 'mastered');
      } else if (cat !== 'All Categories') {
        pool = words.filter((w) => w.category === cat);
      }

      if (pool.length === 0) return;

      const generated = generateQuizQuestions(
        pool,
        words,
        quizFocus,
        questionCount
      );
      setQuestions(generated);
      setCurrentIdx(0);
      setSelectedOption(null);
      setAnswers([]);
      setPhase('active');
    },
    [selectedCategory, words, quizFocus, questionCount]
  );

  useEffect(() => {
    if (initialCategory && initialCategory !== 'All Categories') {
      setSelectedCategory(initialCategory);
      startQuiz(initialCategory);
    }
    // Only auto-start if navigated directly with a specific category deck
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialCategory]);

  const currentQuestion = questions[currentIdx] ?? null;

  const handleSelectOption = useCallback(
    (option: string) => {
      if (!currentQuestion || selectedOption !== null) return;
      const isCorrect = option === currentQuestion.correctAnswer;
      setSelectedOption(option);
      onRecordQuizAnswer(currentQuestion.wordId, isCorrect);
      setAnswers((prev) => [
        ...prev,
        { question: currentQuestion, selectedAnswer: option, isCorrect },
      ]);
    },
    [currentQuestion, selectedOption, onRecordQuizAnswer]
  );

  const handleNext = useCallback(() => {
    if (currentIdx + 1 >= questions.length) {
      const correctCount = answers.filter((a) => a.isCorrect).length;
      onCompleteQuizSession(correctCount);
      setPhase('summary');
    } else {
      setCurrentIdx((prev) => prev + 1);
      setSelectedOption(null);
    }
  }, [currentIdx, questions.length, answers, onCompleteQuizSession]);

  useEffect(() => {
    if (phase !== 'active' || !currentQuestion) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (selectedOption === null) {
        const idx = ['1', '2', '3', '4'].indexOf(e.key);
        if (idx !== -1 && currentQuestion.options[idx]) {
          e.preventDefault();
          handleSelectOption(currentQuestion.options[idx]);
        }
      } else if (e.key === 'Enter' || e.code === 'Space') {
        e.preventDefault();
        handleNext();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [phase, currentQuestion, selectedOption, handleSelectOption, handleNext]);

  if (phase === 'setup') {
    return (
      <div className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-xs sm:p-8">
        <div className="flex items-center gap-3">
          <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <GraduationCap className="h-6 w-6" aria-hidden="true" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-slate-900">
              Practice Quiz
            </h1>
            <p className="text-sm text-slate-500">
              Configure your session to test definitions, sentence context, and synonyms.
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-5 border-t border-slate-100 pt-6">
          <div>
            <label
              htmlFor="quiz-category"
              className="mb-2 block text-sm font-semibold text-slate-800"
            >
              Word Deck
            </label>
            <select
              id="quiz-category"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 focus:border-indigo-600 focus:outline-none"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <p className="mt-1.5 text-xs text-slate-500 tabular-nums">
              {filteredPool.length} words available in this selection
            </p>
          </div>

          <div>
            <span className="mb-2 block text-sm font-semibold text-slate-800">
              Question Focus
            </span>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {(
                [
                  { id: 'mixed', label: 'Mixed' },
                  { id: 'definition', label: 'Definitions' },
                  { id: 'context', label: 'Context' },
                  { id: 'synonym', label: 'Synonyms' },
                ] as const
              ).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setQuizFocus(item.id)}
                  className={`rounded-xl border px-3 py-2.5 text-sm font-semibold transition-colors ${
                    quizFocus === item.id
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className="mb-2 block text-sm font-semibold text-slate-800">
              Number of Questions
            </span>
            <div className="grid grid-cols-3 gap-2">
              {[5, 10, 15].map((cnt) => (
                <button
                  key={cnt}
                  type="button"
                  onClick={() => setQuestionCount(cnt)}
                  className={`rounded-xl border px-3 py-2.5 text-sm font-semibold tabular-nums transition-colors ${
                    questionCount === cnt
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {cnt} Questions
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2">
            <button
              type="button"
              disabled={filteredPool.length === 0}
              onClick={() => startQuiz()}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              <span>
                {filteredPool.length === 0
                  ? 'No words match this selection'
                  : `Start ${Math.min(questionCount, filteredPool.length)}-Question Quiz`}
              </span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'summary') {
    const correctCount = answers.filter((a) => a.isCorrect).length;
    const total = answers.length;
    const accuracy = total > 0 ? Math.round((correctCount / total) * 100) : 0;
    const missedIds = Array.from(
      new Set(answers.filter((a) => !a.isCorrect).map((a) => a.question.wordId))
    );

    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center sm:p-8">
          <h1 className="font-display text-2xl font-bold text-slate-900">
            Quiz Results
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Your spaced repetition schedule has been updated based on your answers.
          </p>

          <div className="mx-auto mt-6 grid max-w-md grid-cols-3 divide-x divide-slate-200 rounded-xl border border-slate-200 bg-slate-50 py-4">
            <div>
              <div className="text-xs font-medium text-slate-500">Score</div>
              <div className="font-display mt-1 text-2xl font-bold text-slate-900 tabular-nums">
                {correctCount}/{total}
              </div>
            </div>
            <div>
              <div className="text-xs font-medium text-slate-500">Accuracy</div>
              <div
                className={`font-display mt-1 text-2xl font-bold tabular-nums ${
                  accuracy >= 70 ? 'text-emerald-700' : 'text-amber-700'
                }`}
              >
                {accuracy}%
              </div>
            </div>
            <div>
              <div className="text-xs font-medium text-slate-500">Bonus XP</div>
              <div className="font-display mt-1 text-2xl font-bold text-indigo-700 tabular-nums">
                +{correctCount * 30 + 25}
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            {missedIds.length > 0 && (
              <button
                type="button"
                onClick={() => onPracticeMissedInFlashcards(missedIds)}
                className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-amber-700"
              >
                <BookOpen className="h-4 w-4" aria-hidden="true" />
                <span>Practice Missed ({missedIds.length})</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => startQuiz()}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              <span>Retake Quiz</span>
            </button>
            <button
              type="button"
              onClick={() => setPhase('setup')}
              className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
            >
              Change Settings
            </button>
          </div>
        </div>

        {/* Question-by-question breakdown */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="font-display text-lg font-semibold text-slate-900">
            Answer Breakdown
          </h2>
          <div className="mt-4 divide-y divide-slate-100">
            {answers.map((item, idx) => (
              <div key={item.question.id} className="py-4 first:pt-0 last:pb-0">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-slate-400 tabular-nums">
                        {idx + 1}.
                      </span>
                      <span className="font-display text-base font-semibold text-slate-900">
                        {item.question.targetWord.word}
                      </span>
                      <span className="text-xs text-slate-500">
                        {item.question.targetWord.partOfSpeech}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-600">
                      {item.question.targetWord.definition}
                    </p>
                    {!item.isCorrect && (
                      <p className="mt-1.5 text-xs text-rose-700">
                        Your answer: {item.selectedAnswer} · Correct:{' '}
                        <span className="font-semibold">
                          {item.question.correctAnswer}
                        </span>
                      </p>
                    )}
                  </div>
                  <div className="shrink-0">
                    {item.isCorrect ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                        <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                        Correct
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-700">
                        <XCircle className="h-4 w-4" aria-hidden="true" />
                        Missed
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* Active Question View */
  if (!currentQuestion) return null;

  const progressPct = Math.round(
    ((currentIdx + (selectedOption ? 1 : 0)) / questions.length) * 100
  );
  const isCurrentCorrect = selectedOption === currentQuestion.correctAnswer;

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      {/* Quiz Header Progress */}
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => setPhase('setup')}
          className="text-xs font-semibold text-slate-500 hover:text-slate-900"
        >
          ← Exit Quiz
        </button>
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-indigo-600 transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <span className="text-sm font-semibold text-slate-700 tabular-nums">
          {currentIdx + 1} / {questions.length}
        </span>
      </div>

      {/* Question Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs sm:p-8">
        <div className="flex items-center justify-between gap-2 text-xs font-medium text-slate-500">
          <span>
            {currentQuestion.type === 'definition'
              ? 'Definition Match'
              : currentQuestion.type === 'context'
                ? 'Sentence Context'
                : 'Synonym Match'}{' '}
            · {currentQuestion.targetWord.category}
          </span>
          {currentQuestion.type !== 'context' && (
            <button
              type="button"
              onClick={() => speakWord(currentQuestion.targetWord.word)}
              className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-700"
            >
              <Volume2 className="h-4 w-4" aria-hidden="true" />
              <span>Listen</span>
            </button>
          )}
        </div>

        <h2 className="font-display mt-3 text-xl font-bold text-slate-900 sm:text-2xl">
          {currentQuestion.prompt}
        </h2>

        {currentQuestion.contextSentence && (
          <p className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-base leading-relaxed text-slate-800">
            &ldquo;{currentQuestion.contextSentence}&rdquo;
          </p>
        )}

        {/* Options */}
        <div className="mt-6 space-y-3">
          {currentQuestion.options.map((option, idx) => {
            const isSelected = selectedOption === option;
            const isCorrectOption = option === currentQuestion.correctAnswer;
            const isRevealed = selectedOption !== null;

            let optionClasses =
              'border-slate-200 bg-white text-slate-800 hover:border-indigo-300 hover:bg-indigo-50/40';
            if (isRevealed) {
              if (isCorrectOption) {
                optionClasses =
                  'border-emerald-500 bg-emerald-50 text-emerald-950';
              } else if (isSelected && !isCorrectOption) {
                optionClasses = 'border-rose-500 bg-rose-50 text-rose-950';
              } else {
                optionClasses = 'border-slate-200 bg-slate-50/60 text-slate-400';
              }
            }

            return (
              <button
                key={`${option}-${idx}`}
                type="button"
                disabled={isRevealed}
                onClick={() => handleSelectOption(option)}
                className={`flex w-full items-center justify-between gap-4 rounded-xl border px-4 py-3.5 text-left text-sm font-medium transition-colors sm:text-base ${optionClasses}`}
              >
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-current/20 font-mono text-xs font-semibold">
                    {idx + 1}
                  </span>
                  <span>{option}</span>
                </div>

                {isRevealed && isCorrectOption && (
                  <span className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-emerald-700">
                    <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                    Correct
                  </span>
                )}
                {isRevealed && isSelected && !isCorrectOption && (
                  <span className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-rose-700">
                    <XCircle className="h-4 w-4" aria-hidden="true" />
                    Your pick
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Instant Feedback & Explanation */}
        {selectedOption !== null && (
          <div className="mt-6 border-t border-slate-200 pt-5">
            <div
              className={`rounded-xl p-4 ${
                isCurrentCorrect
                  ? 'bg-emerald-50 text-emerald-950'
                  : 'bg-rose-50 text-rose-950'
              }`}
            >
              <div className="flex items-center gap-2 font-display text-base font-bold">
                {isCurrentCorrect ? (
                  <>
                    <CheckCircle2
                      className="h-5 w-5 text-emerald-700"
                      aria-hidden="true"
                    />
                    <span>Correct! +20 XP</span>
                  </>
                ) : (
                  <>
                    <XCircle
                      className="h-5 w-5 text-rose-700"
                      aria-hidden="true"
                    />
                    <span>
                      Not quite — the answer is{' '}
                      {currentQuestion.correctAnswer}
                    </span>
                  </>
                )}
              </div>

              <div className="mt-2.5 space-y-1.5 text-sm">
                <p>
                  <span className="font-semibold">
                    {currentQuestion.targetWord.word}
                  </span>{' '}
                  <span className="font-mono text-xs opacity-75">
                    {currentQuestion.targetWord.pronunciation}
                  </span>
                  : {currentQuestion.targetWord.definition}
                </p>
                <p className="italic opacity-90">
                  &ldquo;{currentQuestion.targetWord.exampleSentence}&rdquo;
                </p>
                <p className="text-xs opacity-80">
                  Synonym: {currentQuestion.targetWord.synonym} · Antonym:{' '}
                  {currentQuestion.targetWord.antonym}
                </p>
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={handleNext}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
              >
                <span>
                  {currentIdx + 1 >= questions.length
                    ? 'See Final Results'
                    : 'Next Question'}
                </span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
