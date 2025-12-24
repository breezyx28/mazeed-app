import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Eye, EyeOff, Fingerprint } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useSettings } from "@/context/SettingsContext";
import { CapacitorUtils } from "@/lib/capacitor-utils";
import { useAuth } from "@/context/AuthContext";

const loginSchema = z.object({
  email: z.string().email("Invalid email address").min(1, "Email is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormData = z.infer<typeof loginSchema>;

const Login = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { settings, isBiometricAvailable } = useSettings();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { loginWithEmail, loginWithGoogle, isAuthenticated, loginWithBiometrics } = useAuth();
  const [showBiometricLogin, setShowBiometricLogin] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/");
    }
    // Check if user has enabled biometrics on this device
    const hasBiometrics = localStorage.getItem('has_biometrics') === 'true';
    setShowBiometricLogin(hasBiometrics);
  }, [isAuthenticated, navigate]);

  const handleBiometricLogin = async () => {
    setIsLoading(true);
    try {
      // Use standard WebAuthn (Passkeys) login linked to server
      const success = await loginWithBiometrics();
      if (success) {
        navigate("/");
      }
    } catch (error) {
      console.error("Biometric login failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestBiometric = async () => {
    if (!CapacitorUtils.isNative()) {
      toast.error(t("biometricTestingNative"));
      return;
    }

    const result = await CapacitorUtils.isBiometricAvailable();
    if (!result.isAvailable) {
      toast.error(t("fingerprintNotAvailableDevice"));
      return;
    }

    const allow = window.confirm(
      t("allowBiometric") || "Allow app to use fingerprint for testing?"
    );
    if (!allow) return;

    setIsLoading(true);
    const success = await CapacitorUtils.verifyIdentity({
      reason: t("testBiometricAuth"),
      title: t("testBiometric"),
      subtitle: t("confirmYourIdentity"),
      description: t("testBiometricAuth")
    });
    setIsLoading(false);

    if (success) {
      toast.success(t("biometricTestSucceeded"));
    } else {
      toast.error(t("biometricTestFailed"));
    }
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      await loginWithEmail(data.email, data.password);
      
      // Save credentials for biometric authentication
      if (CapacitorUtils.isNative()) {
        await CapacitorUtils.setCredentials({
          username: data.email,
          password: data.password,
          server: "mazeed-store",
        });
      }

      toast.success(t('loginSuccess') || 'Login successful!');
      navigate("/");
    } catch (error: any) {
      toast.error(error.message || t("loginError"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Abstract Background Shapes */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-amber-200 to-yellow-200 rounded-full opacity-60 blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-orange-200 to-amber-200 rounded-full opacity-60 blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-60 h-60 bg-gradient-to-r from-yellow-200 to-orange-100 rounded-full opacity-40 blur-2xl"></div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-white rounded-t-[2rem] rounded-b-2xl shadow-2xl shadow-black/10 overflow-hidden">
          <div className="p-8">
            <div className="flex justify-center mb-6">
              <img
                src="/assets/icons/android-chrome-512x512.png"
                alt="Mazzed Logo"
                className="w-24 h-24 object-contain"
              />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2 text-center">
              {t("welcomeBack")}
            </h1>
            <p className="text-gray-500 text-center mb-8">
              {t("signInToAccount")}
            </p>

            {/* Google Sign In */}
            <Button
              variant="outline"
              onClick={loginWithGoogle}
              className="w-full h-12 rounded-full border border-gray-200 bg-white hover:bg-gray-50 mb-6 font-medium text-gray-700"
            >
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              {t("loginWithGoogle")}
            </Button>

            {showBiometricLogin && (
              <Button
                variant="outline"
                onClick={handleBiometricLogin}
                className="w-full h-12 rounded-full border border-gray-200 bg-white hover:bg-gray-50 mb-6 font-medium text-gray-700 gap-2"
              >
                <Fingerprint className="w-5 h-5" />
                {t("useFingerprint")}
              </Button>
            )}

            {CapacitorUtils.isNative() && (
              <Button
                variant="ghost"
                onClick={handleTestBiometric}
                className="w-full h-10 rounded-full border border-dashed border-gray-200 bg-white hover:bg-gray-50 mb-6 font-medium text-gray-700"
              >
                {t("testBiometricButton")}
              </Button>
            )}

            {/* Or Separator */}
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">{t("or")}</span>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Email */}
              <div>
                <Input
                  type="email"
                  placeholder={t("email")}
                  className={`h-12 rounded-xl border-gray-200 focus:border-gray-400 focus:ring-0 ${
                    errors.email ? "border-red-500" : ""
                  }`}
                  {...register("email")}
                />
                {errors.email && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder={t("password")}
                    className={`h-12 rounded-xl border-gray-200 focus:border-gray-400 focus:ring-0 pr-12 ${
                      errors.password ? "border-red-500" : ""
                    }`}
                    {...register("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Sign In Button */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 rounded-full bg-black hover:bg-gray-800 text-white font-semibold mt-6 mb-6 disabled:opacity-50"
              >
                {isLoading ? t("loggingIn") : t("signIn")}
              </Button>
            </form>

            {/* Register Link */}
            <p className="text-sm text-gray-600 text-center">
              {t("dontHaveAccount")}{" "}
              <button
                onClick={() => navigate("/register")}
                className="underline text-gray-900 font-medium hover:no-underline"
              >
                {t("createOneHere")}
              </button>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
