import React, { useState, useRef, useEffect } from 'react';
import { Search, Plus, Mail, Phone, BookOpen, Eye, Edit, Trash2, Download, Info, Filter, MoreHorizontal, Sun, Moon, Key } from 'lucide-react';
import { Student } from '../types';
import Modal from '../components/ui/Modal';
import StudentForm from '../components/students/StudentForm';
import CreateUserModal from '../components/users/CreateUserModal';
import { Button } from '../components/ui/Button';
import TableSkeleton from '../components/ui/TableSkeleton';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabaseClient';
import Badge from '../components/ui/Badge';

const transformStudentToCamelCase = (dbStudent: any): Student => ({
  id: dbStudent.id,
  created_at: dbStudent.created_at,
  name: dbStudent.name,
  email: dbStudent.email,
  class: dbStudent.class,
  section: dbStudent.section,
  rollNumber: dbStudent.roll_number,
  phone: dbStudent.phone,
  enrollmentDate: dbStudent.enrollment_date,
  issuedDate: dbStudent.issued_date,
  expiryDate: dbStudent.expiry_date,
  dob: dbStudent.dob,
  status: dbStudent.status,
  avatar: dbStudent.avatar,
  grade: dbStudent.grade,
  user_id: dbStudent.user_id,
  parent_name: dbStudent.parent_name,
  parent_email: dbStudent.parent_email,
  parent_phone: dbStudent.parent_phone,
  student_role: dbStudent.student_role,
  shift: dbStudent.shift,
  school_id: dbStudent.school_id, // Ensure school_id is mapped
});

