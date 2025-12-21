import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Search, Download, TrendingUp, Award, Plus, Edit, Trash2, Filter, X, Layers } from 'lucide-react';
import { Grade, Student, Exam } from '../types';
import Modal from '../components/ui/Modal';
import { Button } from '../components/ui/Button';
import GradeForm from '../components/grades/GradeForm';
import BulkGradeEntryModal from '../components/grades/BulkGradeEntryModal';
import TableSkeleton from '../components/ui/TableSkeleton';
import { supabase } from '../lib/supabaseClient';
import toast from 'react-hot-toast';
import { useGlobal } from '../context/GlobalContext';
import { useSearchParams } from 'react-router-dom';

const transformGradeToCamelCase = (dbGrade: any): Grade => ({
  id: dbGrade.id,
  created_at: dbGrade.created_at,
  student_id: dbGrade.student_id,
  exam_id: dbGrade.exam_id,
  marks_obtained: dbGrade.marks_obtained,
  percentage: dbGrade.percentage,
  grade: dbGrade.grade,
  gpa: dbGrade.gpa,
  date: dbGrade.date,
  studentName: '',
  examName: '',
  subject: '',
  total_marks: 0,
});

const transformExamToCamelCase = (dbExam: any): Exam => ({
  id: dbExam.id,
  created_at: dbExam.created_at,
  name: dbExam.name,
  subject: dbExam.subject,
  class: dbExam.class,
  date: dbExam.date,
  totalMarks: dbExam.total_marks,
  passingMarks: dbExam.passing_marks,
  duration: dbExam.duration,
  status: dbExam.status,
  semester: dbExam.semester, // Added semester
});

