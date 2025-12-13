import React from 'react';
import { Student, Exam } from '../../types';
import Logo from '../ui/Logo';

interface AdmitCardTemplate {
  title: string;
  showPhoto: boolean;
  showSchoolName: boolean;
  showBorder: boolean;
  footerText: string;
  themeColor: string;
}

interface AdmitCardProps {
  student: Student;
  exam: Exam;
  schoolName: string;
  template?: AdmitCardTemplate;
}

const AdmitCard = React.forwardRef<HTMLDivElement, AdmitCardProps>(({ 
  student, 
  exam, 
  schoolName,
  template = {
    title: 'ADMIT CARD',
    showPhoto: true,
    showSchoolName: true,
    showBorder: true,
    footerText: 'Principal Signature',
    themeColor: 'blue'
  }
}, ref) => {
  
  const themeColors: Record<string, string> = {
    blue: 'border-blue-900 text-blue-900',
    red: 'border-red-900 text-red-900',
    green: 'border-green-900 text-green-900',
    black: 'border-gray-900 text-gray-900',
  };

  const colorClass = themeColors[template.themeColor] || themeColors.blue;
  const bgHeader = template.themeColor === 'black' ? 'bg-gray-900' : `bg-${template.themeColor}-900`;

  return (
    <div ref={ref} className={`w-[500px] h-[300px] bg-white p-6 relative flex flex-col font-sans text-gray-900 print:break-inside-avoid mb-8 mx-auto ${template.showBorder ? `border-2 ${colorClass.split(' ')[0]}` : ''}`}>
      {/* Header */}
      <div className={`flex items-center border-b-2 ${colorClass.split(' ')[0]} pb-3 mb-3`}>
        <div className="w-16">
          <Logo />
        </div>
        <div className="flex-1 text-center">
          {template.showSchoolName && (
            <h1 className="text-xl font-bold uppercase tracking-wider">{schoolName}</h1>
          )}
          <h2 className={`text-sm font-semibold text-white inline-block px-3 py-0.5 mt-1 rounded-sm uppercase`} style={{ backgroundColor: template.themeColor === 'black' ? '#111827' : undefined, filter: template.themeColor !== 'black' ? 'brightness(0.8)' : undefined }}>
             {/* Fallback style for dynamic colors since Tailwind arbitrary values need compilation */}
             <span className={template.themeColor === 'blue' ? 'bg-blue-900' : template.themeColor === 'red' ? 'bg-red-900' : template.themeColor === 'green' ? 'bg-green-900' : ''}>
               {template.title}
             </span>
          </h2>
        </div>
        <div className="w-16 flex justify-end">
           {template.showPhoto && (
            <div className="w-16 h-20 border border-gray-300 bg-gray-50 flex items-center justify-center text-xs text-gray-400 overflow-hidden">
              {student.avatar ? (
                <img src={student.avatar} alt="Photo" className="w-full h-full object-cover" />
              ) : (
                "PHOTO"
              )}
            </div>
           )}
        </div>
      </div>

      {/* Exam Details */}
      <div className="mb-4 text-center">
        <h3 className={`text-lg font-bold uppercase ${colorClass.split(' ')[1]}`}>{exam.name}</h3>
        <p className="text-sm font-medium text-gray-600">{exam.date} | {exam.duration}</p>
      </div>

      {/* Student Details */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm flex-grow">
        <div className="flex">
          <span className="font-bold w-24">Name:</span>
          <span className="border-b border-gray-400 flex-1 truncate">{student.name}</span>
        </div>
        <div className="flex">
          <span className="font-bold w-24">Roll No:</span>
          <span className="border-b border-gray-400 flex-1">{student.rollNumber}</span>
        </div>
        <div className="flex">
          <span className="font-bold w-24">Class:</span>
          <span className="border-b border-gray-400 flex-1">{student.class} - {student.section}</span>
        </div>
        <div className="flex">
          <span className="font-bold w-24">Subject:</span>
          <span className="border-b border-gray-400 flex-1 truncate">{exam.subject}</span>
        </div>
      </div>

      {/* Footer / Signatures */}
      <div className="mt-auto pt-4 flex justify-between items-end">
        <div className="text-center">
          <div className="w-32 border-b border-gray-400 mb-1"></div>
          <p className="text-xs font-bold text-gray-500">Student Signature</p>
        </div>
        <div className="text-center">
          <div className="w-32 border-b border-gray-400 mb-1"></div>
          <p className="text-xs font-bold text-gray-500">{template.footerText}</p>
        </div>
      </div>
      
      {/* Watermark */}
      <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none z-0">
        <Logo className="scale-[5]" />
      </div>
    </div>
  );
});

AdmitCard.displayName = 'AdmitCard';

export default AdmitCard;
