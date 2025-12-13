import React, { createContext, useState, useEffect, useContext, ReactNode, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Session, User } from '@supabase/supabase-js';
import toast from 'react-hot-toast';
import { Notification } from '../types';
import { translations, Language } from '../utils/translations';

interface Profile {
  id: string;
  name: string;
  role: 'admin' | 'teacher' | 'student' | 'parent' | 'cashier' | 'principal' | 'system_admin';
  avatar_url?: string;
  school_id?: string;
}

interface GlobalContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  schoolName: string;
  schoolLogo: string | null;
  schoolFee: number;
  academicYear: string;
  updateSetting: (key: string, value: string | number) => Promise<void>;
  notifications: Notification[];
  unreadCount: number;
  fetchNotifications: () => Promise<void>;
  markNotificationAsRead: (notificationId: string) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;
  createNotification: (notification: Omit<Notification, 'id' | 'created_at' | 'read'>) => Promise<void>;
  
  // Multi-System States
  language: Language;
  setLanguage: (lang: Language) => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  t: (key: keyof typeof translations['en']) => string;
  selectedSession: string;
  setSelectedSession: (session: string) => void;
}

const GlobalContext = createContext<GlobalContextType | undefined>(undefined);

export const GlobalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Auth States
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  
  // Settings States
  const [schoolName, setSchoolName] = useState<string>('SchoolMS');
  const [schoolLogo, setSchoolLogo] = useState<string | null>(null);
  const [schoolFee, setSchoolFee] = useState<number>(1200);
  const [academicYear, setAcademicYear] = useState<string>('2024-2025');

  // Multi-System States
  const [language, setLanguage] = useState<Language>('en');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [selectedSession, setSelectedSession] = useState<string>('2024-2025');

  // Notification States
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const [loading, setLoading] = useState(true);

  // Theme Effect
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Translation Helper
  const t = (key: keyof typeof translations['en']) => {
    return translations[language][key] || translations['en'][key] || key;
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Error signing out:", error);
    }
    setProfile(null);
    setUser(null);
    setSession(null);
    localStorage.clear();
  }, []);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      setNotifications(data || []);
      setUnreadCount((data || []).filter(n => !n.read).length);
    } catch (error: any) {
      console.error(`Failed to fetch notifications: ${error.message}`);
    }
  }, [user]);

  useEffect(() => {
    const initAuth = async () => {
      setLoading(true);
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) throw error;

        setSession(session);
        setUser(session?.user ?? null);
      } catch (error: any) {
        console.error("Auth initialization error:", error);
        
        // Handle specific session corruption errors
        if (
          error.message?.includes('refresh_token_hmac_key') || 
          error.code === 'unexpected_failure' ||
          error.status === 500 ||
          error.message?.includes('Failed to fetch') ||
          error.name === 'TypeError'
        ) {
           console.warn("Session corruption detected. Clearing storage to recover.");
           localStorage.clear();
           setSession(null);
           setUser(null);
           setProfile(null);
        }
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'TOKEN_REFRESH_PASSWORD_REQUIRED') {
         signOut();
         return;
      }
      
      setSession(session);
      setUser(session?.user ?? null);
      
      // If signed out, stop loading immediately
      if (event === 'SIGNED_OUT') {
        setLoading(false);
        setProfile(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [signOut]);

  useEffect(() => {
    if (user) {
      const fetchUserData = async (retries = 3) => {
        try {
          // Fetch profile including school_id
          const [profileResponse, settingsResponse] = await Promise.all([
            supabase.from('profiles').select('id, name:full_name, role, avatar_url, school_id').eq('id', user.id).single(),
            supabase.from('settings').select('*')
          ]);

          const { data: profileData, error: profileError } = profileResponse;
          
          if (profileError) {
             // If profile not found (406), it might be a new user or sync issue
             if (profileError.code === 'PGRST116') {
                console.warn("Profile not found for user.");
             } else {
                // If it's a recursion error, we need to be careful not to loop
                if (profileError.message?.includes('infinite recursion')) {
                    console.error("Infinite recursion detected in profile fetch. Check RLS policies.");
                    setProfile(null);
                    return;
                }
                throw new Error(profileError.message);
             }
          }
          
          setProfile(profileData);

          // Fetch School Details if attached to a school
          if (profileData?.school_id) {
            const { data: schoolData } = await supabase
                .from('schools')
                .select('name, logo_url')
                .eq('id', profileData.school_id)
                .single();
            
            if (schoolData) {
                setSchoolName(schoolData.name);
                setSchoolLogo(schoolData.logo_url);
            }
          }

          // Fetch Settings
          const { data: settingsData, error: settingsError } = settingsResponse;
          if (settingsError) throw new Error(settingsError.message);

          if (settingsData) {
            // Only override school name from settings if user is NOT linked to a specific school
            if (!profileData?.school_id) {
                const nameSetting = settingsData.find((s: any) => s.key === 'school_name');
                if (nameSetting) setSchoolName(nameSetting.value);
            }
            
            const feeSetting = settingsData.find((s: any) => s.key === 'school_fee');
            if (feeSetting) setSchoolFee(Number(feeSetting.value));
            const yearSetting = settingsData.find((s: any) => s.key === 'academic_year');
            if (yearSetting) {
                setAcademicYear(yearSetting.value);
                setSelectedSession(yearSetting.value);
            }
          }
          
          await fetchNotifications();

        } catch (error: any) {
          console.error('Error fetching user data:', error);
          
          // Retry logic for network errors
          if (retries > 0 && (
            error.message?.includes('Failed to fetch') || 
            error.name === 'TypeError' ||
            error.status === 500
          )) {
            console.warn(`Network error fetching user data. Retrying... (${retries} left)`);
            setTimeout(() => fetchUserData(retries - 1), 1500);
            return;
          }
        }
      };
      fetchUserData();
    } else {
      setProfile(null);
      setSchoolName('SchoolMS');
      setSchoolLogo(null);
      setSchoolFee(1200);
      setAcademicYear('2024-2025');
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [user, fetchNotifications]);

  const updateSetting = async (key: string, value: string | number) => {
    await toast.promise(
      (async () => {
        const { error } = await supabase.from('settings').upsert({ key, value: String(value) }, { onConflict: 'key' });
        if (error) throw error;
        if (key === 'school_name') setSchoolName(String(value));
        if (key === 'academic_year') {
            setAcademicYear(String(value));
            setSelectedSession(String(value));
        }
        if (key === 'school_fee') {
          setSchoolFee(Number(value));
          await supabase.from('fees').update({ amount: Number(value) }).eq('description', 'Tuition Fee');
        }
      })(),
      { loading: 'Saving settings...', success: 'Settings saved!', error: (err) => `Failed to save: ${err.message}` }
    );
  };

  const markNotificationAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase.from('notifications').update({ read: true }).eq('id', notificationId);
      if (error) throw error;
      setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error: any) {
      toast.error(`Failed to mark as read: ${error.message}`);
    }
  };

  const markAllNotificationsAsRead = async () => {
    if (!user) return;
    try {
      const { error } = await supabase.from('notifications').update({ read: true }).eq('user_id', user.id).eq('read', false);
      if (error) throw error;
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error: any) {
      toast.error(`Failed to mark all as read: ${error.message}`);
    }
  };

  const createNotification = async (notification: Omit<Notification, 'id' | 'created_at' | 'read'>) => {
    try {
      const { error } = await supabase.from('notifications').insert({ ...notification, read: false });
      if (error) throw error;
    } catch (error: any) {
      console.error(`Failed to create notification: ${error.message}`);
    }
  };

  const value: GlobalContextType = {
    session, user, profile, loading, signOut, schoolName, schoolLogo, schoolFee, academicYear, updateSetting,
    notifications, unreadCount, fetchNotifications, markNotificationAsRead, markAllNotificationsAsRead, createNotification,
    language, setLanguage, theme, toggleTheme, t, selectedSession, setSelectedSession
  };

  return (
    <GlobalContext.Provider value={value}>
      {children}
    </GlobalContext.Provider>
  );
};

export const useGlobal = (): GlobalContextType => {
  const context = useContext(GlobalContext);
  if (context === undefined) {
    throw new Error('useGlobal must be used within a GlobalProvider');
  }
  return context;
};
