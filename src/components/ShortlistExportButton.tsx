'use client';

import { useState } from 'react';
import { generateShortlistCsv } from '@/lib/exportShortlist';
import type { IdeaWithScore } from '@/lib/types';

export function ShortlistExportButton({ items }: { items: IdeaWithScore[] }) {
  const [status, setStatus] = useState<string | null>(null);

  const handleExport = () => {
    try {
      const shortlistedItems = items.filter((i) => i.shortlisted);
      const csvData = generateShortlistCsv(shortlistedItems);

      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute(
        'download',
        `shortlist_hexavia_${new Date().toISOString().slice(0, 10)}.csv`,
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setStatus('Exporté');
      setTimeout(() => setStatus(null), 2000);
    } catch {
      setStatus("Erreur d'export");
    }
  };

  const count = items.filter((i) => i.shortlisted).length;

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={handleExport}
        disabled={count === 0}
        className="rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white shadow-2xs hover:bg-zinc-800 disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 transition"
      >
        Exporter shortlist ({count})
      </button>
      {status && <span className="text-xs text-zinc-500">{status}</span>}
    </div>
  );
}