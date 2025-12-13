import React, { useRef, useState } from 'react';
import { ArrowLeft, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import StudentForm from '../components/students/StudentForm';
import { Button } from '../components/ui/Button';
import { supabase } from '../lib/supabaseClient';
import toast from 'react-hot-toast';
import { Student } from '../types';

const StudentAdmission: React.FC = () => {
  const navigate = useNavigate();
  const formRef = useRef<HTMLFormElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const uploadAvatar = async (file: File, id: string): Promise<string | null> => {
    const fileExt = file.name.split('.').pop();
    const filePath = `${id}-${Date.now()}.${fileExt}`;
    const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file);
    if (uploadError) {
      toast.error(`Avatar upload failed: ${uploadError.message}`);
      return null;
    }
    const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
    return data.publicUrl;
  };

  const handleSaveStudent = async ({ formData, imageFile }: {
    formData: Omit<Student, 'id' | 'created_at' | 'issuedDate' | 'expiryDate' | 'avatar'> & { id?: string };
    imageFile: File | null;
  }) => {
    setIsSubmitting(true);
    try {
      const enrollmentDate = formData.enrollmentDate;
      const issuedDate = enrollmentDate;
      const expiryDate = new Date(enrollmentDate);
      expiryDate.setFullYear(expiryDate.getFullYear() + 4);

      const studentToSave = {
        name: formData.name,
        email: formData.email,
        class: formData.class,
        section: formData.section,
        roll_number: formData.rollNumber,
        phone: formData.phone,
        enrollment_date: enrollmentDate,
        issued_date: issuedDate,
        expiry_date: expiryDate.toISOString().split('T')[0],
        dob: formData.dob,
        status: formData.status,
        grade: formData.grade,
        user_id: formData.user_id,
        parent_name: formData.parent_name,
        parent_email: formData.parent_email,
        parent_phone: formData.parent_phone,
        student_role: formData.student_role,
        shift: formData.shift,
        school_id: formData.school_id,
        avatar: undefined as string | undefined,
      };
      
      // Generate a temp ID for image path if new
      const studentId = formData.id || `temp-${Date.now()}`;

      if (imageFile) {
        const url = await uploadAvatar(imageFile, studentId);
        if (url) studentToSave.avatar = url;
      }
      
      const { error } = await supabase.from('students').insert(studentToSave);
      if (error) throw new Error(error.message);
      
      toast.success('Student admitted successfully!');
      navigate('/students');
    } catch (error: any) {
      const errorMessage = error?.message || (typeof error === 'object' ? JSON.stringify(error) : String(error));
      toast.error(`Failed to admit student: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="secondary" onClick={() => navigate('/students')} className="p-2 h-10 w-10 rounded-full">
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Student Admission</h1>
            <p className="text-slate-500 mt-1">Register a new student into the system</p>
          </div>
        </div>
        <Button onClick={() => formRef.current?.requestSubmit()} loading={isSubmitting}>
          <Save size={20} className="mr-2" />
          Submit Admission
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
        <StudentForm ref={formRef} onSubmit={handleSaveStudent} />
      </div>
    </div>
  );
};

export default StudentAdmission;
