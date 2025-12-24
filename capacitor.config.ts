import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mazeedapp.app',
  appName: 'Mazeed',
  webDir: 'dist',
  plugins: {
    NativeBiometric: {
      useFallback: false,
      allowDeviceCredential: false,
      biometryType: 'fingerprint'
    },
     GoogleAuth: {
      scopes: ['profile', 'email'],
      serverClientId: '483329714188-3498q4gkjig7jo1honqjqmrie7c36roo.apps.googleusercontent.com',
      forceCodeForRefreshToken: true
    }
  }
};

export default config;
