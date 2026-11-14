import { FormEvent, useEffect, useState } from 'react';
import { X } from 'lucide-react';
import {
  NewWordInput,
  PRESET_CATEGORIES,
  PartOfSpeech,
  VocabWord,
} from '../types/vocab';

interface AddWordModalProps {
  isOpen: boolean;
  editingWord?: VocabWord | null;
  availableCategories: string[];
  onClose: () => void;
  onSave: (input: NewWordInput, existingId?: string) => void;
}

const PARTS_OF_SPEECH: PartOfSpeech[] = [
  'Noun',
  'Verb',
  'Adjective',
  'Adverb',
  'Other',
];

export function AddWordModal({
  isOpen,
  editingWord,
  availableCategories,
  onClose,
  onSave,
}: AddWordModalProps) {
  const [word, setWord] = useState('');
  const [pronunciation, setPronunciation] = useState('');
  const [partOfSpeech, setPartOfSpeech] = useState<PartOfSpeech>('Adjective');
  const [categoryMode, setCategoryMode] = useState<'existing' | 'custom'>('existing');
  const [selectedCategory, setSelectedCategory] = useState<string>(PRESET_CATEGORIES[0]);
  const [customCategory, setCustomCategory] = useState('');
  const [definition, setDefinition] = useState('');
  const [exampleSentence, setExampleSentence] = useState('');
  const [synonym, setSynonym] = useState('');
  const [antonym, setAntonym] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    if (editingWord) {
      setWord(editingWord.word);
      setPronunciation(editingWord.pronunciation);
      setPartOfSpeech(editingWord.partOfSpeech);
      if (availableCategories.includes(editingWord.category)) {
        setCategoryMode('existing');
        setSelectedCategory(editingWord.category);
      } else {
        setCategoryMode('custom');
        setCustomCategory(editingWord.category);
      }
      setDefinition(editingWord.definition);
      setExampleSentence(editingWord.exampleSentence);
      setSynonym(editingWord.synonym === '—' ? '' : editingWord.synonym);
      setAntonym(editingWord.antonym === '—' ? '' : editingWord.antonym);
      setError('');
    } else {
      setWord('');
      setPronunciation('');
      setPartOfSpeech('Adjective');
      setCategoryMode('existing');
      setSelectedCategory(availableCategories[0] || PRESET_CATEGORIES[0]);
      setCustomCategory('');
      setDefinition('');
      setExampleSentence('');
      setSynonym('');
      setAntonym('');
      setError('');
    }
  }, [isOpen, editingWord, availableCategories]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmedWord = word.trim();
    const trimmedDef = definition.trim();
    const finalCategory =
      categoryMode === 'custom'
        ? customCategory.trim() || 'Custom Deck'
        : selectedCategory;

    if (!trimmedWord) {
      setError('Please enter a vocabulary word.');
      return;
    }
    if (!trimmedDef) {
      setError('Please enter a clear definition.');
      return;
    }

    onSave(
      {
        word: trimmedWord,
        pronunciation: pronunciation.trim(),
        partOfSpeech,
        definition: trimmedDef,
        exampleSentence:
          exampleSentence.trim() ||
          `Using "${trimmedWord.toLowerCase()}" accurately strengthens academic writing.`,
        synonym: synonym.trim(),
        antonym: antonym.trim(),
        category: finalCategory,
      },
      editingWord?.id
    );
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-word-modal-title"
    >
      <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <h2
            id="add-word-modal-title"
            className="font-display text-xl font-semibold text-slate-900"
          >
            {editingWord ? 'Edit Vocabulary Word' : 'Add Custom Word'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {error && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm font-medium text-rose-700">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="word-input"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Word <span className="text-rose-600">*</span>
              </label>
              <input
                id="word-input"
                type="text"
                value={word}
                onChange={(e) => setWord(e.target.value)}
                placeholder="e.g. Perspicacious"
                className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
                autoFocus
              />
            </div>

            <div>
              <label
                htmlFor="pronunciation-input"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Pronunciation (optional)
              </label>
              <input
                id="pronunciation-input"
                type="text"
                value={pronunciation}
                onChange={(e) => setPronunciation(e.target.value)}
                placeholder="e.g. /ˌpɜː.spɪˈkeɪ.ʃəs/"
                className="w-full rounded-lg border border-slate-300 px-3.5 py-2 font-mono text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="pos-select"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Part of Speech
              </label>
              <select
                id="pos-select"
                value={partOfSpeech}
                onChange={(e) => setPartOfSpeech(e.target.value as PartOfSpeech)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
              >
                {PARTS_OF_SPEECH.map((pos) => (
                  <option key={pos} value={pos}>
                    {pos}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label
                  htmlFor="category-select"
                  className="text-sm font-medium text-slate-700"
                >
                  Category
                </label>
                <button
                  type="button"
                  onClick={() =>
                    setCategoryMode((prev) =>
                      prev === 'existing' ? 'custom' : 'existing'
                    )
                  }
                  className="text-xs font-medium text-indigo-600 hover:text-indigo-700"
                >
                  {categoryMode === 'existing' ? '+ New category' : 'Choose existing'}
                </button>
              </div>
              {categoryMode === 'existing' ? (
                <select
                  id="category-select"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
                >
                  {availableCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                  {!availableCategories.includes('Custom Deck') && (
                    <option value="Custom Deck">Custom Deck</option>
                  )}
                </select>
              ) : (
                <input
                  id="category-select"
                  type="text"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  placeholder="e.g. Biology Terms"
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
                />
              )}
            </div>
          </div>

          <div>
            <label
              htmlFor="definition-input"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              Definition <span className="text-rose-600">*</span>
            </label>
            <textarea
              id="definition-input"
              rows={2}
              value={definition}
              onChange={(e) => setDefinition(e.target.value)}
              placeholder="Having a ready insight into and understanding of complex things."
              className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
            />
          </div>

          <div>
            <label
              htmlFor="example-input"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              Example Sentence
            </label>
            <textarea
              id="example-input"
              rows={2}
              value={exampleSentence}
              onChange={(e) => setExampleSentence(e.target.value)}
              placeholder="Her perspicacious analysis spotted the flaw in the budget immediately."
              className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="synonym-input"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Synonym
              </label>
              <input
                id="synonym-input"
                type="text"
                value={synonym}
                onChange={(e) => setSynonym(e.target.value)}
                placeholder="e.g. Astute"
                className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
              />
            </div>

            <div>
              <label
                htmlFor="antonym-input"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Antonym
              </label>
              <input
                id="antonym-input"
                type="text"
                value={antonym}
                onChange={(e) => setAntonym(e.target.value)}
                placeholder="e.g. Obtuse"
                className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
            >
              {editingWord ? 'Save Changes' : 'Save Word'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
