import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, Plus, Edit, Trash2, Book, User, Building, Star } from 'lucide-react';
import { Course, Teacher, Department } from '../types';
import Modal from '../components/ui/Modal';
import { Button } from '../components/ui/Button';
import CourseForm from '../components/courses/CourseForm';
import TableSkeleton from '../components/ui/TableSkeleton';
import { supabase } from '../lib/supabaseClient';
import toast from 'react-hot-toast';

const transformCourseToCamelCase = (dbCourse: any): Course => ({
  id: dbCourse.id,
  created_at: dbCourse.created_at,
  name: dbCourse.name,
  code: dbCourse.code,
  teacherId: dbCourse.teacher_id,
  credits: dbCourse.credits,
  departmentId: dbCourse.department_id,
  teacherName: '', 
  departmentName: '',
});

const Courses: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setModalOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [
          { data: coursesData, error: coursesError },
          { data: teachersData, error: teachersError },
          { data: departmentsData, error: departmentsError }
        ] = await Promise.all([
          supabase.from('courses').select('*').order('name'),
          supabase.from('teachers').select('id, name'),
          supabase.from('departments').select('id, name')
        ]);

        if (coursesError) throw coursesError;
        if (teachersError) throw teachersError;
        if (departmentsError) throw departmentsError;

        setCourses((coursesData || []).map(transformCourseToCamelCase));
        setTeachers(teachersData || []);
        setDepartments(departmentsData || []);
      } catch (error: any) {
        const errorMessage = error?.message || (typeof error === 'object' ? JSON.stringify(error) : String(error));
        toast.error(`Failed to load data: ${errorMessage}`);
        console.error("Error fetching courses data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const enrichedCourses = useMemo(() => {
    return courses.map(course => ({
      ...course,
      teacherName: teachers.find(t => t.id === course.teacherId)?.name || 'N/A',
      departmentName: departments.find(d => d.id === course.departmentId)?.name || 'N/A',
    }));
  }, [courses, teachers, departments]);

  const filteredCourses = enrichedCourses.filter(course =>
    course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.teacherName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAdd = () => {
    setSelectedCourse(null);
    setModalOpen(true);
  };

  const handleEdit = (course: Course) => {
    setSelectedCourse(course);
    setModalOpen(true);
  };

  const handleDelete = (course: Course) => {
    setSelectedCourse(course);
    setDeleteModalOpen(true);
  };

  const handleSaveCourse = async (formData: Omit<Course, 'id' | 'teacherName' | 'departmentName' | 'created_at'> & { id?: string }) => {
    setIsSubmitting(true);
    await toast.promise(
      (async () => {
        const courseToSave = {
          name: formData.name,
          code: formData.code,
          teacher_id: formData.teacherId,
          department_id: formData.departmentId,
          credits: formData.credits,
        };

        if (formData.id) {
          const { data, error } = await supabase.from('courses').update(courseToSave).eq('id', formData.id).select().single();
          if (error) throw error;
          setCourses(prev => prev.map(c => c.id === formData.id ? transformCourseToCamelCase(data) : c));
        } else {
          const { data, error } = await supabase.from('courses').insert(courseToSave).select().single();
          if (error) throw error;
          setCourses(prev => [transformCourseToCamelCase(data), ...prev]);
        }
      })(),
      {
        loading: 'Saving course...',
        success: 'Course saved successfully!',
        error: (err) => `Failed to save course: ${err.message}`,
      }
    );
    setIsSubmitting(false);
    setModalOpen(false);
  };

  const handleConfirmDelete = async () => {
    if (selectedCourse) {
      setIsSubmitting(true);
      await toast.promise(
        (async () => {
          const { error } = await supabase.from('courses').delete().eq('id', selectedCourse.id);
          if (error) throw error;
          setCourses(prev => prev.filter(c => c.id !== selectedCourse.id));
        })(),
        {
          loading: 'Deleting course...',
          success: 'Course deleted successfully!',
          error: (err) => `Failed to delete course: ${err.message}`,
        }
      );
      setIsSubmitting(false);
      setDeleteModalOpen(false);
      setSelectedCourse(null);
    }
  };

  if (loading) {
    return <TableSkeleton title="Courses" headers={['Course', 'Teacher', 'Department', 'Credits', 'Actions']} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Courses</h1>
          <p className="text-gray-600 mt-1">Manage academic courses and curriculum</p>
        </div>
        <Button onClick={handleAdd}>
          <Plus size={20} className="mr-2" />
          Add Course
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search courses by name, code, or teacher..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Teacher</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">Department</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Credits</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCourses.map((course) => (
                <tr key={course.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <Book size={20} className="text-blue-600" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{course.name}</div>
                        <div className="text-sm text-gray-500">{course.code}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell">
                    <div className="flex items-center">
                      <User size={16} className="text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900">{course.teacherName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap hidden lg:table-cell">
                     <div className="flex items-center">
                      <Building size={16} className="text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900">{course.departmentName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Star size={16} className="text-yellow-400 mr-2" />
                      <span className="text-sm font-medium text-gray-900">{course.credits}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                     <Button variant="ghost" size="icon" onClick={() => handleEdit(course)}><Edit className="h-4 w-4" /></Button>
                     <Button variant="ghost" size="icon" onClick={() => handleDelete(course)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
        title={selectedCourse ? 'Edit Course' : 'Add New Course'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={() => formRef.current?.requestSubmit()} loading={isSubmitting}>
              {selectedCourse ? 'Save Changes' : 'Add Course'}
            </Button>
          </>
        }
      >
        <CourseForm 
          ref={formRef} 
          course={selectedCourse} 
          teachers={teachers}
          departments={departments}
          onSubmit={handleSaveCourse} 
        />
      </Modal>

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Course"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteModalOpen(false)}>Cancel</Button>
            <Button variant="danger" onClick={handleConfirmDelete} loading={isSubmitting}>Delete</Button>
          </>
        }
      >
        <p>Are you sure you want to delete <strong>{selectedCourse?.name}</strong>? This action cannot be undone.</p>
      </Modal>
    </div>
  );
};

export default Courses;
