import { ArrowLeft, ArrowRight, MapPin, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

const ShippingAddress = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const [addresses, setAddresses] = useState([
    {
      id: 1,
      name: t('home'),
      address: "شارع الملك فهد، حي العليا",
      city: "الرياض، المملكة العربية السعودية",
      phone: "+966 50 123 4567",
      isDefault: true,
    },
    {
      id: 2,
      name: t('office'),
      address: "طريق الملك عبدالعزيز، حي الوزارات",
      city: "الرياض، المملكة العربية السعودية",
      phone: "+966 50 123 4568",
      isDefault: false,
    },
  ]);

  const [isOpen, setIsOpen] = useState(false);
  const [newAddress, setNewAddress] = useState({
    name: "",
    address: "",
    city: "",
    phone: "",
  });

  const handleAddAddress = () => {
    if (newAddress.name && newAddress.address && newAddress.city && newAddress.phone) {
      setAddresses([
        ...addresses,
        {
          id: addresses.length + 1,
          ...newAddress,
          isDefault: false,
        },
      ]);
      setNewAddress({ name: "", address: "", city: "", phone: "" });
      setIsOpen(false);
      toast.success(t('addressAdded'));
    }
  };

  const setDefault = (id: number) => {
    setAddresses(addresses.map((addr) => ({ ...addr, isDefault: addr.id === id })));
    toast.success(t('defaultAddressUpdated'));
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-accent rounded-full transition-colors">
            {isRTL ? <ArrowRight className="w-5 h-5" /> : <ArrowLeft className="w-5 h-5" />}
          </button>
          <h1 className="text-xl font-bold">{t('shippingAddressTitle')}</h1>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 py-6">
        {/* Address List */}
        <div className="space-y-4 mb-6">
          {addresses.map((addr) => (
            <div key={addr.id} className="bg-card rounded-2xl p-4 border border-border">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold">{addr.name}</h3>
                    {addr.isDefault && (
                      <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{t('default')}</span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{addr.address}</p>
                  <p className="text-sm text-muted-foreground">{addr.city}</p>
                  <p className="text-sm text-muted-foreground mt-1">{addr.phone}</p>
                </div>
              </div>
              {!addr.isDefault && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDefault(addr.id)}
                  className="w-full rounded-full"
                >
                  {t('setAsDefault')}
                </Button>
              )}
            </div>
          ))}
        </div>

        {/* Add New Address Button */}
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="w-full h-14 rounded-full text-base font-semibold">
              <Plus className="w-5 h-5 mr-2" />
              {t('addNewAddress')}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md mx-4">
            <DialogHeader>
              <DialogTitle>{t('addNewAddressTitle')}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t('label')}</Label>
                <Input
                  id="name"
                  value={newAddress.name}
                  onChange={(e) => setNewAddress({ ...newAddress, name: e.target.value })}
                  placeholder={t('home')}
                  className="h-12 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">{t('streetAddress')}</Label>
                <Textarea
                  id="address"
                  value={newAddress.address}
                  onChange={(e) => setNewAddress({ ...newAddress, address: e.target.value })}
                  placeholder="شارع الملك فهد، حي العليا"
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">{t('cityStateZip')}</Label>
                <Input
                  id="city"
                  value={newAddress.city}
                  onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                  placeholder="الرياض، المملكة العربية السعودية"
                  className="h-12 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">{t('phoneNumber')}</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={newAddress.phone}
                  onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                  placeholder="+966 50 123 4567"
                  className="h-12 rounded-xl"
                />
              </div>
              <Button onClick={handleAddAddress} className="w-full h-12 rounded-full">
                {t('addAddress')}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default ShippingAddress;
