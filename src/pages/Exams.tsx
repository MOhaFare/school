import React, { useState, useRef, useEffect } from 'react';
import { Search, Plus, Calendar, Clock, BookOpen, Edit, Trash2, Eye, GraduationCap, Printer, FileText, FileBarChart, Layers } from 'lucide-react';
import { Exam, Student } from '../types';
import Modal from '../components/ui/Modal';
import { Button } from '../components/ui/Button';
import ExamForm from '../components/exams/ExamForm';
import AdmitCard from '../components/exams/AdmitCard';
import ReportCardTemplate from '../components/results/ReportCardTemplate';
import CardGridSkeleton from '../components/ui/CardGridSkeleton';
import { supabase } from '../lib/supabaseClient';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useReactToPrint } from 'react-to-print';
import { useGlobal } from '../context/GlobalContext';

const transformExamToCamelCase = (dbExam: any): Exam => ({
  id: dbExam.id,
  created_at: dbExam.created_at,
  name: dbExam.name,
  subject: dbExam.subject,
  class: dbExam.class,
  section: dbExam.section, // Added section
  date: dbExam.date,
  totalMarks: dbExam.total_marks,
  passingMarks: dbExam.passing_marks,
  duration: dbExam.duration,
  status: dbExam.status,
  semester: dbExam.semester,
});

const transformStudentToCamelCase = (dbStudent: any): Student => ({
  id: dbStudent.id,
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
});

