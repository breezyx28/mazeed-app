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
  Info,
  Map as MapIcon,
  ShieldCheck
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
  const isArabic = i18n.language === 'ar';

  const [product, setProduct] = useState<any>(location.state?.product || null);
  const [seller, setSeller] = useState<any>(null);
  const [userLoc, setUserLoc] = useState<UserLocation | null>(null);
  const [route, setRoute] = useState<RouteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSteps, setShowSteps] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [isBrowser, setIsBrowser] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // 0. Check Platform
        setIsBrowser(!(window as any).Capacitor);

        // 1. Get User Location
        let uPosActual: UserLocation | null = null;
        try {
          uPosActual = await locationService.getCurrentLocation();
          setUserLoc(uPosActual);
          setPermissionError(null);
        } catch (err: any) {
          console.error('Location error:', err);
          setPermissionError(err.message || 'Location permission denied');
        }

        // 2. Load Product & Seller
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
          if (sData) {
            setSeller(sData);
          }
        }

        // 3. calculate route
        const activeSeller = seller || currentProduct?.sellers;
        const sLoc = activeSeller?.location || currentProduct?.location;
        
        if (uPosActual && sLoc && sLoc.lat && sLoc.lng) {
          const routeData = await locationService.getWalkingRoute(
            { lat: uPosActual.lat, lng: uPosActual.lng },
            { lat: sLoc.lat, lng: sLoc.lng }
          );
          if (routeData) setRoute(routeData);
        }
      } catch (err) {
        console.error('Navigation init error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [productId]);

  const openInExternalMaps = () => {
    const activeSeller = seller || product?.sellers;
    const sLoc = activeSeller?.location;
    if (!sLoc || !sLoc.lat || !sLoc.lng) return;
    const { lat, lng } = sLoc;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=walking`;
    window.open(url, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center gap-4">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold">{t('nearbyProducts.preparingMap')}</h2>
          <p className="text-muted-foreground">{t('nearbyProducts.calculatingRoute')}</p>
        </div>
      </div>
    );
  }

  const activeSeller = seller || product?.sellers;
  const storeLoc = activeSeller?.location;

  if (permissionError && !userLoc) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 mb-6">
          <ShieldCheck className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-bold mb-2">{t('nearbyProducts.locationRequired')}</h2>
        <p className="text-muted-foreground mb-8 max-w-xs mx-auto">
          {t('nearbyProducts.locationRequiredDesc')}
        </p>
        <div className="space-y-3 w-full max-w-xs">
          <Button 
            className="w-full h-12 rounded-full font-bold"
            onClick={() => window.location.reload()}
          >
            {t('common.reset', 'Try Again')}
          </Button>
          <Button 
            variant="outline"
            className="w-full h-12 rounded-full font-bold"
            onClick={openInExternalMaps}
            disabled={!storeLoc}
          >
            <ExternalLink className="w-5 h-5 mr-2" />
            {t('nearbyProducts.openInMaps')}
          </Button>
          <Button 
            variant="ghost"
            className="w-full"
            onClick={() => navigate(-1)}
          >
            {t('common.maybeLater')}
          </Button>
        </div>
      </div>
    );
  }

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
        <Badge className="bg-white/90 backdrop-blur-md text-primary border-none shadow-md px-4 py-2 text-sm font-bold flex items-center gap-2 max-w-[200px]">
          <Navigation className="w-4 h-4" />
          <span className="truncate">{product?.name || t('home')}</span>
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
              <Popup>{t('profile')}</Popup>
            </Marker>

            {/* Store Marker */}
            <Marker position={[storeLoc.lat, storeLoc.lng]} icon={storeIcon}>
              <Popup>{activeSeller?.shop_name || t('nearbyProducts.inStore')}</Popup>
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
              <h3 className="font-bold">{t('error')}</h3>
              <p className="text-sm text-muted-foreground">{t('nearbyProducts.locationRequiredDesc')}</p>
              <Button onClick={() => navigate(-1)}>{t('common.viewAll')}</Button>
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
        "bg-white rounded-t-[32px] shadow-[0_-10px_40px_rgba(0,0,0,0.15)] transition-all duration-500 ease-in-out z-[1001] flex flex-col overflow-hidden border-t border-border/50",
        showSteps ? "h-[85vh]" : "h-auto"
      )}>
        {/* Cover Image Section */}
        {activeSeller?.cover_url && !showSteps && (
          <div className="relative h-24 w-full flex-shrink-0 group overflow-hidden">
            <img 
              src={activeSeller.cover_url} 
              alt={activeSeller.shop_name} 
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/30" />
          </div>
        )}

        <div className="px-6 pt-2 pb-8 flex-1 flex flex-col overflow-hidden">
          {/* Handle */}
          <div 
            className="w-12 h-1.5 bg-muted rounded-full mx-auto mb-4 cursor-pointer" 
            onClick={() => setShowSteps(!showSteps)} 
          />

          <div className="flex items-start justify-between mb-6">
            <div className="flex flex-col">
              <span className="text-3xl font-black text-primary flex items-center gap-2 tracking-tighter">
                {route ? locationService.formatDuration(route.duration) : '--'}
                <Clock className="w-6 h-6 text-muted-foreground/50" />
              </span>
              <span className="text-sm text-muted-foreground font-semibold flex items-center gap-1.5 uppercase tracking-wider">
                {route ? locationService.formatDistance(route.distance) : '--'} • {t('nearbyProducts.walkingTime')}
              </span>
            </div>
            
            <div className="flex gap-2">
               {isBrowser && (
                <Button 
                  size="icon"
                  variant="outline"
                  className="rounded-full w-12 h-12 border-2 border-primary/20 text-primary hover:bg-primary/5 shadow-md"
                  onClick={openInExternalMaps}
                >
                  <MapIcon className="w-5 h-5" />
                </Button>
              )}
              <Button 
                size="lg" 
                className="rounded-full px-8 bg-black hover:bg-neutral-800 text-white gap-2 shadow-xl active:scale-95 transition-all h-12"
                onClick={openInExternalMaps}
              >
                <Navigation className="w-5 h-5 fill-white" />
                <span className="font-bold">{t('nearbyProducts.openInMaps')}</span>
              </Button>
            </div>
          </div>

          <div className="space-y-5 flex-1 overflow-hidden flex flex-col">
            {/* Store Information Card */}
            <div className="flex flex-col gap-4 p-5 rounded-[24px] bg-muted/20 border border-border/50 relative overflow-hidden group">
              <div className="flex items-center gap-4 relative z-10">
                <div className="w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center overflow-hidden border-2 border-white ring-1 ring-border/50">
                  <img src={activeSeller?.logo_url || product?.image} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-black text-base truncate leading-tight">{activeSeller?.shop_name || t('nearbyProducts.inStore')}</h4>
                    {activeSeller?.is_verified && (
                      <div className="w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                        <ShieldCheck className="w-2.5 h-2.5 text-white" />
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 font-medium line-clamp-1 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {activeSeller?.location?.address || t('nearbyProducts.inStore')}
                  </p>
                </div>
                <Badge variant="secondary" className="bg-primary/10 text-primary border-none px-2.5 py-1 text-[10px] font-black uppercase">
                  {t('nearbyProducts.inStore')}
                </Badge>
              </div>
              
              {!showSteps && activeSeller?.description && (
                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 italic">
                  "{activeSeller.description}"
                </p>
              )}

              {/* Product Context */}
              <div className="flex items-center gap-3 bg-white/50 dark:bg-black/20 p-2 rounded-xl border border-white/50">
                <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0">
                  <img src={product?.image} alt="" className="w-full h-full object-cover" />
                </div>
                <p className="text-[11px] font-bold truncate flex-1">{product?.name}</p>
                <div className="text-[10px] font-black text-primary px-2 bg-primary/5 rounded-full py-0.5">
                   {t('nearbyProducts.viewProduct')}
                </div>
              </div>
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
                  <span className="font-bold text-sm">{t('nearbyProducts.viewSteps')}</span>
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
