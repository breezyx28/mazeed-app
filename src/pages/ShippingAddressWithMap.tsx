import { ArrowLeft, ArrowRight, MapPin, Plus, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Location marker component that handles map clicks
const LocationMarker = ({ position, setPosition }: { position: [number, number] | null; setPosition: (pos: [number, number]) => void }) => {
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
    },
  });

  return position === null ? null : (
    <Marker position={position}>
      <Popup>
        Selected location: {position[0].toFixed(4)}, {position[1].toFixed(4)}
      </Popup>
    </Marker>
  );
};

const ShippingAddressWithMap = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPosition, setSelectedPosition] = useState<[number, number] | null>(null);
  const mapCenter: [number, number] = [24.7136, 46.6753]; // Riyadh coordinates

  const [addresses, setAddresses] = useState([
    {
      id: 1,
      type: t('home'),
      address: "شارع الملك فهد، حي العليا",
      city: "الرياض، المملكة العربية السعودية",
      isDefault: true,
      coordinates: [24.7136, 46.6753] as [number, number],
    },
    {
      id: 2,
      type: t('office'),
      address: "طريق الملك عبدالعزيز، حي الوزارات",
      city: "الرياض، المملكة العربية السعودية",
      isDefault: false,
      coordinates: [24.6877, 46.7219] as [number, number],
    },
  ]);



  const handleConfirmLocation = () => {
    if (selectedPosition) {
      const newAddress = {
        id: addresses.length + 1,
        type: 'موقع جديد',
        address: `موقع مختار: ${selectedPosition[0].toFixed(4)}, ${selectedPosition[1].toFixed(4)}`,
        city: t('riyadhSaudiArabia'),
        isDefault: false,
        coordinates: selectedPosition,
      };
      setAddresses([...addresses, newAddress]);
      toast.success(t('addressAdded'));
      setSelectedPosition(null);
      setIsMapOpen(false);
    } else {
      toast.error('يرجى اختيار موقع على الخريطة');
    }
  };

  const handleDeleteAddress = (id: number) => {
    setAddresses(addresses.filter(addr => addr.id !== id));
    toast.success('تم حذف العنوان بنجاح');
  };

  const handleSetDefault = (id: number) => {
    setAddresses(addresses.map(addr => ({ ...addr, isDefault: addr.id === id })));
    toast.success(t('defaultAddressUpdated'));
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-40 bg-card border-b border-border">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-accent rounded-full transition-colors"
          >
            {isRTL ? <ArrowRight className="w-6 h-6" /> : <ArrowLeft className="w-6 h-6" />}
          </button>
          <h1 className="text-xl font-bold">{t('shippingAddress')}</h1>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 mt-6">
        <Dialog open={isMapOpen} onOpenChange={setIsMapOpen}>
          <DialogTrigger asChild>
            <Button className="w-full h-14 rounded-2xl mb-6 gap-2">
              <Plus className="w-5 h-5" />
              {t('addNewAddress')}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md mx-auto max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t('selectLocation')}</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder={t('searchLocation')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-12 rounded-xl"
                />
              </div>

              <div className="h-80 rounded-xl overflow-hidden border">
                <MapContainer center={mapCenter} zoom={13} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <LocationMarker position={selectedPosition} setPosition={setSelectedPosition} />
                </MapContainer>
              </div>

              {selectedPosition && (
                <div className="text-center p-3 bg-muted rounded-xl">
                  <p className="text-sm font-medium">الموقع المختار:</p>
                  <p className="text-xs text-muted-foreground">
                    {selectedPosition[0].toFixed(4)}, {selectedPosition[1].toFixed(4)}
                  </p>
                </div>
              )}

              <div className="text-center text-sm text-muted-foreground">
                <p>{t('clickToSelectLocation')}</p>
              </div>

              <Button 
                onClick={handleConfirmLocation}
                className="w-full h-12 rounded-xl"
                disabled={!selectedPosition}
              >
                {t('confirmLocation')}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <div className="space-y-4">
          {addresses.map((address, index) => (
            <motion.div
              key={address.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="rounded-2xl">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <MapPin className="w-5 h-5" />
                      {address.type}
                    </CardTitle>
                    {address.isDefault && (
                      <span className="text-xs bg-primary text-primary-foreground px-3 py-1 rounded-full">
                        {t('default')}
                      </span>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-2">
                    {address.address}
                  </p>
                  <p className="text-sm text-muted-foreground mb-4">
                    {address.city}
                  </p>
                  <div className="flex gap-2">
                    {!address.isDefault && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1 rounded-full"
                        onClick={() => handleSetDefault(address.id)}
                      >
                        {t('setAsDefault')}
                      </Button>
                    )}
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1 rounded-full text-destructive hover:bg-destructive hover:text-destructive-foreground"
                      onClick={() => handleDeleteAddress(address.id)}
                    >
                      حذف
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ShippingAddressWithMap;