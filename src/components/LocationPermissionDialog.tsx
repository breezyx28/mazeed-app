import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { MapPin, Shield, Zap, Navigation } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface LocationPermissionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export const LocationPermissionDialog: React.FC<LocationPermissionDialogProps> = ({
  open,
  onOpenChange,
  onConfirm,
}) => {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-secondary to-primary" />
        
        <DialogHeader className="pt-4">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4 animate-bounce-subtle">
            <MapPin className="w-8 h-8 text-primary" />
          </div>
          <DialogTitle className="text-2xl text-center font-bold">
            {t('nearbyProducts.enableLocationTitle', 'Find Nearby Products')}
          </DialogTitle>
          <DialogDescription className="text-center text-base pt-2">
            {t('nearbyProducts.enableLocationDesc', 'See products available in stores near your current location in Khartoum.')}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-6">
          <div className="flex items-start gap-4 p-3 rounded-lg border bg-muted/30">
            <div className="mt-1 bg-primary/20 p-2 rounded-md">
              <Zap className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="font-medium text-sm">{t('nearbyProducts.benefit1Title', 'Faster Access')}</p>
              <p className="text-xs text-muted-foreground">{t('nearbyProducts.benefit1Desc', 'Find physical stores you can visit today.')}</p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-3 rounded-lg border bg-muted/30">
            <div className="mt-1 bg-secondary/20 p-2 rounded-md">
              <Navigation className="w-4 h-4 text-secondary" />
            </div>
            <div>
              <p className="font-medium text-sm">{t('nearbyProducts.benefit2Title', 'Easy Navigation')}</p>
              <p className="text-xs text-muted-foreground">{t('nearbyProducts.benefit2Desc', 'Get precise walking directions to any store.')}</p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-3 rounded-lg border bg-muted/30">
            <div className="mt-1 bg-green-500/20 p-2 rounded-md">
              <Shield className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <p className="font-medium text-sm">{t('nearbyProducts.privacyTitle', 'Your Privacy Matters')}</p>
              <p className="text-xs text-muted-foreground">{t('nearbyProducts.privacyDesc', 'We only use your location while you are using the app.')}</p>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto order-2 sm:order-1"
          >
            {t('common.maybeLater', 'Maybe Later')}
          </Button>
          <Button 
            onClick={onConfirm}
            className="w-full sm:w-auto order-1 sm:order-2 bg-gradient-to-r from-primary to-primary/80 hover:opacity-90 transition-opacity"
          >
            {t('nearbyProducts.allowAccess', 'Allow Access')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
