import React from 'react';
import { Student, Exam, Grade } from '../../types';
import Logo from '../ui/Logo';
import { formatDate } from '../../utils/format';

interface ReportCardProps {
  student: Student;
  exam: Exam;
  grades: (Grade & { subject: string; total_marks: number })[];
  schoolName: string;
  academicYear: string;
}

const ReportCardTemplate = React.forwardRef<HTMLDivElement, ReportCardProps>(({ student, exam, grades, schoolName, academicYear }, ref) => {
  // Calculate Totals
  const totalMarksObtained = grades.reduce((sum, g) => sum + g.marks_obtained, 0);
  const totalMaxMarks = grades.reduce((sum, g) => sum + g.total_marks, 0);
  const percentage = totalMaxMarks > 0 ? (totalMarksObtained / totalMaxMarks) * 100 : 0;
  const averageGpa = grades.length > 0 ? grades.reduce((sum, g) => sum + g.gpa, 0) / grades.length : 0;
  
  const getResultStatus = () => {
    if (grades.some(g => g.grade === 'F')) return 'FAIL';
    if (percentage >= 40) return 'PASS';
    return 'FAIL';
  };

  return (
    <div ref={ref} className="w-[210mm] h-[148mm] bg-white p-8 font-serif text-slate-900 mx-auto relative print:break-inside-avoid mb-4 border border-slate-200">
      {/* Watermark */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] z-0">
        <Logo className="scale-[6]" />
      </div>

      <div className="relative z-10 h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center border-b-2 border-slate-800 pb-4 mb-4">
          <div className="w-24">
            <Logo className="scale-125" />
          </div>
          <div className="flex-1 text-center">
            <h1 className="text-2xl font-bold uppercase tracking-widest text-slate-900">{schoolName}</h1>
            <p className="text-sm text-slate-600 font-medium uppercase tracking-wide mt-1">Student Report Card</p>
            <p className="text-xs text-slate-500 mt-1">Academic Year: {academicYear}</p>
          </div>
          <div className="w-24 text-right">
             <div className="w-20 h-24 bg-slate-100 border border-slate-300 flex items-center justify-center text-xs text-slate-400 ml-auto">
                {student.avatar ? <img src={student.avatar} className="w-full h-full object-cover"/> : 'PHOTO'}
             </div>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-3 gap-4 text-sm mb-4 bg-slate-50 p-3 rounded border border-slate-200">
          <div>
            <span className="text-slate-500 font-bold block text-xs uppercase">Student Name</span>
            <span className="font-semibold">{student.name}</span>
          </div>
          <div>
            <span className="text-slate-500 font-bold block text-xs uppercase">Class / Section</span>
            <span className="font-semibold">{student.class} - {student.section}</span>
          </div>
          <div>
            <span className="text-slate-500 font-bold block text-xs uppercase">Roll Number</span>
            <span className="font-semibold">{student.rollNumber}</span>
          </div>
          <div>
            <span className="text-slate-500 font-bold block text-xs uppercase">Examination</span>
            <span className="font-semibold">{exam.name}</span>
          </div>
          <div>
            <span className="text-slate-500 font-bold block text-xs uppercase">Date</span>
            <span className="font-semibold">{formatDate(exam.date)}</span>
          </div>
          <div>
            <span className="text-slate-500 font-bold block text-xs uppercase">Attendance</span>
            <span className="font-semibold">92%</span> {/* Placeholder/Calculated */}
          </div>
        </div>

        {/* Marks Table */}
        <div className="flex-grow">
            <table className="w-full border-collapse text-sm">
            <thead>
                <tr className="bg-slate-800 text-white">
                <th className="py-2 px-3 text-left border border-slate-700">Subject</th>
                <th className="py-2 px-3 text-center border border-slate-700">Max Marks</th>
                <th className="py-2 px-3 text-center border border-slate-700">Obtained</th>
                <th className="py-2 px-3 text-center border border-slate-700">Grade</th>
                <th className="py-2 px-3 text-center border border-slate-700">GPA</th>
                <th className="py-2 px-3 text-left border border-slate-700">Remarks</th>
                </tr>
            </thead>
            <tbody>
                {grades.map((grade) => (
                <tr key={grade.id} className="border-b border-slate-200">
                    <td className="py-1.5 px-3 border-l border-r border-slate-200 font-medium">{grade.subject}</td>
                    <td className="py-1.5 px-3 text-center border-r border-slate-200 text-slate-500">{grade.total_marks}</td>
                    <td className="py-1.5 px-3 text-center border-r border-slate-200 font-bold">{grade.marks_obtained}</td>
                    <td className="py-1.5 px-3 text-center border-r border-slate-200">{grade.grade}</td>
                    <td className="py-1.5 px-3 text-center border-r border-slate-200">{grade.gpa}</td>
                    <td className="py-1.5 px-3 border-r border-slate-200 text-xs italic text-slate-500">
                        {grade.grade === 'A+' || grade.grade === 'A' ? 'Excellent' : 
                         grade.grade === 'B+' || grade.grade === 'B' ? 'Good' : 
                         grade.grade === 'F' ? 'Needs Improvement' : 'Satisfactory'}
                    </td>
                </tr>
                ))}
                {/* Empty rows filler if needed */}
                {Array.from({ length: Math.max(0, 6 - grades.length) }).map((_, i) => (
                    <tr key={`empty-${i}`} className="border-b border-slate-100">
                        <td className="py-3 px-3 border-l border-r border-slate-100">&nbsp;</td>
                        <td className="border-r border-slate-100"></td>
                        <td className="border-r border-slate-100"></td>
                        <td className="border-r border-slate-100"></td>
                        <td className="border-r border-slate-100"></td>
                        <td className="border-r border-slate-100"></td>
                    </tr>
                ))}
            </tbody>
            <tfoot>
                <tr className="bg-slate-100 font-bold border-t-2 border-slate-300">
                    <td className="py-2 px-3 text-right border-l border-b border-slate-200">TOTAL</td>
                    <td className="py-2 px-3 text-center border-b border-slate-200">{totalMaxMarks}</td>
                    <td className="py-2 px-3 text-center border-b border-slate-200">{totalMarksObtained}</td>
                    <td className="py-2 px-3 text-center border-b border-slate-200" colSpan={3}>
                        Result: <span className={getResultStatus() === 'PASS' ? 'text-green-700' : 'text-red-700'}>{getResultStatus()}</span> 
                        <span className="mx-2">|</span> 
                        Percentage: {percentage.toFixed(2)}%
                        <span className="mx-2">|</span>
                        GPA: {averageGpa.toFixed(2)}
                    </td>
                </tr>
            </tfoot>
            </table>
        </div>

        {/* Footer */}
        <div className="mt-auto pt-4 grid grid-cols-3 gap-8">
            <div className="text-center">
                <div className="border-b border-slate-400 mb-1 h-8"></div>
                <p className="text-xs font-bold text-slate-500 uppercase">Class Teacher</p>
            </div>
            <div className="text-center">
                <div className="border-b border-slate-400 mb-1 h-8"></div>
                <p className="text-xs font-bold text-slate-500 uppercase">Exam Controller</p>
            </div>
            <div className="text-center">
                <div className="border-b border-slate-400 mb-1 h-8"></div>
                <p className="text-xs font-bold text-slate-500 uppercase">Principal</p>
            </div>
        </div>
      </div>
    </div>
  );
});

ReportCardTemplate.displayName = 'ReportCardTemplate';

export default ReportCardTemplate;
