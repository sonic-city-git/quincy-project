interface RoleInfoProps {
  quantity: number;
  color: string;
  name: string;
}

export function RoleInfo({ quantity, color, name }: RoleInfoProps) {
  return (
    <div className="flex items-center gap-2 min-w-[200px]">
      <span className="text-sm text-muted-foreground">{quantity}×</span>
      <div
        className="w-2 h-2 rounded-full"
        style={{ backgroundColor: color }}
      />
      <h3 className="text-sm font-medium">{name}</h3>
    </div>
  );
}