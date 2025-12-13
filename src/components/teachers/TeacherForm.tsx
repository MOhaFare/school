import React, { useState, useEffect, forwardRef } from 'react';
import { Teacher } from '../../types';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { Select } from '../ui/Select';
import ImageUpload from '../ui/ImageUpload';
import { supabase } from '../../lib/supabaseClient';
import { useGlobal } from '../../context/GlobalContext';

interface TeacherFormProps {
  teacher?: Teacher | null;
  onSubmit: (data: {
    formData: Omit<Teacher, 'id' | 'issuedDate' | 'expiryDate' | 'avatar'> & { id?: string };
    imageFile: File | null;
  }) => void;
}

const subjects = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'History', 'Geography', 'Computer Science'];

const TeacherForm = forwardRef<HTMLFormElement, TeacherFormProps>(({ teacher, onSubmit }, ref) => {
  const { profile } = useGlobal();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: 'Mathematics',
    phone: '',
    joinDate: new Date().toISOString().split('T')[0],
    dob: '',
    salary: 30000,
    status: 'active' as 'active' | 'inactive',
    user_id: null as string | null,
    shift: 'Morning' as 'Morning' | 'Afternoon',
    school_id: profile?.school_id || '', // Default to current user's school
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [availableUsers, setAvailableUsers] = useState<{ id: string; email: string }[]>([]);
  const [schools, setSchools] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    const fetchUsers = async () => {
      const { data, error } = await supabase.rpc('get_unlinked_users', { role_name: 'teacher' });
      if (error) console.error('Error fetching unlinked users:', error);
      else setAvailableUsers(data || []);
    };
    fetchUsers();

    // Fetch schools if Super Admin
    if (profile?.role === 'system_admin') {
        const fetchSchools = async () => {
            const { data } = await supabase.from('schools').select('id, name').eq('is_active', true).order('name');
            if (data) setSchools(data);
        };
        fetchSchools();
    }
  }, [profile]);

  useEffect(() => {
    if (teacher) {
      setFormData({
        name: teacher.name,
        email: teacher.email,
        subject: teacher.subject,
        phone: teacher.phone,
        joinDate: teacher.joinDate,
        dob: teacher.dob,
        salary: teacher.salary,
        status: teacher.status,
        user_id: teacher.user_id || null,
        shift: teacher.shift || 'Morning',
        school_id: teacher.school_id || profile?.school_id || '',
      });
      setImageFile(null);
    } else {
      setFormData({
        name: '', email: '', subject: 'Mathematics', phone: '',
        joinDate: new Date().toISOString().split('T')[0], dob: '', salary: 30000, status: 'active', user_id: null, shift: 'Morning',
        school_id: profile?.school_id || '',
      });
      setImageFile(null);
    }
  }, [teacher, profile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const finalValue = type === 'number' ? parseFloat(value) : (value === 'null' ? null : value);
    setFormData(prev => ({ 
      ...prev, 
      [name]: finalValue
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ formData: { ...formData, id: teacher?.id }, imageFile });
  };

  return (
    <form ref={ref} onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label>Profile Picture</Label>
        <ImageUpload 
          onFileChange={setImageFile} 
          initialPreviewUrl={teacher?.avatar?.startsWith('blob:') ? teacher.avatar : null}
        />
      </div>

      {/* Super Admin School Selection */}
      {profile?.role === 'system_admin' && (
        <div className="space-y-2 bg-blue-50 p-3 rounded-md border border-blue-100">
            <Label htmlFor="school_id" className="text-blue-800">Assign School</Label>
            <Select id="school_id" name="school_id" value={formData.school_id} onChange={handleChange} required>
                <option value="">Select School</option>
                {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </Select>
            <p className="text-xs text-blue-600">This teacher will belong to the selected school.</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Full Name</Label>
          <Input id="name" name="name" value={formData.name} onChange={handleChange} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} required />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="subject">Subject</Label>
          <Select id="subject" name="subject" value={formData.subject} onChange={handleChange}>
            {subjects.map(s => <option key={s} value={s}>{s}</option>)}
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" name="phone" type="tel" value={formData.phone} onChange={handleChange} />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="dob">Date of Birth</Label>
          <Input id="dob" name="dob" type="date" value={formData.dob} onChange={handleChange} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="joinDate">Join Date</Label>
          <Input id="joinDate" name="joinDate" type="date" value={formData.joinDate} onChange={handleChange} required />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="salary">Salary</Label>
          <Input id="salary" name="salary" type="number" value={formData.salary} onChange={handleChange} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="shift">Shift</Label>
          <Select id="shift" name="shift" value={formData.shift} onChange={handleChange}>
            <option value="Morning">Morning</option>
            <option value="Afternoon">Afternoon</option>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select id="status" name="status" value={formData.status} onChange={handleChange}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </Select>
        </div>
      </div>
       <div className="space-y-2">
          <Label htmlFor="user_id">Link to User Account</Label>
          <Select id="user_id" name="user_id" value={formData.user_id || 'null'} onChange={handleChange}>
            <option value="null">-- Not Linked --</option>
            {teacher && teacher.user_id && <option value={teacher.user_id}>Current User</option>}
            {availableUsers.map(u => <option key={u.id} value={u.id}>{u.email}</option>)}
          </Select>
          <p className="text-xs text-muted-foreground">Link this teacher profile to a login account.</p>
        </div>
      <button type="submit" className="hidden">Submit</button>
    </form>
  );
});

TeacherForm.displayName = 'TeacherForm';

export default TeacherForm;
