export function RatesHeader() {
  return (
    <div className="flex items-center px-3">
      <div className="w-[200px]" />
      <div className="grid grid-cols-[200px,200px,1fr] gap-6">
        <span className="text-xs text-muted-foreground pl-1 flex items-center">Daily rate</span>
        <span className="text-xs text-muted-foreground pl-1 flex items-center -ml-[60px]">Hourly rate</span>
        <span className="text-xs text-muted-foreground pl-1 flex items-center -ml-[110px]">Preferred crew</span>
      </div>
    </div>
  );
}