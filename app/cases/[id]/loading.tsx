export default function CaseDetailLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="space-y-3">
        <div className="h-9 w-72 max-w-full rounded-md bg-zinc-800" />
        <div className="h-4 w-24 rounded bg-zinc-800/80" />
      </div>
      <div className="h-32 rounded-lg border border-zinc-800 bg-zinc-900/40" />
      <div className="h-40 rounded-lg border border-zinc-800 bg-zinc-900/40" />
      <div className="h-24 rounded-lg border border-zinc-800 bg-zinc-900/30" />
    </div>
  );
}
