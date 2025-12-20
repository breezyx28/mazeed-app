import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { useTranslation } from "react-i18next";
import { Loader2, CreditCard, Banknote, Building2 } from "lucide-react";

export default function PaymentSettings() {
  const { t } = useTranslation();
  const { sellerProfile } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // State for available methods (could be fetched from a config table)
  // For now we hardcode common ones and manage their 'active' status
  const [methods, setMethods] = useState([
    { id: 'cash', name: 'Cash on Delivery', icon: Banknote, enabled: false },
    { id: 'card', name: 'Credit/Debit Card', icon: CreditCard, enabled: false },
    { id: 'bank_transfer', name: 'Bank Transfer', icon: Building2, enabled: false },
  ]);

  useEffect(() => {
    // Fetch seller's enabled payment methods
    const fetchMethods = async () => {
      try {
        const { data, error } = await supabase
          .from('seller_payment_methods')
          .select('method_id, is_active')
          .eq('seller_id', sellerProfile?.id);

        if (error) throw error;

        // Map db results to local state
        const enabledIds = new Set(data?.filter(m => m.is_active).map(m => m.method_id));
        
        setMethods(prev => prev.map(m => ({
          ...m,
          enabled: enabledIds.has(m.id)
        })));
      } catch (error) {
        console.error("Error fetching payment methods:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (sellerProfile?.id) {
      fetchMethods();
    }
  }, [sellerProfile?.id]);

  const toggleMethod = async (methodId: string, isEnabled: boolean) => {
    setSaving(true);
    try {
      // Upsert into seller_payment_methods
      const { error } = await supabase
        .from('seller_payment_methods')
        .upsert({
          seller_id: sellerProfile?.id,
          method_id: methodId,
          is_active: isEnabled,
          updated_at: new Date().toISOString()
        }, { onConflict: 'seller_id, method_id' });

      if (error) throw error;

      setMethods(prev => prev.map(m => 
        m.id === methodId ? { ...m, enabled: isEnabled } : m
      ));

      toast({
        title: t('success'),
        description: t('paymentMethodsUpdated'),
      });
    } catch (error: any) {
      toast({
        title: t('failure'),
        description: error.message,
        variant: "destructive",
      });
      // Revert state if failed
      setMethods(prev => prev.map(m => 
        m.id === methodId ? { ...m, enabled: !isEnabled } : m
      ));
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) return <div className="p-8 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto" /></div>;

  return (
    <div className="container p-4 pb-24 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-6">{t('paymentMethods')}</h1>
      
      <div className="space-y-4">
        {methods.map((method) => (
          <div key={method.id} className="flex items-center justify-between p-4 bg-card border rounded-xl shadow-sm">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-primary/10 rounded-lg text-primary">
                <method.icon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold">{method.name}</h3>
                <p className="text-xs text-muted-foreground">{method.enabled ? t('enabled') : t('disabled')}</p>
              </div>
            </div>
            
            <Switch
              checked={method.enabled}
              onCheckedChange={(checked) => toggleMethod(method.id, checked)}
              disabled={saving}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
