import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Session, User } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { CapacitorUtils } from '@/lib/capacitor-utils';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  session: Session | null;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  signupWithEmail: (email: string, password: string, fullName: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);

  const upsertProfile = async (user: User, userData?: { full_name?: string; avatar_url?: string }) => {
    try {
      const updates = {
        id: user.id,
        email: user.email,
        full_name: userData?.full_name || user.user_metadata.full_name || user.user_metadata.name,
        avatar_url: userData?.avatar_url || user.user_metadata.avatar_url || user.user_metadata.picture,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('profiles')
        .upsert(updates);

      if (error) {
        console.error('Error updating profile:', error);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsAuthenticated(!!session);
      setIsLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsAuthenticated(!!session);
      setIsLoading(false);

      if (event === 'SIGNED_IN' && session?.user) {
        await upsertProfile(session.user);
      }
    });

    // Handle Deep Links for Auth (Native only)
    let cleanupDeepLink: (() => void) | undefined;
    
    if (CapacitorUtils.isNative()) {
      const handleAuthDeepLink = async (url: string) => {
        if (url.includes('code=') || url.includes('access_token=') || url.includes('refresh_token=')) {
          console.log('Received auth deep link:', url);
          
          // Handle PKCE flow (code)
          const params = new URLSearchParams(url.split('?')[1]);
          const code = params.get('code');
          
          if (code) {
            console.log('Exchanging code for session...');
            const { error } = await supabase.auth.exchangeCodeForSession(code);
            if (error) {
              console.error('Error exchanging code:', error);
              toast.error('Failed to complete login');
            } else {
              toast.success('Login successful!');
            }
          }
          
          // Handle Implicit flow (hash)
          const hash = url.split('#')[1];
          if (hash) {
            const hashParams = new URLSearchParams(hash);
            const accessToken = hashParams.get('access_token');
            const refreshToken = hashParams.get('refresh_token');
            
            if (accessToken && refreshToken) {
               console.log('Setting session from hash...');
               const { error } = await supabase.auth.setSession({
                 access_token: accessToken,
                 refresh_token: refreshToken
               });
               if (error) console.error('Error setting session:', error);
            }
          }
        }
      };

      CapacitorUtils.setupDeepLinkListener(handleAuthDeepLink).then(cleanup => {
        cleanupDeepLink = cleanup;
      });
    }

    return () => {
      subscription.unsubscribe();
      if (cleanupDeepLink) cleanupDeepLink();
    };
  }, []);

  const loginWithGoogle = async () => {
    try {
      console.log('Starting Google login...');
      
      // Determine redirect URL based on platform
      const redirectTo = CapacitorUtils.isNative() 
        ? 'mazeedapp://open' 
        : `https://eqihnrwxroamwrlwpaig.supabase.co/auth/v1/callback`;
        
      console.log('Redirecting to:', redirectTo);

      // Force web auth as per request
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });
      
      if (error) throw error;
    } catch (error: any) {
      console.error('Login error:', error);
      console.error('Error type:', typeof error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      
      let errorMessage = 'Failed to login with Google';
      
      if (error.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      toast.error(`Google Login Failed: ${errorMessage}`);
    }
  };

  const loginWithEmail = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      if (data.user) {
        await upsertProfile(data.user);
      }
      toast.success('Logged in successfully');
    } catch (error: any) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const signupWithEmail = async (email: string, password: string, fullName: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });
      if (error) throw error;
      // Note: For signup, the user might not be fully created/confirmed yet depending on settings,
      // but we can try to upsert if we have a user object.
      if (data.user) {
        await upsertProfile(data.user);
      }
      toast.success('Account created! Please check your email.');
    } catch (error: any) {
      console.error('Signup error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast.success('Logged out successfully');
    } catch (error: any) {
      console.error('Logout error:', error);
      toast.error('Failed to logout');
    }
  };

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      isLoading, 
      user, 
      session, 
      loginWithGoogle, 
      loginWithEmail,
      signupWithEmail,
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
