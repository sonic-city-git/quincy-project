interface RoleInfoProps {
  color: string;
  name: string;
}

export function RoleInfo({ color, name }: RoleInfoProps) {
  return (
    <div className="flex items-center gap-2 w-[200px]">
      <div
        className="h-2 w-2 rounded-full flex-shrink-0"
        style={{ backgroundColor: color }}
      />
      <span className="text-sm font-medium flex items-center">{name}</span>
    </div>
  );
}