import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Bell, Lock, School, Landmark, Copy } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useGlobal } from '../context/GlobalContext';
import { supabase } from '../lib/supabaseClient';
import toast from 'react-hot-toast';
import ImageUpload from '../components/ui/ImageUpload';
import Modal from '../components/ui/Modal';
import ChangePasswordModal from '../components/users/ChangePasswordModal';

const Settings: React.FC = () => {
  const { schoolName, schoolFee, academicYear, schoolLogo, updateSetting, profile } = useGlobal();

  const [isEditingName, setIsEditingName] = useState(false);
  const [localName, setLocalName] = useState(schoolName);
  const [isEditingYear, setIsEditingYear] = useState(false);
  const [localYear, setLocalYear] = useState(academicYear);
  
  const [localFee, setLocalFee] = useState<number>(schoolFee);
  const [isFeeSaved, setIsFeeSaved] = useState(false);
  
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  useEffect(() => {
    setLocalName(schoolName);
  }, [schoolName]);

  useEffect(() => {
    setLocalYear(academicYear);
  }, [academicYear]);

  useEffect(() => {
    setLocalFee(schoolFee);
  }, [schoolFee]);

  const handleSaveName = async () => {
    await updateSetting('school_name', localName);
    setIsEditingName(false);
  };

  const handleSaveYear = async () => {
    await updateSetting('academic_year', localYear);
    setIsEditingYear(false);
  };

  const handleSaveFee = async () => {
    await updateSetting('school_fee', localFee);
    setIsFeeSaved(true);
    setTimeout(() => setIsFeeSaved(false), 2000);
  };

  const handleLogoUpload = async (file: File | null) => {
    if (!file || !profile?.school_id) return;
    
    try {
        const fileExt = file.name.split('.').pop();
        const filePath = `school-logos/${profile.school_id}-${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file);
        
        if (uploadError) throw uploadError;
        
        const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
        
        const { error: updateError } = await supabase
            .from('schools')
            .update({ logo_url: data.publicUrl })
            .eq('id', profile.school_id);
            
        if (updateError) throw updateError;
        
        toast.success('School logo updated! Refresh to see changes.');
        
    } catch (error: any) {
        toast.error(`Failed to update logo: ${error.message}`);
    }
  };

  const copySchoolId = () => {
    if (profile?.school_id) {
      navigator.clipboard.writeText(profile.school_id);
      toast.success('School ID copied to clipboard');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <SettingsIcon className="h-10 w-10 text-gray-500" />
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Settings</h1>
          <p className="text-slate-500 mt-1">Manage your account and application settings</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center"><School className="mr-3 h-5 w-5 text-blue-600"/>General Settings</h3>
        </div>
        <div className="p-6 space-y-4 divide-y">
          
          <div className="flex justify-between items-center pb-4">
            <div>
              <label className="font-medium text-gray-700">School ID</label>
              <p className="text-sm text-gray-500">Unique identifier for your institution</p>
            </div>
            <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-md border border-slate-200">
                <code className="text-sm text-slate-700 font-mono">{profile?.school_id || 'Not Assigned'}</code>
                {profile?.school_id && (
                    <button onClick={copySchoolId} className="text-slate-400 hover:text-blue-600 transition-colors" title="Copy ID">
                        <Copy size={14} />
                    </button>
                )}
            </div>
          </div>

          <div className="flex justify-between items-center pt-4">
            <div>
              <label htmlFor="schoolName" className="font-medium text-gray-700">School Name</label>
              {!isEditingName ? (
                <p className="text-sm text-gray-500">{schoolName}</p>
              ) : (
                <Input 
                  id="schoolName"
                  type="text"
                  value={localName}
                  onChange={(e) => setLocalName(e.target.value)}
                  className="mt-1"
                />
              )}
            </div>
            {!isEditingName ? (
              <Button variant="secondary" onClick={() => setIsEditingName(true)}>Edit</Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => { setIsEditingName(false); setLocalName(schoolName); }}>Cancel</Button>
                <Button onClick={handleSaveName}>Save</Button>
              </div>
            )}
          </div>
          
          <div className="flex justify-between items-start pt-4">
             <div>
                <label className="font-medium text-gray-700">School Logo</label>
                <p className="text-sm text-gray-500 mb-2">Upload your school's official logo.</p>
                <ImageUpload onFileChange={handleLogoUpload} initialPreviewUrl={schoolLogo} />
             </div>
          </div>

           <div className="flex justify-between items-center pt-4">
            <div>
              <label htmlFor="academicYear" className="font-medium text-gray-700">Academic Year</label>
              {!isEditingYear ? (
                <p className="text-sm text-gray-500">{academicYear}</p>
              ) : (
                <Input 
                  id="academicYear"
                  type="text"
                  value={localYear}
                  onChange={(e) => setLocalYear(e.target.value)}
                  className="mt-1"
                  placeholder="e.g., 2024-2025"
                />
              )}
            </div>
            {!isEditingYear ? (
              <Button variant="secondary" onClick={() => setIsEditingYear(true)}>Change</Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => { setIsEditingYear(false); setLocalYear(academicYear); }}>Cancel</Button>
                <Button onClick={handleSaveYear}>Save</Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center"><Landmark className="mr-3 h-5 w-5 text-green-600"/>Fee Settings</h3>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <label htmlFor="schoolFee" className="font-medium text-gray-700">Base Tuition Fee (Birr)</label>
              <p className="text-sm text-gray-500">This fee will be applied as the base tuition for all students.</p>
            </div>
            <div className="flex items-center gap-2">
              <Input 
                id="schoolFee"
                type="number"
                value={localFee}
                onChange={(e) => setLocalFee(Number(e.target.value))}
                className="w-32 text-right"
              />
              <Button onClick={handleSaveFee} disabled={isFeeSaved}>
                {isFeeSaved ? 'Saved!' : 'Save'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center"><Bell className="mr-3 h-5 w-5 text-yellow-600"/>Notifications</h3>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="font-medium text-gray-700">Email Notifications</p>
              <p className="text-sm text-gray-500">Receive important updates via email.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" value="" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center"><Lock className="mr-3 h-5 w-5 text-red-600"/>Security</h3>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="font-medium text-gray-700">Password</p>
              <p className="text-sm text-gray-500">Update your account password.</p>
            </div>
            <Button variant="secondary" onClick={() => setIsPasswordModalOpen(true)}>Change Password</Button>
          </div>
        </div>
      </div>

      <Modal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        title="Change Password"
        size="sm"
      >
        <ChangePasswordModal onClose={() => setIsPasswordModalOpen(false)} />
      </Modal>
    </div>
  );
};

export default Settings;
