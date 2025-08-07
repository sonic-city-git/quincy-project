import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PlaceResult {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
  types: string[];
}

interface CityData {
  city: string;
  country: string;
  displayName: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  placeId: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, sessionToken } = await req.json();
    
    if (!query || query.trim().length < 2) {
      return new Response(
        JSON.stringify({ error: 'Query must be at least 2 characters' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      );
    }

    const googleApiKey = Deno.env.get('GOOGLE_MAPS_API_KEY');
    
    if (!googleApiKey) {
      return new Response(
        JSON.stringify({ error: 'Google Maps API key not configured' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      );
    }

    // Step 1: Get city suggestions using Autocomplete API
    const autocompleteUrl = new URL('https://maps.googleapis.com/maps/api/place/autocomplete/json');
    autocompleteUrl.searchParams.set('input', query);
    autocompleteUrl.searchParams.set('types', '(cities)'); // Focus on cities only
    autocompleteUrl.searchParams.set('key', googleApiKey);
    
    // Use session token for cost optimization
    if (sessionToken) {
      autocompleteUrl.searchParams.set('sessiontoken', sessionToken);
    }

    console.log('Fetching city suggestions for:', query);
    
    const autocompleteResponse = await fetch(autocompleteUrl.toString());
    
    if (!autocompleteResponse.ok) {
      const errorText = await autocompleteResponse.text();
      console.error('Google Autocomplete API error:', errorText);
      throw new Error(`Google API error: ${autocompleteResponse.status}`);
    }

    const autocompleteData = await autocompleteResponse.json();
    
    if (autocompleteData.status !== 'OK' && autocompleteData.status !== 'ZERO_RESULTS') {
      console.error('Google API status error:', autocompleteData.status, autocompleteData.error_message);
      throw new Error(`Google API status: ${autocompleteData.status}`);
    }

    const predictions: PlaceResult[] = autocompleteData.predictions || [];
    
    // Filter and format city results
    const cityResults = predictions
      .filter((place: PlaceResult) => 
        place.types.includes('locality') || 
        place.types.includes('administrative_area_level_1')
      )
      .slice(0, 8) // Limit to 8 results for better UX
      .map((place: PlaceResult) => ({
        placeId: place.place_id,
        displayName: place.description,
        mainText: place.structured_formatting?.main_text || '',
        secondaryText: place.structured_formatting?.secondary_text || '',
      }));

    return new Response(
      JSON.stringify({ 
        cities: cityResults,
        status: 'success'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in city-places function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        status: 'error'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});