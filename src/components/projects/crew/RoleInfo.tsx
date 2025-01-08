interface RoleInfoProps {
  color: string;
  name: string;
}

export function RoleInfo({ color, name }: RoleInfoProps) {
  return (
    <div className="flex items-center gap-2 flex-1">
      <div
        className="h-2 w-2 rounded-full"
        style={{ backgroundColor: color }}
      />
      <span className="text-sm">{name}</span>
    </div>
  );
}