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
      router.refresh(); // recharge la liste affichée
    } catch {
      setStatus({
        kind: 'error',
        message: 'Impossible de joindre le serveur. Vérifiez votre connexion.',
      });
    } finally {
      input.value = ''; // permet de re-sélectionner le même fichier
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
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
        className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
      >
        {status.kind === 'loading' ? 'Import en cours…' : 'Importer un fichier CSV'}
      </button>

      <div aria-live="polite" className="max-w-md text-right text-sm">
        {status.kind === 'success' && (
          <div>
            <p className="text-green-700 dark:text-green-400">
              {status.imported} idée(s) importée(s).
            </p>
            {status.skipped.length > 0 && (
              <ul className="mt-1 text-amber-700 dark:text-amber-400">
                {status.skipped.map((message) => (
                  <li key={message}>{message}</li>
                ))}
              </ul>
            )}
          </div>
        )}
        {status.kind === 'error' && (
          <p className="text-red-700 dark:text-red-400">{status.message}</p>
        )}
      </div>
    </div>
  );
}