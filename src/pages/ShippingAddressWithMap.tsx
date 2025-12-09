import { ArrowLeft, ArrowRight, MapPin, Plus, Search, Edit, Trash2, Navigation } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { Geolocation } from '@capacitor/geolocation';
import { CapacitorUtils } from "@/lib/capacitor-utils";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface Address {
  id: string;
  type: string;
  street: string | null;
  city: string;
  state: string | null;
  zip_code: string | null;
  country: string;
  phone_number: string | null;
  is_default: boolean;
}

interface SearchResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  address: {
    road?: string;
    suburb?: string;
    city?: string;
    state?: string;
    postcode?: string;
    country?: string;
  };
}

const MapUpdater = ({ center }: { center: [number, number] }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, 13);
  }, [center, map]);
  return null;
};

const LocationMarker = ({ position, setPosition, onLocationSelect }: { 
  position: [number, number] | null; 
  setPosition: (pos: [number, number]) => void;
  onLocationSelect: (lat: number, lon: number) => void;
}) => {
  useMap().on('click', (e) => {
    setPosition([e.latlng.lat, e.latlng.lng]);
    onLocationSelect(e.latlng.lat, e.latlng.lng);
  });

  return position ? <Marker position={position}><Popup>Selected Location</Popup></Marker> : null;
};

