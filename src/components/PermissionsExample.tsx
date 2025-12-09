import React from 'react';
import { Button } from './ui/button';
import { CapacitorUtils } from '../lib/capacitor-utils';
import { toast } from 'sonner';

export const PermissionsExample: React.FC = () => {
  const handleRequestNotifications = async () => {
    const granted = await CapacitorUtils.requestNotificationPermissions();
    toast(granted ? 'Notifications enabled!' : 'Notifications denied');
  };

  const handleScheduleNotification = async () => {
    await CapacitorUtils.scheduleLocalNotification(
      'Test Notification',
      'This is a test notification from your app!'
    );
    toast('Notification scheduled for 5 seconds');
  };

  const handleVibrate = async () => {
    await CapacitorUtils.vibrate(500);
    toast('Device vibrated');
  };

  const handleTakePicture = async () => {
    const imageUrl = await CapacitorUtils.takePicture();
    if (imageUrl) {
      toast('Picture taken successfully!');
    } else {
      toast('Failed to take picture');
    }
  };

  const handleGetLocation = async () => {
    const hasPermission = await CapacitorUtils.requestLocationPermissions();
    if (!hasPermission) {
      toast('Location permission denied');
      return;
    }

    const location = await CapacitorUtils.getCurrentLocation();
    if (location) {
      toast(`Location: ${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`);
    } else {
      toast('Failed to get location');
    }
  };

  const handleBiometricAuth = async () => {
    const isAvailable = await CapacitorUtils.isBiometricAvailable();
    if (!isAvailable) {
      toast('Biometric authentication not available');
      return;
    }

    const success = await CapacitorUtils.authenticateWithBiometric('Authenticate to test biometric');
    toast(success ? 'Biometric authentication successful!' : 'Biometric authentication failed');
  };

  if (!CapacitorUtils.isNative()) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-yellow-800">
          This component only works on mobile devices. Build and run on Android to test permissions.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      <h3 className="text-lg font-semibold">Test Native Permissions</h3>
      
      <div className="grid grid-cols-2 gap-2">
        <Button onClick={handleRequestNotifications} variant="outline">
          Request Notifications
        </Button>
        
        <Button onClick={handleScheduleNotification} variant="outline">
          Schedule Notification
        </Button>
        
        <Button onClick={handleVibrate} variant="outline">
          Vibrate
        </Button>
        
        <Button onClick={handleTakePicture} variant="outline">
          Take Picture
        </Button>
        
        <Button onClick={handleGetLocation} variant="outline">
          Get Location
        </Button>
        
        <Button onClick={handleBiometricAuth} variant="outline">
          Biometric Auth
        </Button>
      </div>
    </div>
  );
};