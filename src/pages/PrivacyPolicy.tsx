import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const PrivacyPolicy = () => {
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
          <h1 className="text-xl font-semibold">{t('privacyPolicy') || 'Privacy Policy'}</h1>
        </div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl mx-auto px-4 py-8"
      >
        <div className="bg-white rounded-2xl p-6 shadow-sm space-y-6 text-gray-700 leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">1. Introduction</h2>
            <p>
              Welcome to Mazeed Store. We respect your privacy and are committed to protecting your personal data. 
              This privacy policy explains how we collect, use, and protect your information when you use our mobile application and services in Sudan.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">2. Information We Collect</h2>
            <p className="mb-2">We collect information that is necessary to provide our services to you, including:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Personal Information:</strong> Name, phone number, email address, and delivery address.</li>
              <li><strong>Account Information:</strong> Username, password, and profile preferences.</li>
              <li><strong>Transaction Data:</strong> Details about payments to and from you and other details of products you have purchased from us.</li>
              <li><strong>Device Information:</strong> Information about the device you use to access our app.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">3. How We Use Your Information</h2>
            <p className="mb-2">We use your data to:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Process and deliver your orders.</li>
              <li>Manage your account and authentication.</li>
              <li>Process payments via Bankak, Visa, or Cash on Delivery.</li>
              <li>Send you order updates and promotional offers (if opted in).</li>
              <li>Improve our app functionality and user experience.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">4. Data Sharing</h2>
            <p>
              We do not sell your personal data. We may share your information with trusted third parties solely for the purpose of providing our services:
            </p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li><strong>Delivery Partners:</strong> To ensure your package reaches you.</li>
              <li><strong>Payment Processors:</strong> To securely handle transactions.</li>
              <li><strong>Legal Authorities:</strong> If required by Sudanese law.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">5. Data Security</h2>
            <p>
              We implement appropriate security measures to prevent your personal data from being accidentally lost, used, or accessed in an unauthorized way. 
              However, please note that no method of transmission over the internet is 100% secure.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">6. Your Rights</h2>
            <p>
              You have the right to access, correct, or delete your personal data stored with us. You can manage most of your information directly through the "Edit Profile" section of the app.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">7. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy, please contact us at:
            </p>
            <p className="mt-2 font-medium">Email: support@mazeed.com</p>
            <p className="font-medium">Phone: +249 912 345 678</p>
          </section>

          <div className="pt-6 border-t border-gray-100 text-sm text-gray-500">
            Last updated: November 2025
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default PrivacyPolicy;
