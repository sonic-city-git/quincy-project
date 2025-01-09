export function RatesHeader() {
  return (
    <div className="flex items-center px-3">
      <div className="w-[200px]" />
      <div className="grid grid-cols-[200px,200px,1fr] gap-6">
        <span className="text-xs text-muted-foreground pl-1">Daily rate</span>
        <span className="text-xs text-muted-foreground pl-1">Hourly rate</span>
        <span className="text-xs text-muted-foreground pl-1">Preferred crew</span>
      </div>
    </div>
  );
}