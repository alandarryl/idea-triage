import { Suspense } from 'react';
import { getIdeasWithScores } from '@/lib/ideas';
import { IdeasTable } from '@/components/IdeasTable';
import { ImportButton } from '@/components/ImportButton';

// Composant serveur : lit les idées à chaque requête.
// Il doit être entouré d'un <Suspense> (règle de Cache Components).
async function IdeasSection() {
  const ideas = await getIdeasWithScores();
  return <IdeasTable ideas={ideas} />;
}

export default function Home() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Tri des idées du challenge</h1>
          <p className="mt-1 text-sm opacity-70">
            Parcourez les idées déposées, filtrez-les, puis notez-les.
          </p>
        </div>
        <ImportButton />
      </header>

      <Suspense fallback={<p className="opacity-70">Chargement des idées…</p>}>
        <IdeasSection />
      </Suspense>
    </main>
  );
}