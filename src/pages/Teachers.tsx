import React, { useState, useRef, useEffect } from 'react';
import { Search, Plus, Mail, Phone, Calendar, Eye, Edit, Trash2, Filter, Sun, Moon, Key } from 'lucide-react';
import { Teacher } from '../types';
import Modal from '../components/ui/Modal';
import TeacherForm from '../components/teachers/TeacherForm';
import CreateUserModal from '../components/users/CreateUserModal';
import { Button } from '../components/ui/Button';
import CardGridSkeleton from '../components/ui/CardGridSkeleton';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabaseClient';
import Badge from '../components/ui/Badge';
import { formatCurrency } from '../utils/format';

const transformTeacherToCamelCase = (dbTeacher: any): Teacher => ({
  id: dbTeacher.id,
  created_at: dbTeacher.created_at,
  name: dbTeacher.name,
  email: dbTeacher.email,
  subject: dbTeacher.subject,
  phone: dbTeacher.phone,
  joinDate: dbTeacher.join_date,
  issuedDate: dbTeacher.issued_date,
  expiryDate: dbTeacher.expiry_date,
  dob: dbTeacher.dob,
  salary: dbTeacher.salary,
  status: dbTeacher.status,
  avatar: dbTeacher.avatar,
  user_id: dbTeacher.user_id,
  shift: dbTeacher.shift,
  school_id: dbTeacher.school_id, // Ensure school_id is mapped
});

