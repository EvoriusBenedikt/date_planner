export default function Loading() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="h-16 rounded-2xl bg-stone-200/70" />
      <div className="flex gap-2">
        <div className="h-8 w-16 rounded-full bg-stone-200/70" />
        <div className="h-8 w-20 rounded-full bg-stone-200/70" />
        <div className="h-8 w-16 rounded-full bg-stone-200/70" />
      </div>
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
        <div className="h-64 rounded-2xl bg-stone-200/70" />
        <div className="h-64 rounded-2xl bg-stone-200/70" />
      </div>
    </div>
  );
}
