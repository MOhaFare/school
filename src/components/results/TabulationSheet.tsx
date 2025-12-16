import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import { Label } from '../ui/Label';
import { Printer, Search, Loader, AlertCircle } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import Logo from '../ui/Logo';
import { useGlobal } from '../../context/GlobalContext';

interface TabulationSheetProps {
  onClose?: () => void;
}

const TabulationSheet: React.FC<TabulationSheetProps> = ({ onClose }) => {
  const { schoolName, academicYear } = useGlobal();
  const [loading, setLoading] = useState(false);
  const [classes, setClasses] = useState<string[]>([]);
  const [examNames, setExamNames] = useState<string[]>([]);
  
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedExam, setSelectedExam] = useState('');
  
  const [sheetData, setSheetData] = useState<{
    subjects: string[];
    students: any[];
  } | null>(null);

  const printRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: `Tabulation-Sheet-${selectedClass}-${selectedExam}`,
    pageStyle: `
      @page { size: A4 landscape; margin: 10mm; }
      @media print {
        body { -webkit-print-color-adjust: exact; }
        .no-print { display: none !important; }
      }
    `
  });

  useEffect(() => {
    const fetchOptions = async () => {
      // Fetch unique classes from students
      const { data: classData } = await supabase.from('students').select('class, section').order('class');
      if (classData) {
        const uniqueClasses = Array.from(new Set(classData.map(c => `${c.class}-${c.section}`)));
        setClasses(uniqueClasses);
      }

      // Fetch unique exam names
      const { data: examData } = await supabase.from('exams').select('name').order('name');
      if (examData) {
        const uniqueExams = Array.from(new Set(examData.map(e => e.name)));
        setExamNames(uniqueExams);
      }
    };
    fetchOptions();
  }, []);

  const generateSheet = async () => {
    if (!selectedClass || !selectedExam) return;
    
    setLoading(true);
    try {
      const [classNum, section] = selectedClass.split('-');

      // 1. Fetch Students
      const { data: students, error: studentError } = await supabase
        .from('students')
        .select('id, name, roll_number')
        .eq('class', classNum)
        .eq('section', section)
        .eq('status', 'active')
        .order('name');

      if (studentError) throw studentError;

      // 2. Fetch Exams (Subjects) for this Class & Exam Name
      const { data: exams, error: examError } = await supabase
        .from('exams')
        .select('id, subject, total_marks')
        .eq('class', classNum)
        .eq('name', selectedExam);

      if (examError) throw examError;

      if (!exams || exams.length === 0) {
        setSheetData({ subjects: [], students: [] });
        setLoading(false);
        return;
      }

      // 3. Fetch Grades
      const examIds = exams.map(e => e.id);
      const { data: grades, error: gradeError } = await supabase
        .from('grades')
        .select('student_id, exam_id, marks_obtained, grade')
        .in('exam_id', examIds);

      if (gradeError) throw gradeError;

      // 4. Process Data
      const subjects = exams.map(e => e.subject).sort();
      const examMap = exams.reduce((acc: any, e: any) => {
        acc[e.id] = e;
        return acc;
      }, {});

      const processedStudents = students.map((student: any) => {
        const studentGrades: Record<string, any> = {};
        let totalObtained = 0;
        let totalMax = 0;

        exams.forEach((exam: any) => {
          const gradeEntry = grades?.find((g: any) => g.student_id === student.id && g.exam_id === exam.id);
          if (gradeEntry) {
            studentGrades[exam.subject] = {
              marks: gradeEntry.marks_obtained,
              grade: gradeEntry.grade
            };
            totalObtained += gradeEntry.marks_obtained;
          } else {
            studentGrades[exam.subject] = { marks: '-', grade: '-' };
          }
          totalMax += exam.total_marks;
        });

        const percentage = totalMax > 0 ? (totalObtained / totalMax) * 100 : 0;
        
        return {
          ...student,
          grades: studentGrades,
          totalObtained,
          totalMax,
          percentage: percentage.toFixed(1)
        };
      });

      // Sort by rank (percentage)
      processedStudents.sort((a: any, b: any) => parseFloat(b.percentage) - parseFloat(a.percentage));

      // Assign Rank
      processedStudents.forEach((s: any, index: number) => {
        s.rank = index + 1;
      });

      setSheetData({
        subjects,
        students: processedStudents
      });

    } catch (error) {
      console.error("Error generating sheet:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Controls */}
      <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-6 no-print">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div className="space-y-2">
            <Label>Select Class</Label>
            <Select value={selectedClass} onChange={e => setSelectedClass(e.target.value)}>
              <option value="">-- Choose Class --</option>
              {classes.map(c => <option key={c} value={c}>Class {c}</option>)}
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Select Exam</Label>
            <Select value={selectedExam} onChange={e => setSelectedExam(e.target.value)}>
              <option value="">-- Choose Exam --</option>
              {examNames.map(e => <option key={e} value={e}>{e}</option>)}
            </Select>
          </div>
          <div className="flex gap-2">
            <Button onClick={generateSheet} disabled={!selectedClass || !selectedExam || loading} className="flex-1">
              {loading ? <Loader className="animate-spin mr-2 h-4 w-4" /> : <Search className="mr-2 h-4 w-4" />}
              Generate
            </Button>
            <Button variant="secondary" onClick={handlePrint} disabled={!sheetData || sheetData.students.length === 0}>
              <Printer className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Sheet Display */}
      <div className="flex-grow overflow-auto bg-gray-100 p-4 rounded-lg border border-gray-200">
        {sheetData ? (
          <div ref={printRef} className="bg-white p-8 min-w-max mx-auto shadow-sm">
            {/* Header */}
            <div className="text-center mb-6 border-b-2 border-gray-800 pb-4">
              <div className="flex justify-center mb-2"><Logo /></div>
              <h1 className="text-2xl font-bold uppercase text-gray-900">{schoolName}</h1>
              <h2 className="text-lg font-semibold text-gray-700 mt-1">Exam Tabulation Sheet</h2>
              <div className="flex justify-center gap-6 text-sm font-medium text-gray-600 mt-2">
                <span>Exam: {selectedExam}</span>
                <span>Class: {selectedClass}</span>
                <span>Session: {academicYear}</span>
              </div>
            </div>

            {/* Table */}
            <table className="w-full border-collapse border border-gray-300 text-xs">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-2 py-2 w-10">Rank</th>
                  <th className="border border-gray-300 px-2 py-2 w-16">Roll No</th>
                  <th className="border border-gray-300 px-2 py-2 text-left">Student Name</th>
                  {sheetData.subjects.map(sub => (
                    <th key={sub} className="border border-gray-300 px-2 py-2 w-16 text-center">{sub.substring(0, 3).toUpperCase()}</th>
                  ))}
                  <th className="border border-gray-300 px-2 py-2 w-16 bg-gray-50">Total</th>
                  <th className="border border-gray-300 px-2 py-2 w-16 bg-gray-50">%</th>
                  <th className="border border-gray-300 px-2 py-2 w-16 bg-gray-50">Result</th>
                </tr>
              </thead>
              <tbody>
                {sheetData.students.map((student) => (
                  <tr key={student.id}>
                    <td className="border border-gray-300 px-2 py-1.5 text-center font-bold">{student.rank}</td>
                    <td className="border border-gray-300 px-2 py-1.5 text-center">{student.roll_number}</td>
                    <td className="border border-gray-300 px-2 py-1.5 font-medium">{student.name}</td>
                    {sheetData.subjects.map(sub => (
                      <td key={sub} className="border border-gray-300 px-2 py-1.5 text-center">
                        {student.grades[sub]?.marks || '-'}
                      </td>
                    ))}
                    <td className="border border-gray-300 px-2 py-1.5 text-center font-bold bg-gray-50">{student.totalObtained}</td>
                    <td className="border border-gray-300 px-2 py-1.5 text-center bg-gray-50">{student.percentage}</td>
                    <td className={`border border-gray-300 px-2 py-1.5 text-center font-bold ${parseFloat(student.percentage) >= 40 ? 'text-green-700' : 'text-red-700'}`}>
                      {parseFloat(student.percentage) >= 40 ? 'PASS' : 'FAIL'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Footer */}
            <div className="mt-12 flex justify-between text-sm font-medium text-gray-600 pt-8">
              <div className="text-center w-40 border-t border-gray-400 pt-2">Class Teacher</div>
              <div className="text-center w-40 border-t border-gray-400 pt-2">Exam Controller</div>
              <div className="text-center w-40 border-t border-gray-400 pt-2">Principal</div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <AlertCircle size={48} className="mb-4 opacity-50" />
            <p>Select a class and exam to generate the tabulation sheet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TabulationSheet;
