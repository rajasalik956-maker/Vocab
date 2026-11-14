import { BookOpen, Brain, GraduationCap, LayoutDashboard, Plus } from 'lucide-react';
import { ActiveView } from '../types/vocab';

interface NavbarProps {
  activeView: ActiveView;
  onNavigate: (view: ActiveView) => void;
  onOpenAddWord: () => void;
}

const NAV_ITEMS: { id: ActiveView; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'flashcards', label: 'Flashcards', icon: BookOpen },
  { id: 'quiz', label: 'Quiz', icon: GraduationCap },
  { id: 'library', label: 'Library', icon: Brain },
];

export function Navbar({ activeView, onNavigate, onOpenAddWord }: NavbarProps) {
  return (
    <>
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-8 px-4 py-3.5 sm:px-6">
          <button
            type="button"
            onClick={() => onNavigate('dashboard')}
            className="font-display shrink-0 whitespace-nowrap text-xl font-bold tracking-tight text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-indigo-600"
          >
            VocabFlow
          </button>

          <nav
            aria-label="Primary Navigation"
            className="hidden items-center gap-7 md:flex"
          >
            {NAV_ITEMS.map((item) => {
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onNavigate(item.id)}
                  className={`relative shrink-0 whitespace-nowrap py-1.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-indigo-600 ${
                    isActive
                      ? 'text-indigo-700'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {item.label}
                  {isActive && (
                    <span
                      aria-hidden="true"
                      className="absolute inset-x-0 -bottom-[15px] h-0.5 bg-indigo-600"
                    />
                  )}
                </button>
              );
            })}
          </nav>

          <div className="shrink-0">
            <button
              type="button"
              onClick={onOpenAddWord}
              className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              <span>Add Word</span>
            </button>
          </div>
        </div>
      </header>

      <nav
        aria-label="Mobile Navigation"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white md:hidden"
      >
        <div className="grid grid-cols-4">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.id)}
                className={`flex min-h-[56px] flex-col items-center justify-center gap-1 px-2 py-2 text-xs font-medium transition-colors ${
                  isActive
                    ? 'text-indigo-700'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
                <span className="whitespace-nowrap">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
