import React, { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import toast from 'react-hot-toast';
import { Lock, UserPlus, Mail, User, School } from 'lucide-react';

interface CreateSchoolAdminModalProps {
  schoolId: string;
  schoolName: string;
  onClose: () => void;
}

const CreateSchoolAdminModal: React.FC<CreateSchoolAdminModalProps> = ({ schoolId, schoolName, onClose }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Create Auth User (Using a temporary isolated client)
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

      // Sign up the new user
      const { data: authData, error: authError } = await tempClient.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
            role: 'admin',
            school_id: schoolId
          }
        }
      });

      if (authError) throw authError;

      if (authData.user) {
         toast.success(`Admin user created successfully for ${schoolName}!`);
         // Add delay for trigger to finish
         setTimeout(() => {
             onClose();
         }, 1500);
      }
    } catch (error: any) {
      console.error("Creation error:", error);
      toast.error(`Failed to create admin: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleCreate} className="space-y-5">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
        <div className="p-2 bg-blue-100 rounded-full text-blue-600 shrink-0">
            <School size={20} />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-blue-800">Assign School Admin</h4>
          <p className="text-xs text-blue-600 mt-1">
            Creating an administrator for <strong>{schoolName}</strong>. 
            They will have full access to manage this school's data.
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="adminName">Full Name</Label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <User className="h-4 w-4 text-gray-400" />
          </div>
          <Input
            id="adminName"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="pl-10"
            placeholder="e.g. Principal Skinner"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="adminEmail">Email Address</Label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Mail className="h-4 w-4 text-gray-400" />
          </div>
          <Input
            id="adminEmail"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="pl-10"
            placeholder="admin@school.com"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="adminPassword">Password</Label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Lock className="h-4 w-4 text-gray-400" />
          </div>
          <Input
            id="adminPassword"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="pl-10"
            placeholder="••••••••"
            required
            minLength={6}
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
        <Button type="submit" loading={loading}>
            <UserPlus size={18} className="mr-2" />
            Create Admin
        </Button>
      </div>
    </form>
  );
};

export default CreateSchoolAdminModal;
