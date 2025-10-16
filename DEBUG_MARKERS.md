# Debug Checklist for Missing Map Pins

## Browser Console Messages to Check:

1. **Location Loading:**
   - `📍 User is in Missouri:` or `📍 User outside Missouri, defaulting to St. Louis`
   - Do you see this message?

2. **Data Fetching:**
   - `🗺️ Loading data centered on:` followed by coordinates
   - Does this appear?

3. **Filtered Locations:**
   - `🔍 Filtering results: X locations`
   - `📊 Filters: Museums=true, Libraries=true, Others=true`
   - How many locations does it show?

4. **Markers Creation:**
   - `🗺️ Created X markers`
   - How many markers were created?

5. **API Response:**
   - Look for `/api/map/csv-data` requests in Network tab
   - Check if `data.success` is true and `data.locations` has items with lat/lng

## Common Issues:

### Issue 1: No locations in response
**Solution:** Check if CSV file has valid lat/lng coordinates

### Issue 2: filteredLocations is empty (0 locations)
**Solution:** Check if filters are enabled (Museums, Libraries, Others toggles)

### Issue 3: Markers created but not visible
**Solution:** Check if:
- Google Maps API key is valid
- Map center is correct
- Zoom level is appropriate

### Issue 4: Data fetching fails
**Solution:** AWS credentials in .env.local must be real, not placeholders

## Quick Test:

Open Browser Console and run:
```javascript
// Check if locations are loaded
console.log('Locations:', window.locations);
```

