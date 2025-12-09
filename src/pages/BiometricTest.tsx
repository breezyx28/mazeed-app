import { useState } from 'react';
import { ArrowLeft, Fingerprint } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { CapacitorUtils } from '@/lib/capacitor-utils';
import { toast } from 'sonner';

const BiometricTest = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const testBiometric = async () => {
    setIsLoading(true);
    try {
      // Check if biometric is available
      const isAvailable = await CapacitorUtils.isBiometricAvailable();
      if (!isAvailable) {
        toast.error('Fingerprint authentication not available on this device');
        return;
      }

      // Test authentication
      const success = await CapacitorUtils.authenticateWithBiometric('Test fingerprint authentication');
      if (success) {
        toast.success('Fingerprint authentication successful!');
      } else {
        toast.error('Fingerprint authentication failed');
      }
    } catch (error) {
      toast.error('Error testing fingerprint authentication');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-accent rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold">Biometric Test</h1>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 py-8">
        <div className="bg-card rounded-2xl p-6 border border-border text-center">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <Fingerprint className="w-8 h-8" />
          </div>
          
          <h2 className="text-lg font-semibold mb-2">Test Fingerprint Authentication</h2>
          <p className="text-muted-foreground mb-6">
            This will test if fingerprint authentication is working on your device.
          </p>

          <Button 
            onClick={testBiometric}
            disabled={isLoading}
            className="w-full h-12 rounded-full"
          >
            {isLoading ? 'Testing...' : 'Test Fingerprint'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BiometricTest;