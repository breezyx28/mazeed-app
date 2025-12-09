import { ArrowLeft, ArrowRight, CreditCard, Plus } from "lucide-react";
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
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

const PaymentMethods = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const [cards, setCards] = useState([
    {
      id: 1,
      type: "Visa",
      last4: "4242",
      expiry: "12/25",
      isDefault: true,
    },
    {
      id: 2,
      type: "Mastercard",
      last4: "8888",
      expiry: "09/26",
      isDefault: false,
    },
  ]);

  const [isOpen, setIsOpen] = useState(false);
  const [newCard, setNewCard] = useState({
    number: "",
    name: "",
    expiry: "",
    cvv: "",
  });

  const handleAddCard = () => {
    if (newCard.number && newCard.name && newCard.expiry && newCard.cvv) {
      const last4 = newCard.number.slice(-4);
      setCards([
        ...cards,
        {
          id: cards.length + 1,
          type: "Card",
          last4,
          expiry: newCard.expiry,
          isDefault: false,
        },
      ]);
      setNewCard({ number: "", name: "", expiry: "", cvv: "" });
      setIsOpen(false);
      toast.success(t('cardAdded'));
    }
  };

  const setDefault = (id: number) => {
    setCards(cards.map((card) => ({ ...card, isDefault: card.id === id })));
    toast.success(t('defaultPaymentUpdated'));
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-accent rounded-full transition-colors">
            {isRTL ? <ArrowRight className="w-5 h-5" /> : <ArrowLeft className="w-5 h-5" />}
          </button>
          <h1 className="text-xl font-bold">{t('paymentMethodsTitle')}</h1>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 py-6">
        {/* Cards List */}
        <div className="space-y-4 mb-6">
          {cards.map((card) => (
            <div key={card.id} className="bg-gradient-to-br from-primary to-primary/80 rounded-2xl p-5 text-primary-foreground shadow-lg">
              <div className="flex items-center justify-between mb-8">
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                  <CreditCard className="w-6 h-6" />
                </div>
                {card.isDefault && (
                  <span className="text-xs bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">{t('default')}</span>
                )}
              </div>
              <div className="space-y-1 mb-4">
                <p className="text-sm opacity-80">{card.type}</p>
                <p className="text-2xl font-bold tracking-wider">•••• {card.last4}</p>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs opacity-60">{t('expires')}</p>
                  <p className="font-semibold">{card.expiry}</p>
                </div>
                {!card.isDefault && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setDefault(card.id)}
                    className="rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm border-0"
                  >
                    {t('setDefault')}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Add New Card Button */}
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="w-full h-14 rounded-full text-base font-semibold">
              <Plus className="w-5 h-5 mr-2" />
              {t('addNewCard')}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md mx-4">
            <DialogHeader>
              <DialogTitle>{t('addNewCardTitle')}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="cardNumber">{t('cardNumber')}</Label>
                <Input
                  id="cardNumber"
                  value={newCard.number}
                  onChange={(e) => setNewCard({ ...newCard, number: e.target.value })}
                  placeholder="1234 5678 9012 3456"
                  maxLength={19}
                  className="h-12 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cardName">{t('cardholderName')}</Label>
                <Input
                  id="cardName"
                  value={newCard.name}
                  onChange={(e) => setNewCard({ ...newCard, name: e.target.value })}
                  placeholder="John Doe"
                  className="h-12 rounded-xl"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="expiry">{t('expiryDate')}</Label>
                  <Input
                    id="expiry"
                    value={newCard.expiry}
                    onChange={(e) => setNewCard({ ...newCard, expiry: e.target.value })}
                    placeholder="MM/YY"
                    maxLength={5}
                    className="h-12 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cvv">CVV</Label>
                  <Input
                    id="cvv"
                    type="password"
                    value={newCard.cvv}
                    onChange={(e) => setNewCard({ ...newCard, cvv: e.target.value })}
                    placeholder="123"
                    maxLength={3}
                    className="h-12 rounded-xl"
                  />
                </div>
              </div>
              <Button onClick={handleAddCard} className="w-full h-12 rounded-full">
                {t('addCard')}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default PaymentMethods;
