import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Award, BarChart2, Download, Search, Star, UserCheck, Table, Printer } from 'lucide-react';
import { Grade, Student, Exam } from '../types';
import TableSkeleton from '../components/ui/TableSkeleton';
import { supabase } from '../lib/supabaseClient';
import toast from 'react-hot-toast';
import Modal from '../components/ui/Modal';
import { Button } from '../components/ui/Button';
import { useReactToPrint } from 'react-to-print';
import ReportCardTemplate from '../components/results/ReportCardTemplate';
import TabulationSheet from '../components/results/TabulationSheet';
import { useGlobal } from '../context/GlobalContext';

// Extended type for internal use
type EnrichedGrade = Grade & {
  studentName: string;
  examName: string;
  subject: string;
  total_marks: number;
};

const Results: React.FC = () => {
  const [grades, setGrades] = useState<EnrichedGrade[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modals
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isTabulationOpen, setIsTabulationOpen] = useState(false);
  
  const [selectedGrade, setSelectedGrade] = useState<EnrichedGrade | null>(null);
  const [fullReportData, setFullReportData] = useState<{student: Student, exam: Exam, grades: any[]} | null>(null);
  
  const { schoolName, schoolAddress, schoolPhone, schoolEmail, schoolLogo, academicYear } = useGlobal();
  
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Optimized Query: Join tables to get names directly
        const { data, error } = await supabase
          .from('grades')
          .select(`
            *,
            students ( id, name ),
            exams ( id, name, subject, total_marks )
          `)
          .order('date', { ascending: false })
          .limit(500); // Limit initial load for performance

        if (error) throw error;

        // Transform data
        const transformedGrades = (data || []).map((g: any) => ({
          id: g.id,
          created_at: g.created_at,
          student_id: g.student_id,
          exam_id: g.exam_id,
          marks_obtained: g.marks_obtained,
          percentage: g.percentage,
          grade: g.grade,
          gpa: g.gpa,
          date: g.date,
          studentName: g.students?.name || 'Unknown Student',
          examName: g.exams?.name || 'Unknown Exam',
          subject: g.exams?.subject || 'Unknown Subject',
          total_marks: g.exams?.total_marks || 100,
        }));

        setGrades(transformedGrades);
      } catch (error: any) {
        const errorMessage = error?.message || (typeof error === 'object' ? JSON.stringify(error) : String(error));
        toast.error(`Failed to load results: ${errorMessage}`);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredGrades = grades.filter(grade =>
    grade.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    grade.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    grade.examName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const summaryStats = useMemo(() => {
    if (grades.length === 0) {
      return { passRate: '0.0', topStudent: { name: 'N/A', score: 0 }, highestScore: '0.0', examsPublished: 0, averageGpa: '0.00' };
    }
    const passCount = grades.filter(g => g.gpa > 1.5).length;
    const passRate = (passCount / grades.length) * 100;
    
    const topGrade = grades.reduce((max, grade) => grade.percentage > max.percentage ? grade : max, grades[0]);
    const topStudent = { name: topGrade.studentName, score: topGrade.percentage };

    const examsPublished = new Set(grades.map(g => g.exam_id)).size;
    const averageGpa = (grades.reduce((acc, g) => acc + g.gpa, 0) / grades.length);

    return {
      passRate: passRate.toFixed(1),
      topStudent,
      highestScore: topStudent.score.toFixed(1),
      examsPublished,
      averageGpa: averageGpa.toFixed(2),
    };
  }, [grades]);

  const getGradeColor = (grade: string) => {
    if (grade.startsWith('A')) return 'bg-green-100 text-green-800';
    if (grade.startsWith('B')) return 'bg-blue-100 text-blue-800';
    if (grade.startsWith('C')) return 'bg-yellow-100 text-yellow-800';
    if (grade.startsWith('D')) return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
  };

  const handleViewDetails = async (grade: EnrichedGrade) => {
    setSelectedGrade(grade);
    setFullReportData(null);
    setIsViewModalOpen(true);
    
    const toastId = toast.loading('Generating report card...');
    try {
        // Fetch full details on demand
        const [studentRes, examRes, relatedGradesRes] = await Promise.all([
            supabase.from('students').select('*').eq('id', grade.student_id).single(),
            supabase.from('exams').select('*').eq('id', grade.exam_id).single(),
            supabase.from('grades').select('*, exams(name, total_marks, subject)').eq('student_id', grade.student_id)
        ]);

        if (studentRes.error) throw studentRes.error;
        if (examRes.error) throw examRes.error;
        
        // Map related grades for the report card (same exam name, e.g. "Mid Term")
        const currentExamName = examRes.data.name;
        
        const formattedGrades = (relatedGradesRes.data || [])
            .map((g: any) => ({
                ...g,
                subject: g.exams?.subject || 'Unknown',
                examName: g.exams?.name || 'Unknown',
                total_marks: g.exams?.total_marks || 100
            }))
            .filter((g: any) => g.examName === currentExamName);

        // Transform keys to match internal types
        const studentData: Student = {
            id: studentRes.data.id,
            name: studentRes.data.name,
            email: studentRes.data.email,
            class: studentRes.data.class,
            section: studentRes.data.section,
            rollNumber: studentRes.data.roll_number,
            phone: studentRes.data.phone,
            enrollmentDate: studentRes.data.enrollment_date,
            issuedDate: studentRes.data.issued_date,
            expiryDate: studentRes.data.expiry_date,
            dob: studentRes.data.dob,
            status: studentRes.data.status,
            grade: studentRes.data.grade,
            avatar: studentRes.data.avatar,
            parent_name: studentRes.data.parent_name,
            parent_email: studentRes.data.parent_email,
            parent_phone: studentRes.data.parent_phone
        };

        const examData: Exam = {
            id: examRes.data.id,
            name: examRes.data.name,
            subject: examRes.data.subject,
            class: examRes.data.class,
            date: examRes.data.date,
            totalMarks: examRes.data.total_marks,
            passingMarks: examRes.data.passing_marks,
            duration: examRes.data.duration,
            status: examRes.data.status
        };

        setFullReportData({
            student: studentData,
            exam: examData,
            grades: formattedGrades
        });
        
        toast.dismiss(toastId);
    } catch (error: any) {
        console.error("Error loading report details:", error);
        toast.error('Failed to load report details');
        toast.dismiss(toastId);
        setIsViewModalOpen(false);
    }
  };

  const handleExport = () => {
    const headers = ["Student", "Exam", "Subject", "Score", "Total", "Percentage", "Grade", "GPA", "Date"];
    const csvContent = "data:text/csv;charset=utf-8,"
      + headers.join(",") + "\n"
      + grades.map(g => `"${g.studentName}","${g.examName}","${g.subject}","${g.marks_obtained}","${g.total_marks}","${g.percentage}","${g.grade}","${g.gpa}","${g.date}"`).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "exam_results.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Results exported successfully!");
  };

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: `Report-Card-${selectedGrade?.studentName}`,
  });

  if (loading) {
    return <TableSkeleton title="Results" headers={['Student', 'Exam', 'Score', 'Grade', 'Actions']} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Results</h1>
          <p className="text-slate-500 mt-1">View and manage student exam results.</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsTabulationOpen(true)} variant="secondary" className="bg-white border border-slate-200 text-blue-600 hover:bg-blue-50">
            <Table size={20} className="mr-2" />
            Tabulation Sheet
          </Button>
          <Button onClick={handleExport} variant="secondary">
            <Download size={20} className="mr-2" />
            Export All
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-5 border border-slate-200">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <p className="text-sm font-medium text-slate-500">Overall Pass Rate</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">{summaryStats.passRate}%</p>
            </div>
            <div className="p-3 rounded-lg bg-green-100">
              <UserCheck className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5 border border-slate-200">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <p className="text-sm font-medium text-slate-500">Highest Score</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">{summaryStats.highestScore}%</p>
              <p className="text-xs text-slate-500 mt-1 truncate">{summaryStats.topStudent.name}</p>
            </div>
            <div className="p-3 rounded-lg bg-yellow-100">
              <Star className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5 border border-slate-200">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <p className="text-sm font-medium text-slate-500">Exams Published</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">{summaryStats.examsPublished}</p>
            </div>
            <div className="p-3 rounded-lg bg-blue-100">
              <Award className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5 border border-slate-200">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <p className="text-sm font-medium text-slate-500">Average GPA</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">{summaryStats.averageGpa}</p>
            </div>
            <div className="p-3 rounded-lg bg-purple-100">
              <BarChart2 className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Search by student name or subject..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-white">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Student</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Exam</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Score</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">Grade</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {filteredGrades.map((grade) => (
                <tr key={grade.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-slate-900">{grade.studentName}</div>
                    <div className="text-xs text-slate-500 font-mono">{grade.student_id}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-slate-900">{grade.examName}</div>
                    <div className="text-xs text-slate-500">{grade.subject}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-slate-900">{grade.marks_obtained} / {grade.total_marks}</div>
                    <div className="text-xs text-slate-500">{grade.percentage.toFixed(1)}%</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${getGradeColor(grade.grade)}`}>
                      {grade.grade}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => handleViewDetails(grade)} className="text-blue-600 hover:text-blue-800 font-medium">View Report</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredGrades.length === 0 && (
          <div className="p-12 text-center">
            <p className="text-slate-500">No results found for your search.</p>
          </div>
        )}
      </div>

      {/* Tabulation Sheet Modal */}
      <Modal
        isOpen={isTabulationOpen}
        onClose={() => setIsTabulationOpen(false)}
        title="Exam Tabulation Sheet"
        size="full"
      >
        <TabulationSheet onClose={() => setIsTabulationOpen(false)} />
      </Modal>

      {/* Report Card Modal */}
      {selectedGrade && (
        <Modal 
          isOpen={isViewModalOpen} 
          onClose={() => setIsViewModalOpen(false)} 
          title="Student Report Card"
          footer={
            <Button onClick={handlePrint} disabled={!fullReportData}>
              <Printer className="mr-2 h-4 w-4" /> Print Report Card
            </Button>
          }
        >
          <div className="space-y-6">
            <div className="border border-slate-200 rounded-md overflow-hidden bg-slate-50 p-4 flex justify-center">
                {fullReportData ? (
                    <div className="scale-[0.6] origin-top">
                        <ReportCardTemplate 
                            student={fullReportData.student}
                            exam={fullReportData.exam}
                            grades={fullReportData.grades}
                            schoolName={schoolName}
                            schoolAddress={schoolAddress}
                            schoolPhone={schoolPhone}
                            schoolEmail={schoolEmail}
                            schoolLogo={schoolLogo}
                            academicYear={academicYear}
                        />
                    </div>
                ) : (
                    <div className="text-center p-12">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-slate-500">Generating report card...</p>
                    </div>
                )}
            </div>
            
            <div style={{ display: 'none' }}>
              {fullReportData && (
                  <ReportCardTemplate 
                    ref={printRef}
                    student={fullReportData.student}
                    exam={fullReportData.exam}
                    grades={fullReportData.grades}
                    schoolName={schoolName}
                    schoolAddress={schoolAddress}
                    schoolPhone={schoolPhone}
                    schoolEmail={schoolEmail}
                    schoolLogo={schoolLogo}
                    academicYear={academicYear}
                  />
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Results;
