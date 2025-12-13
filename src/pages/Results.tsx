import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Award, BarChart2, Download, Search, Star, UserCheck, User, Printer } from 'lucide-react';
import { Grade, Student, Exam } from '../types';
import TableSkeleton from '../components/ui/TableSkeleton';
import { supabase } from '../lib/supabaseClient';
import toast from 'react-hot-toast';
import Modal from '../components/ui/Modal';
import { Button } from '../components/ui/Button';
import { useReactToPrint } from 'react-to-print';
import ResultSlip from '../components/results/ResultSlip';
import { useGlobal } from '../context/GlobalContext';

type EnrichedGrade = Grade & {
  studentName: string;
  examName: string;
  subject: string;
  total_marks: number;
};

const Results: React.FC = () => {
  const [grades, setGrades] = useState<Grade[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedGrade, setSelectedGrade] = useState<EnrichedGrade | null>(null);
  const { schoolName } = useGlobal();
  
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [
          { data: gradesData, error: gradesError },
          { data: studentsData, error: studentsError },
          { data: examsData, error: examsError }
        ] = await Promise.all([
          supabase.from('grades').select('*'),
          supabase.from('students').select('id, name'),
          supabase.from('exams').select('id, name, subject, total_marks')
        ]);

        if (gradesError) throw gradesError;
        if (studentsError) throw studentsError;
        if (examsError) throw examsError;

        setGrades(gradesData || []);
        setStudents(studentsData || []);
        setExams(examsData || []);
      } catch (error: any) {
        const errorMessage = error?.message || (typeof error === 'object' ? JSON.stringify(error) : String(error));
        toast.error(`Failed to load results: ${errorMessage}`);
        console.error("Error fetching results:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const enrichedGrades: EnrichedGrade[] = useMemo(() => {
    return grades.map(grade => {
      const student = students.find(s => s.id === grade.student_id);
      const exam = exams.find(e => e.id === grade.exam_id);
      return {
        ...grade,
        studentName: student?.name || grade.student_id,
        examName: exam?.name || grade.exam_id,
        subject: exam?.subject || 'N/A',
        total_marks: exam?.total_marks || grade.total_marks,
      };
    });
  }, [grades, students, exams]);

  const filteredGrades = enrichedGrades.filter(grade =>
    grade.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    grade.subject.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const summaryStats = useMemo(() => {
    if (grades.length === 0) {
      return { passRate: '0.0', topStudent: { name: 'N/A', score: 0 }, highestScore: '0.0', examsPublished: 0, averageGpa: '0.00' };
    }
    const passCount = grades.filter(g => g.gpa > 1.5).length;
    const passRate = (passCount / grades.length) * 100;
    
    const topGrade = enrichedGrades.reduce((max, grade) => grade.percentage > max.percentage ? grade : max, enrichedGrades[0]);
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
  }, [grades, enrichedGrades]);

  const getGradeColor = (grade: string) => {
    if (grade.startsWith('A')) return 'bg-green-100 text-green-800';
    if (grade.startsWith('B')) return 'bg-blue-100 text-blue-800';
    if (grade.startsWith('C')) return 'bg-yellow-100 text-yellow-800';
    if (grade.startsWith('D')) return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
  };

  const handleViewDetails = (grade: EnrichedGrade) => {
    setSelectedGrade(grade);
    setIsViewModalOpen(true);
  };

  const handleExport = () => {
    const headers = ["Student", "Exam", "Subject", "Score", "Total", "Percentage", "Grade", "GPA", "Date"];
    const csvContent = "data:text/csv;charset=utf-8,"
      + headers.join(",") + "\n"
      + enrichedGrades.map(g => `"${g.studentName}","${g.examName}","${g.subject}","${g.marks_obtained}","${g.total_marks}","${g.percentage}","${g.grade}","${g.gpa}","${g.date}"`).join("\n");
    
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
    documentTitle: `Result-${selectedGrade?.studentName}-${selectedGrade?.subject}`,
  });

  if (loading) {
    return <TableSkeleton title="Results" headers={['Student', 'Exam', 'Score', 'Grade', 'Actions']} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-primary">Results</h1>
          <p className="text-muted-foreground mt-1">View and manage student exam results.</p>
        </div>
        <Button onClick={handleExport} variant="secondary">
          <Download size={20} className="mr-2" />
          Export All Results
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-5 border border-border">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <p className="text-sm font-medium text-muted-foreground">Overall Pass Rate</p>
              <p className="text-3xl font-bold text-primary mt-1">{summaryStats.passRate}%</p>
            </div>
            <div className="p-3 rounded-lg bg-green-100">
              <UserCheck className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-5 border border-border">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <p className="text-sm font-medium text-muted-foreground">Highest Score</p>
              <p className="text-3xl font-bold text-primary mt-1">{summaryStats.highestScore}%</p>
              <p className="text-xs text-muted-foreground mt-1 truncate">{summaryStats.topStudent.name}</p>
            </div>
            <div className="p-3 rounded-lg bg-yellow-100">
              <Star className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-5 border border-border">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <p className="text-sm font-medium text-muted-foreground">Exams Published</p>
              <p className="text-3xl font-bold text-primary mt-1">{summaryStats.examsPublished}</p>
            </div>
            <div className="p-3 rounded-lg bg-blue-100">
              <Award className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-5 border border-border">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <p className="text-sm font-medium text-muted-foreground">Average GPA</p>
              <p className="text-3xl font-bold text-primary mt-1">{summaryStats.averageGpa}</p>
            </div>
            <div className="p-3 rounded-lg bg-purple-100">
              <BarChart2 className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-border">
        <div className="p-4 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by student name or subject..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border bg-secondary border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-secondary">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Student</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Exam</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Score</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">Grade</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-border">
              {filteredGrades.map((grade) => (
                <tr key={grade.id} className="hover:bg-secondary/50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-primary">{grade.studentName}</div>
                    <div className="text-sm text-muted-foreground">{grade.student_id}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-primary">{grade.examName}</div>
                    <div className="text-sm text-muted-foreground">{grade.subject}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-primary">{grade.marks_obtained} / {grade.total_marks}</div>
                    <div className="text-sm text-muted-foreground">{grade.percentage.toFixed(1)}%</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${getGradeColor(grade.grade)}`}>
                      {grade.grade}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => handleViewDetails(grade)} className="text-blue-600 hover:text-blue-800">View Details</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredGrades.length === 0 && (
          <div className="p-12 text-center">
            <p className="text-muted-foreground">No results found for your search.</p>
          </div>
        )}
      </div>

      {selectedGrade && (
        <Modal 
          isOpen={isViewModalOpen} 
          onClose={() => setIsViewModalOpen(false)} 
          title="Result Details"
          footer={
            <Button onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" /> Print Result Slip
            </Button>
          }
        >
          <div className="space-y-6">
            <div className="flex items-center">
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <User className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="font-semibold text-lg text-gray-900">{selectedGrade.studentName}</p>
                <p className="text-sm text-gray-500">Student ID: {selectedGrade.student_id}</p>
              </div>
            </div>
            <div className="border-t border-gray-200 pt-6">
              <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500">Exam</dt>
                  <dd className="mt-1 text-base text-gray-900 font-semibold">{selectedGrade.examName} - {selectedGrade.subject}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Date</dt>
                  <dd className="mt-1 text-sm text-gray-900">{selectedGrade.date}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Score</dt>
                  <dd className="mt-1 text-sm font-bold text-gray-900">{selectedGrade.marks_obtained} / {selectedGrade.total_marks}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500">Percentage</dt>
                  <dd className="mt-1 text-sm text-gray-900 flex items-center">
                    <div className="w-full bg-gray-200 rounded-full h-2.5 mr-3">
                      <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${selectedGrade.percentage}%` }}></div>
                    </div>
                    <span className="font-semibold">{selectedGrade.percentage.toFixed(1)}%</span>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Grade</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${getGradeColor(selectedGrade.grade)}`}>
                      {selectedGrade.grade}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">GPA</dt>
                  <dd className="mt-1 text-sm font-bold text-gray-900">{selectedGrade.gpa.toFixed(2)}</dd>
                </div>
              </dl>
            </div>
            
            {/* Hidden printable component */}
            <div style={{ display: 'none' }}>
              <ResultSlip ref={printRef} grade={selectedGrade} schoolName={schoolName} />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Results;
