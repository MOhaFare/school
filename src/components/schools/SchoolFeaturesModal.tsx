import React, { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { supabase } from '../../lib/supabaseClient';
import toast from 'react-hot-toast';
import { Check, X, Shield, Settings, LayoutDashboard, ClipboardList, GraduationCap, BookOpen, Video, CalendarDays, Book, DownloadCloud, Users, DollarSign, TrendingUp, ClipboardCheck, FileText, Monitor, MessageSquare, Library, Box, Bus, BedDouble, Badge, FilePieChart } from 'lucide-react';

interface SchoolFeaturesModalProps {
  schoolId: string;
  schoolName: string;
  onClose: () => void;
}

const FEATURE_LIST = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'front-office', label: 'Front Office', icon: ClipboardList },
  { key: 'student-info', label: 'Student Information', icon: GraduationCap },
  { key: 'academics', label: 'Academics', icon: BookOpen },
  { key: 'live-classes', label: 'Live Classes', icon: Video },
  { key: 'lesson-plan', label: 'Lesson Plan', icon: CalendarDays },
  { key: 'homework', label: 'Homework', icon: Book },
  { key: 'download-center', label: 'Download Center', icon: DownloadCloud },
  { key: 'hr', label: 'Human Resource', icon: Users },
  { key: 'fees', label: 'Fees Collection', icon: DollarSign },
  { key: 'finance', label: 'Income & Expenses', icon: TrendingUp },
  { key: 'attendance', label: 'Attendance', icon: ClipboardCheck },
  { key: 'exams', label: 'Examinations', icon: FileText },
  { key: 'online-exams', label: 'Online Examinations', icon: Monitor },
  { key: 'communicate', label: 'Communicate', icon: MessageSquare },
  { key: 'library', label: 'Library', icon: Library },
  { key: 'inventory', label: 'Inventory', icon: Box },
  { key: 'transport', label: 'Transport', icon: Bus },
  { key: 'hostel', label: 'Hostel', icon: BedDouble },
  { key: 'certificate', label: 'Certificate', icon: Badge },
  { key: 'alumni', label: 'Alumni', icon: GraduationCap },
  { key: 'reports', label: 'Reports', icon: FilePieChart },
  { key: 'settings', label: 'System Settings', icon: Settings },
];

const SchoolFeaturesModal: React.FC<SchoolFeaturesModalProps> = ({ schoolId, schoolName, onClose }) => {
  const [enabledFeatures, setEnabledFeatures] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchFeatures = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('schools')
        .select('features')
        .eq('id', schoolId)
        .single();
      
      if (error) {
        toast.error('Failed to load features');
      } else {
        setEnabledFeatures(data.features || []);
      }
      setLoading(false);
    };
    fetchFeatures();
  }, [schoolId]);

  const toggleFeature = (key: string) => {
    setEnabledFeatures(prev => 
      prev.includes(key) 
        ? prev.filter(k => k !== key)
        : [...prev, key]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('schools')
        .update({ features: enabledFeatures })
        .eq('id', schoolId);

      if (error) throw error;
      toast.success('School features updated successfully!');
      onClose();
    } catch (error: any) {
      toast.error(`Failed to update features: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleSelectAll = () => {
    setEnabledFeatures(FEATURE_LIST.map(f => f.key));
  };

  const handleDeselectAll = () => {
    setEnabledFeatures(['dashboard', 'settings']); // Keep core features
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
        <div className="p-2 bg-blue-100 rounded-full text-blue-600 shrink-0">
            <Shield size={20} />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-blue-800">Manage Features for {schoolName}</h4>
          <p className="text-xs text-blue-600 mt-1">
            Enable or disable modules for this school. Disabled modules will be hidden from the school admin's menu.
          </p>
        </div>
      </div>

      <div className="flex justify-end gap-2 text-sm">
        <button onClick={handleSelectAll} className="text-blue-600 hover:underline">Select All</button>
        <span className="text-gray-300">|</span>
        <button onClick={handleDeselectAll} className="text-blue-600 hover:underline">Deselect All</button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto p-1">
        {FEATURE_LIST.map((feature) => {
          const isEnabled = enabledFeatures.includes(feature.key);
          const Icon = feature.icon;
          return (
            <div 
              key={feature.key}
              onClick={() => toggleFeature(feature.key)}
              className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
                isEnabled 
                  ? 'bg-blue-50 border-blue-200 shadow-sm' 
                  : 'bg-white border-gray-200 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-md ${isEnabled ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
                  <Icon size={18} />
                </div>
                <span className={`text-sm font-medium ${isEnabled ? 'text-blue-900' : 'text-gray-600'}`}>
                  {feature.label}
                </span>
              </div>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center border ${
                isEnabled ? 'bg-blue-600 border-blue-600' : 'border-gray-300'
              }`}>
                {isEnabled && <Check size={12} className="text-white" />}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} loading={saving}>Save Changes</Button>
      </div>
    </div>
  );
};

export default SchoolFeaturesModal;
