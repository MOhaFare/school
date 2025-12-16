import React, { useState, useRef, useEffect } from 'react';
import { Search, Plus, User, GraduationCap, Star, Book, Edit, Trash2 } from 'lucide-react';
import PerformanceChart from '../components/PerformanceChart';
import { SchoolClass, Teacher } from '../types';
import Modal from '../components/ui/Modal';
import { Button } from '../components/ui/Button';
import ClassForm from '../components/classes/ClassForm';
import CardGridSkeleton from '../components/ui/CardGridSkeleton';
import { supabase } from '../lib/supabaseClient';
import toast from 'react-hot-toast';
import { useGlobal } from '../context/GlobalContext';

const calculateGpa = (marks: number, totalMarks: number): number => {
    if (totalMarks === 0) return 0;
    const percentage = (marks / totalMarks) * 100;
    if (percentage >= 90) return 4.0;
    if (percentage >= 80) return 3.5;
    if (percentage >= 70) return 3.0;
    if (percentage >= 60) return 2.5;
    if (percentage >= 50) return 2.0;
    if (percentage >= 40) return 1.5;
    return 0.0;
};

const Classes: React.FC = () => {
  const { profile, user } = useGlobal();
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setModalOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<SchoolClass | null>(null);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formRef = useRef<HTMLFormElement>(null);
  const canManage = ['system_admin', 'admin', 'principal'].includes(profile?.role || '');

  useEffect(() => {
    const fetchData = async () => {
      if (!profile?.school_id) return;
      
      setLoading(true);
      try {
        // 1. Determine Teacher Filter
        let teacherFilterId = null;
        if (profile.role === 'teacher' && user) {
            const { data: tData } = await supabase
                .from('teachers')
                .select('id')
                .eq('user_id', user.id)
                .maybeSingle();
            teacherFilterId = tData?.id;
        }

        // 2. Build Classes Query
        let classesQuery = supabase.from('classes').select('*').eq('school_id', profile.school_id);
        
        // If Teacher, only show their assigned classes
        if (teacherFilterId) {
            classesQuery = classesQuery.eq('teacher_id', teacherFilterId);
        }

        const [
          { data: classesData, error: classesError },
          { data: teachersData, error: teachersError },
          { data: studentsData, error: studentsError },
          { data: gradesData, error: gradesError }
        ] = await Promise.all([
          classesQuery,
          supabase.from('teachers').select('id, name').eq('school_id', profile.school_id),
          supabase.from('students').select('id, class, section').eq('school_id', profile.school_id),
          supabase.from('grades').select('student_id, marks_obtained, exams(subject, total_marks)').eq('school_id', profile.school_id)
        ]);

        if (classesError) throw new Error(classesError.message);
        if (teachersError) throw new Error(teachersError.message);
        if (studentsError) throw new Error(studentsError.message);
        if (gradesError) throw new Error(gradesError.message);

        setTeachers(teachersData || []);

        const transformedClasses = (classesData || []).map((cls: any) => {
            const classStudents = studentsData?.filter(s => `${s.class}-${s.section}` === cls.name) || [];
            const studentIds = new Set(classStudents.map(s => s.id));
            const classGrades = gradesData?.filter((g: any) => studentIds.has(g.student_id)) || [];
            
            const totalGpa = classGrades.reduce((sum, g: any) => {
              const totalMarks = g.exams?.total_marks ?? 100;
              const gpa = calculateGpa(g.marks_obtained, totalMarks);
              return sum + gpa;
            }, 0);

            const averageGpa = classGrades.length > 0 ? totalGpa / classGrades.length : 0;
            const classSubjects = [...new Set(classGrades.map((g: any) => g.exams?.subject).filter(Boolean))];
            const teacher = teachersData?.find(t => t.id === cls.teacher_id);
            return { 
              ...cls, 
              name: `Class ${cls.name}`, 
              studentCount: classStudents.length, 
              averageGpa, 
              subjects: classSubjects, 
              teacher: { id: teacher?.id || '', name: teacher?.name || 'Unassigned' } 
            };
        });
        setClasses(transformedClasses);

      } catch (error: any) {
        toast.error(`Failed to fetch class data: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [profile, user]);

  const filteredClasses = classes.filter(cls =>
    cls.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cls.teacher.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAdd = () => {
    setSelectedClass(null);
    setModalOpen(true);
  };

  const handleEdit = (cls: SchoolClass) => {
    setSelectedClass(cls);
    setModalOpen(true);
  };

  const handleDelete = (cls: SchoolClass) => {
    setSelectedClass(cls);
    setDeleteModalOpen(true);
  };

  const handleSaveClass = async (formData: { name: string; teacher_id: string; capacity: number; id?: string }) => {
    setIsSubmitting(true);
    await toast.promise(
      (async () => {
        const classToSave = {
          name: formData.name,
          teacher_id: formData.teacher_id || null, // Handle empty string for UUID
          capacity: formData.capacity,
          school_id: profile?.school_id // Ensure school_id is set
        };
        
        if (formData.id) {
          const { data, error } = await supabase.from('classes').update(classToSave).eq('id', formData.id).select().single();
          if (error) throw new Error(error.message);
          
          setClasses(prev => prev.map(c => {
            if (c.id === formData.id) {
              const teacher = teachers.find(t => t.id === data.teacher_id);
              return {
                ...c,
                name: `Class ${data.name}`,
                teacher: { id: teacher?.id || data.teacher_id || '', name: teacher?.name || 'Unassigned' },
                capacity: data.capacity
              };
            }
            return c;
          }));
        } else {
          const { data, error } = await supabase.from('classes').insert(classToSave).select().single();
          if (error) throw new Error(error.message);
          
          const teacher = teachers.find(t => t.id === data.teacher_id);
          const newClass: SchoolClass = { 
            ...data, 
            name: `Class ${data.name}`, 
            studentCount: 0, 
            averageGpa: 0, 
            subjects: [], 
            teacher: { id: teacher?.id || data.teacher_id || '', name: teacher?.name || 'Unassigned' } 
          };
          setClasses(prev => [newClass, ...prev]);
        }
      })(),
      {
        loading: 'Saving class...',
        success: 'Class saved successfully!',
        error: (err) => `Failed to save class: ${err.message || 'Unknown error'}`,
      }
    );
    setIsSubmitting(false);
    setModalOpen(false);
  };

  const handleConfirmDelete = async () => {
    if (selectedClass) {
      setIsSubmitting(true);
      await toast.promise(
        (async () => {
          const { error } = await supabase.from('classes').delete().eq('id', selectedClass.id);
          if (error) throw new Error(error.message);
          setClasses(prev => prev.filter(c => c.id !== selectedClass.id));
        })(),
        {
          loading: 'Deleting class...',
          success: 'Class deleted successfully!',
          error: (err) => `Failed to delete class: ${err.message || 'Unknown error'}`,
        }
      );
      setIsSubmitting(false);
      setDeleteModalOpen(false);
      setSelectedClass(null);
    }
  };

  if (loading) {
    return <CardGridSkeleton title="Classes" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Classes</h1>
          <p className="text-slate-500 mt-1">Manage classes, teachers, and student performance</p>
        </div>
        {canManage && (
          <Button onClick={handleAdd}>
            <Plus size={20} className="mr-2" />
            Add New Class
          </Button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Search by class name or teacher..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      <PerformanceChart classes={classes} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClasses.map((cls) => (
          <div key={cls.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col hover:shadow-lg transition-shadow duration-300">
            <div className="flex-grow">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-slate-900">{cls.name}</h3>
                <div className="flex items-center space-x-2 text-sm text-slate-500">
                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                  <span className="font-semibold text-slate-700">{cls.averageGpa.toFixed(2)} GPA</span>
                </div>
              </div>

              <div className="flex items-center text-sm text-slate-600 mb-4">
                <User className="w-4 h-4 mr-2 text-slate-400" />
                <span>Teacher: <strong>{cls.teacher.name}</strong></span>
              </div>

              <div className="flex items-center text-sm text-slate-600 mb-6">
                <GraduationCap className="w-4 h-4 mr-2 text-slate-400" />
                <span><strong>{cls.studentCount} / {cls.capacity}</strong> Students</span>
              </div>

              <div className="mb-4">
                <h4 className="text-sm font-semibold text-slate-800 mb-3 flex items-center">
                  <Book className="w-4 h-4 mr-2 text-slate-400" />
                  Subjects
                </h4>
                <div className="flex flex-wrap gap-2">
                  {cls.subjects.map((subject, index) => (
                    <span key={index} className="px-2 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-medium">
                      {subject}
                    </span>
                  ))}
                  {cls.subjects.length === 0 && <span className="text-xs text-slate-500">No subjects assigned</span>}
                </div>
              </div>
            </div>

            {canManage && (
              <div className="pt-4 border-t border-slate-100 mt-auto flex items-center justify-end">
                <Button variant="ghost" size="icon" onClick={() => handleEdit(cls)}><Edit className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(cls)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
              </div>
            )}
          </div>
        ))}
        
        {filteredClasses.length === 0 && (
            <div className="col-span-full text-center py-12 text-slate-500">
                <p>No classes found.</p>
                {profile?.role === 'teacher' && <p className="text-xs mt-1">You are only seeing classes assigned to you.</p>}
            </div>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
        title={selectedClass ? 'Edit Class' : 'Add New Class'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={() => formRef.current?.requestSubmit()} loading={isSubmitting} disabled={teachers.length === 0}>
              {selectedClass ? 'Save Changes' : 'Add Class'}
            </Button>
          </>
        }
      >
        <ClassForm 
          ref={formRef} 
          schoolClass={selectedClass} 
          teachers={teachers}
          onSubmit={handleSaveClass} 
        />
      </Modal>

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Class"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteModalOpen(false)}>Cancel</Button>
            <Button variant="danger" onClick={handleConfirmDelete} loading={isSubmitting}>Delete</Button>
          </>
        }
      >
        <p>Are you sure you want to delete <strong>{selectedClass?.name}</strong>? This will not delete the students in the class, but it will unassign them. This action cannot be undone.</p>
      </Modal>
    </div>
  );
};

export default Classes;
