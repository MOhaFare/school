import React, { useState, useEffect, forwardRef } from 'react';
import { Student } from '../../types';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { Select } from '../ui/Select';
import ImageUpload from '../ui/ImageUpload';
import { supabase } from '../../lib/supabaseClient';
import { useGlobal } from '../../context/GlobalContext';
import { RefreshCw, AlertCircle } from 'lucide-react';

interface StudentFormProps {
  student?: Student | null;
  onSubmit: (data: {
    formData: Omit<Student, 'id' | 'issuedDate' | 'expiryDate' | 'avatar'> & { id?: string; category_id?: string };
    imageFile: File | null;
  }) => void;
}

const StudentForm = forwardRef<HTMLFormElement, StudentFormProps>(({ student, onSubmit }, ref) => {
  const { profile } = useGlobal();
  
  // Dynamic Options State
  const [availableClasses, setAvailableClasses] = useState<{grade: string, section: string}[]>([]);
  const [gradeOptions, setGradeOptions] = useState<string[]>([]);
  const [sectionOptions, setSectionOptions] = useState<string[]>([]);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    class: '',
    section: '',
    rollNumber: '',
    phone: '',
    enrollmentDate: new Date().toISOString().split('T')[0],
    dob: '',
    status: 'active' as 'active' | 'inactive' | 'alumni' | 'suspended',
    grade: '',
    user_id: null as string | null,
    parent_name: '',
    parent_email: '',
    parent_phone: '',
    student_role: '',
    shift: 'Morning' as 'Morning' | 'Afternoon',
    school_id: profile?.school_id || '',
    category_id: '',
    student_house: '',
  });
  
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [availableUsers, setAvailableUsers] = useState<{ id: string; email: string }[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [schools, setSchools] = useState<{ id: string; name: string }[]>([]);

  // Helper to generate 7-digit roll number
  const generateRollNumber = () => {
    return Math.floor(1000000 + Math.random() * 9000000).toString();
  };

  const handleRegenerateRoll = () => {
    setFormData(prev => ({ ...prev, rollNumber: generateRollNumber() }));
  };

  // 1. Fetch Initial Data (Classes, Users, Categories)
  useEffect(() => {
    const fetchData = async () => {
      if (!profile?.school_id && profile?.role !== 'system_admin') return;

      // Fetch Classes
      let classQuery = supabase.from('classes').select('name');
      if (profile?.role !== 'system_admin') {
          classQuery = classQuery.eq('school_id', profile?.school_id);
      }
      const { data: classesData } = await classQuery;

      if (classesData) {
        // Parse "Class 9-A" into {grade: "9", section: "A"}
        const parsedClasses = classesData.map(c => {
            const cleanName = c.name.replace('Class ', '');
            const parts = cleanName.split('-');
            if (parts.length >= 2) {
                return { grade: parts[0], section: parts[1] };
            }
            return null;
        }).filter(c => c !== null) as {grade: string, section: string}[];

        setAvailableClasses(parsedClasses);

        // Extract unique grades for the first dropdown
        const uniqueGrades = Array.from(new Set(parsedClasses.map(c => c.grade))).sort((a, b) => {
             // Custom sort for KG1, KG2, KG3, 1, 2...
             const order = ['KG1', 'KG2', 'KG3', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
             const idxA = order.indexOf(a);
             const idxB = order.indexOf(b);
             if (idxA !== -1 && idxB !== -1) return idxA - idxB;
             return a.localeCompare(b);
        });
        setGradeOptions(uniqueGrades);
        
        // Set default class/section if creating new and options exist
        if (!student && uniqueGrades.length > 0 && !formData.class) {
            const defaultGrade = uniqueGrades[0];
            const defaultSections = parsedClasses.filter(c => c.grade === defaultGrade).map(c => c.section).sort();
            setFormData(prev => ({
                ...prev,
                class: defaultGrade,
                section: defaultSections[0] || '',
                grade: defaultGrade.startsWith('KG') ? defaultGrade : `Grade ${defaultGrade}`
            }));
        }
      }

      // Fetch Unlinked Users
      const { data: usersData } = await supabase.rpc('get_unlinked_users', { role_name: 'student' });
      setAvailableUsers(usersData || []);

      // Fetch Categories
      const { data: catData } = await supabase.from('student_categories').select('id, name').order('name');
      if (catData) setCategories(catData);

      // Fetch Schools (Super Admin)
      if (profile?.role === 'system_admin') {
          const { data: schoolData } = await supabase.from('schools').select('id, name').eq('is_active', true).order('name');
          if (schoolData) setSchools(schoolData);
      }
    };

    fetchData();
  }, [profile, student]); // Re-run if student prop changes (edit mode) to ensure defaults don't override

  // 2. Update Section Options when Class Changes
  useEffect(() => {
    if (formData.class) {
        const sections = availableClasses
            .filter(c => c.grade === formData.class)
            .map(c => c.section)
            .sort();
        setSectionOptions(sections);
        
        // If current section is invalid for new class, reset it
        if (!sections.includes(formData.section) && sections.length > 0) {
            setFormData(prev => ({ ...prev, section: sections[0] }));
        } else if (sections.length === 0) {
             setFormData(prev => ({ ...prev, section: '' }));
        }
    } else {
        setSectionOptions([]);
    }
  }, [formData.class, availableClasses]);

  // 3. Initialize Form Data from Prop
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
        category_id: (student as any).category_id || '',
        student_house: (student as any).student_house || '',
      });
      setImageFile(null);
    } else if (!formData.rollNumber) {
      // Only set initial roll number if not already set (prevents overwrite on re-renders)
      setFormData(prev => ({ ...prev, rollNumber: generateRollNumber() }));
    }
  }, [student, profile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updates = { [name]: value === 'null' ? null : value };
      if (name === 'class') {
        updates['grade'] = value.startsWith('KG') ? value : `Grade ${value}`;
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

      {/* Dynamic Class & Section Selection */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="class">Class</Label>
          {gradeOptions.length > 0 ? (
            <Select id="class" name="class" value={formData.class} onChange={handleChange} required>
                <option value="">Select Class</option>
                {gradeOptions.map(c => <option key={c} value={c}>{c}</option>)}
            </Select>
          ) : (
            <div className="p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-700 flex items-center">
                <AlertCircle size={12} className="mr-1"/> No classes found. Please create classes first.
            </div>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="section">Section</Label>
          <Select 
            id="section" 
            name="section" 
            value={formData.section} 
            onChange={handleChange} 
            required
            disabled={!formData.class || sectionOptions.length === 0}
          >
            <option value="">Select Section</option>
            {sectionOptions.map(s => <option key={s} value={s}>{s}</option>)}
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="rollNumber">Roll Number (Auto)</Label>
          <div className="flex gap-2">
            <Input 
                id="rollNumber" 
                name="rollNumber" 
                value={formData.rollNumber} 
                onChange={handleChange} 
                required 
                className="bg-gray-50"
            />
            <button 
                type="button" 
                onClick={handleRegenerateRoll}
                className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md border border-gray-200"
                title="Regenerate Roll Number"
            >
                <RefreshCw size={18} />
            </button>
          </div>
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

      <div className="space-y-2">
          <Label htmlFor="category_id">Category</Label>
          <Select id="category_id" name="category_id" value={formData.category_id} onChange={handleChange}>
              <option value="">Select Category</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
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