const Exams: React.FC = () => {
  const { profile, schoolName, academicYear, user } = useGlobal();
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [activeSemester, setActiveSemester] = useState<string>('First Semester');
  
  const [isModalOpen, setModalOpen] = useState(false);
  const [isViewModalOpen, setViewModalOpen] = useState(false);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Admit Card States
  const [isAdmitCardModalOpen, setIsAdmitCardModalOpen] = useState(false);
  const [examStudents, setExamStudents] = useState<Student[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const admitCardPrintRef = useRef<HTMLDivElement>(null);
  
  // Report Card States
  const [isReportCardModalOpen, setIsReportCardModalOpen] = useState(false);
  const [reportCardData, setReportCardData] = useState<{student: Student, grades: any[]}[]>([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const reportCardPrintRef = useRef<HTMLDivElement>(null);

  const navigate = useNavigate();
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const fetchExams = async () => {
      if (!profile) return;
      setLoading(true);
      try {
        let query = supabase.from('exams').select('*').order('date', { ascending: false });
        
        if (profile.role !== 'system_admin' && profile.school_id) {
          query = query.eq('school_id', profile.school_id);
        }

        const { data, error } = await query;
        if (error) throw error;
        
        let fetchedExams = data.map(transformExamToCamelCase);

        // Client-side filtering for Students to enforce strict Class & Section visibility
        if (profile.role === 'student' && user) {
            const { data: studentData } = await supabase
                .from('students')
                .select('class, section')
                .eq('user_id', user.id)
                .eq('school_id', profile.school_id)
                .single();
            
            if (studentData) {
                fetchedExams = fetchedExams.filter(exam => {
                    // Match class exactly
                    if (exam.class !== studentData.class) return false;
                    
                    // Match section if exam has a specific section assigned.
                    // If exam.section is null/empty, it applies to all sections of that class.
                    if (exam.section && exam.section !== studentData.section) return false;
                    
                    return true;
                });
            }
        }

        setExams(fetchedExams);
      } catch (error: any) {
        const errorMessage = error?.message || (typeof error === 'object' ? JSON.stringify(error) : String(error));
        toast.error(`Failed to fetch exams: ${errorMessage}`);
      } finally {
        setLoading(false);
      }
    };
    fetchExams();
  }, [profile, user]);

  const filteredExams = exams.filter(exam => {
    const matchesSearch = exam.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exam.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exam.class.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || exam.status === filterStatus;
    const matchesSemester = exam.semester === activeSemester;
    return matchesSearch && matchesStatus && matchesSemester;
  });

  const handleAdd = () => {
    setSelectedExam(null);
    setModalOpen(true);
  };

  const handleEdit = (exam: Exam) => {
    setSelectedExam(exam);
    setModalOpen(true);
  };

  const handleView = (exam: Exam) => {
    setSelectedExam(exam);
    setViewModalOpen(true);
  };

  const handleDelete = (exam: Exam) => {
    setSelectedExam(exam);
    setDeleteModalOpen(true);
  };

  const handleEnterGrades = (exam: Exam) => {
    navigate(`/grades?examId=${exam.id}`);
  };

  const handleGenerateAdmitCards = async (exam: Exam) => {
    if (!profile?.school_id) return;
    setSelectedExam(exam);
    setIsAdmitCardModalOpen(true);
    setLoadingStudents(true);
    try {
      let query = supabase
        .from('students')
        .select('*')
        .eq('school_id', profile.school_id)
        .eq('class', exam.class)
        .eq('status', 'active')
        .order('name');
      
      // Filter by section if exam is section-specific
      if (exam.section) {
        query = query.eq('section', exam.section);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      setExamStudents(data.map(transformStudentToCamelCase));
    } catch (error: any) {
      toast.error(`Failed to fetch students: ${error.message}`);
      setIsAdmitCardModalOpen(false);
    } finally {
      setLoadingStudents(false);
    }
  };

  const handleGenerateReportCards = async (exam: Exam) => {
    if (!profile?.school_id) return;
    setSelectedExam(exam);
    setIsReportCardModalOpen(true);
    setLoadingReports(true);
    try {
      // 1. Fetch all students in the exam's class (and section if applicable)
      let studentQuery = supabase
        .from('students')
        .select('*')
        .eq('school_id', profile.school_id)
        .eq('class', exam.class)
        .eq('status', 'active')
        .order('name');
      
      if (exam.section) {
        studentQuery = studentQuery.eq('section', exam.section);
      }

      const { data: studentsData, error: studentsError } = await studentQuery;
      
      if (studentsError) throw studentsError;

      // 2. Fetch all exams with same name/class/semester
      const { data: relatedExams, error: relatedExamsError } = await supabase
        .from('exams')
        .select('id, subject, total_marks')
        .eq('school_id', profile.school_id)
        .eq('name', exam.name)
        .eq('class', exam.class)
        .eq('semester', exam.semester || 'First Semester');

      if (relatedExamsError) throw relatedExamsError;

      const examIds = relatedExams.map(e => e.id);
      const examMap = relatedExams.reduce((acc: any, e: any) => {
        acc[e.id] = e;
        return acc;
      }, {});

      // 3. Fetch grades
      const { data: gradesData, error: gradesError } = await supabase
        .from('grades')
        .select('*')
        .eq('school_id', profile.school_id)
        .in('exam_id', examIds);

      if (gradesError) throw gradesError;

      // 4. Map students to grades
      const reports = studentsData.map((student: any) => {
        const studentGrades = gradesData
          .filter((g: any) => g.student_id === student.id)
          .map((g: any) => ({
            ...g,
            subject: examMap[g.exam_id]?.subject || 'Unknown',
            total_marks: examMap[g.exam_id]?.total_marks || 100
          }));
        
        return {
          student: transformStudentToCamelCase(student),
          grades: studentGrades
        };
      });

      setReportCardData(reports);

    } catch (error: any) {
      toast.error(`Failed to generate reports: ${error.message}`);
      setIsReportCardModalOpen(false);
    } finally {
      setLoadingReports(false);
    }
  };

  const handlePrintAdmitCards = useReactToPrint({
    content: () => admitCardPrintRef.current,
    documentTitle: `Admit-Cards-${selectedExam?.name}`,
  });

  const handlePrintReportCards = useReactToPrint({
    content: () => reportCardPrintRef.current,
    documentTitle: `Report-Cards-${selectedExam?.name}`,
  });

  const handleSaveExam = async (formData: Omit<Exam, 'id' | 'created_at'> & { id?: string }) => {
    setIsSubmitting(true);
    const examToSave = {
      name: formData.name,
      subject: formData.subject,
      class: formData.class,
      section: formData.section || null, // Save section
      date: formData.date,
      total_marks: formData.totalMarks,
      passing_marks: formData.passingMarks,
      duration: formData.duration,
      status: formData.status,
      semester: formData.semester,
      school_id: profile?.school_id
    };

    await toast.promise(
      (async () => {
        if (formData.id) {
          const { data, error } = await supabase.from('exams').update(examToSave).eq('id', formData.id).select().single();
          if (error) throw error;
          setExams(prev => prev.map(e => e.id === formData.id ? transformExamToCamelCase(data) : e));
        } else {
          const { data, error } = await supabase.from('exams').insert(examToSave).select().single();
          if (error) throw error;
          setExams(prev => [transformExamToCamelCase(data), ...prev]);
        }
      })(),
      {
        loading: 'Saving exam...',
        success: 'Exam saved successfully!',
        error: (err) => `Failed to save exam: ${err.message}`,
      }
    );
    setIsSubmitting(false);
    setModalOpen(false);
  };

  const handleConfirmDelete = async () => {
    if (selectedExam) {
      setIsSubmitting(true);
      await toast.promise(
        (async () => {
          const { error } = await supabase.from('exams').delete().eq('id', selectedExam.id);
          if (error) throw error;
          setExams(prev => prev.filter(e => e.id !== selectedExam.id));
        })(),
        {
          loading: 'Deleting exam...',
          success: 'Exam deleted successfully!',
          error: (err) => `Failed to delete exam: ${err.message}`,
        }
      );
      setIsSubmitting(false);
      setDeleteModalOpen(false);
      setSelectedExam(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming': return 'bg-blue-100 text-blue-800';
      case 'ongoing': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <CardGridSkeleton title="Exams" />;
  }

  const canManage = ['admin', 'principal', 'teacher', 'system_admin'].includes(profile?.role || '');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Exams</h1>
          <p className="text-gray-600 mt-1">Schedule and manage examinations</p>
        </div>
        {canManage && (
          <Button onClick={handleAdd}>
            <Plus size={20} className="mr-2" />
            Schedule Exam
          </Button>
        )}
      </div>

      {/* Semester Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="flex overflow-x-auto border-b border-gray-200">
            {['First Semester', 'Second Semester', 'Summer Semester'].map(sem => (
                <button
                    key={sem}
                    onClick={() => setActiveSemester(sem)}
                    className={`flex-1 py-4 px-6 text-sm font-medium whitespace-nowrap transition-colors ${
                        activeSemester === sem 
                        ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600' 
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                >
                    {sem}
                </button>
            ))}
        </div>
        
        <div className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                type="text"
                placeholder="Search exams by name, subject, or class..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
            </div>
            <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
                <option value="all">All Status</option>
                <option value="upcoming">Upcoming</option>
                <option value="ongoing">Ongoing</option>
                <option value="completed">Completed</option>
            </select>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {filteredExams.map((exam) => (
          <div key={exam.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-semibold text-gray-900 text-lg">{exam.name}</h3>
                <p className="text-sm text-gray-500 mt-1">{exam.id}</p>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(exam.status)}`}>
                {exam.status}
              </span>
            </div>

            <div className="space-y-3 flex-grow">
              <div className="flex items-center text-sm"><BookOpen size={16} className="text-gray-400 mr-3" /><div><span className="text-gray-500">Subject: </span><span className="font-medium text-gray-900">{exam.subject}</span></div></div>
              <div className="flex items-center text-sm"><Calendar size={16} className="text-gray-400 mr-3" /><div><span className="text-gray-500">Date: </span><span className="font-medium text-gray-900">{exam.date}</span></div></div>
              <div className="flex items-center text-sm"><Clock size={16} className="text-gray-400 mr-3" /><div><span className="text-gray-500">Duration: </span><span className="font-medium text-gray-900">{exam.duration}</span></div></div>
              <div className="flex items-center text-sm"><Layers size={16} className="text-gray-400 mr-3" /><div><span className="text-gray-500">Semester: </span><span className="font-medium text-gray-900">{exam.semester || 'N/A'}</span></div></div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
              <span className="text-gray-500 text-sm">Class {exam.class} {exam.section ? `- Sec ${exam.section}` : ''}</span>
              <div className="text-right">
                <div className="text-gray-500 text-sm">Marks</div>
                <div className="font-bold text-gray-900">{exam.totalMarks}</div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100 mt-4 flex flex-col gap-2">
              {canManage && (
                <>
                  <div className="flex gap-2">
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      className="flex-1 text-xs"
                      onClick={() => handleGenerateAdmitCards(exam)}
                    >
                      <FileText className="h-3 w-3 mr-1" />
                      Admit Cards
                    </Button>
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      className="flex-1 text-xs"
                      onClick={() => handleGenerateReportCards(exam)}
                    >
                      <FileBarChart className="h-3 w-3 mr-1" />
                      Report Cards
                    </Button>
                  </div>
                  <Button 
                      variant="primary" 
                      size="sm" 
                      className="w-full text-xs"
                      onClick={() => handleEnterGrades(exam)}
                    >
                      <GraduationCap className="h-3 w-3 mr-1" />
                      Enter Grades
                  </Button>
                </>
              )}
              
              <div className="flex justify-end gap-1 mt-1">
                <Button variant="ghost" size="icon" onClick={() => handleView(exam)} title="View Details"><Eye className="h-4 w-4" /></Button>
                {canManage && (
                  <>
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(exam)} title="Edit Exam"><Edit className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(exam)} title="Delete Exam"><Trash2 className="h-4 w-4 text-red-500" /></Button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredExams.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <p className="text-gray-500">No exams found for {activeSemester}.</p>
          {canManage && <Button onClick={handleAdd} variant="secondary" className="mt-4">Schedule Exam</Button>}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
        title={selectedExam ? 'Edit Exam' : 'Schedule New Exam'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={() => formRef.current?.requestSubmit()} loading={isSubmitting}>
              {selectedExam ? 'Save Changes' : 'Schedule Exam'}
            </Button>
          </>
        }
      >
        <ExamForm ref={formRef} exam={selectedExam} onSubmit={handleSaveExam} />
      </Modal>

      {/* View Modal, Delete Modal, Admit Card Modal, Report Card Modal */}
      
      {selectedExam && (
        <Modal isOpen={isViewModalOpen} onClose={() => setViewModalOpen(false)} title="Exam Details">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900">{selectedExam.name}</h3>
                <p className="text-sm text-gray-500">{selectedExam.subject} - Class {selectedExam.class} {selectedExam.section ? `- Sec ${selectedExam.section}` : ''}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedExam.status)}`}>
                {selectedExam.status}
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Semester</p>
                <p className="font-medium">{selectedExam.semester || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Date</p>
                <p className="font-medium">{selectedExam.date}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Duration</p>
                <p className="font-medium">{selectedExam.duration}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Marks</p>
                <p className="font-medium">{selectedExam.totalMarks}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Passing Marks</p>
                <p className="font-medium">{selectedExam.passingMarks}</p>
              </div>
            </div>

            {canManage && (
              <div className="pt-4 flex justify-end gap-2">
                 <Button variant="secondary" onClick={() => { setViewModalOpen(false); handleGenerateAdmitCards(selectedExam); }}>
                    <FileText className="mr-2 h-4 w-4" />
                    Admit Cards
                 </Button>
                 <Button onClick={() => { setViewModalOpen(false); handleEnterGrades(selectedExam); }}>
                    <GraduationCap className="mr-2 h-4 w-4" />
                    Enter Grades
                 </Button>
              </div>
            )}
          </div>
        </Modal>
      )}

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Exam"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteModalOpen(false)}>Cancel</Button>
            <Button variant="danger" onClick={handleConfirmDelete} loading={isSubmitting}>Delete</Button>
          </>
        }
      >
        <p>Are you sure you want to delete the exam <strong>"{selectedExam?.name}"</strong>? This action cannot be undone.</p>
      </Modal>

      {/* Admit Card Modal */}
      <Modal
        isOpen={isAdmitCardModalOpen}
        onClose={() => setIsAdmitCardModalOpen(false)}
        title={`Admit Cards - ${selectedExam?.name}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsAdmitCardModalOpen(false)}>Close</Button>
            <Button onClick={handlePrintAdmitCards} disabled={loadingStudents || examStudents.length === 0}>
              <Printer className="mr-2 h-4 w-4" /> Print All
            </Button>
          </>
        }
      >
        <div className="overflow-y-auto max-h-[60vh] bg-gray-100 p-4 rounded-md">
          {loadingStudents ? (
            <div className="text-center py-8">Loading students...</div>
          ) : examStudents.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No students found for Class {selectedExam?.class} {selectedExam?.section ? `Section ${selectedExam.section}` : ''}.</div>
          ) : (
            <div ref={admitCardPrintRef}>
              {examStudents.map((student) => (
                selectedExam && <AdmitCard key={student.id} student={student} exam={selectedExam} schoolName={schoolName} />
              ))}
            </div>
          )}
        </div>
      </Modal>

      {/* Report Card Modal */}
      <Modal
        isOpen={isReportCardModalOpen}
        onClose={() => setIsReportCardModalOpen(false)}
        title={`Report Cards - ${selectedExam?.name}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsReportCardModalOpen(false)}>Close</Button>
            <Button onClick={handlePrintReportCards} disabled={loadingReports || reportCardData.length === 0}>
              <Printer className="mr-2 h-4 w-4" /> Print All
            </Button>
          </>
        }
      >
        <div className="overflow-y-auto max-h-[60vh] bg-gray-100 p-4 rounded-md">
          {loadingReports ? (
            <div className="text-center py-8">Generating report cards...</div>
          ) : reportCardData.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No data found. Ensure grades are entered for this exam.</div>
          ) : (
            <div ref={reportCardPrintRef} className="print-container">
              {reportCardData.map((data, index) => (
                selectedExam && (
                  <div key={index} className="break-after-page">
                    <ReportCardTemplate 
                      student={data.student} 
                      exam={selectedExam} 
                      grades={data.grades}
                      schoolName={schoolName}
                      academicYear={academicYear}
                    />
                  </div>
                )
              ))}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default Exams;
