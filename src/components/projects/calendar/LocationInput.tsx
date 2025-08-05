import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

declare global {
  interface Window {
    google: any;
    initGoogleMaps: () => void;
  }
}

interface LocationInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function LocationInput({ value, onChange, disabled }: LocationInputProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteInstance = useRef<any>(null);
  const [apiKey, setApiKey] = useState<string | null>(null);

  useEffect(() => {
    const fetchApiKey = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-secret', {
          body: { key: 'GOOGLE_MAPS_API_KEY' }
        });

        if (error) {
          console.error('Error fetching Google Maps API key:', error);
          throw error;
        }
        
        if (!data?.secret) {
          throw new Error('No API key returned');
        }
        
        setApiKey(data.secret);
      } catch (err) {
        console.error('Error fetching Google Maps API key:', err);
        setError('Failed to load location search');
      }
    };

    fetchApiKey();
  }, []);

  useEffect(() => {
    if (!apiKey || !inputRef.current) return;

    const loadGoogleMapsScript = () => {
      setIsLoading(true);
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initGoogleMaps`;
      script.async = true;
      script.defer = true;

      window.initGoogleMaps = () => {
        try {
          if (!inputRef.current) return;

          autocompleteInstance.current = new window.google.maps.places.Autocomplete(
            inputRef.current,
            { types: ['geocode', 'establishment'] }
          );

          const handlePlaceChanged = () => {
            try {
              const place = autocompleteInstance.current.getPlace();
              if (place.formatted_address) {
                onChange(place.formatted_address);
              }
            } catch (err) {
              console.error('Error handling place change:', err);
              setError('Error selecting location');
            }
          };

          autocompleteInstance.current.addListener('place_changed', handlePlaceChanged);
          setIsLoading(false);
          setError(null);
        } catch (err) {
          console.error('Error initializing Google Maps:', err);
          setError('Error initializing location search');
          setIsLoading(false);
        }
      };

      script.onerror = () => {
        console.error('Error loading Google Maps script');
        setError('Error loading location search');
        setIsLoading(false);
      };

      document.head.appendChild(script);
    };

    if (!window.google) {
      loadGoogleMapsScript();
    } else {
      window.initGoogleMaps();
    }

    return () => {
      if (autocompleteInstance.current) {
        window.google?.maps?.event?.clearInstanceListeners(autocompleteInstance.current);
      }
    };
  }, [apiKey, onChange]);

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Enter location"
        disabled={disabled || isLoading}
        className={error ? 'border-red-500' : ''}
      />
      {isLoading && (
        <div className="absolute right-2 top-1/2 -translate-y-1/2">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      )}
              {error && (
          <p className="mt-1 text-sm font-medium text-destructive">
            {error}
          </p>
        )}
    </div>
  );
}