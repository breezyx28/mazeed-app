# Shipping Address Implementation

## ✅ Features Implemented

### 1. Real Data Integration with Supabase
- ✅ Fetch addresses from `addresses` table
- ✅ Create new addresses
- ✅ Update existing addresses
- ✅ Delete addresses
- ✅ Set default address
- ✅ Automatic user_id association

### 2. Interactive Map with Nominatim
- ✅ Leaflet map integration
- ✅ Search with autocomplete (Nominatim API)
- ✅ Click on map to select location
- ✅ Reverse geocoding (coordinates → address)
- ✅ Display location name instead of coordinates
- ✅ Search results dropdown with suggestions

### 3. Geolocation Support
- ✅ Browser geolocation for web
- ✅ Capacitor Geolocation plugin for mobile
- ✅ "Use My Location" button
- ✅ Auto-center map on user location
- ✅ Default to Khartoum, Sudan if geolocation fails

### 4. Dual Input Methods
- ✅ **Map Tab**: Interactive map with search
- ✅ **Manual Tab**: Form for manual entry
- ✅ Tabs switch between map and manual input

### 5. Address Type Selection
- ✅ Predefined types: Home, Work, Other
- ✅ Custom type option with text input
- ✅ Bilingual labels (Arabic/English)

### 6. Form Fields
**Required:**
- City *
- State *
- Country *
- Address Type *

**Optional:**
- Street
- Zip Code
- Phone Number

### 7. Address Management
- ✅ View all saved addresses
- ✅ Edit existing addresses
- ✅ Delete addresses
- ✅ Set default address
- ✅ Default badge display
- ✅ Empty state when no addresses

### 8. Auto-fill from Map
When user:
1. Searches location → Auto-fills form
2. Clicks on map → Reverse geocodes and fills form
3. Uses "My Location" → Centers map and fills form

## 🔧 Technical Details

### Nominatim API Usage
```javascript
// Search
https://nominatim.openstreetmap.org/search?format=json&q={query}&addressdetails=1&limit=5

// Reverse Geocode
https://nominatim.openstreetmap.org/reverse?format=json&lat={lat}&lon={lon}&addressdetails=1
```

**Rate Limits:**
- 1 request per second
- Implemented 500ms debounce on search
- Free, no API key required

### Database Schema Used
```sql
addresses table:
- id (uuid)
- user_id (uuid) - FK to profiles
- type (address_type enum or text)
- street (text, nullable)
- city (text, required)
- state (text, nullable)
- zip_code (text, nullable)
- country (text, required)
- phone_number (text, nullable)
- is_default (boolean)
```

### Geolocation Implementation
```typescript
// Web
navigator.geolocation.getCurrentPosition()

// Mobile (Capacitor)
import { Geolocation } from '@capacitor/geolocation';
await Geolocation.getCurrentPosition();
```

## 📱 Mobile Permissions

For Capacitor, add to `capacitor.config.ts`:
```typescript
{
  plugins: {
    Geolocation: {
      permissions: ["location"]
    }
  }
}
```

**Android** - Add to `AndroidManifest.xml`:
```xml
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
```

**iOS** - Add to `Info.plist`:
```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>We need your location to help you add shipping addresses</string>
```

## 🎨 UI/UX Features

1. **Search Autocomplete**
   - Dropdown appears below search input
   - Shows 5 most relevant results
   - Click to select and auto-fill

2. **Map Interaction**
   - Click anywhere to place marker
   - Marker shows selected location
   - Auto reverse-geocodes on click

3. **Address Cards**
   - Show type, street, city, state, country
   - Default badge for default address
   - Edit and Delete buttons
   - "Set as Default" button for non-default

4. **Responsive Dialog**
   - Max height with scroll
   - Tabs for map/manual input
   - Form validation
   - Loading states

## 🧪 Testing Checklist

- [ ] Search for "Khartoum" - should show results
- [ ] Click search result - should center map and fill form
- [ ] Click on map - should place marker and reverse geocode
- [ ] Click "Use My Location" - should request permission and center
- [ ] Fill manual form - should save to database
- [ ] Edit address - should load data and update
- [ ] Delete address - should remove from database
- [ ] Set default - should update all addresses
- [ ] Create first address - should auto-set as default

## 🐛 Known Limitations

1. **Nominatim Rate Limits**: 1 req/sec - implemented debounce
2. **Geolocation Permission**: User must grant permission
3. **Offline**: Map and search require internet connection
4. **Address Parsing**: Nominatim may not have all Sudan locations

## 🔄 Future Enhancements

- [ ] Cache search results
- [ ] Offline map tiles
- [ ] Multiple markers for all saved addresses
- [ ] Distance calculation from current location
- [ ] Address validation service
- [ ] Delivery zone checking
