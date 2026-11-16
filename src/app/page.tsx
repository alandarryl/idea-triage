import { Suspense } from 'react';
import { getIdeasWithScores } from '@/lib/ideas';
import { IdeasTable } from '@/components/IdeasTable';
import { ImportButton } from '@/components/ImportButton';
import { LogoutButton } from '@/components/LogoutButton';

async function IdeasSection() {
  const ideas = await getIdeasWithScores();
  return <IdeasTable ideas={ideas} />;
}

export default function Home() {
  return (
    <main className="min-h-screen bg-[#FBFBFA] text-zinc-900 selection:bg-zinc-900 selection:text-white dark:bg-[#09090B] dark:text-zinc-50">
      <header className="border-b border-zinc-200/80 bg-white/65 backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-900/65 sticky top-0 z-30">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded bg-zinc-900 text-xs font-semibold tracking-tighter text-white dark:bg-zinc-100 dark:text-zinc-900">
              HX
            </span>
            <div>
              <span className="text-xs font-medium uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                Hexavia — Innovation
              </span>
              <h1 className="text-sm font-medium tracking-tight text-zinc-900 dark:text-zinc-100">
                Évaluation des dossiers
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ImportButton />
            <LogoutButton />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-10">
        <Suspense
          fallback={
            <div className="py-24 text-center text-sm text-zinc-400">
              Chargement des dossiers en cours…
            </div>
          }
        >
          <IdeasSection />
        </Suspense>
      </div>
    </main>
  );
}