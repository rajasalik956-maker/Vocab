import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { AddWordModal } from './components/AddWordModal';
import { DashboardView } from './components/DashboardView';
import { FlashcardsView } from './components/FlashcardsView';
import { LibraryView } from './components/LibraryView';
import { Navbar } from './components/Navbar';
import { QuizView } from './components/QuizView';
import { useVocabStore } from './hooks/useVocabStore';
import {
  ActiveView,
  FlashcardStudyMode,
  NewWordInput,
  PRESET_CATEGORIES,
  VocabWord,
} from './types/vocab';

export default function App() {
  const {
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
  } = useVocabStore();

  const [activeView, setActiveView] = useState<ActiveView>('dashboard');
  const [flashcardMode, setFlashcardMode] =
    useState<FlashcardStudyMode>('review');
  const [flashcardCategory, setFlashcardCategory] =
    useState<string>('All Categories');
  const [flashcardFocusIds, setFlashcardFocusIds] = useState<string[] | null>(
    null
  );
  const [quizCategory, setQuizCategory] = useState<string>('All Categories');

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingWord, setEditingWord] = useState<VocabWord | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(null), 2800);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  const availableCategories = useMemo(() => {
    const set = new Set<string>([...PRESET_CATEGORIES]);
    words.forEach((w) => set.add(w.category));
    return Array.from(set);
  }, [words]);

  const handleStartFlashcards = (
    mode: FlashcardStudyMode,
    category = 'All Categories'
  ) => {
    setFlashcardFocusIds(null);
    setFlashcardMode(mode);
    setFlashcardCategory(category);
    setActiveView('flashcards');
  };

  const handleStudySpecificWords = (wordIds: string[]) => {
    setFlashcardFocusIds(wordIds);
    setFlashcardCategory('All Categories');
    setActiveView('flashcards');
  };

  const handleStartQuiz = (category = 'All Categories') => {
    setQuizCategory(category);
    setActiveView('quiz');
  };

  const handleSaveWord = (input: NewWordInput, existingId?: string) => {
    if (existingId) {
      updateWord(existingId, input);
      setToastMessage(`Updated "${input.word}"`);
    } else {
      addCustomWord(input);
      setToastMessage(`Added "${input.word}" to ${input.category}`);
    }
    setEditingWord(null);
  };

  const handleDeleteWord = (wordId: string) => {
    const target = words.find((w) => w.id === wordId);
    deleteCustomWord(wordId);
    if (target) {
      setToastMessage(`Removed "${target.word}"`);
    }
  };

  const handleResetProgress = () => {
    resetProgress();
    setToastMessage('Study progress reset to starter state');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Navbar
        activeView={activeView}
        onNavigate={(view) => {
          if (view === 'quiz') {
            setQuizCategory('All Categories');
          }
          setActiveView(view);
        }}
        onOpenAddWord={() => {
          setEditingWord(null);
          setIsAddModalOpen(true);
        }}
      />

      <main className="mx-auto max-w-6xl px-4 py-6 pb-24 sm:px-6 sm:py-8 md:pb-12">
        {activeView === 'dashboard' && (
          <DashboardView
            words={words}
            stats={stats}
            onStartFlashcards={handleStartFlashcards}
            onStartQuiz={handleStartQuiz}
            onOpenLibrary={() => setActiveView('library')}
            onChangeDailyGoal={setDailyGoal}
            onResetProgress={handleResetProgress}
          />
        )}

        {activeView === 'flashcards' && (
          <FlashcardsView
            words={words}
            initialMode={flashcardMode}
            initialCategory={flashcardCategory}
            customFocusIds={flashcardFocusIds}
            onClearFocusIds={() => setFlashcardFocusIds(null)}
            onRecordReview={recordCardReview}
            onToggleBookmark={toggleBookmark}
            onStartQuizFromDeck={(category) => handleStartQuiz(category)}
            onBackToDashboard={() => setActiveView('dashboard')}
          />
        )}

        {activeView === 'quiz' && (
          <QuizView
            words={words}
            initialCategory={quizCategory}
            onRecordQuizAnswer={recordQuizAnswer}
            onCompleteQuizSession={completeQuizSession}
            onPracticeMissedInFlashcards={handleStudySpecificWords}
          />
        )}

        {activeView === 'library' && (
          <LibraryView
            words={words}
            onToggleBookmark={toggleBookmark}
            onSetMasteryStatus={setMasteryStatus}
            onOpenAddWord={() => {
              setEditingWord(null);
              setIsAddModalOpen(true);
            }}
            onEditWord={(word) => {
              setEditingWord(word);
              setIsAddModalOpen(true);
            }}
            onDeleteWord={handleDeleteWord}
            onStudySelectedWords={handleStudySpecificWords}
          />
        )}
      </main>

      <AddWordModal
        isOpen={isAddModalOpen}
        editingWord={editingWord}
        availableCategories={availableCategories}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingWord(null);
        }}
        onSave={handleSaveWord}
      />

      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed right-4 bottom-20 z-50 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-900 px-4 py-3 text-sm font-medium text-white shadow-lg md:bottom-6"
        >
          <CheckCircle2 className="h-4 w-4 text-emerald-400" aria-hidden="true" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
