import React from 'react';
import { Grade } from '../../types';
import Logo from '../ui/Logo';

interface ResultSlipProps {
  grade: Grade & { studentName: string; examName: string; subject: string; total_marks: number };
  schoolName: string;
}

const ResultSlip = React.forwardRef<HTMLDivElement, ResultSlipProps>(({ grade, schoolName }, ref) => {
  return (
    <div ref={ref} className="w-[600px] bg-white border-2 border-gray-800 p-8 font-sans text-gray-900 mx-auto my-4 print:break-inside-avoid">
      {/* Header */}
      <div className="flex items-center border-b-2 border-gray-800 pb-4 mb-6">
        <div className="w-20">
          <Logo />
        </div>
        <div className="flex-1 text-center">
          <h1 className="text-2xl font-bold uppercase tracking-wider">{schoolName}</h1>
          <p className="text-sm text-gray-600 font-medium mt-1">OFFICIAL RESULT SLIP</p>
        </div>
        <div className="w-20 text-right">
          <div className="inline-block border-2 border-gray-800 px-2 py-1 font-bold text-xl">
            {grade.grade}
          </div>
        </div>
      </div>

      {/* Student & Exam Info */}
      <div className="bg-gray-50 p-4 rounded-sm mb-6 border border-gray-200">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500 font-semibold">Student Name:</span>
            <p className="font-bold text-lg">{grade.studentName}</p>
          </div>
          <div className="text-right">
            <span className="text-gray-500 font-semibold">Date:</span>
            <p className="font-medium">{grade.date}</p>
          </div>
          <div>
            <span className="text-gray-500 font-semibold">Exam:</span>
            <p className="font-medium">{grade.examName}</p>
          </div>
          <div className="text-right">
            <span className="text-gray-500 font-semibold">Subject:</span>
            <p className="font-medium">{grade.subject}</p>
          </div>
        </div>
      </div>

      {/* Marks Table */}
      <div className="mb-8">
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-4 py-2 text-left text-sm font-bold">Metric</th>
              <th className="border border-gray-300 px-4 py-2 text-right text-sm font-bold">Value</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-gray-300 px-4 py-2 text-sm">Marks Obtained</td>
              <td className="border border-gray-300 px-4 py-2 text-right text-sm font-medium">{grade.marks_obtained}</td>
            </tr>
            <tr>
              <td className="border border-gray-300 px-4 py-2 text-sm">Total Marks</td>
              <td className="border border-gray-300 px-4 py-2 text-right text-sm font-medium">{grade.total_marks}</td>
            </tr>
            <tr>
              <td className="border border-gray-300 px-4 py-2 text-sm">Percentage</td>
              <td className="border border-gray-300 px-4 py-2 text-right text-sm font-medium">{grade.percentage.toFixed(2)}%</td>
            </tr>
            <tr className="bg-gray-50">
              <td className="border border-gray-300 px-4 py-2 text-sm font-bold">GPA</td>
              <td className="border border-gray-300 px-4 py-2 text-right text-sm font-bold">{grade.gpa.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Remarks & Signature */}
      <div className="flex justify-between items-end mt-12">
        <div className="text-xs text-gray-500 italic max-w-[60%]">
          This is a computer-generated document. No signature is required.
          <br />
          Generated on {new Date().toLocaleDateString()}.
        </div>
        <div className="text-center">
          <div className="w-40 border-b border-gray-400 mb-1"></div>
          <p className="text-xs font-bold text-gray-500 uppercase">Principal / Controller</p>
        </div>
      </div>
    </div>
  );
});

ResultSlip.displayName = 'ResultSlip';

export default ResultSlip;
