import { TAG_COLORS } from "@/types/crew";

interface RoleTagsProps {
  role: string;
}

export function RoleTags({ role }: RoleTagsProps) {
  if (!role) {
    return null;
  }
  
  const tags = role.split(", ");
  
  return (
    <div className="flex gap-1 whitespace-nowrap -ml-1">
      {tags.map((tag, index) => {
        const upperTag = tag.toUpperCase();
        return (
          <span
            key={index}
            className={`px-2 py-0.5 rounded text-xs font-medium ${TAG_COLORS[upperTag] || 'bg-zinc-700 text-white'}`}
          >
            {upperTag}
          </span>
        );
      })}
    </div>
  );
}