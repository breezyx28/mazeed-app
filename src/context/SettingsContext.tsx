import React, { createContext, useContext, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { CapacitorUtils } from '@/lib/capacitor-utils';

interface SettingsState {
  darkMode: boolean;
  notifications: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  biometric: boolean;
  language: string;
}

interface SettingsContextType {
  settings: SettingsState;
  updateSettings: (newSettings: Partial<SettingsState>) => void;
  isBiometricAvailable: boolean;
  checkBiometricAvailability: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider = ({ children }: { children: React.ReactNode }) => {
  const { i18n } = useTranslation();
  
  const [settings, setSettings] = useState<SettingsState>({
    darkMode: false,
    notifications: true,
    emailNotifications: true,
    pushNotifications: true,
    biometric: false,
    language: i18n.language || 'en',
  });

  const [isBiometricAvailable, setIsBiometricAvailable] = useState(false);

  useEffect(() => {
    checkBiometricAvailability();
    // Load settings from local storage if available
    const savedSettings = localStorage.getItem('app_settings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []);

  useEffect(() => {
    // Sync language with i18n
    if (settings.language !== i18n.language) {
      i18n.changeLanguage(settings.language);
      document.dir = settings.language === 'ar' ? 'rtl' : 'ltr';
    }
    // Save to local storage
    localStorage.setItem('app_settings', JSON.stringify(settings));
  }, [settings, i18n]);

  const checkBiometricAvailability = async () => {
    try {
      const result = await CapacitorUtils.isBiometricAvailable();
      setIsBiometricAvailable(result.isAvailable);
    } catch (error) {
      console.error('Biometric check failed', error);
      setIsBiometricAvailable(false);
    }
  };

  const updateSettings = (newSettings: Partial<SettingsState>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  return (
    <SettingsContext.Provider
      value={{
        settings,
        updateSettings,
        isBiometricAvailable,
        checkBiometricAvailability,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
