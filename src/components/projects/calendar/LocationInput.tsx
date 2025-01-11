import { Input } from "@/components/ui/input";
import { useEffect, useRef, useState } from "react";
import { MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface LocationInputProps {
  value: string;
  onChange: (value: string) => void;
}

export function LocationInput({ value, onChange }: LocationInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scriptId = 'google-maps-script';
  const [apiKey, setApiKey] = useState<string | null>(null);

  useEffect(() => {
    const fetchApiKey = async () => {
      const { data: { GOOGLE_MAPS_API_KEY }, error } = await supabase.functions.invoke('get-secret', {
        body: { secretName: 'GOOGLE_MAPS_API_KEY' }
      });

      if (error || !GOOGLE_MAPS_API_KEY) {
        console.error('Error fetching Google Maps API key:', error);
        setError('Could not load location search');
        return;
      }

      setApiKey(GOOGLE_MAPS_API_KEY);
    };

    fetchApiKey();
  }, []);

  useEffect(() => {
    if (!apiKey) return;

    // Check if script already exists
    if (document.getElementById(scriptId)) {
      setIsLoaded(true);
      return;
    }

    // Load Google Maps JavaScript API
    const script = document.createElement('script');
    script.id = scriptId;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&loading=async`;
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      console.log('Google Maps script loaded successfully');
      setIsLoaded(true);
    };

    script.onerror = () => {
      console.error('Failed to load Google Maps API');
      setError('Failed to load location search');
      document.head.removeChild(script);
    };

    document.head.appendChild(script);

    return () => {
      // Only remove the script if it was added by this component
      const scriptElement = document.getElementById(scriptId);
      if (scriptElement && scriptElement.parentNode === document.head) {
        document.head.removeChild(scriptElement);
      }
    };
  }, [apiKey]);

  useEffect(() => {
    if (isLoaded && inputRef.current && !error) {
      try {
        const autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
          types: ['(cities)'],
          fields: ['formatted_address', 'name'],
        });

        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace();
          if (place.name) {
            onChange(place.name);
          }
        });
      } catch (err) {
        console.error('Error initializing Google Places Autocomplete:', err);
        setError('Failed to initialize location search');
      }
    }
  }, [isLoaded, onChange, error]);

  return (
    <div className="relative">
      <MapPin className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        ref={inputRef}
        placeholder={error || "Enter location"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-8"
        disabled={!!error}
      />
    </div>
  );
}