import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';
import { supabase } from './supabase';
import { App } from '@capacitor/app';
import { PushNotifications } from '@capacitor/push-notifications';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Geolocation } from '@capacitor/geolocation';
import { NativeBiometric, BiometryType } from '@capgo/capacitor-native-biometric';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';

export class CapacitorUtils {
  static isNative() {
    return Capacitor.isNativePlatform();
  }

  static initialize() {
    if (this.isNative()) {
      GoogleAuth.initialize(
        {
          clientId: '483329714188-rjrddhk71mbd25859embl5kare6ei74g.apps.googleusercontent.com',
          scopes: ['profile', 'email'],
          grantOfflineAccess: true,
        }
      );
    }
  }

  static async registerPushNotifications(userId: string) {
    if (!this.isNative()) {
      // Browser push notification logic can be complex without a service worker file,
      // but we can at least request permission for local notifications/web push
      if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          console.log('Browser notification permission granted');
          // In a real app, this is where we'd register a Service Worker for Web Push
        }
      }
      return;
    }

    try {
      // Reset badge count
      await PushNotifications.removeAllDeliveredNotifications();

      // Request permissions
      const permission = await PushNotifications.requestPermissions();
      if (permission.receive === 'granted') {
        // Register with Apple / Google to receive push via APNS/FCM
        await PushNotifications.register();
      }

      // On success, we should be able to receive notifications
      PushNotifications.addListener('registration', async (token) => {
        console.log('Push registration success, token: ' + token.value);
        
        // Save token to Supabase
        await supabase
          .from('user_push_tokens')
          .upsert({
            user_id: userId,
            token: token.value,
            platform: Capacitor.getPlatform(),
            updated_at: new Date().toISOString()
          }, { onConflict: 'user_id, token' });
      });

      // Some errors occurred
      PushNotifications.addListener('registrationError', (error: any) => {
        console.error('Error on push registration: ' + JSON.stringify(error));
      });

      // Show the notification payload if the app is open
      PushNotifications.addListener('pushNotificationReceived', (notification) => {
        console.log('Push received: ' + JSON.stringify(notification));
        // We can show a local toast here or it might be handled by the OS
      });

      // Method called when tapping on a notification
      PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
        console.log('Push action performed: ' + JSON.stringify(notification));
        const data = notification.notification.data;
        
        // Auto-navigate to seller orders if the notification is for an order
        if (data?.type === 'order' || data?.order_id) {
          const targetPath = `/seller/orders${data.order_id ? `?id=${data.order_id}` : ''}`;
          console.log('Auto-navigating to:', targetPath);
          window.location.href = targetPath; // Use window.location as fallback if navigate isn't available in this context
        }
      });

    } catch (error) {
      console.error('Error setting up push notifications:', error);
    }
  }

  static async requestNotificationPermissions() {
    if (!this.isNative()) return false;
    
    try {
      const pushResult = await PushNotifications.requestPermissions();
      const localResult = await LocalNotifications.requestPermissions();
      return pushResult.receive === 'granted' && localResult.display === 'granted';
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  }

  static async scheduleLocalNotification(title: string, body: string, id = 1) {
    if (!this.isNative()) return;
    
    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            title,
            body,
            id,
            schedule: { at: new Date(Date.now() + 1000 * 5) }, // 5 seconds from now
          }
        ]
      });
    } catch (error) {
      console.error('Error scheduling notification:', error);
    }
  }

  static async vibrate(duration = 300) {
    if (!this.isNative()) return;
    
    try {
      await Haptics.vibrate({ duration });
    } catch (error) {
      console.error('Error vibrating:', error);
    }
  }

  static async impactFeedback(style: ImpactStyle = ImpactStyle.Medium) {
    if (!this.isNative()) return;
    
    try {
      await Haptics.impact({ style });
    } catch (error) {
      console.error('Error with haptic feedback:', error);
    }
  }

  static async takePicture() {
    if (!this.isNative()) return null;
    
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: true,
        resultType: CameraResultType.Uri,
        source: CameraSource.Prompt // Let user choose camera or gallery
      });
      return image.webPath;
    } catch (error) {
      console.error('Error taking picture:', error);
      return null;
    }
  }

  static async getCurrentLocation() {
    if (!this.isNative()) return null;
    
    try {
      const coordinates = await Geolocation.getCurrentPosition();
      return {
        latitude: coordinates.coords.latitude,
        longitude: coordinates.coords.longitude
      };
    } catch (error) {
      console.error('Error getting location:', error);
      return null;
    }
  }

  static async requestLocationPermissions() {
    if (!this.isNative()) return false;
    
    try {
      const permissions = await Geolocation.requestPermissions();
      return permissions.location === 'granted';
    } catch (error) {
      console.error('Error requesting location permissions:', error);
      return false;
    }
  }

  static async isBiometricAvailable() {
    if (!this.isNative()) return { isAvailable: false };
    
    try {
      return await NativeBiometric.isAvailable();
    } catch (error) {
      console.error('Error checking biometric availability:', error);
      return { isAvailable: false };
    }
  }

  static async verifyIdentity(options?: { 
    reason?: string; 
    title?: string; 
    subtitle?: string; 
    description?: string;
    negativeButtonText?: string;
    useFallback?: boolean;
    maxAttempts?: number;
  }) {
    if (!this.isNative()) return false;
    
    try {
      const result = await NativeBiometric.isAvailable();

      if (!result.isAvailable) return false;

      await NativeBiometric.verifyIdentity({
        reason: options?.reason || "For easy log in",
        title: options?.title || "Log in",
        subtitle: options?.subtitle || "Authenticate to continue",
        description: options?.description || "Please authenticate to access this feature",
        negativeButtonText: options?.negativeButtonText,
        useFallback: options?.useFallback,
        maxAttempts: options?.maxAttempts
      });
      return true;
    } catch (error) {
      console.error('Biometric verification failed:', error);
      return false;
    }
  }

  static async setCredentials(options: { username: string; password: string; server: string }) {
    if (!this.isNative()) return;
    try {
      await NativeBiometric.setCredentials(options);
    } catch (error) {
      console.error('Error setting credentials:', error);
      throw error;
    }
  }

  static async getCredentials(options: { server: string }) {
    if (!this.isNative()) return null;
    try {
      return await NativeBiometric.getCredentials(options);
    } catch (error) {
      console.error('Error getting credentials:', error);
      throw error;
    }
  }

  static async deleteCredentials(options: { server: string }) {
    if (!this.isNative()) return;
    try {
      await NativeBiometric.deleteCredentials(options);
    } catch (error) {
      console.error('Error deleting credentials:', error);
      throw error;
    }
  }

  static async isCredentialsSaved(options: { server: string }) {
    if (!this.isNative()) return false;
    try {
      const result = await NativeBiometric.isCredentialsSaved(options);
      return result.isSaved;
    } catch (error) {
      console.error('Error checking if credentials saved:', error);
      return false;
    }
  }

  static async share(options: { title?: string; text?: string; url?: string; dialogTitle?: string }) {
    if (!this.isNative()) {
      // Fallback for web
      if (navigator.share) {
        try {
          await navigator.share({
            title: options.title,
            text: options.text,
            url: options.url
          });
          return true;
        } catch (error) {
          console.error('Error sharing on web:', error);
          return false;
        }
      } else {
        // Copy to clipboard fallback
        if (options.url) {
          await navigator.clipboard.writeText(options.url);
          return 'copied';
        }
        return false;
      }
    }

    try {
      await Share.share({
        title: options.title,
        text: options.text,
        url: options.url,
        dialogTitle: options.dialogTitle,
      });
      return true;
    } catch (error) {
      console.error('Error sharing:', error);
      return false;
    }
  }
  static async loginWithGoogle() {
    if (!this.isNative()) {
      // For web, we might want to let Supabase handle it directly via OAuth redirect
      // or use the web implementation of the plugin if configured.
      // But based on the user request, they specifically guarded for native in their snippet.
      // However, for the app flow, we might want to return null or handle it.
      return null;
    }

    try {
      console.log('Calling GoogleAuth.signIn()...');
      const user = await GoogleAuth.signIn();
      console.log("Google user:", user);
      console.log("Google user authentication:", user?.authentication);
      return user;
    } catch (err: any) {
      console.error("Google login failed", err);
      console.error("Error code:", err?.code);
      console.error("Error message:", err?.message);
      console.error("Full error:", JSON.stringify(err, null, 2));
      throw err;
    }
  }

  /**
   * Setup deep link listener to handle URLs that open the app
   * @param callback Function to call when app is opened via URL
   * @returns Cleanup function to remove the listener
   */
  static async setupDeepLinkListener(callback: (url: string) => void) {
    if (!this.isNative()) return () => {};

    const listener = await App.addListener('appUrlOpen', (event) => {
      console.log('App opened with URL:', event.url);
      callback(event.url);
    });

    return () => {
      listener.remove();
    };
  }

  /**
   * Get the URL that was used to launch the app (if any)
   * Useful for handling deep links when app starts
   */
  static async getInitialUrl(): Promise<string | null> {
    if (!this.isNative()) return null;

    try {
      const result = await App.getLaunchUrl();
      return result?.url || null;
    } catch (error) {
      console.error('Error getting launch URL:', error);
      return null;
    }
  }
}