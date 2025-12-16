import React, { useState, useRef, useEffect } from 'react';
import { Search, Plus, Edit, Trash2, Building2, User, BookOpen } from 'lucide-react';
import { Department, Teacher } from '../types';
import Modal from '../components/ui/Modal';
import { Button } from '../components/ui/Button';
import DepartmentForm from '../components/departments/DepartmentForm';
import CardGridSkeleton from '../components/ui/CardGridSkeleton';
import { supabase } from '../lib/supabaseClient';
import toast from 'react-hot-toast';

const transformDepartmentToCamelCase = (dbDept: any, teachers: {id: string, name: string}[]): Department => ({
  id: dbDept.id,
  created_at: dbDept.created_at,
  name: dbDept.name,
  headOfDepartmentId: dbDept.head_of_department_id,
  headOfDepartmentName: teachers.find(t => t.id === dbDept.head_of_department_id)?.name || 'N/A',
  description: dbDept.description,
  courseCount: dbDept.courses?.[0]?.count || 0,
});

const Departments: React.FC = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setModalOpen] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [
          { data: departmentsData, error: departmentsError },
          { data: teachersData, error: teachersError }
        ] = await Promise.all([
          supabase.from('departments').select('*, courses(count)'),
          supabase.from('teachers').select('id, name')
        ]);

        if (departmentsError) throw new Error(`Departments fetch failed: ${departmentsError.message}`);
        if (teachersError) throw new Error(`Teachers fetch failed: ${teachersError.message}`);

        const fetchedTeachers = (teachersData || []) as Teacher[];
        setTeachers(fetchedTeachers);

        const enrichedDepartments = (departmentsData || []).map((dept: any) => transformDepartmentToCamelCase(dept, fetchedTeachers));
        setDepartments(enrichedDepartments);
        
      } catch (error: any) {
        const errorMessage = error?.message || (typeof error === 'object' ? JSON.stringify(error) : String(error));
        toast.error(`Failed to load data: ${errorMessage}`);
        console.error("Error fetching departments data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredDepartments = departments.filter(dept =>
    dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dept.headOfDepartmentName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAdd = () => {
    if (teachers.length === 0) {
      toast.error('Please add at least one teacher before creating a department.');
      return;
    }
    setSelectedDepartment(null);
    setModalOpen(true);
  };

  const handleEdit = (department: Department) => {
    setSelectedDepartment(department);
    setModalOpen(true);
  };

  const handleDelete = (department: Department) => {
    setSelectedDepartment(department);
    setDeleteModalOpen(true);
  };

  const handleSaveDepartment = async (formData: Omit<Department, 'id' | 'headOfDepartmentName' | 'courseCount' | 'created_at'> & { id?: string }) => {
    setIsSubmitting(true);
    await toast.promise(
      (async () => {
        const deptToSave = {
          name: formData.name,
          head_of_department_id: formData.headOfDepartmentId || null, // Handle empty string
          description: formData.description,
        };
        if (formData.id) {
          const { data, error } = await supabase.from('departments').update(deptToSave).eq('id', formData.id).select('*, courses(count)').single();
          if (error) throw error;
          const updatedDept = transformDepartmentToCamelCase(data, teachers);
          setDepartments(prev => prev.map(d => d.id === formData.id ? updatedDept : d));
        } else {
          const { data, error } = await supabase.from('departments').insert(deptToSave).select('*, courses(count)').single();
          if (error) throw error;
          const newDept = transformDepartmentToCamelCase(data, teachers);
          setDepartments(prev => [newDept, ...prev]);
        }
      })(),
      {
        loading: 'Saving department...',
        success: 'Department saved successfully!',
        error: (err) => `Failed to save department: ${err.message}`,
      }
    );
    setIsSubmitting(false);
    setModalOpen(false);
  };

  const handleConfirmDelete = async () => {
    if (selectedDepartment) {
      setIsSubmitting(true);
      await toast.promise(
        (async () => {
          const { error } = await supabase.from('departments').delete().eq('id', selectedDepartment.id);
          if (error) throw error;
          setDepartments(prev => prev.filter(d => d.id !== selectedDepartment.id));
        })(),
        {
          loading: 'Deleting department...',
          success: 'Department deleted successfully!',
          error: (err) => `Failed to delete department: ${err.message}`,
        }
      );
      setIsSubmitting(false);
      setDeleteModalOpen(false);
      setSelectedDepartment(null);
    }
  };

  if (loading) {
    return <CardGridSkeleton title="Departments" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Departments</h1>
          <p className="text-gray-600 mt-1">Manage academic departments</p>
        </div>
        <Button onClick={handleAdd}>
          <Plus size={20} className="mr-2" />
          Add Department
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search departments by name or HOD..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDepartments.map((dept) => (
          <div key={dept.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center">
                <div className="h-12 w-12 rounded-lg bg-purple-100 flex items-center justify-center">
                  <Building2 size={24} className="text-purple-600" />
                </div>
                <div className="ml-4">
                  <h3 className="font-semibold text-gray-900 text-lg">{dept.name}</h3>
                  <p className="text-sm text-gray-500">{dept.id}</p>
                </div>
              </div>
            </div>

            <p className="text-sm text-gray-600 flex-grow mb-4">{dept.description}</p>
            
            <div className="space-y-2 text-sm mb-4">
              <div className="flex items-center">
                <User size={14} className="text-gray-400 mr-2" />
                <span className="text-gray-500">HOD:</span>
                <span className="font-medium text-gray-800 ml-2">{dept.headOfDepartmentName}</span>
              </div>
              <div className="flex items-center">
                <BookOpen size={14} className="text-gray-400 mr-2" />
                <span className="text-gray-500">Courses:</span>
                <span className="font-medium text-gray-800 ml-2">{dept.courseCount}</span>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100 mt-auto flex items-center justify-end">
              <Button variant="ghost" size="icon" onClick={() => handleEdit(dept)}><Edit className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon" onClick={() => handleDelete(dept)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
            </div>
          </div>
        ))}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
        title={selectedDepartment ? 'Edit Department' : 'Add New Department'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={() => formRef.current?.requestSubmit()} loading={isSubmitting} disabled={teachers.length === 0}>
              {selectedDepartment ? 'Save Changes' : 'Add Department'}
            </Button>
          </>
        }
      >
        <DepartmentForm 
          ref={formRef} 
          department={selectedDepartment} 
          teachers={teachers}
          onSubmit={handleSaveDepartment} 
        />
      </Modal>

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Department"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteModalOpen(false)}>Cancel</Button>
            <Button variant="danger" onClick={handleConfirmDelete} loading={isSubmitting}>Delete</Button>
          </>
        }
      >
        <p>Are you sure you want to delete <strong>{selectedDepartment?.name}</strong>? This action cannot be undone.</p>
      </Modal>
    </div>
  );
};

export default Departments;
