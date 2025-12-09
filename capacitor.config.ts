import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mazeedapp.app',
  appName: 'Mazzed',
  webDir: 'dist',
  plugins: {
    NativeBiometric: {
      useFallback: false,
      allowDeviceCredential: false,
      biometryType: 'fingerprint'
    },
     GoogleAuth: {
      scopes: ['profile', 'email'],
      serverClientId: '483329714188-rjrddhk71mbd25859embl5kare6ei74g.apps.googleusercontent.com',
      forceCodeForRefreshToken: true
    }
  }
};

export default config;
