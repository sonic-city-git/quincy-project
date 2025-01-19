import { Input } from "@/components/ui/input";
import { useEffect, useRef, useState } from "react";
import { MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface LocationInputProps {
  value: string;
  onChange: (value: string) => void;
}

const SCRIPT_ID = 'google-maps-script';
const SCRIPT_LOADED_KEY = 'google-maps-script-loaded';

export function LocationInput({ value, onChange }: LocationInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const autocompleteInstance = useRef<google.maps.places.Autocomplete | null>(null);
  const [internalValue, setInternalValue] = useState(value);

  useEffect(() => {
    const fetchApiKey = async () => {
      try {
        const { data: { GOOGLE_MAPS_API_KEY }, error } = await supabase.functions.invoke('get-secret', {
          body: { secretName: 'GOOGLE_MAPS_API_KEY' }
        });

        if (error || !GOOGLE_MAPS_API_KEY) {
          console.error('Error fetching Google Maps API key:', error);
          setError('Could not load location search');
          return;
        }

        setApiKey(GOOGLE_MAPS_API_KEY);
      } catch (err) {
        console.error('Error in fetchApiKey:', err);
        setError('Failed to initialize location search');
      }
    };

    // Only fetch API key if it hasn't been loaded before
    if (!window[SCRIPT_LOADED_KEY]) {
      fetchApiKey();
    } else {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!apiKey || window[SCRIPT_LOADED_KEY]) return;

    const loadGoogleMapsScript = () => {
      // Remove any existing script
      const existingScript = document.getElementById(SCRIPT_ID);
      if (existingScript) {
        document.head.removeChild(existingScript);
      }

      const script = document.createElement('script');
      script.id = SCRIPT_ID;
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initGoogleMaps`;
      script.async = true;
      script.defer = true;

      // Define the callback function
      window.initGoogleMaps = () => {
        window[SCRIPT_LOADED_KEY] = true;
        setIsLoaded(true);
      };

      script.onerror = (e) => {
        console.error('Failed to load Google Maps API:', e);
        setError('Failed to load location search');
        if (script.parentNode) {
          script.parentNode.removeChild(script);
        }
      };

      document.head.appendChild(script);
    };

    loadGoogleMapsScript();

    return () => {
      // Cleanup callback
      delete window.initGoogleMaps;
    };
  }, [apiKey]);

  useEffect(() => {
    if (!isLoaded || !inputRef.current || error) return;

    try {
      if (autocompleteInstance.current) {
        google.maps.event.clearInstanceListeners(autocompleteInstance.current);
      }

      const options: google.maps.places.AutocompleteOptions = {
        types: ['(cities)'],
        fields: ['formatted_address', 'name'],
      };

      autocompleteInstance.current = new google.maps.places.Autocomplete(inputRef.current, options);

      if (inputRef.current) {
        inputRef.current.setAttribute('autocomplete', 'off');
      }

      autocompleteInstance.current.addListener('place_changed', () => {
        const place = autocompleteInstance.current?.getPlace();
        if (place?.name) {
          setInternalValue(place.name);
          onChange(place.name);
        }
      });

    } catch (err) {
      console.error('Error initializing Google Places Autocomplete:', err);
      setError('Failed to initialize location search');
      toast.error('Failed to initialize location search');
    }

    return () => {
      if (autocompleteInstance.current) {
        google.maps.event.clearInstanceListeners(autocompleteInstance.current);
      }
    };
  }, [isLoaded, onChange, error]);

  useEffect(() => {
    setInternalValue(value);
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInternalValue(newValue);
    onChange(newValue);
  };

  return (
    <div className="relative">
      <MapPin className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        ref={inputRef}
        placeholder={error || "Enter location"}
        value={internalValue}
        onChange={handleInputChange}
        className="pl-8"
        disabled={!!error}
      />
    </div>
  );
}

// Add type declaration for the window object
declare global {
  interface Window {
    initGoogleMaps: () => void;
    [key: string]: any;
  }
}