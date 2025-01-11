import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarEvent, EventType } from "@/types/events";
import { LocationInput } from "./LocationInput";
import { getStatusIcon } from "@/utils/eventFormatters";

interface EventFormProps {
  name: string;
  setName: (name: string) => void;
  selectedType: string;
  setSelectedType: (type: string) => void;
  status: CalendarEvent['status'];
  setStatus: (status: CalendarEvent['status']) => void;
  location: string;
  setLocation: (location: string) => void;
  eventTypes: EventType[];
  isNameRequired: boolean;
}

const EVENT_STATUSES = ['proposed', 'confirmed', 'invoice ready', 'cancelled'] as const;

export function EventForm({
  name,
  setName,
  selectedType,
  setSelectedType,
  status,
  setStatus,
  location,
  setLocation,
  eventTypes,
  isNameRequired,
}: EventFormProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Input
          placeholder={isNameRequired ? "Event name (required)" : "Event name"}
          value={name}
          onChange={(e) => setName(e.target.value)}
          required={isNameRequired}
        />
      </div>

      <LocationInput 
        value={location}
        onChange={setLocation}
      />

      <Select
        value={selectedType}
        onValueChange={(value) => setSelectedType(value)}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select event type" />
        </SelectTrigger>
        <SelectContent>
          {eventTypes.map((type) => (
            <SelectItem key={type.id} value={type.id}>
              {type.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={status}
        onValueChange={(value) => setStatus(value as CalendarEvent['status'])}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select status" />
        </SelectTrigger>
        <SelectContent>
          {EVENT_STATUSES.map((statusOption) => (
            <SelectItem 
              key={statusOption} 
              value={statusOption}
              className="flex items-center gap-2 w-full"
            >
              <div className="flex items-center gap-2 min-w-0">
                {getStatusIcon(statusOption)}
                <span className="truncate">
                  {statusOption.charAt(0).toUpperCase() + statusOption.slice(1)}
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}