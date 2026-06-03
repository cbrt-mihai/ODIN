export default function GraphLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="space-y-2">
        <div className="h-8 w-56 rounded-md bg-zinc-800" />
        <div className="h-4 max-w-xl rounded bg-zinc-900" />
      </div>
      <div className="h-[560px] rounded-lg border border-zinc-800 bg-zinc-900/50" />
    </div>
  );
}
