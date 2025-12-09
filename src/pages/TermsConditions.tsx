import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const TermsConditions = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <h1 className="text-xl font-semibold">{t('termsOfService') || 'Terms & Conditions'}</h1>
        </div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl mx-auto px-4 py-8"
      >
        <div className="bg-white rounded-2xl p-6 shadow-sm space-y-6 text-gray-700 leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">1. Acceptance of Terms</h2>
            <p>
              By downloading, accessing, or using the Mazeed Store mobile application, you agree to be bound by these Terms and Conditions. 
              If you do not agree to these terms, please do not use our services.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">2. User Accounts</h2>
            <p>
              To use certain features of the app, you must register for an account. You are responsible for maintaining the confidentiality of your account credentials 
              and for all activities that occur under your account. You must provide accurate and complete information during registration.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">3. Products and Pricing</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>All prices are listed in Sudanese Pounds (SDG).</li>
              <li>We strive to ensure all pricing and product information is accurate, but errors may occur. We reserve the right to correct any errors.</li>
              <li>Prices and availability are subject to change without notice.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">4. Orders and Payments</h2>
            <p className="mb-2">We accept the following payment methods:</p>
            <ul className="list-disc pl-5 space-y-1 mb-2">
              <li>Cash on Delivery (COD)</li>
              <li>Bankak (Bank of Khartoum)</li>
              <li>Visa / Mastercard</li>
            </ul>
            <p>
              We reserve the right to refuse or cancel any order for any reason, including limitations on quantities available for purchase or inaccuracies in product or pricing information.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">5. Delivery</h2>
            <p>
              We deliver to specified areas within Sudan. Delivery times are estimates and cannot be guaranteed. 
              Delays may occur due to unforeseen circumstances or external factors.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">6. Returns and Refunds</h2>
            <p>
              You may return eligible items within 3 days of delivery if they are defective or not as described. 
              Items must be unused and in their original packaging. Refunds will be processed according to the original payment method or as store credit.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">7. Intellectual Property</h2>
            <p>
              All content included in the app, such as text, graphics, logos, images, and software, is the property of Mazeed Store or its content suppliers 
              and is protected by copyright laws.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">8. Governing Law</h2>
            <p>
              These Terms and Conditions shall be governed by and construed in accordance with the laws of the Republic of Sudan.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">9. Contact Information</h2>
            <p>
              For any questions regarding these Terms, please contact us at support@mazeed.com.
            </p>
          </section>

          <div className="pt-6 border-t border-gray-100 text-sm text-gray-500">
            Last updated: November 2025
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default TermsConditions;
