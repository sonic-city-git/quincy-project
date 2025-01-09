export function RatesHeader() {
  return (
    <div className="flex items-center px-3">
      <div className="min-w-[232px]" />
      <div className="grid grid-cols-[1fr,1fr,1fr] gap-6 flex-grow">
        <span className="text-xs text-muted-foreground">Daily rate</span>
        <span className="text-xs text-muted-foreground">Hourly rate</span>
        <span className="text-xs text-muted-foreground">Preferred crew</span>
      </div>
    </div>
  );
}