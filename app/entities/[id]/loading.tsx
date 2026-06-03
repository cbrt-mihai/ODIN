export default function EntityDetailLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="h-10 w-64 rounded-md bg-zinc-800" />
      <div className="space-y-4 rounded-lg border border-zinc-800 p-4">
        <div className="h-6 w-40 rounded bg-zinc-800" />
        <div className="h-24 rounded bg-zinc-900" />
        <div className="h-24 rounded bg-zinc-900" />
      </div>
      <div className="h-48 rounded-lg border border-zinc-800 bg-zinc-900/50" />
    </div>
  );
}
