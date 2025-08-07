# 🗺️ Google Places API Setup for QUINCY (Supabase Integration)

## Overview

QUINCY uses Google Places API through Supabase Edge Functions to provide secure city autocomplete functionality for event locations. This enhances the user experience by:

- **City-focused search**: Optimized for entertainment industry logistics
- **Global coverage**: Search cities worldwide
- **Structured data**: Automatically extracts city, country, and coordinates
- **Secure API access**: API keys managed in Supabase, not exposed to client
- **Cost optimization**: Session tokens and server-side caching

---

## Setup Instructions

### 1. Get Google Places API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing project
3. Enable the **Places API**:
   - Navigate to "APIs & Services" > "Library"
   - Search for "Places API"
   - Click "Enable"

### 2. Create API Key

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "API Key"
3. Copy the generated API key

### 3. Secure the API Key (Important!)

1. Click on your API key to edit it
2. Under "Application restrictions":
   - For development: Choose "HTTP referrers" and add `http://localhost:*/*`
   - For production: Add your domain (e.g., `https://quincy.soniccity.no/*`)
3. Under "API restrictions":
   - Choose "Restrict key"
   - Select "Places API"
4. Save changes

### 4. Verify Supabase Secret (Already Configured!)

✅ Your project already has `GOOGLE_MAPS_API_KEY` configured in Supabase secrets.

The city location functions will use this existing key. To verify:
```bash
supabase secrets list
```

If you need to update the key:
```bash
supabase secrets set GOOGLE_MAPS_API_KEY=your_updated_key_here
```

---

## Usage in QUINCY

### City Location Input Component

```tsx
import { CityLocationInput } from '@/components/shared/forms/CityLocationInput';

// In your form
<CityLocationInput
  value={locationValue}
  onChange={(displayName, cityData) => {
    // displayName: "Oslo, Norway"
    // cityData: { city: "Oslo", country: "Norway", coordinates: {...} }
    setLocation(displayName);
    if (cityData) {
      // Store structured data for future analytics
      setCityData(cityData);
    }
  }}
  placeholder="Search for a city..."
  required
/>
```

### Features

- **Auto-complete**: Start typing, get instant city suggestions
- **Global coverage**: Search any city worldwide
- **Structured data**: Extract city, country, coordinates automatically
- **Graceful fallback**: Works without API key (manual input)
- **Entertainment optimized**: Focus on cities for crew/equipment logistics

---

## Cost Considerations

### Google Places API Pricing (as of 2024)

- **Autocomplete - Per Session**: $2.83 per 1,000 sessions
- **Place Details**: $17 per 1,000 requests
- **Monthly free tier**: $200 credit (≈70,000 autocomplete sessions)

### QUINCY Usage Estimate

For a typical production company:
- **Events per month**: ~50-200
- **Location searches per event**: ~2-5 (including edits)
- **Monthly API calls**: ~100-1,000
- **Estimated cost**: $0.28-$2.83/month

### Cost Optimization

1. **City-only search**: Reduces API calls vs. full address search
2. **Session-based pricing**: Multiple selections in one session = one charge
3. **Caching**: Component caches recent searches
4. **Fallback**: Manual input if quota exceeded

---

## Troubleshooting

### API Key Issues

❌ **"This API project is not authorized to use this API"**
- Enable Places API in Google Cloud Console

❌ **"The provided API key is invalid"**
- Check API key is correctly copied to `.env.local`
- Verify environment variable name: `VITE_GOOGLE_PLACES_API_KEY`

❌ **"This API key is not authorized for this service"**
- Add Places API to API restrictions
- Check HTTP referrer restrictions

### Component Issues

❌ **"Loading city search..." never disappears**
- Check browser console for JavaScript errors
- Verify API key has Places API enabled
- Check network tab for failed API requests

❌ **Autocomplete not working**
- Try manual text input as fallback
- Check if `window.google` is available in browser console

---

## Entertainment Industry Benefits

### 🎯 **Crew Logistics**
- **Travel planning**: Automatic distance calculations between cities
- **Regional scheduling**: Group events by geographic proximity
- **Accommodation booking**: City-level location data for hotels

### 🎯 **Equipment Transport**
- **Logistics optimization**: Plan equipment routes between cities
- **Warehouse planning**: City data for regional equipment staging
- **Cost estimation**: Distance-based transport pricing

### 🎯 **Project Analytics**
- **Geographic insights**: Project distribution by city/region
- **Travel analysis**: Crew travel patterns and costs
- **Market analysis**: Identify key geographic markets

---

## Future Enhancements

### Phase 2: Enhanced Location Intelligence
- **Travel time calculations** between cities
- **Regional crew preferences** (local vs. travel crew)
- **Weather integration** for outdoor events
- **Venue database** integration with city data

### Phase 3: Advanced Analytics
- **Heat maps** of project activity by region
- **Travel cost optimization** suggestions
- **Crew efficiency** analysis by location patterns