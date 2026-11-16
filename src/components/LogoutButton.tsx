'use client';

export function LogoutButton() {
  const handleLogout = () => {
    document.cookie = 'idea_triage_auth=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    window.location.href = '/login';
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="rounded-md border border-black/20 px-3 py-1.5 text-sm font-medium hover:bg-black/5 dark:border-white/25 dark:hover:bg-white/10"
    >
      Se déconnecter
    </button>
  );
}