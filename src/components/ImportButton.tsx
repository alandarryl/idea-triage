'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

type Status =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'success'; imported: number; skipped: string[] }
  | { kind: 'error'; message: string };

interface ImportResponse {
  error?: string;
  imported?: number;
  skipped?: string[];
}

export function ImportButton() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<Status>({ kind: 'idle' });

  async function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const input = event.target;
    const file = input.files?.[0];
    if (!file) return;

    setStatus({ kind: 'loading' });
    try {
      const text = await file.text();
      const response = await fetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        body: text,
      });
      const data: ImportResponse = await response.json();

      if (!response.ok) {
        setStatus({ kind: 'error', message: data.error ?? "L'import a échoué." });
        return;
      }
      setStatus({
        kind: 'success',
        imported: data.imported ?? 0,
        skipped: data.skipped ?? [],
      });
      router.refresh();
    } catch {
      setStatus({
        kind: 'error',
        message: 'Impossible de joindre le serveur.',
      });
    } finally {
      input.value = '';
    }
  }

  return (
    <div className="relative flex items-center gap-2">
      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv"
        onChange={handleFile}
        className="hidden"
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={status.kind === 'loading'}
        className="rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-900 shadow-2xs hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800 transition"
      >
        {status.kind === 'loading' ? 'Import…' : 'Importer CSV'}
      </button>

      {status.kind === 'success' && (
        <span className="text-xs text-emerald-600 dark:text-emerald-400">
          {status.imported} importés
        </span>
      )}
      {status.kind === 'error' && (
        <span className="text-xs text-rose-600 dark:text-rose-400">{status.message}</span>
      )}
    </div>
  );
}