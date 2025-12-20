export interface Location {
  lat: number;
  lng: number;
  timestamp: number;
}

const LOCATION_CACHE_KEY = 'mazeed_user_location';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const locationService = {
  /**
   * Request user's current location with a timeout and caching
   */
  getCurrentLocation: (): Promise<Location> => {
    return new Promise((resolve, reject) => {
      // Check cache first
      const cached = localStorage.getItem(LOCATION_CACHE_KEY);
      if (cached) {
        const parsed: Location = JSON.parse(cached);
        if (Date.now() - parsed.timestamp < CACHE_DURATION) {
          return resolve(parsed);
        }
      }

      if (!navigator.geolocation) {
        return reject(new Error('Geolocation not supported'));
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newLocation: Location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            timestamp: Date.now(),
          };
          localStorage.setItem(LOCATION_CACHE_KEY, JSON.stringify(newLocation));
          resolve(newLocation);
        },
        (error) => {
          reject(error);
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    });
  },

  /**
   * Get walking route from OSRM
   */
  getWalkingRoute: async (start: { lat: number, lng: number }, end: { lat: number, lng: number }) => {
    try {
      const url = `https://router.project-osrm.org/route/v1/foot/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson&steps=true`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Route calculation failed');
      const data = await response.json();
      
      if (data.code !== 'Ok' || !data.routes[0]) {
        throw new Error('No route found');
      }

      return {
        geometry: data.routes[0].geometry,
        distance: data.routes[0].distance,
        duration: data.routes[0].duration,
        steps: data.routes[0].legs[0].steps,
      };
    } catch (error) {
      console.error('OSRM Error:', error);
      return null; // Fallback to straight line in UI
    }
  },

  /**
   * Format distance in meters or kilometers
   */
  formatDistance: (meters: number): string => {
    if (meters < 1000) {
      return `${Math.round(meters)}m`;
    }
    return `${(meters / 1000).toFixed(1)}km`;
  },

  /**
   * Format duration in seconds to minutes
   */
  formatDuration: (seconds: number): string => {
    const minutes = Math.ceil(seconds / 60);
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  },

  /**
   * Calculate straight-line distance (Haversine) as a fallback
   */
  calculateStraigthLineDistance: (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3; // metres
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // in metres
  },
};