const Students: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modals
  const [isAddEditModalOpen, setAddEditModalOpen] = useState(false);
  const [isViewModalOpen, setViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isCreateUserModalOpen, setCreateUserModalOpen] = useState(false);
  
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const formRef = useRef<HTMLFormElement>(null);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      // Only fetch Active and Inactive students for the main list
      // Alumni and Suspended students are in the "Disabled Students" page
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .in('status', ['active', 'inactive']) 
        .order('created_at', { ascending: false });

      if (error) throw new Error(error.message);
      setStudents(data.map(transformStudentToCamelCase));
    } catch (error: any) {
      const errorMessage = error?.message || (typeof error === 'object' ? JSON.stringify(error) : String(error));
      toast.error(`Failed to fetch students: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.rollNumber.includes(searchTerm) ||
    student.class.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAdd = () => {
    setSelectedStudent(null);
    setAddEditModalOpen(true);
  };

  const handleEdit = (student: Student) => {
    setSelectedStudent(student);
    setAddEditModalOpen(true);
  };

  const handleView = (student: Student) => {
    setSelectedStudent(student);
    setViewModalOpen(true);
  };

  const handleDelete = (student: Student) => {
    setSelectedStudent(student);
    setDeleteModalOpen(true);
  };

  const handleCreateUser = (student: Student) => {
    if (student.user_id) {
      toast.error("This student already has a login account.");
      return;
    }
    setSelectedStudent(student);
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
        avatar: selectedStudent?.avatar,
      };
      
      const studentId = formData.id || `temp-${Date.now()}`;

      if (imageFile) {
        const url = await uploadAvatar(imageFile, studentId);
        if (url) studentToSave.avatar = url;
      }
      
      if (formData.id) {
        const { data, error } = await supabase.from('students').update(studentToSave).eq('id', formData.id).select().single();
        if (error) throw new Error(error.message);
        const updatedStudent = transformStudentToCamelCase(data);
        
        // If status changed to alumni/suspended, remove from this list
        if (['alumni', 'suspended'].includes(updatedStudent.status)) {
            setStudents(prev => prev.filter(s => s.id !== formData.id));
            toast.success(`Student updated and moved to ${updatedStudent.status} list.`);
        } else {
            setStudents(prev => prev.map(s => s.id === formData.id ? updatedStudent : s));
            toast.success('Student updated successfully!');
        }
      } else {
        const { data, error } = await supabase.from('students').insert(studentToSave).select().single();
        if (error) throw new Error(error.message);
        const newStudent = transformStudentToCamelCase(data);
        setStudents(prev => [newStudent, ...prev]);
        toast.success('Student added successfully!');
      }
      setAddEditModalOpen(false);
      setSelectedStudent(null);
    } catch (error: any) {
      const errorMessage = error?.message || (typeof error === 'object' ? JSON.stringify(error) : String(error));
      toast.error(`Failed to save student: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (selectedStudent) {
      setIsSubmitting(true);
      try {
        const { error } = await supabase.from('students').delete().eq('id', selectedStudent.id);
        if (error) throw new Error(error.message);
        setStudents(prev => prev.filter(s => s.id !== selectedStudent.id));
        toast.success('Student deleted successfully!');
        setDeleteModalOpen(false);
        setSelectedStudent(null);
      } catch (error: any) {
        const errorMessage = error?.message || (typeof error === 'object' ? JSON.stringify(error) : String(error));
        toast.error(`Failed to delete student: ${errorMessage}`);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleExport = () => {
    const headers = ["ID", "Name", "Email", "Class", "Section", "Roll Number", "Phone", "Status", "Shift"];
    const csvContent = "data:text/csv;charset=utf-8,"
      + headers.join(",") + "\n"
      + students.map(s => `"${s.id}","${s.name}","${s.email}","${s.class}","${s.section}","${s.rollNumber}","${s.phone}","${s.status}","${s.shift || 'Morning'}"`).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "students.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return <TableSkeleton title="Students" headers={['Student', 'Class', 'Contact', 'Shift', 'Status', 'Actions']} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Students</h1>
          <p className="text-slate-500 mt-1">Manage active student records.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={handleExport} className="border border-border">
            <Download size={18} className="mr-2" />
            Export
          </Button>
          <Button onClick={handleAdd} className="shadow-md shadow-blue-500/20">
            <Plus size={18} className="mr-2" />
            Add Student
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-card border border-border overflow-hidden">
        <div className="p-4 border-b border-border flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-50/50">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search students..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm transition-all"
            />
          </div>
          <div className="flex items-center gap-2">
             <Button variant="secondary" size="sm" className="text-slate-600 border border-border bg-white">
                <Filter size={16} className="mr-2" /> Filter
             </Button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Student Name</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">Class Info</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider hidden lg:table-cell">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Shift</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-border">
              {filteredStudents.map((student) => (
                <tr key={student.id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 font-bold overflow-hidden shrink-0">
                        {student.avatar ? (
                          <img src={student.avatar} alt={student.name} className="w-full h-full object-cover" />
                        ) : (
                          student.name.charAt(0)
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-semibold text-slate-900">{student.name}</div>
                        <div className="text-xs text-slate-500 font-mono">{student.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-slate-700">Class {student.class}-{student.section}</span>
                      <span className="text-xs text-slate-500">Roll No: {student.rollNumber}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap hidden lg:table-cell">
                    <div className="flex flex-col space-y-1">
                      <div className="flex items-center text-xs text-slate-600">
                        <Mail size={12} className="mr-1.5 text-slate-400" />
                        {student.email}
                      </div>
                      <div className="flex items-center text-xs text-slate-600">
                        <Phone size={12} className="mr-1.5 text-slate-400" />
                        {student.phone}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-slate-700">
                      {student.shift === 'Afternoon' ? (
                        <Moon size={14} className="mr-1.5 text-purple-500" />
                      ) : (
                        <Sun size={14} className="mr-1.5 text-orange-500" />
                      )}
                      {student.shift || 'Morning'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant={student.status === 'active' ? 'success' : 'neutral'}>
                      {student.status.charAt(0).toUpperCase() + student.status.slice(1)}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                     <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!student.user_id && (
                          <button onClick={() => handleCreateUser(student)} className="p-1.5 text-slate-500 hover:text-green-600 hover:bg-green-50 rounded-md transition-colors" title="Create Login">
                            <Key size={16} />
                          </button>
                        )}
                        <button onClick={() => handleView(student)} className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors" title="View Details"><Eye size={16} /></button>
                        <button onClick={() => handleEdit(student)} className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-md transition-colors" title="Edit"><Edit size={16} /></button>
                        <button onClick={() => handleDelete(student)} className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors" title="Delete"><Trash2 size={16} /></button>
                     </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredStudents.length === 0 && (
            <div className="p-12 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4">
                    <Search className="h-8 w-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-medium text-slate-900">No students found</h3>
                <p className="text-slate-500 mt-1 max-w-sm mx-auto">We couldn't find any active students matching your search criteria.</p>
                <Button onClick={handleAdd} className="mt-6" variant="secondary">Add New Student</Button>
            </div>
        )}
      </div>

      <Modal
        isOpen={isAddEditModalOpen}
        onClose={() => setAddEditModalOpen(false)}
        title={selectedStudent ? 'Edit Student Profile' : 'New Student Admission'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setAddEditModalOpen(false)}>Cancel</Button>
            <Button onClick={() => formRef.current?.requestSubmit()} loading={isSubmitting}>
              {selectedStudent ? 'Save Changes' : 'Admit Student'}
            </Button>
          </>
        }
      >
        <StudentForm ref={formRef} student={selectedStudent} onSubmit={handleSaveStudent} />
      </Modal>

      <Modal
        isOpen={isCreateUserModalOpen}
        onClose={() => setCreateUserModalOpen(false)}
        title="Create Student Login"
      >
        {selectedStudent && (
          <CreateUserModal 
            name={selectedStudent.name} 
            email={selectedStudent.email} 
            role="student" 
            schoolId={selectedStudent.school_id} // Pass the student's school ID
            onClose={() => setCreateUserModalOpen(false)}
            onSuccess={fetchStudents}
          />
        )}
      </Modal>

      {selectedStudent && (
        <Modal isOpen={isViewModalOpen} onClose={() => setViewModalOpen(false)} title="Student Profile">
          <div className="flex flex-col items-center mb-6">
             <div className="h-24 w-24 rounded-full bg-slate-100 border-2 border-white shadow-md flex items-center justify-center text-3xl font-bold text-slate-400 overflow-hidden mb-3">
                {selectedStudent.avatar ? (
                  <img src={selectedStudent.avatar} alt={selectedStudent.name} className="w-full h-full object-cover" />
                ) : (
                  selectedStudent.name.charAt(0)
                )}
             </div>
             <h3 className="text-xl font-bold text-slate-900">{selectedStudent.name}</h3>
             <p className="text-slate-500">Class {selectedStudent.class}-{selectedStudent.section} • Roll #{selectedStudent.rollNumber}</p>
             <div className="mt-2 flex gap-2">
                <Badge variant={selectedStudent.status === 'active' ? 'success' : 'neutral'}>{selectedStudent.status}</Badge>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border bg-slate-50 text-slate-600 border-slate-200">
                  {selectedStudent.shift === 'Afternoon' ? <Moon size={12} className="mr-1"/> : <Sun size={12} className="mr-1"/>}
                  {selectedStudent.shift || 'Morning'}
                </span>
             </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 border-t border-border pt-4">
            <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-xs font-medium text-slate-500 uppercase">Contact Info</p>
                <p className="text-sm text-slate-900 mt-1 font-medium">{selectedStudent.email}</p>
                <p className="text-sm text-slate-700">{selectedStudent.phone}</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-xs font-medium text-slate-500 uppercase">Academic Info</p>
                <p className="text-sm text-slate-900 mt-1">Enrolled: {selectedStudent.enrollmentDate}</p>
                <p className="text-sm text-slate-700">ID: {selectedStudent.id}</p>
            </div>
          </div>
        </Modal>
      )}

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Confirm Deletion"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteModalOpen(false)}>Cancel</Button>
            <Button variant="danger" onClick={handleConfirmDelete} loading={isSubmitting}>Delete Student</Button>
          </>
        }
      >
        <div className="flex items-start gap-4">
            <div className="p-2 bg-red-100 rounded-full text-red-600 shrink-0">
                <Trash2 size={24} />
            </div>
            <div>
                <h4 className="font-semibold text-slate-900">Are you absolutely sure?</h4>
                <p className="text-slate-500 mt-1 text-sm">
                    This action will permanently delete the student record for <strong>{selectedStudent?.name}</strong>. 
                    This cannot be undone and will remove all associated grades and attendance records.
                </p>
            </div>
        </div>
      </Modal>
    </div>
  );
};

export default Students;
