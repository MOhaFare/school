import React, { useState, useEffect, forwardRef } from 'react';
import { Student } from '../../types';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { Select } from '../ui/Select';
import ImageUpload from '../ui/ImageUpload';
import { supabase } from '../../lib/supabaseClient';
import { useGlobal } from '../../context/GlobalContext';

interface StudentFormProps {
  student?: Student | null;
  onSubmit: (data: {
    formData: Omit<Student, 'id' | 'issuedDate' | 'expiryDate' | 'avatar'> & { id?: string; student_house?: string; category_id?: string };
    imageFile: File | null;
  }) => void;
}

const classOptions = ['Lower', 'Upper', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
const houseOptions = ['Red House', 'Blue House', 'Green House', 'Yellow House'];

const StudentForm = forwardRef<HTMLFormElement, StudentFormProps>(({ student, onSubmit }, ref) => {
  const { profile } = useGlobal();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    class: '9',
    section: 'A',
    rollNumber: '',
    phone: '',
    enrollmentDate: new Date().toISOString().split('T')[0],
    dob: '',
    status: 'active' as 'active' | 'inactive' | 'alumni' | 'suspended',
    grade: 'Grade 9',
    user_id: null as string | null,
    parent_name: '',
    parent_email: '',
    parent_phone: '',
    student_role: '',
    shift: 'Morning' as 'Morning' | 'Afternoon',
    school_id: profile?.school_id || '', // Default to current user's school, or empty if Super Admin
    student_house: '',
    category_id: '',
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [availableUsers, setAvailableUsers] = useState<{ id: string; email: string }[]>([]);
  const [sections, setSections] = useState<string[]>(['A', 'B', 'C']);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [schools, setSchools] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    const fetchUsers = async () => {
      const { data, error } = await supabase.rpc('get_unlinked_users', { role_name: 'student' });
      if (error) console.error('Error fetching unlinked users:', error);
      else setAvailableUsers(data || []);
    };
    fetchUsers();

    const fetchSections = async () => {
      const { data } = await supabase.from('sections').select('name').order('name');
      if (data && data.length > 0) {
        setSections(data.map(s => s.name));
      }
    };
    fetchSections();

    const fetchCategories = async () => {
      const { data } = await supabase.from('student_categories').select('id, name').order('name');
      if (data) setCategories(data);
    };
    fetchCategories();

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
    if (student) {
      setFormData({
        name: student.name,
        email: student.email,
        class: student.class,
        section: student.section,
        rollNumber: student.rollNumber,
        phone: student.phone,
        enrollmentDate: student.enrollmentDate,
        dob: student.dob,
        status: student.status,
        grade: student.grade,
        user_id: student.user_id || null,
        parent_name: student.parent_name || '',
        parent_email: student.parent_email || '',
        parent_phone: student.parent_phone || '',
        student_role: student.student_role || '',
        shift: student.shift || 'Morning',
        school_id: student.school_id || profile?.school_id || '',
        student_house: (student as any).student_house || '',
        category_id: (student as any).category_id || '',
      });
      setImageFile(null);
    } else {
      setFormData({
        name: '', email: '', class: '9', section: sections[0] || 'A', rollNumber: '', phone: '',
        enrollmentDate: new Date().toISOString().split('T')[0], dob: '', status: 'active', grade: 'Grade 9', user_id: null,
        parent_name: '', parent_email: '', parent_phone: '', student_role: '', shift: 'Morning',
        school_id: profile?.school_id || '',
        student_house: '',
        category_id: '',
      });
      setImageFile(null);
    }
  }, [student, profile, sections]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updates = { [name]: value === 'null' ? null : value };
      if (name === 'class') {
        updates['grade'] = value === 'Lower' || value === 'Upper' ? `${value} Class` : `Grade ${value}`;
      }
      return { ...prev, ...updates };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ formData: { ...formData, id: student?.id }, imageFile });
  };

  return (
    <form ref={ref} onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label>Profile Picture</Label>
        <ImageUpload 
          onFileChange={setImageFile} 
          initialPreviewUrl={student?.avatar?.startsWith('blob:') ? student.avatar : null}
        />
      </div>
      
      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider border-b pb-1">Student Information</h3>
      
      {/* Super Admin School Selection */}
      {profile?.role === 'system_admin' && (
        <div className="space-y-2 bg-blue-50 p-3 rounded-md border border-blue-100">
            <Label htmlFor="school_id" className="text-blue-800">Assign School</Label>
            <Select id="school_id" name="school_id" value={formData.school_id} onChange={handleChange} required>
                <option value="">Select School</option>
                {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </Select>
            <p className="text-xs text-blue-600">This student will belong to the selected school.</p>
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="class">Class</Label>
          <Select id="class" name="class" value={formData.class} onChange={handleChange}>
            {classOptions.map(c => <option key={c} value={c}>{c}</option>)}
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="section">Section</Label>
          <Select id="section" name="section" value={formData.section} onChange={handleChange}>
            {sections.map(s => <option key={s} value={s}>{s}</option>)}
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="rollNumber">Roll Number</Label>
          <Input id="rollNumber" name="rollNumber" value={formData.rollNumber} onChange={handleChange} required />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" name="phone" type="tel" value={formData.phone} onChange={handleChange} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="dob">Date of Birth</Label>
          <Input id="dob" name="dob" type="date" value={formData.dob} onChange={handleChange} required />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="student_role">Student Role</Label>
          <Input id="student_role" name="student_role" value={formData.student_role} onChange={handleChange} placeholder="e.g. Class Monitor" />
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
            <option value="alumni">Alumni</option>
            <option value="suspended">Suspended</option>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
            <Label htmlFor="student_house">School House</Label>
            <Select id="student_house" name="student_house" value={formData.student_house} onChange={handleChange}>
                <option value="">Select House</option>
                {houseOptions.map(h => <option key={h} value={h}>{h}</option>)}
            </Select>
        </div>
        <div className="space-y-2">
            <Label htmlFor="category_id">Category</Label>
            <Select id="category_id" name="category_id" value={formData.category_id} onChange={handleChange}>
                <option value="">Select Category</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
        </div>
      </div>

      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider border-b pb-1 pt-4">Parent Information</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="parent_name">Parent Name</Label>
          <Input id="parent_name" name="parent_name" value={formData.parent_name} onChange={handleChange} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="parent_email">Parent Email</Label>
          <Input id="parent_email" name="parent_email" type="email" value={formData.parent_email} onChange={handleChange} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="parent_phone">Parent Phone</Label>
          <Input id="parent_phone" name="parent_phone" type="tel" value={formData.parent_phone} onChange={handleChange} />
        </div>
      </div>

      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider border-b pb-1 pt-4">System Access</h3>

       <div className="space-y-2">
          <Label htmlFor="user_id">Link to User Account</Label>
          <Select id="user_id" name="user_id" value={formData.user_id || 'null'} onChange={handleChange}>
            <option value="null">-- Not Linked --</option>
            {student && student.user_id && <option value={student.user_id}>Current User</option>}
            {availableUsers.map(u => <option key={u.id} value={u.id}>{u.email}</option>)}
          </Select>
          <p className="text-xs text-muted-foreground">Link this student profile to a login account.</p>
        </div>
      <button type="submit" className="hidden">Submit</button>
    </form>
  );
});

StudentForm.displayName = 'StudentForm';

export default StudentForm;
