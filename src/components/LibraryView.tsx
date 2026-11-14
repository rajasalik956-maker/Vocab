import { useMemo, useState } from 'react';
import {
  Bookmark,
  CheckCircle2,
  Clock,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Trash2,
  Volume2,
  X,
} from 'lucide-react';
import { MasteryStatus, VocabWord } from '../types/vocab';
import { speakWord } from '../utils/spacedRepetition';

interface LibraryViewProps {
  words: VocabWord[];
  onToggleBookmark: (wordId: string) => void;
  onSetMasteryStatus: (wordId: string, status: MasteryStatus) => void;
  onOpenAddWord: () => void;
  onEditWord: (word: VocabWord) => void;
  onDeleteWord: (wordId: string) => void;
  onStudySelectedWords: (wordIds: string[]) => void;
}

type StatusFilter = 'all' | MasteryStatus;

const STATUS_TABS: { id: StatusFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'mastered', label: 'Mastered' },
  { id: 'learning', label: 'Learning' },
  { id: 'new', label: 'New' },
];

export function LibraryView({
  words,
  onToggleBookmark,
  onSetMasteryStatus,
  onOpenAddWord,
  onEditWord,
  onDeleteWord,
  onStudySelectedWords,
}: LibraryViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('All Categories');
  const [bookmarkedOnly, setBookmarkedOnly] = useState(false);
  const [selectedWordId, setSelectedWordId] = useState<string | null>(null);

  const categories = useMemo(
    () => ['All Categories', ...Array.from(new Set(words.map((w) => w.category)))],
    [words]
  );

  const filteredWords = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return words.filter((w) => {
      if (statusFilter !== 'all' && w.masteryStatus !== statusFilter) {
        return false;
      }
      if (categoryFilter !== 'All Categories' && w.category !== categoryFilter) {
        return false;
      }
      if (bookmarkedOnly && !w.isBookmarked) {
        return false;
      }
      if (!q) return true;
      return (
        w.word.toLowerCase().includes(q) ||
        w.definition.toLowerCase().includes(q) ||
        w.synonym.toLowerCase().includes(q) ||
        w.antonym.toLowerCase().includes(q) ||
        w.category.toLowerCase().includes(q)
      );
    });
  }, [words, searchQuery, statusFilter, categoryFilter, bookmarkedOnly]);

  const selectedWord = useMemo(
    () => words.find((w) => w.id === selectedWordId) ?? null,
    [words, selectedWordId]
  );

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">
            Vocabulary Library
          </h1>
          <p className="mt-1 text-sm text-slate-600 tabular-nums">
            Showing {filteredWords.length} of {words.length} words across curated and custom decks
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {filteredWords.length > 0 && (
            <button
              type="button"
              onClick={() =>
                onStudySelectedWords(filteredWords.map((w) => w.id))
              }
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
            >
              <span>Study Filtered ({filteredWords.length})</span>
            </button>
          )}
          <button
            type="button"
            onClick={onOpenAddWord}
            className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            <span>Add Custom Word</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search words, definitions, synonyms, or antonyms..."
              aria-label="Search vocabulary words"
              className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pr-9 pl-10 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/15"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
                className="absolute top-1/2 right-2.5 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              aria-label="Filter by category"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-700 focus:border-indigo-600 focus:outline-none"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => setBookmarkedOnly((prev) => !prev)}
              aria-pressed={bookmarkedOnly}
              className={`inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2.5 text-sm font-semibold transition-colors ${
                bookmarkedOnly
                  ? 'border-amber-300 bg-amber-50 text-amber-800'
                  : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Bookmark
                className="h-4 w-4"
                fill={bookmarkedOnly ? 'currentColor' : 'none'}
                aria-hidden="true"
              />
              <span>Bookmarked</span>
            </button>
          </div>
        </div>

        {/* Mastery Status Segmented Control */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
          <div className="inline-flex items-center gap-1 rounded-xl bg-slate-100 p-1">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                  statusFilter === tab.id
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {(searchQuery ||
            statusFilter !== 'all' ||
            categoryFilter !== 'All Categories' ||
            bookmarkedOnly) && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
                setCategoryFilter('All Categories');
                setBookmarkedOnly(false);
              }}
              className="text-xs font-medium text-indigo-600 hover:text-indigo-700"
            >
              Reset all filters
            </button>
          )}
        </div>
      </div>

      {/* Word Directory List */}
      {filteredWords.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center">
          <p className="font-display text-lg font-semibold text-slate-900">
            No matching words found
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Try adjusting your search query or filters, or add a custom word to your deck.
          </p>
          <button
            type="button"
            onClick={onOpenAddWord}
            className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            <span>Add Word</span>
          </button>
        </div>
      ) : (
        <div className="divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200 bg-white">
          {filteredWords.map((item) => (
            <div
              key={item.id}
              className="flex flex-col justify-between gap-4 p-4 transition-colors hover:bg-slate-50/70 sm:flex-row sm:items-center sm:px-6"
            >
              <button
                type="button"
                onClick={() => setSelectedWordId(item.id)}
                className="flex-1 text-left focus-visible:outline-2 focus-visible:outline-indigo-600"
              >
                <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
                  <span className="font-display text-lg font-bold text-slate-900">
                    {item.word}
                  </span>
                  <span className="font-mono text-xs text-slate-500">
                    {item.pronunciation}
                  </span>
                  <span className="text-xs text-slate-400">·</span>
                  <span className="text-xs font-medium text-slate-500">
                    {item.partOfSpeech}
                  </span>
                  <span className="text-xs text-slate-400">·</span>
                  <span className="text-xs text-slate-500">{item.category}</span>
                  {item.isCustom && (
                    <>
                      <span className="text-xs text-slate-400">·</span>
                      <span className="text-xs font-medium text-indigo-600">
                        Custom
                      </span>
                    </>
                  )}
                </div>
                <p className="mt-1 line-clamp-2 text-sm text-slate-600">
                  {item.definition}
                </p>
              </button>

              <div className="flex shrink-0 items-center justify-between gap-3 sm:justify-end">
                {/* Explicit Icon + Text Status Indicator (never hue-only) */}
                <span
                  className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
                    item.masteryStatus === 'mastered'
                      ? 'text-emerald-700'
                      : item.masteryStatus === 'learning'
                        ? 'text-amber-700'
                        : 'text-slate-500'
                  }`}
                >
                  {item.masteryStatus === 'mastered' ? (
                    <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                  ) : item.masteryStatus === 'learning' ? (
                    <Clock className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Sparkles className="h-4 w-4" aria-hidden="true" />
                  )}
                  <span>
                    {item.masteryStatus === 'mastered'
                      ? 'Mastered'
                      : item.masteryStatus === 'learning'
                        ? 'Learning'
                        : 'New'}
                  </span>
                </span>

                <div className="flex items-center gap-1 border-l border-slate-200 pl-3">
                  <button
                    type="button"
                    onClick={() => speakWord(item.word)}
                    aria-label={`Pronounce ${item.word}`}
                    className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-indigo-700"
                  >
                    <Volume2 className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onToggleBookmark(item.id)}
                    aria-label={
                      item.isBookmarked
                        ? `Remove bookmark for ${item.word}`
                        : `Bookmark ${item.word}`
                    }
                    className={`rounded-lg p-2 transition-colors hover:bg-slate-100 ${
                      item.isBookmarked
                        ? 'text-amber-500'
                        : 'text-slate-400 hover:text-slate-700'
                    }`}
                  >
                    <Bookmark
                      className="h-4 w-4"
                      fill={item.isBookmarked ? 'currentColor' : 'none'}
                    />
                  </button>
                  {item.isCustom && (
                    <>
                      <button
                        type="button"
                        onClick={() => onEditWord(item)}
                        aria-label={`Edit ${item.word}`}
                        className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-indigo-700"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteWord(item.id)}
                        aria-label={`Delete ${item.word}`}
                        className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-rose-50 hover:text-rose-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Word Detail Inspector Modal */}
      {selectedWord && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-labelledby="word-detail-title"
          onClick={() => setSelectedWordId(null)}
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <div className="text-xs font-medium text-slate-500">
                  {selectedWord.category} · {selectedWord.partOfSpeech}
                </div>
                <div className="mt-1 flex items-center gap-2.5">
                  <h2
                    id="word-detail-title"
                    className="font-display text-2xl font-bold text-slate-900"
                  >
                    {selectedWord.word}
                  </h2>
                  <button
                    type="button"
                    onClick={() => speakWord(selectedWord.word)}
                    aria-label={`Pronounce ${selectedWord.word}`}
                    className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-indigo-700"
                  >
                    <Volume2 className="h-5 w-5" />
                  </button>
                </div>
                <p className="font-mono text-sm text-slate-500">
                  {selectedWord.pronunciation}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedWordId(null)}
                aria-label="Close word details"
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <div className="text-xs font-semibold text-slate-400">
                  Definition
                </div>
                <p className="mt-1 text-base leading-relaxed text-slate-900">
                  {selectedWord.definition}
                </p>
              </div>

              <div>
                <div className="text-xs font-semibold text-slate-400">
                  Example Sentence
                </div>
                <p className="mt-1 text-sm leading-relaxed text-slate-700 italic">
                  &ldquo;{selectedWord.exampleSentence}&rdquo;
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-4">
                <div>
                  <div className="text-xs font-semibold text-emerald-700">
                    Synonym
                  </div>
                  <p className="mt-0.5 text-sm font-medium text-slate-900">
                    {selectedWord.synonym}
                  </p>
                </div>
                <div>
                  <div className="text-xs font-semibold text-amber-700">
                    Antonym
                  </div>
                  <p className="mt-0.5 text-sm font-medium text-slate-900">
                    {selectedWord.antonym}
                  </p>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4">
                <div className="mb-2 text-xs font-semibold text-slate-500">
                  Mastery Status
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {(['new', 'learning', 'mastered'] as MasteryStatus[]).map(
                    (status) => (
                      <button
                        key={status}
                        type="button"
                        onClick={() =>
                          onSetMasteryStatus(selectedWord.id, status)
                        }
                        className={`rounded-lg border px-3 py-2 text-xs font-semibold capitalize transition-colors ${
                          selectedWord.masteryStatus === status
                            ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {status}
                      </button>
                    )
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => onToggleBookmark(selectedWord.id)}
                className={`inline-flex items-center gap-1.5 text-sm font-semibold ${
                  selectedWord.isBookmarked
                    ? 'text-amber-600'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Bookmark
                  className="h-4 w-4"
                  fill={selectedWord.isBookmarked ? 'currentColor' : 'none'}
                />
                <span>
                  {selectedWord.isBookmarked ? 'Bookmarked' : 'Bookmark Word'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onStudySelectedWords([selectedWord.id]);
                  setSelectedWordId(null);
                }}
                className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                Practice Flashcard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
