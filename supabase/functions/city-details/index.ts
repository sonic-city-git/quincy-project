import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CityDetails {
  city: string;
  country: string;
  displayName: string;
  coordinates: {
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
    const { placeId, sessionToken } = await req.json();
    
    if (!placeId) {
      return new Response(
        JSON.stringify({ error: 'Place ID is required' }),
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

    // Step 2: Get detailed place information
    const detailsUrl = new URL('https://maps.googleapis.com/maps/api/place/details/json');
    detailsUrl.searchParams.set('place_id', placeId);
    detailsUrl.searchParams.set('fields', 'name,address_components,geometry,place_id');
    detailsUrl.searchParams.set('key', googleApiKey);
    
    // Use session token for cost optimization
    if (sessionToken) {
      detailsUrl.searchParams.set('sessiontoken', sessionToken);
    }

    console.log('Fetching city details for place ID:', placeId);
    
    const detailsResponse = await fetch(detailsUrl.toString());
    
    if (!detailsResponse.ok) {
      const errorText = await detailsResponse.text();
      console.error('Google Place Details API error:', errorText);
      throw new Error(`Google API error: ${detailsResponse.status}`);
    }

    const detailsData = await detailsResponse.json();
    
    if (detailsData.status !== 'OK') {
      console.error('Google API status error:', detailsData.status, detailsData.error_message);
      throw new Error(`Google API status: ${detailsData.status}`);
    }

    const place = detailsData.result;
    
    if (!place) {
      throw new Error('No place details found');
    }

    // Extract city and country from address components
    let city = '';
    let country = '';
    
    if (place.address_components) {
      place.address_components.forEach((component: any) => {
        const types = component.types;
        
        if (types.includes('locality')) {
          city = component.long_name;
        } else if (types.includes('administrative_area_level_1') && !city) {
          city = component.long_name;
        }
        
        if (types.includes('country')) {
          country = component.long_name;
        }
      });
    }

    // Fallback to place name if no city found
    if (!city) {
      city = place.name || '';
    }

    const displayName = city && country ? `${city}, ${country}` : place.name || '';
    
    const cityDetails: CityDetails = {
      city,
      country,
      displayName,
      coordinates: {
        lat: place.geometry?.location?.lat || 0,
        lng: place.geometry?.location?.lng || 0
      },
      placeId: place.place_id
    };

    return new Response(
      JSON.stringify({ 
        cityDetails,
        status: 'success'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in city-details function:', error);
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