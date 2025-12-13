import React, { createContext, useState, useEffect, useContext, ReactNode, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Session, User } from '@supabase/supabase-js';

interface Profile {
  id: string;
  name: string;
  role: 'admin' | 'teacher' | 'student' | 'parent' | 'cashier' | 'principal' | 'system_admin';
  avatar_url?: string;
  school_id?: string;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Error signing out:", error);
    }
    // Clear state and local storage to ensure a clean slate
    setSession(null);
    setUser(null);
    setProfile(null);
    localStorage.clear(); 
  }, []);

  const fetchProfile = useCallback(async (user: User | null) => {
    if (!user) {
      setProfile(null);
      return;
    }
    try {
      const { data, error, status } = await supabase
        .from('profiles')
        .select('id, name, role, avatar_url, school_id')
        .eq('id', user.id)
        .single();
      
      if (error && status === 406) {
        setProfile(null);
        console.warn("User authenticated but profile not found.");
        return;
      }

      if (error) throw error;
      
      setProfile(data);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setProfile(null);
    }
  }, []);

  useEffect(() => {
    const setAuthData = async () => {
      try {
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        
        if (error) throw error;

        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        await fetchProfile(currentSession?.user ?? null);
      } catch (e: any) {
        console.error("Error during initial auth check:", e);
        
        // Enhanced error handling for network/corruption issues
        if (
          e.message?.includes('refresh_token_hmac_key') || 
          e.code === 'unexpected_failure' ||
          e.status === 500 ||
          e.message?.includes('Failed to fetch') ||
          e.name === 'TypeError'
        ) {
            console.warn("Session corruption or network issue detected. Clearing session to recover.");
            // Clear local storage manually to ensure bad tokens are gone
            localStorage.clear();
            setSession(null);
            setUser(null);
            setProfile(null);
        }
      } finally {
        setLoading(false);
      }
    };

    setAuthData();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      // If we get a token refresh error, sign out immediately
      if (event === 'TOKEN_REFRESH_PASSWORD_REQUIRED') {
         await signOut();
         return;
      }

      // Handle implicit sign out
      if (event === 'SIGNED_OUT') {
          setSession(null);
          setUser(null);
          setProfile(null);
          setLoading(false);
          return;
      }

      setLoading(true);
      try {
        setSession(newSession);
        setUser(newSession?.user ?? null);
        await fetchProfile(newSession?.user ?? null);
      } catch (error) {
        console.error("Error in onAuthStateChange:", error);
      } finally {
        setLoading(false);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [fetchProfile, signOut]);

  const value = {
    session,
    user,
    profile,
    loading,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
