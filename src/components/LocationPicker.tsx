import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Loader2, Map as MapIcon } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Fix for default marker icon
let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

interface LocationPickerProps {
    initialPosition?: { lat: number; lng: number } | null;
    onLocationSelect: (lat: number, lng: number) => void;
}

// Free tile layer options
const TILE_LAYERS = {
  osm: {
    name: 'OpenStreetMap',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  },
  osmHot: {
    name: 'Humanitarian',
    url: 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors, Tiles style by Humanitarian OpenStreetMap Team'
  },
  cartoDB: {
    name: 'CartoDB Voyager',
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
  },
  cartoDBDark: {
    name: 'CartoDB Dark',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
  },
  esriWorldImagery: {
    name: 'Satellite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
  },
  esriWorldStreet: {
    name: 'Street Map',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri'
  },
  stamenTerrain: {
    name: 'Terrain',
    url: 'https://stamen-tiles-{s}.a.ssl.fastly.net/terrain/{z}/{x}/{y}.jpg',
    attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; OpenStreetMap contributors'
  },
  stamenToner: {
    name: 'Toner (B&W)',
    url: 'https://stamen-tiles-{s}.a.ssl.fastly.net/toner/{z}/{x}/{y}.png',
    attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; OpenStreetMap contributors'
  },
  stamenWatercolor: {
    name: 'Watercolor',
    url: 'https://stamen-tiles-{s}.a.ssl.fastly.net/watercolor/{z}/{x}/{y}.jpg',
    attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; OpenStreetMap contributors'
  }
};

function LocationMarker({ position, setPosition }: { position: { lat: number; lng: number } | null, setPosition: (pos: { lat: number; lng: number }) => void }) {
    useMapEvents({
        click(e) {
            setPosition(e.latlng);
        },
    });

    return position === null ? null : (
        <Marker position={position} />
    );
}

function MapController({ center }: { center: { lat: number; lng: number } }) {
    const map = useMap();
    useEffect(() => {
        map.flyTo(center, 13);
    }, [center, map]);
    return null;
}

export function LocationPicker({ initialPosition, onLocationSelect }: LocationPickerProps) {
    const [position, setPosition] = useState<{ lat: number; lng: number } | null>(initialPosition || null);
    const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>(initialPosition || { lat: 24.7136, lng: 46.6753 });
    const [searchQuery, setSearchQuery] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const [selectedTileLayer, setSelectedTileLayer] = useState<keyof typeof TILE_LAYERS>('osm');

    // Sync with initialPosition updates if they happen
    useEffect(() => {
        if(initialPosition) {
            setPosition(initialPosition);
            setMapCenter(initialPosition);
        }
    }, [initialPosition]);

    const handleSetPosition = (pos: { lat: number; lng: number }) => {
        setPosition(pos);
        onLocationSelect(pos.lat, pos.lng);
    };

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;
        setIsSearching(true);
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
            const data = await response.json();
            if (data && data.length > 0) {
                const lat = parseFloat(data[0].lat);
                const lng = parseFloat(data[0].lon);
                setMapCenter({ lat, lng });
            }
        } catch (error) {
            console.error("Search error:", error);
        } finally {
            setIsSearching(false);
        }
    };

    return (
        <div className="space-y-3">
             <div className="flex gap-2">
                <Input 
                    placeholder="Search location (e.g. Riyadh, Jeddah)..." 
                    value={searchQuery} 
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleSearch())}
                    className="flex-1"
                />
                <Button type="button" variant="outline" size="icon" onClick={handleSearch} disabled={isSearching}>
                    {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                </Button>
            </div>
            
            {/* Map Style Selector */}
            <div className="flex items-center gap-2">
                <MapIcon className="h-4 w-4 text-muted-foreground" />
                <Select value={selectedTileLayer} onValueChange={(value) => setSelectedTileLayer(value as keyof typeof TILE_LAYERS)}>
                    <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Select map style" />
                    </SelectTrigger>
                    <SelectContent>
                        {Object.entries(TILE_LAYERS).map(([key, layer]) => (
                            <SelectItem key={key} value={key}>
                                {layer.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            
            <div className="h-[300px] w-full rounded-xl overflow-hidden border z-0 relative">
                <MapContainer center={mapCenter} zoom={13} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
                    <TileLayer
                        key={selectedTileLayer}
                        attribution={TILE_LAYERS[selectedTileLayer].attribution}
                        url={TILE_LAYERS[selectedTileLayer].url}
                    />
                    <LocationMarker position={position} setPosition={handleSetPosition} />
                    <MapController center={mapCenter} />
                </MapContainer>
            </div>
        </div>
    );
}
