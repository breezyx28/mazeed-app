import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';

const Checkout = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [selectedAddress, setSelectedAddress] = useState(0);

  const addresses = [
    {
      id: 1,
      type: "المنزل",
      address: "شارع الملك فهد، حي العليا",
      city: "الرياض، المملكة العربية السعودية",
    },
    {
      id: 2,
      type: "العمل", 
      address: "طريق الملك عبدالعزيز، حي الوزارات",
      city: "الرياض، المملكة العربية السعودية",
    },
  ];

  const handleConfirmLocation = () => {
    navigate('/payment-selection');
  };

  return (
    <div className="min-h-screen bg-background pb-32">
      <header className="sticky top-0 z-40 bg-card border-b border-border">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-accent rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold">تأكيد العنوان</h1>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 mt-6">
        <div className="space-y-4 mb-6">
          {addresses.map((address, index) => (
            <motion.div
              key={address.id}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedAddress(index)}
              className={`bg-card rounded-2xl p-4 border-2 cursor-pointer transition-all ${
                selectedAddress === index ? 'border-primary' : 'border-border'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold">{address.type}</h3>
                    {selectedAddress === index && <Check className="w-4 h-4 text-primary" />}
                  </div>
                  <p className="text-sm text-muted-foreground">{address.address}</p>
                  <p className="text-sm text-muted-foreground">{address.city}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <Button 
          variant="outline" 
          onClick={() => navigate('/shipping-address')}
          className="w-full h-12 rounded-full mb-6"
        >
          إضافة عنوان جديد
        </Button>
      </div>

      <div className="fixed bottom-20 left-0 right-0 bg-card border-t border-border p-4 z-40">
        <div className="max-w-md mx-auto">
          <Button onClick={handleConfirmLocation} className="w-full h-14 rounded-full font-semibold">
            تأكيد العنوان والمتابعة
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Checkout;