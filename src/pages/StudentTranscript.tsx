import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, Printer, FileText, User, GraduationCap } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import { Student, Grade, Exam } from '../types';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { supabase } from '../lib/supabaseClient';
import toast from 'react-hot-toast';
import { useGlobal } from '../context/GlobalContext';
import StudentTranscriptTemplate from '../components/results/StudentTranscriptTemplate';
import { Skeleton } from '../components/ui/Skeleton';

const StudentTranscript: React.FC = () => {
  const { schoolName, academicYear } = useGlobal();
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [grades, setGrades] = useState<(Grade & { examName: string; total_marks: number })[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingGrades, setLoadingGrades] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const componentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchStudents = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.from('students').select('*').order('name');
        if (error) throw error;
        setStudents(data.map((s: any) => ({
            id: s.id,
            name: s.name,
            email: s.email,
            class: s.class,
            section: s.section,
            rollNumber: s.roll_number,
            phone: s.phone,
            enrollmentDate: s.enrollment_date,
            issuedDate: s.issued_date,
            expiryDate: s.expiry_date,
            dob: s.dob,
            status: s.status,
            grade: s.grade,
            avatar: s.avatar
        })));
      } catch (error: any) {
        toast.error('Failed to load students');
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
  }, []);

  useEffect(() => {
    if (!selectedStudentId) {
      setGrades([]);
      return;
    }

    const fetchGrades = async () => {
      setLoadingGrades(true);
      try {
        const { data, error } = await supabase
          .from('grades')
          .select(`
            *,
            exams ( name, total_marks )
          `)
          .eq('student_id', selectedStudentId)
          .order('date', { ascending: true });

        if (error) throw error;

        const formattedGrades = data.map((g: any) => ({
          id: g.id,
          student_id: g.student_id,
          exam_id: g.exam_id,
          marks_obtained: g.marks_obtained,
          percentage: g.percentage,
          grade: g.grade,
          gpa: g.gpa,
          date: g.date,
          subject: g.subject || 'Unknown', // Fallback if subject stored in grade row
          examName: g.exams?.name || 'Unknown Exam',
          total_marks: g.exams?.total_marks || 100,
          studentName: '', // Not needed for this view
          examNameRaw: g.exams?.name // Helper
        }));

        setGrades(formattedGrades);
      } catch (error: any) {
        toast.error('Failed to load grades');
      } finally {
        setLoadingGrades(false);
      }
    };

    fetchGrades();
  }, [selectedStudentId]);

  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    documentTitle: `Transcript-${selectedStudentId}`,
  });

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.rollNumber.includes(searchTerm)
  );

  const selectedStudent = students.find(s => s.id === selectedStudentId);

  // Group grades by Exam Name
  const groupedGrades = useMemo(() => {
    const groups: Record<string, typeof grades> = {};
    grades.forEach(grade => {
      if (!groups[grade.examName]) {
        groups[grade.examName] = [];
      }
      groups[grade.examName].push(grade);
    });
    return groups;
  }, [grades]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Student Transcript</h1>
          <p className="text-slate-500 mt-1">Generate cumulative academic reports and transcripts</p>
        </div>
        <Button onClick={handlePrint} disabled={!selectedStudent || grades.length === 0}>
          <Printer size={20} className="mr-2" /> Print Transcript
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar: Student Selection */}
        <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-[calc(100vh-12rem)]">
          <div className="p-4 border-b border-slate-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Search student..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>
          <div className="flex-grow overflow-y-auto scrollbar-thin">
            {loading ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredStudents.map(student => (
                  <button
                    key={student.id}
                    onClick={() => setSelectedStudentId(student.id)}
                    className={`w-full text-left p-3 hover:bg-slate-50 transition-colors flex items-center gap-3 ${selectedStudentId === student.id ? 'bg-blue-50 border-l-4 border-blue-600' : 'border-l-4 border-transparent'}`}
                  >
                    <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-sm overflow-hidden shrink-0">
                      {student.avatar ? <img src={student.avatar} alt={student.name} className="w-full h-full object-cover" /> : student.name.charAt(0)}
                    </div>
                    <div>
                      <p className={`text-sm font-medium ${selectedStudentId === student.id ? 'text-blue-700' : 'text-slate-900'}`}>{student.name}</p>
                      <p className="text-xs text-slate-500">Class {student.class}-{student.section}</p>
                    </div>
                  </button>
                ))}
                {filteredStudents.length === 0 && (
                  <div className="p-8 text-center text-slate-500 text-sm">No students found</div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Main Content: Transcript Preview */}
        <div className="lg:col-span-3 bg-slate-50 rounded-xl border border-slate-200 overflow-hidden flex flex-col">
          {selectedStudent ? (
            loadingGrades ? (
              <div className="flex-grow flex items-center justify-center p-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-slate-500">Generating transcript...</p>
                </div>
              </div>
            ) : grades.length > 0 ? (
              <div className="flex-grow overflow-auto p-8 bg-slate-100/50">
                <div className="shadow-lg mx-auto max-w-[210mm]">
                  <StudentTranscriptTemplate 
                    ref={componentRef}
                    student={selectedStudent}
                    groupedGrades={groupedGrades}
                    schoolName={schoolName}
                    academicYear={academicYear}
                  />
                </div>
              </div>
            ) : (
              <div className="flex-grow flex flex-col items-center justify-center p-12 text-center">
                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
                  <FileText className="h-8 w-8 text-yellow-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">No Grades Found</h3>
                <p className="text-slate-500 max-w-md mt-1">This student does not have any recorded grades yet. Add grades in the Examinations module to generate a transcript.</p>
              </div>
            )
          ) : (
            <div className="flex-grow flex flex-col items-center justify-center p-12 text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <GraduationCap className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900">Select a Student</h3>
              <p className="text-slate-500 max-w-md mt-1">Select a student from the list to view and print their academic transcript.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentTranscript;
