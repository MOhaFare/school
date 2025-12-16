import React from 'react';
import { Student, Exam, Grade } from '../../types';
import Logo from '../ui/Logo';
import { formatDate } from '../../utils/format';

interface ReportCardProps {
  student: Student;
  exam: Exam;
  grades: (Grade & { subject: string; total_marks: number })[];
  schoolName: string;
  schoolAddress?: string;
  schoolPhone?: string;
  schoolEmail?: string;
  schoolLogo?: string | null;
  academicYear: string;
}

const ReportCardTemplate = React.forwardRef<HTMLDivElement, ReportCardProps>(({ 
  student, exam, grades, schoolName, schoolAddress, schoolPhone, schoolEmail, schoolLogo, academicYear 
}, ref) => {
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

  const getRemarks = (gpa: number) => {
    if (gpa >= 3.8) return "Outstanding Performance!";
    if (gpa >= 3.5) return "Excellent work, keep it up.";
    if (gpa >= 3.0) return "Very Good, consistent effort.";
    if (gpa >= 2.5) return "Good, but room for improvement.";
    if (gpa >= 2.0) return "Satisfactory, needs more focus.";
    return "Needs serious improvement.";
  };

  return (
    <div ref={ref} className="w-[210mm] min-h-[297mm] bg-white p-10 font-sans text-slate-900 mx-auto relative print:break-inside-avoid border border-slate-200">
      {/* Watermark */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.04] z-0">
        {schoolLogo ? <img src={schoolLogo} className="w-96 h-96 object-contain grayscale" /> : <Logo className="scale-[8]" />}
      </div>

      <div className="relative z-10 h-full flex flex-col">
        {/* Header Section */}
        <div className="flex items-start border-b-4 border-double border-blue-900 pb-6 mb-6">
          <div className="w-28 flex items-center justify-center">
             {schoolLogo ? (
                <img src={schoolLogo} alt="Logo" className="w-24 h-24 object-contain" />
             ) : (
                <Logo className="scale-[2.5]" />
             )}
          </div>
          <div className="flex-1 text-center px-4">
            <h1 className="text-3xl font-extrabold uppercase tracking-wide text-blue-900">{schoolName}</h1>
            {schoolAddress && <p className="text-sm text-slate-600 mt-1 font-medium">{schoolAddress}</p>}
            <div className="flex justify-center gap-4 text-xs text-slate-500 mt-1">
                {schoolPhone && <span>Ph: {schoolPhone}</span>}
                {schoolEmail && <span>Email: {schoolEmail}</span>}
            </div>
            <div className="mt-4 inline-block bg-blue-900 text-white px-8 py-1.5 text-lg font-bold uppercase rounded-full shadow-sm tracking-wider">
                Progress Report
            </div>
          </div>
          <div className="w-28 flex justify-end">
             <div className="w-24 h-28 bg-slate-50 border border-slate-300 flex items-center justify-center text-xs text-slate-400 overflow-hidden shadow-sm">
                {student.avatar ? <img src={student.avatar} className="w-full h-full object-cover"/> : 'STUDENT PHOTO'}
             </div>
          </div>
        </div>

        {/* Student Details Grid */}
        <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg mb-6 shadow-sm">
            <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
                <div className="flex border-b border-slate-200 pb-1">
                    <span className="font-bold text-slate-500 w-32">Student Name:</span>
                    <span className="font-bold text-slate-900 flex-1">{student.name}</span>
                </div>
                <div className="flex border-b border-slate-200 pb-1">
                    <span className="font-bold text-slate-500 w-32">Admission No:</span>
                    <span className="font-semibold text-slate-900 flex-1">{student.id}</span>
                </div>
                <div className="flex border-b border-slate-200 pb-1">
                    <span className="font-bold text-slate-500 w-32">Class & Section:</span>
                    <span className="font-semibold text-slate-900 flex-1">{student.class} - {student.section}</span>
                </div>
                <div className="flex border-b border-slate-200 pb-1">
                    <span className="font-bold text-slate-500 w-32">Roll Number:</span>
                    <span className="font-semibold text-slate-900 flex-1">{student.rollNumber}</span>
                </div>
                <div className="flex border-b border-slate-200 pb-1">
                    <span className="font-bold text-slate-500 w-32">Exam Name:</span>
                    <span className="font-semibold text-slate-900 flex-1">{exam.name}</span>
                </div>
                <div className="flex border-b border-slate-200 pb-1">
                    <span className="font-bold text-slate-500 w-32">Academic Year:</span>
                    <span className="font-semibold text-slate-900 flex-1">{academicYear}</span>
                </div>
                {student.parent_name && (
                    <div className="flex border-b border-slate-200 pb-1 col-span-2">
                        <span className="font-bold text-slate-500 w-32">Parent/Guardian:</span>
                        <span className="font-semibold text-slate-900 flex-1">{student.parent_name}</span>
                    </div>
                )}
            </div>
        </div>

        {/* Academic Performance Table */}
        <div className="mb-6 flex-grow">
            <h3 className="text-sm font-bold text-blue-900 uppercase mb-2 border-l-4 border-blue-600 pl-2">Scholastic Areas</h3>
            <table className="w-full border-collapse text-sm shadow-sm">
            <thead>
                <tr className="bg-blue-900 text-white">
                    <th className="py-3 px-4 text-left border border-blue-800 w-1/3">Subject</th>
                    <th className="py-3 px-4 text-center border border-blue-800">Max Marks</th>
                    <th className="py-3 px-4 text-center border border-blue-800">Marks Obt.</th>
                    <th className="py-3 px-4 text-center border border-blue-800">Grade</th>
                    <th className="py-3 px-4 text-center border border-blue-800">GPA</th>
                    <th className="py-3 px-4 text-left border border-blue-800">Remarks</th>
                </tr>
            </thead>
            <tbody>
                {grades.map((grade, index) => (
                <tr key={grade.id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}>
                    <td className="py-2.5 px-4 border border-slate-300 font-medium text-slate-800">{grade.subject}</td>
                    <td className="py-2.5 px-4 text-center border border-slate-300 text-slate-600">{grade.total_marks}</td>
                    <td className="py-2.5 px-4 text-center border border-slate-300 font-bold text-slate-900">{grade.marks_obtained}</td>
                    <td className="py-2.5 px-4 text-center border border-slate-300 font-semibold">{grade.grade}</td>
                    <td className="py-2.5 px-4 text-center border border-slate-300">{grade.gpa.toFixed(1)}</td>
                    <td className="py-2.5 px-4 border border-slate-300 text-xs italic text-slate-500">
                        {grade.grade === 'A+' ? 'Outstanding' : 
                         grade.grade === 'A' ? 'Excellent' : 
                         grade.grade === 'B+' ? 'Very Good' : 
                         grade.grade === 'B' ? 'Good' : 
                         grade.grade === 'C' ? 'Satisfactory' : 'Needs Work'}
                    </td>
                </tr>
                ))}
                
                {/* Total Row */}
                <tr className="bg-blue-50 font-bold border-t-2 border-blue-200">
                    <td className="py-3 px-4 text-right border border-slate-300 text-blue-900">GRAND TOTAL</td>
                    <td className="py-3 px-4 text-center border border-slate-300 text-blue-900">{totalMaxMarks}</td>
                    <td className="py-3 px-4 text-center border border-slate-300 text-blue-900">{totalMarksObtained}</td>
                    <td className="py-3 px-4 text-center border border-slate-300" colSpan={3}>
                        Percentage: <span className="text-blue-700">{percentage.toFixed(2)}%</span>
                    </td>
                </tr>
            </tbody>
            </table>
        </div>

        {/* Result Summary */}
        <div className="grid grid-cols-2 gap-6 mb-8">
            <div className="border border-slate-300 p-4 rounded-lg bg-white shadow-sm">
                <h4 className="text-xs font-bold text-slate-500 uppercase mb-3 border-b pb-1">Final Result</h4>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-xs text-slate-500">Result Status</p>
                        <p className={`text-lg font-bold ${getResultStatus() === 'PASS' ? 'text-green-600' : 'text-red-600'}`}>
                            {getResultStatus()}
                        </p>
                    </div>
                    <div>
                        <p className="text-xs text-slate-500">Overall GPA</p>
                        <p className="text-lg font-bold text-blue-600">{averageGpa.toFixed(2)}</p>
                    </div>
                </div>
            </div>
            <div className="border border-slate-300 p-4 rounded-lg bg-white shadow-sm">
                <h4 className="text-xs font-bold text-slate-500 uppercase mb-2 border-b pb-1">Class Teacher's Remarks</h4>
                <p className="text-sm italic text-slate-700 mt-2">"{getRemarks(averageGpa)}"</p>
            </div>
        </div>

        {/* Grading Scale */}
        <div className="mb-12">
            <p className="text-xs font-bold text-slate-500 uppercase mb-1">Grading Scale</p>
            <div className="flex flex-wrap gap-2 text-[10px] text-slate-600 border-t border-slate-200 pt-2">
                <span className="px-2 py-1 bg-slate-100 rounded">A+ (90-100%)</span>
                <span className="px-2 py-1 bg-slate-100 rounded">A (80-89%)</span>
                <span className="px-2 py-1 bg-slate-100 rounded">B+ (70-79%)</span>
                <span className="px-2 py-1 bg-slate-100 rounded">B (60-69%)</span>
                <span className="px-2 py-1 bg-slate-100 rounded">C (40-59%)</span>
                <span className="px-2 py-1 bg-slate-100 rounded">D (33-39%)</span>
                <span className="px-2 py-1 bg-slate-100 rounded">F (Below 33%)</span>
            </div>
        </div>

        {/* Signatures */}
        <div className="mt-auto grid grid-cols-3 gap-8 items-end">
            <div className="text-center">
                <div className="text-sm font-bold text-slate-900 mb-1">{formatDate(new Date().toISOString())}</div>
                <div className="border-t border-slate-400 pt-1">
                    <p className="text-xs font-bold text-slate-500 uppercase">Date of Issue</p>
                </div>
            </div>
            <div className="text-center">
                <div className="h-10"></div> {/* Space for signature */}
                <div className="border-t border-slate-400 pt-1">
                    <p className="text-xs font-bold text-slate-500 uppercase">Class Teacher</p>
                </div>
            </div>
            <div className="text-center">
                <div className="h-10"></div> {/* Space for signature */}
                <div className="border-t border-slate-400 pt-1">
                    <p className="text-xs font-bold text-slate-500 uppercase">Principal</p>
                </div>
            </div>
        </div>
        
        {/* Footer Note */}
        <div className="text-center mt-6 text-[10px] text-slate-400">
            This report card is computer generated and valid without a signature if accessed via the student portal.
        </div>
      </div>
    </div>
  );
});

ReportCardTemplate.displayName = 'ReportCardTemplate';

export default ReportCardTemplate;
