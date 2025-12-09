import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Truck, CreditCard, Bitcoin, Upload, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

const PaymentSelection = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const mbokAccount = "1234567890123456";
  const binanceId = "123456789";
  const binanceLink = "https://www.binance.com/en/qr/dqr_123456789";

  const paymentMethods = [
    {
      id: 'cod',
      name: 'الدفع عند الاستلام',
      description: 'ادفع نقداً عند وصول الطلب',
      icon: Truck,
      color: 'text-green-600'
    },
    {
      id: 'mbok',
      name: 'مبوك',
      description: 'تحويل بنكي عبر مبوك',
      icon: CreditCard,
      color: 'text-blue-600'
    },
    {
      id: 'crypto',
      name: 'العملة المشفرة',
      description: 'دفع بالعملة المشفرة USDT',
      icon: Bitcoin,
      color: 'text-orange-600'
    }
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      toast.success('تم رفع الملف بنجاح');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('تم نسخ الرقم');
  };

  const handleProceed = () => {
    if (selectedMethod === 'cod') {
      navigate('/order-success');
    } else if ((selectedMethod === 'mbok' && uploadedFile) || selectedMethod === 'crypto') {
      setIsProcessing(true);
      toast.success('جاري مراجعة الدفع من قبل الإدارة...');
      // Simulate admin confirmation
      setTimeout(() => {
        navigate('/order-success');
      }, 3000);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-32">
      <header className="sticky top-0 z-40 bg-card border-b border-border">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-accent rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold">طريقة الدفع</h1>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 mt-6 mb-14">
        <div className="space-y-4 mb-6">
          {paymentMethods.map((method) => (
            <motion.div
              key={method.id}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedMethod(method.id)}
              className={`bg-card rounded-2xl p-4 border-2 cursor-pointer transition-all ${
                selectedMethod === method.id ? 'border-primary' : 'border-border'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-full bg-muted flex items-center justify-center ${method.color}`}>
                  <method.icon className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">{method.name}</h3>
                  <p className="text-sm text-muted-foreground">{method.description}</p>
                </div>
                {selectedMethod === method.id && <Check className="w-5 h-5 text-primary" />}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Mbok Payment Details */}
        {selectedMethod === 'mbok' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-2xl p-4 mb-6"
          >
            <h3 className="font-semibold mb-3">تفاصيل التحويل</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-2 p-3 bg-muted rounded-xl">
                <span className="flex-1 font-mono">{mbokAccount}</span>
                <Button size="sm" variant="ghost" onClick={() => copyToClipboard(mbokAccount)}>
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">رفع صورة الإيصال</label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="h-12"
                />
                {uploadedFile && (
                  <p className="text-sm text-green-600 mt-2">✓ تم رفع الملف: {uploadedFile.name}</p>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Crypto Payment Details */}
        {selectedMethod === 'crypto' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-2xl p-4 mb-6"
          >
            <h3 className="font-semibold mb-3">تفاصيل الدفع بالعملة المشفرة</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-2">معرف بينانس</label>
                <div className="flex items-center gap-2 p-3 bg-muted rounded-xl">
                  <span className="flex-1 font-mono">{binanceId}</span>
                  <Button size="sm" variant="ghost" onClick={() => copyToClipboard(binanceId)}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => window.open(binanceLink, '_blank')}
              >
                فتح رابط بينانس المباشر
              </Button>
            </div>
          </motion.div>
        )}

        {isProcessing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 mb-6"
          >
            <p className="text-yellow-800 text-center">جاري مراجعة الدفع من قبل الإدارة...</p>
          </motion.div>
        )}
      </div>

      <div className="fixed bottom-20 left-0 right-0 bg-card border-t border-border p-4 z-40">
        <div className="max-w-md mx-auto">
          <Button 
            onClick={handleProceed}
            disabled={!selectedMethod || (selectedMethod === 'mbok' && !uploadedFile) || isProcessing}
            className="w-full h-14 rounded-full font-semibold"
          >
            {isProcessing ? 'جاري المراجعة...' : 'تأكيد الطلب'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PaymentSelection;