'use client';

import { useState } from 'react';
import { generateShortlistCsv } from '@/lib/exportShortlist';
import type { IdeaWithScore } from '@/lib/types';

export function ShortlistExportButton({ items }: { items: IdeaWithScore[] }) {
  const [status, setStatus] = useState<string | null>(null);

  const handleExport = () => {
    try {
      const shortlistedItems = items.filter(i => i.shortlisted);
      const csvData = generateShortlistCsv(shortlistedItems);
      
      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `shortlist_hexavia_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setStatus('Export réussi !');
    } catch {
      setStatus("Erreur lors de l'export.");
    }
  };

  const count = items.filter(i => i.shortlisted).length;

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={handleExport}
        disabled={count === 0}
        className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
      >
        📥 Exporter la Shortlist ({count} idées)
      </button>
      {status && <span className="text-sm opacity-80">{status}</span>}
    </div>
  );
}