const Grades: React.FC = () => {
  const { profile } = useGlobal();
  const [grades, setGrades] = useState<Grade[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterExamId, setFilterExamId] = useState<string>('');
  
  const [isModalOpen, setModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [selectedGrade, setSelectedGrade] = useState<Grade | null>(null);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const preSelectedExamId = searchParams.get('examId');
  
  const formRef = useRef<HTMLFormElement>(null);

  const fetchData = async () => {
    if (!profile) return;
    setLoading(true);
    try {
      let gradesQuery = supabase.from('grades').select('*').order('date', { ascending: false });
      let studentsQuery = supabase.from('students').select('id, name, user_id');
      let examsQuery = supabase.from('exams').select('id, name, subject, class, total_marks, passing_marks, date, duration, status, semester');

      if (profile.role !== 'system_admin' && profile.school_id) {
        gradesQuery = gradesQuery.eq('school_id', profile.school_id);
        studentsQuery = studentsQuery.eq('school_id', profile.school_id);
        examsQuery = examsQuery.eq('school_id', profile.school_id);
      }

      const [
        { data: gradesData, error: gradesError },
        { data: studentsData, error: studentsError },
        { data: examsData, error: examsError }
      ] = await Promise.all([
        gradesQuery,
        studentsQuery,
        examsQuery
      ]);

      if (gradesError) throw gradesError;
      if (studentsError) throw studentsError;
      if (examsError) throw examsError;

      setGrades((gradesData || []).map(transformGradeToCamelCase));
      setStudents(studentsData || []);
      setExams((examsData || []).map(transformExamToCamelCase));

      if (preSelectedExamId) {
          setFilterExamId(preSelectedExamId);
          setIsBulkModalOpen(true);
      }

    } catch (error: any) {
      const errorMessage = error?.message || (typeof error === 'object' ? JSON.stringify(error) : String(error));
      toast.error(`Failed to load data: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [profile]);

  const enrichedGrades = useMemo(() => {
    return grades.map(grade => {
      const student = students.find(s => s.id === grade.student_id);
      const exam = exams.find(e => e.id === grade.exam_id);
      return {
        ...grade,
        studentName: student?.name || grade.student_id,
        examName: exam?.name || grade.exam_id,
        subject: exam?.subject || 'N/A',
        total_marks: exam?.totalMarks || grade.total_marks,
        semester: exam?.semester, // Enrich with semester
      };
    });
  }, [grades, students, exams]);

  const filteredGrades = enrichedGrades.filter(grade => {
    const matchesSearch = 
      grade.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      grade.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      grade.examName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesExamFilter = filterExamId ? grade.exam_id === filterExamId : true;

    return matchesSearch && matchesExamFilter;
  });
  
  const handleAdd = (examId?: string | null) => {
    setSelectedGrade(null);
    if (examId || filterExamId) {
        const targetId = examId || filterExamId;
        const preSelectedExam = exams.find(e => e.id === targetId);
        if (preSelectedExam) {
             setSelectedGrade({
                id: '',
                student_id: '',
                exam_id: targetId,
                marks_obtained: 0,
                percentage: 0,
                grade: '',
                gpa: 0,
                date: '',
                studentName: '',
                examName: '',
                subject: '',
                total_marks: 0
             });
        }
    }
    setModalOpen(true);
  };

  const handleEdit = (grade: Grade) => {
    setSelectedGrade(grade);
    setModalOpen(true);
  };

  const handleDelete = (grade: Grade) => {
    setSelectedGrade(grade);
    setDeleteModalOpen(true);
  };

  const clearFilters = () => {
    setFilterExamId('');
    setSearchParams({});
  };

  const handleSaveGrade = async (formData: { studentId: string; examId: string; marksObtained: number; id?: string }) => {
    setIsSubmitting(true);
    await toast.promise(
      (async () => {
        const exam = exams.find(e => e.id === formData.examId);
        if (!exam) throw new Error("Selected exam not found.");

        const percentage = (formData.marksObtained / exam.totalMarks) * 100;
        const gpa = percentage >= 90 ? 4.0 : percentage >= 80 ? 3.5 : percentage >= 70 ? 3.0 : percentage >= 60 ? 2.5 : percentage >= 50 ? 2.0 : percentage >= 40 ? 1.5 : 0.0;
        const gradeLetter = percentage >= 90 ? 'A+' : percentage >= 80 ? 'A' : percentage >= 70 ? 'B+' : percentage >= 60 ? 'B' : percentage >= 50 ? 'C+' : percentage >= 40 ? 'C' : percentage >= 33 ? 'D' : 'F';

        const gradeToSave = {
          student_id: formData.studentId,
          exam_id: formData.examId,
          marks_obtained: formData.marksObtained,
          percentage: parseFloat(percentage.toFixed(2)),
          gpa: parseFloat(gpa.toFixed(2)),
          grade: gradeLetter,
          date: exam.date,
          school_id: profile?.school_id
        };

        if (formData.id) {
          const { data, error } = await supabase.from('grades').update(gradeToSave).eq('id', formData.id).select().single();
          if (error) throw error;
          setGrades(prev => prev.map(g => g.id === formData.id ? transformGradeToCamelCase(data) : g));
        } else {
          const { data, error } = await supabase.from('grades').insert(gradeToSave).select().single();
          if (error) throw error;
          setGrades(prev => [transformGradeToCamelCase(data), ...prev]);
        }
      })(),
      {
        loading: 'Saving grade...',
        success: 'Grade saved successfully!',
        error: (err) => `Failed to save grade: ${err.message}`,
      }
    );
    setIsSubmitting(false);
    setModalOpen(false);
  };

  const handleConfirmDelete = async () => {
    if (selectedGrade) {
      setIsSubmitting(true);
      await toast.promise(
        (async () => {
          const { error } = await supabase.from('grades').delete().eq('id', selectedGrade.id);
          if (error) throw error;
          setGrades(prev => prev.filter(g => g.id !== selectedGrade.id));
        })(),
        {
          loading: 'Deleting grade...',
          success: 'Grade deleted successfully!',
          error: (err) => `Failed to delete grade: ${err.message}`,
        }
      );
      setIsSubmitting(false);
      setDeleteModalOpen(false);
      setSelectedGrade(null);
    }
  };

  const getGradeColor = (grade: string) => {
    if (grade.startsWith('A')) return 'bg-green-100 text-green-800';
    if (grade.startsWith('B')) return 'bg-blue-100 text-blue-800';
    if (grade.startsWith('C')) return 'bg-yellow-100 text-yellow-800';
    if (grade.startsWith('D')) return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
  };

  const summaryStats = useMemo(() => {
    const dataToUse = filteredGrades.length > 0 ? filteredGrades : enrichedGrades;
    if (dataToUse.length === 0) return { averageGPA: '0.00', passRate: '0.0', excellenceRate: '0.0' };
    const averageGPA = (dataToUse.reduce((sum, g) => sum + g.gpa, 0) / dataToUse.length).toFixed(2);
    const passRate = ((dataToUse.filter(g => g.percentage >= 40).length / dataToUse.length) * 100).toFixed(1);
    const excellenceRate = ((dataToUse.filter(g => g.percentage >= 80).length / dataToUse.length) * 100).toFixed(1);
    return { averageGPA, passRate, excellenceRate };
  }, [filteredGrades, enrichedGrades]);

  if (loading) {
    return <TableSkeleton title="Grades" headers={['Student', 'Exam', 'Marks', 'Grade', 'Actions']} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Grades & GPA</h1>
          <p className="text-gray-600 mt-1">Track student academic performance and grades</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setIsBulkModalOpen(true)} className="bg-white border border-slate-200 text-blue-600 hover:bg-blue-50">
            <Layers size={20} className="mr-2" /> Bulk Entry
          </Button>
          <Button onClick={() => handleAdd(null)}>
            <Plus size={20} className="mr-2" /> Add Grade
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-500">Average GPA {filterExamId ? '(Filtered)' : ''}</p><p className="text-3xl font-bold text-gray-900 mt-2">{summaryStats.averageGPA}</p></div><div className="p-3 bg-blue-100 rounded-lg"><TrendingUp className="h-6 w-6 text-blue-600" /></div></div></div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-500">Pass Rate {filterExamId ? '(Filtered)' : ''}</p><p className="text-3xl font-bold text-gray-900 mt-2">{summaryStats.passRate}%</p></div><div className="p-3 bg-green-100 rounded-lg"><Award className="h-6 w-6 text-green-600" /></div></div></div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-500">Excellence {filterExamId ? '(Filtered)' : ''}</p><p className="text-3xl font-bold text-gray-900 mt-2">{summaryStats.excellenceRate}%</p></div><div className="p-3 bg-purple-100 rounded-lg"><Award className="h-6 w-6 text-purple-600" /></div></div></div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input type="text" placeholder="Search by student name, subject, or exam..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" />
            </div>
            <div className="flex items-center gap-2">
                <select 
                    value={filterExamId} 
                    onChange={(e) => setFilterExamId(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none max-w-xs"
                >
                    <option value="">All Exams</option>
                    {exams.map(e => (
                        <option key={e.id} value={e.id}>{e.name} - {e.subject} ({e.semester})</option>
                    ))}
                </select>
                {filterExamId && (
                    <Button variant="secondary" onClick={clearFilters} className="px-3">
                        <X size={16} />
                    </Button>
                )}
            </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Exam</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Marks</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grade</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredGrades.map((grade) => (
                <tr key={grade.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap"><div className="flex items-center"><div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white font-bold">{grade.studentName.charAt(0)}</div><div className="ml-4"><div className="text-sm font-medium text-gray-900">{grade.studentName}</div><div className="text-sm text-gray-500">{grade.student_id}</div></div></div></td>
                  <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell">
                    <div className="text-sm text-gray-900">{grade.examName}</div>
                    <div className="text-sm text-gray-500">{grade.subject}</div>
                    <div className="text-xs text-gray-400">{grade.semester}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm font-medium text-gray-900">{grade.marks_obtained}/{grade.total_marks}</div><div className="text-xs text-gray-500">{grade.percentage.toFixed(1)}%</div></td>
                  <td className="px-6 py-4 whitespace-nowrap"><span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${getGradeColor(grade.grade)}`}>{grade.grade}</span></td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                     <Button variant="ghost" size="icon" onClick={() => handleEdit(grade)}><Edit className="h-4 w-4" /></Button>
                     <Button variant="ghost" size="icon" onClick={() => handleDelete(grade)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                  </td>
                </tr>
              ))}
              {filteredGrades.length === 0 && (
                  <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                          No grades found. {filterExamId ? 'Try adding grades for this exam.' : ''}
                      </td>
                  </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Single Entry Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setModalOpen(false)} title={selectedGrade ? 'Edit Grade' : 'Add New Grade'} footer={<><Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button><Button onClick={() => formRef.current?.requestSubmit()} loading={isSubmitting}>{selectedGrade ? 'Save Changes' : 'Add Grade'}</Button></>}>
        <GradeForm ref={formRef} grade={selectedGrade} students={students} exams={exams} onSubmit={handleSaveGrade} />
      </Modal>

      {/* Bulk Entry Modal */}
      <Modal 
        isOpen={isBulkModalOpen} 
        onClose={() => { setIsBulkModalOpen(false); clearFilters(); }} 
        title="Bulk Grade Entry" 
        size="4xl"
      >
        <BulkGradeEntryModal 
            initialExamId={filterExamId}
            onClose={() => { setIsBulkModalOpen(false); clearFilters(); }} 
            onSuccess={() => {
                fetchData();
            }} 
        />
      </Modal>

      <Modal isOpen={isDeleteModalOpen} onClose={() => setDeleteModalOpen(false)} title="Delete Grade" footer={<><Button variant="secondary" onClick={() => setDeleteModalOpen(false)}>Cancel</Button><Button variant="danger" onClick={handleConfirmDelete} loading={isSubmitting}>Delete</Button></>}>
        <p>Are you sure you want to delete the grade for <strong>{selectedGrade?.studentName}</strong> in <strong>{selectedGrade?.subject}</strong>? This action cannot be undone.</p>
      </Modal>
    </div>
  );
};

export default Grades;
