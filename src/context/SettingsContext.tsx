import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import toast from 'react-hot-toast';
import { useGlobal } from './GlobalContext';

interface SettingsContextType {
  schoolName: string;
  schoolFee: number;
  academicYear: string;
  loading: boolean;
  updateSetting: (key: string, value: string | number) => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { profile } = useGlobal();
  const [schoolName, setSchoolName] = useState<string>('SchoolMS');
  const [schoolFee, setSchoolFee] = useState<number>(1200);
  const [academicYear, setAcademicYear] = useState<string>('2024-2025');
  const [loading, setLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    if (!profile?.school_id) {
        setLoading(false);
        return;
    }

    setLoading(true);
    try {
      // Fetch settings specifically for this school
      const { data: settingsData, error } = await supabase
        .from('settings')
        .select('*')
        .eq('school_id', profile.school_id);

      if (error) throw new Error(error.message);
      
      if (settingsData) {
        const nameSetting = settingsData.find(s => s.key === 'school_name');
        if (nameSetting) setSchoolName(nameSetting.value);
        
        const feeSetting = settingsData.find(s => s.key === 'school_fee');
        if (feeSetting) setSchoolFee(Number(feeSetting.value));
        
        const yearSetting = settingsData.find(s => s.key === 'academic_year');
        if (yearSetting) setAcademicYear(yearSetting.value);
      }
    } catch (error: any) {
      console.error(`Failed to fetch settings: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [profile?.school_id]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateSetting = async (key: string, value: string | number) => {
    if (!profile?.school_id) {
        toast.error("You must be assigned to a school to update settings.");
        return;
    }

    await toast.promise(
      (async () => {
        // We must include school_id in the upsert payload to match the unique index (school_id, key)
        const { error } = await supabase.from('settings').upsert(
            { 
                key, 
                value: String(value),
                school_id: profile.school_id 
            }, 
            { onConflict: 'school_id, key' }
        );
        
        if (error) throw new Error(error.message);

        // Update local state immediately
        if (key === 'school_name') setSchoolName(String(value));
        if (key === 'academic_year') setAcademicYear(String(value));
        if (key === 'school_fee') {
          setSchoolFee(Number(value));
          // Optional: Update existing tuition fee records if needed
          // await supabase.from('fees').update({ amount: Number(value) }).eq('description', 'Tuition Fee').eq('school_id', profile.school_id);
        }
      })(),
      { 
        loading: 'Saving settings...', 
        success: 'Settings saved successfully!', 
        error: (err) => `Failed to save settings: ${err?.message || 'Unknown error'}` 
      }
    );
  };

  const value: SettingsContextType = {
    schoolName,
    schoolFee,
    academicYear,
    loading,
    updateSetting,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
