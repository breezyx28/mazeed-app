import { ArrowLeft, Bell, Globe, Lock, Fingerprint } from "lucide-react";
import { CapacitorUtils } from "@/lib/capacitor-utils";
import { useNavigate } from "react-router-dom";
import { SwitchRTL as Switch } from "@/components/ui/switch-rtl";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useSettings } from "@/context/SettingsContext";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useNotifications } from "@/context/NotificationContext";

const Settings = () => {
  const navigate = useNavigate();
  const { settings, updateSettings, isBiometricAvailable } = useSettings();
  const { t, i18n } = useTranslation();
  const { addNotification } = useNotifications();

  const handleLanguageChange = () => {
    const newLang = settings.language === 'ar' ? 'en' : 'ar';
    updateSettings({ language: newLang });
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-accent rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold">Settings</h1>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 py-6">
        {/* Notifications */}
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-muted-foreground mb-3 px-1">NOTIFICATIONS</h2>
          <div className="bg-card rounded-2xl p-4 space-y-4 border border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                  <Bell className="w-5 h-5" />
                </div>
                <Label htmlFor="notifications" className="font-medium cursor-pointer">
                  Allow Mobile Notifications
                </Label>
              </div>
              <Switch
                id="notifications"
                checked={settings.notifications}
                onCheckedChange={(checked) => updateSettings({ notifications: checked })}
              />
            </div>
            
            {settings.notifications && (
              <>
                <div className="flex items-center justify-between pl-13">
                  <Label htmlFor="email-notif" className="text-sm cursor-pointer">
                    Email Notifications
                  </Label>
                  <Switch
                    id="email-notif"
                    checked={settings.emailNotifications}
                    onCheckedChange={(checked) => updateSettings({ emailNotifications: checked })}
                  />
                </div>
                <div className="flex items-center justify-between pl-13">
                  <Label htmlFor="push-notif" className="text-sm cursor-pointer">
                    Push Notifications
                  </Label>
                  <Switch
                    id="push-notif"
                    checked={settings.pushNotifications}
                    onCheckedChange={(checked) => updateSettings({ pushNotifications: checked })}
                  />
                </div>
              </>
            )}
            
            <Button 
              variant="outline" 
              onClick={() => addNotification({
                type: 'alert',
                title: 'Test Notification',
                message: 'This is a test notification to verify sound and badge functionality.',
              })}
              className="w-full mt-2"
            >
              Test Notification Sound
            </Button>
            
            <Button 
              variant="outline" 
              onClick={async () => {
                if (CapacitorUtils.isNative()) {
                  await CapacitorUtils.requestNotificationPermissions();
                  await CapacitorUtils.scheduleLocalNotification('Test Local Notification', 'This is a test local notification!');
                } else {
                  // Web notification
                  if ('Notification' in window) {
                    const permission = await Notification.requestPermission();
                    if (permission === 'granted') {
                      new Notification('Test Local Notification', {
                        body: 'This is a test local notification!',
                        icon: '/favicon.ico'
                      });
                    }
                  }
                }
              }}
              className="w-full mt-2"
            >
              Test Local Notification
            </Button>
          </div>
        </div>

        {/* Security */}
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-muted-foreground mb-3 px-1">SECURITY</h2>
          <div className="bg-card rounded-2xl p-4 space-y-4 border border-border">
            {isBiometricAvailable && (
              <>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                      <Fingerprint className="w-5 h-5" />
                    </div>
                    <div>
                      <Label htmlFor="biometric" className="font-medium cursor-pointer">
                        Fingerprint Authentication
                      </Label>
                      <p className="text-xs text-muted-foreground">Use fingerprint to login securely</p>
                    </div>
                  </div>
                  <Switch
                    id="biometric"
                    checked={settings.biometric}
                    onCheckedChange={async (checked) => {
                      if (checked) {
                        const success = await CapacitorUtils.verifyIdentity({
                          reason: "Enable fingerprint authentication",
                          title: "Enable Biometric",
                          subtitle: "Confirm your identity",
                          description: "Enable fingerprint authentication"
                        });
                        if (success) {
                          updateSettings({ biometric: checked });
                          toast.success("Fingerprint authentication enabled");
                        }
                      } else {
                        updateSettings({ biometric: checked });
                        toast.success("Fingerprint authentication disabled");
                      }
                    }}
                  />
                </div>
                
                <Button 
                  variant="outline" 
                  onClick={async () => {
                    const success = await CapacitorUtils.verifyIdentity({
                        reason: "Test fingerprint",
                        title: "Test Biometric",
                        subtitle: "Confirm your identity",
                        description: "Test fingerprint"
                    });
                    if (success) {
                      toast.success("Fingerprint verified successfully");
                    } else {
                      toast.error("Fingerprint verification failed");
                    }
                  }}
                  className="w-full"
                >
                  Test Fingerprint
                </Button>
              </>
            )}
            
            <button className="flex items-center gap-3 w-full hover:opacity-70 transition-opacity">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                <Lock className="w-5 h-5" />
              </div>
              <span className="font-medium">Change Password</span>
            </button>
          </div>
        </div>

        {/* General */}
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-muted-foreground mb-3 px-1">GENERAL</h2>
          <div className="bg-card rounded-2xl p-4 border border-border">
            <button 
              onClick={handleLanguageChange}
              className="flex items-center gap-3 w-full hover:opacity-70 transition-opacity"
            >
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                <Globe className="w-5 h-5" />
              </div>
              <span className="font-medium">Language</span>
              <span className="ml-auto text-sm text-muted-foreground">
                {settings.language === 'ar' ? 'العربية' : 'English'}
              </span>
            </button>
          </div>
        </div>

        {/* About */}
        <div className="space-y-2 px-1">
          <Button variant="ghost" className="w-full justify-start text-muted-foreground">
            Privacy Policy
          </Button>
          <Button variant="ghost" className="w-full justify-start text-muted-foreground">
            Terms of Service
          </Button>
          <Button variant="ghost" className="w-full justify-start text-muted-foreground">
            About App
          </Button>
          <p className="text-center text-sm text-muted-foreground pt-4">Version 1.0.0</p>
        </div>
      </div>
    </div>
  );
};

export default Settings;
