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

    fetchApiKey();
  }, []);

  useEffect(() => {
    if (!apiKey) return;

    const loadGoogleMapsScript = () => {
      const existingScript = document.getElementById(SCRIPT_ID);
      if (existingScript) {
        document.head.removeChild(existingScript);
      }

      window.initGoogleMaps = () => {
        setIsLoaded(true);
        console.log('Google Maps script loaded successfully');
      };

      const script = document.createElement('script');
      script.id = SCRIPT_ID;
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initGoogleMaps`;
      script.async = true;
      script.defer = true;

      script.onerror = () => {
        console.error('Failed to load Google Maps script');
        setError('Location search is temporarily unavailable');
        toast.error('Location search is temporarily unavailable. Please try again later.');
        if (script.parentNode) {
          script.parentNode.removeChild(script);
        }
      };

      document.head.appendChild(script);
    };

    if (!document.getElementById(SCRIPT_ID)) {
      loadGoogleMapsScript();
    }

    return () => {
      delete window.initGoogleMaps;
      const script = document.getElementById(SCRIPT_ID);
      if (script) {
        script.remove();
      }
    };
  }, [apiKey]);

  useEffect(() => {
    if (!isLoaded || !inputRef.current) return;

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

      const handlePlaceChanged = () => {
        const place = autocompleteInstance.current?.getPlace();
        if (place?.name) {
          setInternalValue(place.name);
          onChange(place.name);
        }
      };

      // Using the modern addEventListener approach instead of addDomListener
      autocompleteInstance.current.addListener('place_changed', handlePlaceChanged);

      return () => {
        if (autocompleteInstance.current) {
          google.maps.event.clearInstanceListeners(autocompleteInstance.current);
        }
      };
    } catch (err) {
      console.error('Error initializing Google Places Autocomplete:', err);
      setError('Location search initialization failed');
      toast.error('Location search is unavailable. Please type the location manually.');
    }
  }, [isLoaded, onChange]);

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
        placeholder={error ? "Enter location manually" : "Enter location"}
        value={internalValue}
        onChange={handleInputChange}
        className="pl-8"
      />
    </div>
  );
}

declare global {
  interface Window {
    initGoogleMaps: () => void;
    google: typeof google;
  }
}