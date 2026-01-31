# Station ID Resolution & Disambiguation

## Overview

The TfL API requires specific station ID formats, but users may search using various formats (shortcodes, names, NaPTAN codes, etc.). This system automatically resolves and handles these cases.

## How It Works

### Automatic Resolution

When you call `getStationArrivals(stationId)`, it will:

1. **Check if the ID is valid** (format: `940GZZLU...`, `940GZZDL...`, `910G...`)
2. **If not, search for the station** by name/code
3. **If exactly one match** → Auto-resolve and fetch arrivals
4. **If multiple matches** → Throw error with alternatives for user to choose

### Example: Bank Station

**Problem:** Bank has two separate stations:
- Bank Underground: `940GZZLUBNK` (Central, Northern, Waterloo & City)
- Bank DLR: `940GZZDLBNK` (DLR)

**Before:**
```typescript
// Using "HUBBAN" or "Bank" would fail silently
getStationArrivals("HUBBAN"); // Returns 0 arrivals ❌
```

**After:**
```typescript
// Using "Bank" now shows disambiguation options
try {
  await getStationArrivals("Bank");
} catch (error) {
  // Error contains list of Bank stations
  // UI shows both options for user to select
}
```

### Usage in UI

```typescript
const fetchArrivals = async (stationId: string) => {
  try {
    const arrivals = await getStationArrivals(stationId);
    setArrivals(arrivals);
  } catch (err) {
    const errorMessage = err.message;
    
    if (errorMessage.includes('Multiple stations found')) {
      // Show disambiguation UI
      const resolution = await checkStationDisambiguation(stationId);
      setDisambiguationOptions(resolution.alternatives);
      setShowDisambiguation(true);
    } else {
      setError(errorMessage);
    }
  }
};
```

## Valid Station ID Formats

### London Underground
- Format: `940GZZLU` + 3-letter code
- Example: `940GZZLUPDK` (Paddington)
- Example: `940GZZLUBNK` (Bank)

### DLR
- Format: `940GZZDL` + 3-letter code
- Example: `940GZZDLBNK` (Bank DLR)
- Example: `940GZZDLPDK` (Paddington)

### Elizabeth Line
- Format: `910G` + code
- Example: `910GPADDTON` (Paddington Elizabeth Line)

## API Functions

### `resolveStationId(input: string)`
Resolves any station identifier to the correct TfL station code(s).

```typescript
const result = await resolveStationId("Bank");
// Returns: {
//   success: false,
//   alternatives: [
//     { id: "940GZZLUBNK", name: "Bank Underground Station", ... },
//     { id: "940GZZDLBNK", name: "Bank DLR Station", ... }
//   ]
// }
```

### `checkStationDisambiguation(stationId: string)`
Check if a station needs disambiguation before fetching arrivals.

```typescript
const resolution = await checkStationDisambiguation("Bank");
if (resolution.alternatives) {
  // Show user the options
}
```

### `getStationArrivals(stationId: string)`
Now automatically resolves station IDs and handles disambiguation.

```typescript
// These all work now:
await getStationArrivals("940GZZLUPDK");  // Direct ID ✅
await getStationArrivals("Paddington");   // Name (single match) ✅
await getStationArrivals("Bank");         // Throws with alternatives ⚠️
```

## Benefits

1. **User-friendly**: Users can search by name, not just codes
2. **Transparent**: Auto-resolution is logged for debugging
3. **Flexible**: Handles all station ID formats
4. **Clear errors**: When disambiguation needed, shows all options
5. **Type-safe**: Full TypeScript support

## Logs

The system provides helpful logs:

```
🔍 Resolving station ID/name: "Bank"
🤔 Multiple stations found for "Bank": ["Bank Underground Station", "Bank DLR Station"]

✅ Auto-resolved "Paddington" → "Paddington Underground Station" (940GZZLUPDK)
```
