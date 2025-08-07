/**
 * City Location Input - Supabase Edge Function integration focused on cities
 * Optimized for entertainment industry logistics (crew travel, equipment transport)
 * Uses Supabase Edge Functions for secure Google Places API access
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { FormLabel, FormDescription, FormMessage } from '@/components/ui/form';
import { MapPin, Loader2, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { FORM_PATTERNS } from '@/design-system';

interface CityLocationData {
  city: string;
  country: string;
  displayName: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  placeId: string;
}

interface CityResult {
  placeId: string;
  displayName: string;
  mainText: string;
  secondaryText: string;
}

interface CityLocationInputProps {
  value?: string;
  onChange: (value: string, cityData?: CityLocationData) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  required?: boolean;
  className?: string;
  showLabel?: boolean;
  description?: string;
}

export function CityLocationInput({
  value = '',
  onChange,
  placeholder = "Search for a city...",
  disabled = false,
  error,
  required = false,
  className,
  showLabel = true,
  description = "Start typing to search for cities worldwide"
}: CityLocationInputProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [cityResults, setCityResults] = useState<CityResult[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [sessionToken] = useState(() => Math.random().toString(36).substring(2));
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isSelectingRef = useRef(false);
  
  // Debounced search function
  const searchCities = useCallback(async (query: string) => {
    if (!query || query.trim().length < 2) {
      setCityResults([]);
      setShowDropdown(false);
      return;
    }

    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('city-places', {
        body: { 
          query: query.trim(),
          sessionToken 
        }
      });

      if (error) {
        console.error('City search error:', error);
        // Show error message to user but don't prevent manual typing
        setCityResults([]);
        return;
      }

      if (data?.cities) {
        setCityResults(data.cities);
        setShowDropdown(data.cities.length > 0);
      }
    } catch (error) {
      console.error('City search failed:', error);
      // Graceful fallback - just hide dropdown but allow manual input
      setCityResults([]);
      setShowDropdown(false);
    } finally {
      setIsLoading(false);
    }
  }, [sessionToken]);

  // Debounced search calls
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      // Check if we're selecting a city at the time of search
      if (isSelectingRef.current) {
        isSelectingRef.current = false;
        return;
      }
      searchCities(value);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [value, searchCities]);

  // Handle city selection
  const handleCitySelect = async (city: CityResult) => {
    // Immediately clear results and close dropdown to prevent visual issues
    setCityResults([]);
    setShowDropdown(false);
    setHighlightedIndex(-1);
    setIsLoading(true);
    isSelectingRef.current = true; // Prevent search from triggering
    
    try {
      // Get detailed city information
      const { data, error } = await supabase.functions.invoke('city-details', {
        body: { 
          placeId: city.placeId,
          sessionToken 
        }
      });

      if (error) {
        console.error('City details error:', error);
        onChange(city.displayName);
        return;
      }

      if (data?.cityDetails) {
        onChange(data.cityDetails.displayName, data.cityDetails);
      } else {
        onChange(city.displayName);
      }
    } catch (error) {
      console.error('City details failed:', error);
      onChange(city.displayName);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle manual text input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    onChange(inputValue);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown || cityResults.length === 0) {
      if (e.key === 'ArrowDown' && cityResults.length > 0) {
        e.preventDefault();
        setShowDropdown(true);
        setHighlightedIndex(0);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < cityResults.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => prev > 0 ? prev - 1 : prev);
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < cityResults.length) {
          handleCitySelect(cityResults[highlightedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setShowDropdown(false);
        setHighlightedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  // Reset highlighted index when results change
  useEffect(() => {
    setHighlightedIndex(-1);
  }, [cityResults]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={cn("space-y-2", className)}>
      {showLabel && (
        <FormLabel className="flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          Location {required && <span className="text-destructive">*</span>}
        </FormLabel>
      )}
      
      <div className="relative" ref={dropdownRef}>
        <Input
          ref={inputRef}
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => value.length >= 2 && setShowDropdown(cityResults.length > 0)}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            FORM_PATTERNS.input.withIcon,
            "pr-10",
            error && "border-destructive focus-visible:ring-destructive",
            required && !value && "border-orange-200 focus-visible:ring-orange-200"
          )}
          autoComplete="off"
          role="combobox"
          aria-expanded={showDropdown}
          aria-autocomplete="list"
          aria-activedescendant={highlightedIndex >= 0 ? `city-option-${highlightedIndex}` : undefined}
        />
        
        <div className="absolute left-3 top-1/2 -translate-y-1/2">
          {isLoading && cityResults.length > 0 ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : (
            <MapPin className="h-4 w-4 text-muted-foreground" />
          )}
        </div>

        {showDropdown && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </div>
        )}

        {/* City suggestions dropdown */}
        {showDropdown && cityResults.length > 0 && (
          <div className={cn(
            FORM_PATTERNS.dropdown.content,
            "absolute top-full left-0 right-0 z-50 mt-1 max-h-64 overflow-auto"
          )}>
            {cityResults.map((city, index) => (
              <button
                key={city.placeId}
                id={`city-option-${index}`}
                onClick={() => handleCitySelect(city)}
                onMouseEnter={() => setHighlightedIndex(index)}
                className={cn(
                  FORM_PATTERNS.dropdown.item,
                  "w-full text-left",
                  index === highlightedIndex && FORM_PATTERNS.dropdown.itemSelected,
                  isLoading && "pointer-events-none opacity-50"
                )}
                disabled={isLoading}
                role="option"
                aria-selected={index === highlightedIndex}
              >
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{city.mainText}</div>
                    {city.secondaryText && (
                      <div className="text-sm text-muted-foreground truncate">{city.secondaryText}</div>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {description && (
        <FormDescription>
          {description}
        </FormDescription>
      )}

      {error && <FormMessage>{error}</FormMessage>}
    </div>
  );
}