const ShippingAddressWithMap = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const isRTL = i18n.language === 'ar';
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [selectedPosition, setSelectedPosition] = useState<[number, number]>([15.5007, 32.5599]); // Khartoum
  const [mapCenter, setMapCenter] = useState<[number, number]>([15.5007, 32.5599]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const searchTimeout = useRef<NodeJS.Timeout>();

  const [formData, setFormData] = useState({
    type: 'home',
    customType: '',
    street: '',
    city: '',
    state: '',
    zip_code: '',
    country: 'Sudan',
    phone_number: '',
  });

  const [typeSearchOpen, setTypeSearchOpen] = useState(false);
  const [typeSearchValue, setTypeSearchValue] = useState('');

  const addressTypes = [
    { value: 'home', label: isRTL ? 'منزل' : 'Home' },
    { value: 'work', label: isRTL ? 'عمل' : 'Work' },
    { value: 'office', label: isRTL ? 'مكتب' : 'Office' },
  ];

  useEffect(() => {
    if (user) {
      fetchAddresses();
      getUserLocation();
    }
  }, [user]);

  const getUserLocation = async () => {
    try {
      if (CapacitorUtils.isNative()) {
        const position = await Geolocation.getCurrentPosition();
        const coords: [number, number] = [position.coords.latitude, position.coords.longitude];
        setSelectedPosition(coords);
        setMapCenter(coords);
      } else {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const coords: [number, number] = [position.coords.latitude, position.coords.longitude];
            setSelectedPosition(coords);
            setMapCenter(coords);
          },
          () => console.log('Geolocation not available')
        );
      }
    } catch (error) {
      console.log('Geolocation error:', error);
    }
  };

  const fetchAddresses = async () => {
    try {
      const { data, error } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', user?.id)
        .order('is_default', { ascending: false });

      if (error) throw error;
      setAddresses(data || []);
    } catch (error) {
      console.error('Error fetching addresses:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchLocation = async (query: string) => {
    if (!query || query.length < 3) {
      setSearchResults([]);
      return;
    }

    try {
      const response = await fetch(
        `/nominatim/search?format=json&q=${encodeURIComponent(query)}&addressdetails=1&limit=5`
      );
      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      console.error('Search error:', error);
    }
  };

  const reverseGeocode = async (lat: number, lon: number) => {
    try {
      const response = await fetch(
        `/nominatim/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1`
      );
      const data = await response.json();
      
      setFormData(prev => ({
        ...prev,
        street: data.address.road || data.address.suburb || '',
        city: data.address.city || data.address.town || data.address.village || '',
        state: data.address.state || '',
        country: data.address.country || 'Sudan',
        zip_code: data.address.postcode || '',
      }));
    } catch (error) {
      console.error('Reverse geocode error:', error);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => searchLocation(value), 500);
  };

  const handleSelectSearchResult = (result: SearchResult) => {
    const coords: [number, number] = [parseFloat(result.lat), parseFloat(result.lon)];
    setSelectedPosition(coords);
    setMapCenter(coords);
    setSearchQuery(result.display_name);
    setSearchResults([]);
    
    setFormData(prev => ({
      ...prev,
      street: result.address.road || result.address.suburb || '',
      city: result.address.city || '',
      state: result.address.state || '',
      country: result.address.country || 'Sudan',
      zip_code: result.address.postcode || '',
    }));
  };

  const handleSaveAddress = async () => {
    if (!user) return;

    if (!formData.city || !formData.country) {
      toast.error(isRTL ? 'المدينة والدولة مطلوبة' : 'City and country are required');
      return;
    }

    try {
      const addressData = {
        user_id: user.id,
        type: formData.type === 'custom' ? formData.customType : formData.type,
        street: formData.street || null,
        city: formData.city,
        state: formData.state || null,
        zip_code: formData.zip_code || null,
        country: formData.country,
        phone_number: formData.phone_number || null,
        is_default: addresses.length === 0,
      };

      if (editingAddress) {
        const { error } = await supabase
          .from('addresses')
          .update(addressData)
          .eq('id', editingAddress.id);
        if (error) throw error;
        toast.success(t('addressUpdated') || 'Address updated');
      } else {
        const { error } = await supabase
          .from('addresses')
          .insert(addressData);
        if (error) throw error;
        toast.success(t('addressAdded') || 'Address added');
      }

      await fetchAddresses();
      handleCloseDialog();
    } catch (error: any) {
      console.error('Error saving address:', error);
      toast.error('Failed to save address');
    }
  };

  const handleDeleteAddress = async (id: string) => {
    try {
      const { error } = await supabase
        .from('addresses')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success(isRTL ? 'تم حذف العنوان' : 'Address deleted');
      await fetchAddresses();
    } catch (error) {
      console.error('Error deleting address:', error);
      toast.error('Failed to delete address');
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await supabase.from('addresses').update({ is_default: false }).eq('user_id', user?.id);
      const { error } = await supabase.from('addresses').update({ is_default: true }).eq('id', id);
      if (error) throw error;
      toast.success(t('defaultAddressUpdated') || 'Default address updated');
      await fetchAddresses();
    } catch (error) {
      console.error('Error setting default:', error);
      toast.error('Failed to set default');
    }
  };

  const handleEditAddress = (address: Address) => {
    setEditingAddress(address);
    setFormData({
      type: ['home', 'work', 'other'].includes(address.type) ? address.type : 'custom',
      customType: !['home', 'work', 'other'].includes(address.type) ? address.type : '',
      street: address.street || '',
      city: address.city,
      state: address.state || '',
      zip_code: address.zip_code || '',
      country: address.country,
      phone_number: address.phone_number || '',
    });
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingAddress(null);
    setSearchQuery('');
    setSearchResults([]);
    setFormData({
      type: 'home',
      customType: '',
      street: '',
      city: '',
      state: '',
      zip_code: '',
      country: 'Sudan',
      phone_number: '',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-40 bg-card border-b border-border">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-accent rounded-full transition-colors">
            {isRTL ? <ArrowRight className="w-6 h-6" /> : <ArrowLeft className="w-6 h-6" />}
          </button>
          <h1 className="text-xl font-bold">{t('shippingAddress')}</h1>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 mt-6">
        <Button onClick={() => setIsDialogOpen(true)} className="w-full h-14 rounded-2xl mb-6 gap-2">
          <Plus className="w-5 h-5" />
          {t('addNewAddress')}
        </Button>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-md mx-auto max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingAddress ? (isRTL ? 'تعديل العنوان' : 'Edit Address') : (isRTL ? 'إضافة عنوان جديد' : 'Add New Address')}</DialogTitle>
            </DialogHeader>

            <Tabs defaultValue="map" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="map">{isRTL ? 'الخريطة' : 'Map'}</TabsTrigger>
                <TabsTrigger value="manual">{isRTL ? 'يدوي' : 'Manual'}</TabsTrigger>
              </TabsList>

              <TabsContent value="map" className="space-y-4">
                <div className="space-y-2">
                  <Label>{isRTL ? 'نوع العنوان' : 'Address Type'} *</Label>
                  <Popover open={typeSearchOpen} onOpenChange={setTypeSearchOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={typeSearchOpen}
                        className="w-full h-12 rounded-xl justify-between"
                      >
                        {formData.type
                          ? addressTypes.find((type) => type.value === formData.type)?.label || formData.customType || (isRTL ? 'اختر النوع' : 'Select type')
                          : (isRTL ? 'اختر النوع' : 'Select type')}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput 
                          placeholder={isRTL ? 'ابحث عن نوع...' : 'Search type...'}
                          value={typeSearchValue}
                          onValueChange={setTypeSearchValue}
                        />
                        <CommandList>
                          <CommandEmpty>
                            <div className="p-2 text-center">
                              <p className="text-sm text-muted-foreground mb-2">
                                {isRTL ? 'لم يتم العثور على نتائج' : 'No results found'}
                              </p>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setFormData({ ...formData, type: 'custom', customType: typeSearchValue });
                                  setTypeSearchOpen(false);
                                  setTypeSearchValue('');
                                }}
                                className="w-full"
                              >
                                {isRTL ? `إضافة "${typeSearchValue}"` : `Add "${typeSearchValue}"`}
                              </Button>
                            </div>
                          </CommandEmpty>
                          <CommandGroup>
                            {addressTypes.map((type) => (
                              <CommandItem
                                key={type.value}
                                value={type.value}
                                onSelect={(currentValue) => {
                                  setFormData({ ...formData, type: currentValue, customType: '' });
                                  setTypeSearchOpen(false);
                                  setTypeSearchValue('');
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    formData.type === type.value ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {type.label}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground z-10" />
                  <Input
                    type="text"
                    placeholder={isRTL ? 'ابحث عن موقع...' : 'Search location...'}
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="pl-10 h-12 rounded-xl"
                  />
                  {searchResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-card border rounded-xl shadow-lg max-h-60 overflow-y-auto z-20">
                      {searchResults.map((result) => (
                        <button
                          key={result.place_id}
                          onClick={() => handleSelectSearchResult(result)}
                          className="w-full text-left px-4 py-3 hover:bg-accent transition-colors border-b last:border-b-0"
                        >
                          <p className="text-sm font-medium">{result.display_name}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <Button
                  variant="outline"
                  onClick={getUserLocation}
                  className="w-full gap-2"
                >
                  <Navigation className="w-4 h-4" />
                  {isRTL ? 'استخدم موقعي الحالي' : 'Use My Location'}
                </Button>

                <div className="h-80 rounded-xl overflow-hidden border">
                  <MapContainer center={mapCenter} zoom={13} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <MapUpdater center={mapCenter} />
                    <LocationMarker 
                      position={selectedPosition} 
                      setPosition={setSelectedPosition}
                      onLocationSelect={reverseGeocode}
                    />
                  </MapContainer>
                </div>

                <p className="text-sm text-muted-foreground text-center">
                  {isRTL ? 'انقر على الخريطة لتحديد الموقع' : 'Click on map to select location'}
                </p>
              </TabsContent>

              <TabsContent value="manual" className="space-y-4">
                <div className="space-y-2">
                  <Label>{isRTL ? 'نوع العنوان' : 'Address Type'} *</Label>
                  <Popover open={typeSearchOpen} onOpenChange={setTypeSearchOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={typeSearchOpen}
                        className="w-full h-12 rounded-xl justify-between"
                      >
                        {formData.type
                          ? addressTypes.find((type) => type.value === formData.type)?.label || formData.customType || (isRTL ? 'اختر النوع' : 'Select type')
                          : (isRTL ? 'اختر النوع' : 'Select type')}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput 
                          placeholder={isRTL ? 'ابحث عن نوع...' : 'Search type...'}
                          value={typeSearchValue}
                          onValueChange={setTypeSearchValue}
                        />
                        <CommandList>
                          <CommandEmpty>
                            <div className="p-2 text-center">
                              <p className="text-sm text-muted-foreground mb-2">
                                {isRTL ? 'لم يتم العثور على نتائج' : 'No results found'}
                              </p>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setFormData({ ...formData, type: 'custom', customType: typeSearchValue });
                                  setTypeSearchOpen(false);
                                  setTypeSearchValue('');
                                }}
                                className="w-full"
                              >
                                {isRTL ? `إضافة "${typeSearchValue}"` : `Add "${typeSearchValue}"`}
                              </Button>
                            </div>
                          </CommandEmpty>
                          <CommandGroup>
                            {addressTypes.map((type) => (
                              <CommandItem
                                key={type.value}
                                value={type.value}
                                onSelect={(currentValue) => {
                                  setFormData({ ...formData, type: currentValue, customType: '' });
                                  setTypeSearchOpen(false);
                                  setTypeSearchValue('');
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    formData.type === type.value ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {type.label}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              </TabsContent>
            </Tabs>

            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>{isRTL ? 'الشارع' : 'Street'}</Label>
                <Input
                  value={formData.street}
                  onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                  className="h-12 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{isRTL ? 'المدينة' : 'City'} *</Label>
                  <Input
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="h-12 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{isRTL ? 'الولاية' : 'State'} *</Label>
                  <Input
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="h-12 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{isRTL ? 'الرمز البريدي' : 'Zip Code'}</Label>
                  <Input
                    value={formData.zip_code}
                    onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
                    className="h-12 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{isRTL ? 'الدولة' : 'Country'} *</Label>
                  <Input
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    className="h-12 rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>{isRTL ? 'رقم الهاتف' : 'Phone Number'}</Label>
                <Input
                  value={formData.phone_number}
                  onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                  className="h-12 rounded-xl"
                  type="tel"
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={handleSaveAddress} className="flex-1 h-12 rounded-xl">
                  {editingAddress ? (isRTL ? 'تحديث' : 'Update') : (isRTL ? 'حفظ' : 'Save')}
                </Button>
                <Button onClick={handleCloseDialog} variant="outline" className="flex-1 h-12 rounded-xl">
                  {isRTL ? 'إلغاء' : 'Cancel'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <div className="space-y-4">
          {addresses.length === 0 ? (
            <Card className="rounded-2xl p-8 text-center">
              <MapPin className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">{isRTL ? 'لا توجد عناوين' : 'No addresses yet'}</p>
            </Card>
          ) : (
            addresses.map((address, index) => (
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
                      {address.is_default && (
                        <span className="text-xs bg-primary text-primary-foreground px-3 py-1 rounded-full">
                          {t('default')}
                        </span>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-1">
                      {address.street && `${address.street}, `}
                      {address.city}
                    </p>
                    <p className="text-sm text-muted-foreground mb-4">
                      {address.state && `${address.state}, `}
                      {address.country}
                    </p>
                    <div className="flex gap-2">
                      {!address.is_default && (
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
                        className="rounded-full"
                        onClick={() => handleEditAddress(address)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-full text-destructive hover:bg-destructive hover:text-destructive-foreground"
                        onClick={() => handleDeleteAddress(address.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ShippingAddressWithMap;