const Teachers: React.FC = () => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddEditModalOpen, setAddEditModalOpen] = useState(false);
  const [isViewModalOpen, setViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isCreateUserModalOpen, setCreateUserModalOpen] = useState(false);

  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formRef = useRef<HTMLFormElement>(null);

  const fetchTeachers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('teachers').select('*').order('created_at', { ascending: false });
      if (error) throw new Error(error.message);
      setTeachers(data.map(transformTeacherToCamelCase));
    } catch (error: any) {
      const errorMessage = error?.message || (typeof error === 'object' ? JSON.stringify(error) : String(error));
      toast.error(`Failed to fetch teachers: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, []);

  const filteredTeachers = teachers.filter(teacher =>
    teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    teacher.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    teacher.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAdd = () => {
    setSelectedTeacher(null);
    setAddEditModalOpen(true);
  };

  const handleEdit = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setAddEditModalOpen(true);
  };

  const handleView = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setViewModalOpen(true);
  };

  const handleDelete = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setDeleteModalOpen(true);
  };

  const handleCreateUser = (teacher: Teacher) => {
    if (teacher.user_id) {
      toast.error("This teacher already has a login account.");
      return;
    }
    setSelectedTeacher(teacher);
    setCreateUserModalOpen(true);
  };

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

  const handleSaveTeacher = async ({ formData, imageFile }: {
    formData: Omit<Teacher, 'id' | 'created_at' | 'issuedDate' | 'expiryDate' | 'avatar'> & { id?: string };
    imageFile: File | null;
  }) => {
    setIsSubmitting(true);
    try {
      const joinDate = formData.joinDate;
      const issuedDate = joinDate;
      const expiryDate = new Date(joinDate);
      expiryDate.setFullYear(expiryDate.getFullYear() + 4);

      const teacherToSave = {
        name: formData.name,
        email: formData.email,
        subject: formData.subject,
        phone: formData.phone,
        join_date: joinDate,
        issued_date: issuedDate,
        expiry_date: expiryDate.toISOString().split('T')[0],
        dob: formData.dob,
        salary: formData.salary,
        status: formData.status,
        user_id: formData.user_id,
        shift: formData.shift,
        school_id: formData.school_id,
        avatar: selectedTeacher?.avatar,
      };
      
      const teacherId = formData.id || `temp-${Date.now()}`;

      if (imageFile) {
        const url = await uploadAvatar(imageFile, teacherId);
        if (url) teacherToSave.avatar = url;
      }

      if (formData.id) {
        const { data, error } = await supabase.from('teachers').update(teacherToSave).eq('id', formData.id).select().single();
        if (error) throw new Error(error.message);
        const updatedTeacher = transformTeacherToCamelCase(data);
        setTeachers(prev => prev.map(t => t.id === formData.id ? updatedTeacher : t));
        toast.success('Teacher updated successfully!');
      } else {
        const { data, error } = await supabase.from('teachers').insert(teacherToSave).select().single();
        if (error) throw new Error(error.message);
        const newTeacher = transformTeacherToCamelCase(data);
        setTeachers(prev => [newTeacher, ...prev]);
        toast.success('Teacher added successfully!');
      }
      setAddEditModalOpen(false);
      setSelectedTeacher(null);
    } catch (error: any) {
      const errorMessage = error?.message || (typeof error === 'object' ? JSON.stringify(error) : String(error));
      toast.error(`Failed to save teacher: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (selectedTeacher) {
      setIsSubmitting(true);
      try {
        const { error } = await supabase.from('teachers').delete().eq('id', selectedTeacher.id);
        if (error) throw new Error(error.message);
        setTeachers(prev => prev.filter(t => t.id !== selectedTeacher.id));
        toast.success('Teacher deleted successfully!');
        setDeleteModalOpen(false);
        setSelectedTeacher(null);
      } catch (error: any) {
        const errorMessage = error?.message || (typeof error === 'object' ? JSON.stringify(error) : String(error));
        toast.error(`Failed to delete teacher: ${errorMessage}`);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  if (loading) {
    return <CardGridSkeleton title="Teachers" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Teachers</h1>
          <p className="text-slate-500 mt-1">Manage faculty members and staff.</p>
        </div>
        <Button onClick={handleAdd} className="shadow-md shadow-blue-500/20">
          <Plus size={18} className="mr-2" />
          Add Teacher
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-card border border-border p-4 flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search teachers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm transition-all"
          />
        </div>
        <Button variant="secondary" size="sm" className="text-slate-600 border border-border bg-white">
            <Filter size={16} className="mr-2" /> Filter
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTeachers.map((teacher) => (
          <div key={teacher.id} className="bg-white rounded-xl shadow-card border border-border p-6 flex flex-col hover:shadow-lg transition-shadow duration-300 group">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center text-white font-bold text-lg overflow-hidden ring-2 ring-white shadow-sm">
                  {teacher.avatar ? (
                    <img src={teacher.avatar} alt={teacher.name} className="w-full h-full object-cover" />
                  ) : (
                    teacher.name.charAt(0)
                  )}
                </div>
                <div className="ml-3">
                  <h3 className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">{teacher.name}</h3>
                  <p className="text-xs text-slate-500 font-mono">{teacher.id}</p>
                </div>
              </div>
              <Badge variant={teacher.status === 'active' ? 'success' : 'neutral'}>
                {teacher.status}
              </Badge>
            </div>

            <div className="space-y-3 flex-grow">
              <div className="flex items-center justify-between text-sm p-2 bg-slate-50 rounded-lg">
                <div>
                    <span className="text-slate-500 font-medium mr-2">Subject:</span>
                    <span className="font-semibold text-slate-800">{teacher.subject}</span>
                </div>
                <div className="flex items-center text-xs font-medium text-slate-600">
                    {teacher.shift === 'Afternoon' ? <Moon size={12} className="mr-1 text-purple-500"/> : <Sun size={12} className="mr-1 text-orange-500"/>}
                    {teacher.shift || 'Morning'}
                </div>
              </div>
              <div className="flex items-center text-sm text-slate-600 px-2">
                <Mail size={14} className="text-slate-400 mr-3" />
                <span className="truncate">{teacher.email}</span>
              </div>
              <div className="flex items-center text-sm text-slate-600 px-2">
                <Phone size={14} className="text-slate-400 mr-3" />
                <span>{teacher.phone}</span>
              </div>
            </div>

            <div className="pt-4 border-t border-border mt-5 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 uppercase font-medium">Salary</p>
                <p className="text-sm font-bold text-slate-900">{formatCurrency(teacher.salary)}</p>
              </div>
              <div className="flex gap-1">
                {!teacher.user_id && (
                  <button onClick={() => handleCreateUser(teacher)} className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-md transition-colors" title="Create Login"><Key size={16}/></button>
                )}
                <button onClick={() => handleView(teacher)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"><Eye size={16}/></button>
                <button onClick={() => handleEdit(teacher)} className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-md transition-colors"><Edit size={16}/></button>
                <button onClick={() => handleDelete(teacher)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"><Trash2 size={16}/></button>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {filteredTeachers.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-border p-12 text-center">
          <p className="text-slate-500">No teachers found matching your criteria.</p>
        </div>
      )}

      <Modal
        isOpen={isAddEditModalOpen}
        onClose={() => setAddEditModalOpen(false)}
        title={selectedTeacher ? 'Edit Teacher' : 'Add New Faculty'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setAddEditModalOpen(false)}>Cancel</Button>
            <Button onClick={() => formRef.current?.requestSubmit()} loading={isSubmitting}>
              {selectedTeacher ? 'Save Changes' : 'Add Teacher'}
            </Button>
          </>
        }
      >
        <TeacherForm ref={formRef} teacher={selectedTeacher} onSubmit={handleSaveTeacher} />
      </Modal>

      <Modal
        isOpen={isCreateUserModalOpen}
        onClose={() => setCreateUserModalOpen(false)}
        title="Create Teacher Login"
      >
        {selectedTeacher && (
          <CreateUserModal 
            name={selectedTeacher.name} 
            email={selectedTeacher.email} 
            role="teacher" 
            schoolId={selectedTeacher.school_id} // Pass the teacher's school ID
            onClose={() => setCreateUserModalOpen(false)}
            onSuccess={fetchTeachers}
          />
        )}
      </Modal>

      {selectedTeacher && (
        <Modal isOpen={isViewModalOpen} onClose={() => setViewModalOpen(false)} title="Faculty Profile">
          <div className="flex flex-col items-center mb-6">
             <div className="h-24 w-24 rounded-full bg-slate-100 border-4 border-white shadow-lg flex items-center justify-center text-3xl font-bold text-slate-400 overflow-hidden mb-3">
                {selectedTeacher.avatar ? (
                  <img src={selectedTeacher.avatar} alt={selectedTeacher.name} className="w-full h-full object-cover" />
                ) : (
                  selectedTeacher.name.charAt(0)
                )}
             </div>
             <h3 className="text-xl font-bold text-slate-900">{selectedTeacher.name}</h3>
             <p className="text-slate-500 font-medium">{selectedTeacher.subject} Department</p>
             <div className="mt-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border bg-slate-50 text-slate-600 border-slate-200">
                  {selectedTeacher.shift === 'Afternoon' ? <Moon size={12} className="mr-1"/> : <Sun size={12} className="mr-1"/>}
                  {selectedTeacher.shift || 'Morning'} Shift
                </span>
             </div>
          </div>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <p className="text-xs font-semibold text-slate-500 uppercase">Contact</p>
                    <p className="text-sm mt-1 truncate" title={selectedTeacher.email}>{selectedTeacher.email}</p>
                    <p className="text-sm">{selectedTeacher.phone}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <p className="text-xs font-semibold text-slate-500 uppercase">Details</p>
                    <p className="text-sm mt-1">Joined: {selectedTeacher.joinDate}</p>
                    <p className="text-sm">DOB: {selectedTeacher.dob}</p>
                </div>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-100 flex justify-between items-center">
                <span className="text-sm font-medium text-blue-700">Monthly Base Salary</span>
                <span className="text-lg font-bold text-blue-800">{formatCurrency(selectedTeacher.salary)}</span>
            </div>
          </div>
        </Modal>
      )}

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Teacher"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteModalOpen(false)}>Cancel</Button>
            <Button variant="danger" onClick={handleConfirmDelete} loading={isSubmitting}>Delete Faculty</Button>
          </>
        }
      >
        <p>Are you sure you want to delete <strong>{selectedTeacher?.name}</strong>? This will remove them from all assigned classes and payroll records.</p>
      </Modal>
    </div>
  );
};

export default Teachers;
