import React, { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useTranslation } from 'react-i18next';
import { 
  ChevronLeft, 
  Navigation, 
  MapPin, 
  Clock, 
  MoveRight, 
  ExternalLink,
  ChevronRight,
  ChevronDown,
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { locationService, Location as UserLocation } from '@/services/locationService';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

// Custom icons
const userIcon = L.divIcon({
  html: `<div class="w-6 h-6 bg-blue-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center animate-pulse">
          <div class="w-2 h-2 bg-white rounded-full"></div>
        </div>`,
  className: '',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

const storeIcon = L.divIcon({
  html: `<div class="w-8 h-8 bg-primary rounded-full border-2 border-white shadow-lg flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
        </div>`,
  className: '',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

interface RouteData {
  geometry: any;
  distance: number;
  duration: number;
  steps: any[];
}

const MapAutoCenter: React.FC<{ userLoc: UserLocation, storeLoc: { lat: number, lng: number } }> = ({ userLoc, storeLoc }) => {
  const map = useMap();
  useEffect(() => {
    const bounds = L.latLngBounds([userLoc.lat, userLoc.lng], [storeLoc.lat, storeLoc.lng]);
    map.fitBounds(bounds, { padding: [50, 50] });
  }, [userLoc, storeLoc, map]);
  return null;
};

const NavigateToStore: React.FC = () => {
  const { productId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const [product, setProduct] = useState<any>(location.state?.product || null);
  const [seller, setSeller] = useState<any>(null);
  const [userLoc, setUserLoc] = useState<UserLocation | null>(null);
  const [route, setRoute] = useState<RouteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSteps, setShowSteps] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // 1. Get User Location
        const uPos = await locationService.getCurrentLocation();
        setUserLoc(uPos);

        // 2. Load Product & Seller if not in state
        let currentProduct = product;
        if (!currentProduct) {
          const { data: pData } = await supabase
            .from('products')
            .select('*, sellers(*)')
            .eq('id', productId)
            .single();
          if (pData) {
            currentProduct = pData;
            setProduct(pData);
            setSeller(pData.sellers);
          }
        } else if (!seller) {
          const { data: sData } = await supabase
            .from('sellers')
            .select('*')
            .eq('id', currentProduct.seller_id || currentProduct.sellerId)
            .single();
          if (sData) setSeller(sData);
        }

        // 3. calculate route if we have both locations
        if (uPos && (seller || currentProduct?.sellers || currentProduct?.location)) {
          const sLoc = seller?.location || currentProduct?.sellers?.location || currentProduct?.location;
          if (sLoc && sLoc.lat && sLoc.lng) {
            const routeData = await locationService.getWalkingRoute(
              { lat: uPos.lat, lng: uPos.lng },
              { lat: sLoc.lat, lng: sLoc.lng }
            );
            if (routeData) setRoute(routeData);
          }
        }
      } catch (err) {
        console.error('Navigation init error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [productId, product, seller]);

  const openInExternalMaps = () => {
    if (!seller?.location) return;
    const { lat, lng } = seller.location;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=walking`;
    window.open(url, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center gap-4">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold">{t('common.preparingMap', 'Preparing Navigation...')}</h2>
          <p className="text-muted-foreground">{t('common.calculatingRoute', 'Calculating your walking route in Khartoum')}</p>
        </div>
      </div>
    );
  }

  const storeLoc = seller?.location || product?.sellers?.location;

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-[1000] p-4 flex items-center justify-between">
        <Button 
          variant="outline" 
          size="icon" 
          className="rounded-full bg-white/90 backdrop-blur-md border-none shadow-lg"
          onClick={() => navigate(-1)}
        >
          <ChevronLeft className="w-6 h-6" />
        </Button>
        <Badge className="bg-white/90 backdrop-blur-md text-primary border-none shadow-md px-4 py-2 text-sm font-bold flex items-center gap-2">
          <Navigation className="w-4 h-4" />
          {product?.name || 'Navigation'}
        </Badge>
        <div className="w-10 h-10" /> {/* Spacer */}
      </header>

      {/* Map View */}
      <div className="flex-1 w-full bg-muted relative z-0">
        {userLoc && storeLoc ? (
          <MapContainer 
            center={[userLoc.lat, userLoc.lng]} 
            zoom={15} 
            className="w-full h-full"
            zoomControl={false}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            {/* User Marker */}
            <Marker position={[userLoc.lat, userLoc.lng]} icon={userIcon}>
              <Popup>{t('nearbyProducts.yourLocation', 'Your Location')}</Popup>
            </Marker>

            {/* Store Marker */}
            <Marker position={[storeLoc.lat, storeLoc.lng]} icon={storeIcon}>
              <Popup>{seller?.shop_name || 'Store'}</Popup>
            </Marker>

            {/* Route Polyline */}
            {route && (
              <Polyline 
                positions={route.geometry.coordinates.map((c: any) => [c[1], c[0]])}
                color="#3b82f6"
                weight={6}
                opacity={0.7}
                lineCap="round"
                lineJoin="round"
                dashArray="10, 10"
                className="animate-dash"
              />
            )}

            <MapAutoCenter userLoc={userLoc} storeLoc={storeLoc} />
          </MapContainer>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted/50">
            <div className="text-center p-6 space-y-4 max-w-xs">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto text-red-500">
                <Info className="w-8 h-8" />
              </div>
              <h3 className="font-bold">{t('errors.locationMissing', 'Unable to load locations')}</h3>
              <p className="text-sm text-muted-foreground">{t('errors.locationMissingDesc', 'We couldnt detect the store or your device location.')}</p>
              <Button onClick={() => navigate(-1)}>{t('common.goBack', 'Go Back')}</Button>
            </div>
          </div>
        )}

        {/* Floating Controls */}
        <div className="absolute top-20 right-4 z-[1000] flex flex-col gap-2">
           <Button 
            variant="outline" 
            size="icon" 
            className="rounded-full bg-white shadow-lg border-none"
            onClick={openInExternalMaps}
          >
            <ExternalLink className="w-5 h-5 text-primary" />
          </Button>
        </div>
      </div>

      {/* Bottom Sheet Navigation Info */}
      <div className={cn(
        "bg-white rounded-t-[32px] shadow-[0_-10px_40px_rgba(0,0,0,0.1)] transition-all duration-500 ease-in-out z-[1001] px-6 pt-2 pb-8",
        showSteps ? "h-[70vh]" : "h-auto"
      )}>
        {/* Handle */}
        <div className="w-12 h-1.5 bg-muted rounded-full mx-auto mb-6" onClick={() => setShowSteps(!showSteps)} />

        <div className="flex items-center justify-between mb-6">
          <div className="flex flex-col">
            <span className="text-3xl font-black text-primary flex items-center gap-2">
              {route ? locationService.formatDuration(route.duration) : '--'}
              <Clock className="w-6 h-6 text-muted-foreground" />
            </span>
            <span className="text-sm text-muted-foreground font-medium flex items-center gap-1">
              {route ? locationService.formatDistance(route.distance) : '--'} • {t('nearbyProducts.walkingTime', 'Walking')}
            </span>
          </div>
          <Button 
            size="lg" 
            className="rounded-full px-8 bg-black hover:bg-black/90 text-white gap-2 shadow-xl active:scale-95 transition-all"
            onClick={openInExternalMaps}
          >
            <Navigation className="w-5 h-5 fill-white" />
            {t('nearbyProducts.openInMaps', 'Go')}
          </Button>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-muted/30 border">
            <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center overflow-hidden border">
              <img src={product?.image} alt="" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-sm leading-tight">{product?.name}</h4>
              <p className="text-xs text-muted-foreground mt-0.5">{seller?.shop_name}</p>
            </div>
            <Badge variant="outline" className="bg-white">{t('nearbyProducts.inStore', 'In Store')}</Badge>
          </div>

          <div className="pt-2">
            <button 
              onClick={() => setShowSteps(!showSteps)}
              className="w-full flex items-center justify-between p-4 rounded-2xl bg-primary/5 hover:bg-primary/10 transition-colors border border-primary/10 group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-lg group-hover:rotate-12 transition-all">
                  <MoveRight className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold text-sm">{t('nearbyProducts.viewSteps', 'View Turn-by-Turn')}</span>
              </div>
              {showSteps ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
            </button>
          </div>

          {showSteps && route && (
            <div className="mt-4 overflow-y-auto max-h-[40vh] space-y-3 pb-4 scrollbar-hide">
              {route.steps.map((step: any, idx: number) => (
                <div key={idx} className="flex gap-4 items-start p-3 border-b border-border/50 last:border-none">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0 text-muted-foreground text-xs font-bold">
                    {idx + 1}
                  </div>
                  <div>
                    <p className="text-sm font-medium leading-relaxed">{step.maneuver.instruction}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {locationService.formatDistance(step.distance)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes dash {
          to {
            stroke-dashoffset: -20;
          }
        }
        .animate-dash {
          animation: dash 1s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default NavigateToStore;
