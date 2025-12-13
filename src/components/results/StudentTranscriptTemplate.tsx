import React from 'react';
import { Student, Grade, Exam } from '../../types';
import Logo from '../ui/Logo';
import { formatDate } from '../../utils/format';

interface TranscriptProps {
  student: Student;
  groupedGrades: Record<string, (Grade & { examName: string; total_marks: number })[]>;
  schoolName: string;
  academicYear: string;
}

const StudentTranscriptTemplate = React.forwardRef<HTMLDivElement, TranscriptProps>(({ student, groupedGrades, schoolName, academicYear }, ref) => {
  // Calculate Cumulative Stats
  const allGrades = Object.values(groupedGrades).flat();
  const totalMarksObtained = allGrades.reduce((sum, g) => sum + g.marks_obtained, 0);
  const totalMaxMarks = allGrades.reduce((sum, g) => sum + g.total_marks, 0);
  const overallPercentage = totalMaxMarks > 0 ? (totalMarksObtained / totalMaxMarks) * 100 : 0;
  const cgpa = allGrades.length > 0 ? allGrades.reduce((sum, g) => sum + g.gpa, 0) / allGrades.length : 0;

  return (
    <div ref={ref} className="w-[210mm] min-h-[297mm] bg-white p-12 font-serif text-slate-900 mx-auto relative print:break-inside-avoid">
      {/* Watermark */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] z-0">
        <Logo className="scale-[8]" />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <div className="text-center border-b-4 border-double border-slate-800 pb-6 mb-8">
          <div className="flex justify-center mb-4">
            <Logo className="scale-150" />
          </div>
          <h1 className="text-3xl font-bold uppercase tracking-widest text-slate-900">{schoolName}</h1>
          <p className="text-slate-600 italic mt-1">Excellence in Education</p>
          <div className="mt-4 inline-block bg-slate-900 text-white px-6 py-1 text-lg font-bold uppercase tracking-wider">
            Official Academic Transcript
          </div>
        </div>

        {/* Student Info */}
        <div className="grid grid-cols-2 gap-8 mb-8 text-sm">
          <div>
            <table className="w-full">
              <tbody>
                <tr>
                  <td className="font-bold py-1 w-32">Student Name:</td>
                  <td className="border-b border-slate-300">{student.name}</td>
                </tr>
                <tr>
                  <td className="font-bold py-1">Student ID:</td>
                  <td className="border-b border-slate-300">{student.id}</td>
                </tr>
                <tr>
                  <td className="font-bold py-1">Date of Birth:</td>
                  <td className="border-b border-slate-300">{formatDate(student.dob)}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div>
            <table className="w-full">
              <tbody>
                <tr>
                  <td className="font-bold py-1 w-32">Class / Grade:</td>
                  <td className="border-b border-slate-300">{student.class} - {student.section}</td>
                </tr>
                <tr>
                  <td className="font-bold py-1">Academic Year:</td>
                  <td className="border-b border-slate-300">{academicYear}</td>
                </tr>
                <tr>
                  <td className="font-bold py-1">Issue Date:</td>
                  <td className="border-b border-slate-300">{new Date().toLocaleDateString()}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Grades Tables */}
        <div className="space-y-8">
          {Object.entries(groupedGrades).map(([examName, grades]) => {
             const examTotal = grades.reduce((sum, g) => sum + g.marks_obtained, 0);
             const examMax = grades.reduce((sum, g) => sum + g.total_marks, 0);
             const examAvg = grades.length > 0 ? (grades.reduce((sum, g) => sum + g.percentage, 0) / grades.length) : 0;

             return (
              <div key={examName} className="break-inside-avoid">
                <div className="flex justify-between items-end mb-2 border-b border-slate-400 pb-1">
                  <h3 className="text-lg font-bold uppercase text-slate-800">{examName}</h3>
                  <span className="text-xs font-medium text-slate-500">Exam Summary: {examTotal}/{examMax} ({((examTotal/examMax)*100).toFixed(1)}%)</span>
                </div>
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-300">
                      <th className="py-2 px-3 text-left font-bold w-1/3">Subject</th>
                      <th className="py-2 px-3 text-center font-bold">Marks</th>
                      <th className="py-2 px-3 text-center font-bold">Total</th>
                      <th className="py-2 px-3 text-center font-bold">Grade</th>
                      <th className="py-2 px-3 text-center font-bold">Points (GPA)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {grades.map((grade) => (
                      <tr key={grade.id} className="border-b border-slate-200">
                        <td className="py-2 px-3">{grade.subject}</td>
                        <td className="py-2 px-3 text-center">{grade.marks_obtained}</td>
                        <td className="py-2 px-3 text-center text-slate-500">{grade.total_marks}</td>
                        <td className="py-2 px-3 text-center font-bold">{grade.grade}</td>
                        <td className="py-2 px-3 text-center">{grade.gpa.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>

        {/* Cumulative Summary */}
        <div className="mt-12 border-t-2 border-slate-800 pt-6 break-inside-avoid">
          <h3 className="text-lg font-bold uppercase mb-4">Cumulative Performance</h3>
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-sm">
            <div className="grid grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-xs text-slate-500 uppercase font-bold">Total Marks</p>
                <p className="text-xl font-bold">{totalMarksObtained} / {totalMaxMarks}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase font-bold">Overall Percentage</p>
                <p className="text-xl font-bold">{overallPercentage.toFixed(2)}%</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase font-bold">CGPA</p>
                <p className="text-xl font-bold">{cgpa.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase font-bold">Final Result</p>
                <p className={`text-xl font-bold ${overallPercentage >= 40 ? 'text-green-700' : 'text-red-700'}`}>
                  {overallPercentage >= 40 ? 'PASSED' : 'FAILED'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Grading Scale Legend */}
        <div className="mt-8 text-xs text-slate-500 break-inside-avoid">
          <p className="font-bold mb-1">Grading Scale:</p>
          <div className="grid grid-cols-4 gap-2">
            <span>A+ (90-100%) : 4.0</span>
            <span>A (80-89%) : 3.5</span>
            <span>B+ (70-79%) : 3.0</span>
            <span>B (60-69%) : 2.5</span>
            <span>C+ (50-59%) : 2.0</span>
            <span>C (40-49%) : 1.5</span>
            <span>D (33-39%) : 1.0</span>
            <span>F (0-32%) : 0.0</span>
          </div>
        </div>

        {/* Signatures */}
        <div className="mt-16 grid grid-cols-2 gap-20 break-inside-avoid">
          <div className="text-center">
            <div className="border-b border-slate-400 mb-2 h-12"></div>
            <p className="font-bold text-sm">Class Teacher Signature</p>
          </div>
          <div className="text-center">
            <div className="border-b border-slate-400 mb-2 h-12"></div>
            <p className="font-bold text-sm">Principal Signature & Seal</p>
          </div>
        </div>
      </div>
    </div>
  );
});

StudentTranscriptTemplate.displayName = 'StudentTranscriptTemplate';

export default StudentTranscriptTemplate;
