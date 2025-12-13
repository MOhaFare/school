import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import toast from 'react-hot-toast';
import { Lock, UserPlus, AlertCircle, School, Loader } from 'lucide-react';
import { useGlobal } from '../../context/GlobalContext';
import { supabase } from '../../lib/supabaseClient';

interface CreateUserModalProps {
  email: string;
  name: string;
  role: 'student' | 'teacher';
  schoolId?: string; // Optional: If not provided, falls back to current user's school
  onClose: () => void;
  onSuccess: () => void;
}

const CreateUserModal: React.FC<CreateUserModalProps> = ({ email, name, role, schoolId, onClose, onSuccess }) => {
  const { profile } = useGlobal();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [targetSchoolName, setTargetSchoolName] = useState<string>('');
  const [checkingSchool, setCheckingSchool] = useState(false);

  // Determine the effective school ID
  const targetSchoolId = schoolId || profile?.school_id;

  useEffect(() => {
    const fetchSchoolName = async () => {
      if (targetSchoolId) {
        setCheckingSchool(true);
        const { data } = await supabase.from('schools').select('name').eq('id', targetSchoolId).single();
        if (data) {
          setTargetSchoolName(data.name);
        }
        setCheckingSchool(false);
      }
    };
    fetchSchoolName();
  }, [targetSchoolId]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!targetSchoolId) {
      toast.error("Cannot create user: No School ID assigned to this record.");
      return;
    }

    setLoading(true);

    try {
      // Create a temporary Supabase client that doesn't persist session
      // This prevents the admin from being logged out when creating a new user
      const tempClient = createClient(
        import.meta.env.VITE_SUPABASE_URL,
        import.meta.env.VITE_SUPABASE_ANON_KEY,
        {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false
          }
        }
      );

      const { data, error } = await tempClient.auth.signUp({
        email,
        password,
        options: {
          data: {
            role,
            full_name: name,
            school_id: targetSchoolId
          }
        }
      });

      if (error) throw error;

      if (data.user) {
        toast.success(`Login created for ${name}!`);
        // Add a delay to allow the database trigger to complete before refreshing
        setTimeout(() => {
            onSuccess();
            onClose();
        }, 1500);
      }
    } catch (error: any) {
      console.error("User creation error:", error);
      toast.error(`Failed to create user: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleCreateUser} className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <UserPlus className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
          <div>
            <h4 className="text-sm font-semibold text-blue-800">Create Login Credentials</h4>
            <p className="text-xs text-blue-600 mt-1">
              Creating login for <strong>{name}</strong> ({email}).
            </p>
          </div>
        </div>
        
        {/* School Context Indicator */}
        <div className="mt-3 pt-3 border-t border-blue-200 flex items-center gap-2 text-xs text-blue-800">
          <School size={14} />
          {checkingSchool ? (
            <span className="flex items-center gap-1"><Loader size={10} className="animate-spin"/> Verifying school...</span>
          ) : targetSchoolName ? (
            <span>Assigning to: <strong>{targetSchoolName}</strong></span>
          ) : (
            <span className="text-red-600 font-bold flex items-center gap-1">
              <AlertCircle size={12}/> Warning: No School Assigned
            </span>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Set Password</Label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Lock className="h-4 w-4 text-gray-400" />
          </div>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="pl-10"
            placeholder="Enter a secure password"
            required
            minLength={6}
          />
        </div>
        <p className="text-xs text-gray-500">Must be at least 6 characters.</p>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
        <Button type="submit" loading={loading} disabled={!targetSchoolId || checkingSchool}>
          Create Login
        </Button>
      </div>
    </form>
  );
};

export default CreateUserModal;
