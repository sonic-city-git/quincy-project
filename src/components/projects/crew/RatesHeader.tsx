export function RatesHeader() {
  return (
    <div className="flex items-center px-3">
      <div className="min-w-[232px]" />
      <div className="flex items-center gap-6">
        <span className="text-xs text-muted-foreground w-24">Daily rate</span>
        <span className="text-xs text-muted-foreground w-24">Hourly rate</span>
      </div>
    </div>
  );
}