import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase, Profile, getProfile } from '@/lib/supabase';
import { Session } from '@supabase/supabase-js';
import { router } from 'expo-router';

type AuthContextType = {
  session: Session | null;
  profile: Profile | null;
  isLoading: boolean;
  signUpStep: number;
  setSignUpStep: (step: number) => void;
  signUpData: {
    email: string;
    password: string;
    fullName: string;
    username: string;
    school: string;
  };
  updateSignUpData: (data: Partial<typeof initialSignUpData>) => void;
  refreshProfile: () => Promise<void>;
};

const initialSignUpData = {
  email: '',
  password: '',
  fullName: '',
  username: '',
  school: '',
};

const AuthContext = createContext<AuthContextType>({
  session: null,
  profile: null,
  isLoading: true,
  signUpStep: 1,
  setSignUpStep: () => {},
  signUpData: initialSignUpData,
  updateSignUpData: () => {},
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [signUpStep, setSignUpStep] = useState(1);
  const [signUpData, setSignUpData] = useState(initialSignUpData);

  useEffect(() => {
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      
      if (session) {
        // Fetch user profile when session changes
        fetchProfile();
      } else {
        setProfile(null);
      }
      
      setIsLoading(false);
    });

    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      
      if (session) {
        fetchProfile();
      } else {
        setIsLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Redirect based on auth state
  useEffect(() => {
    if (!isLoading) {
      if (session && profile) {
        // User is signed in and has a profile
        if (router.pathname === '/' || router.pathname === '/signup' || router.pathname === '/forgot-password') {
          router.replace('/(app)');
        }
      } else if (!session && router.pathname !== '/' && router.pathname !== '/signup' && router.pathname !== '/forgot-password') {
        // User is not signed in but trying to access protected routes
        router.replace('/');
      }
    }
  }, [session, profile, isLoading]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await getProfile();
      
      if (error) {
        console.error('Error fetching profile:', error);
      } else {
        setProfile(data);
      }
    } catch (error) {
      console.error('Error in fetchProfile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshProfile = async () => {
    await fetchProfile();
  };

  const updateSignUpData = (data: Partial<typeof initialSignUpData>) => {
    setSignUpData(prev => ({ ...prev, ...data }));
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        profile,
        isLoading,
        signUpStep,
        setSignUpStep,
        signUpData,
        updateSignUpData,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);