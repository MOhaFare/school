import React from 'react';
import { Student, Teacher } from '../types';
import Logo from './ui/Logo';

interface IdCardProps {
  person: Student | Teacher;
  type: 'Student' | 'Teacher';
  schoolName: string;
  schoolLogo?: string | null;
}

const Barcode: React.FC = () => (
  <div className="flex items-end h-8 space-x-px">
    {[...Array(50)].map((_, i) => (
      <div
        key={i}
        className="bg-white"
        style={{
          width: '1.5px',
          height: `${Math.random() * 70 + 30}%`,
        }}
      />
    ))}
  </div>
);

/**
 * Generates a deterministic 6-digit numeric string from a UUID.
 * @param uuid The UUID string.
 * @returns A 6-digit string.
 */
const getNumericId = (uuid: string): string => {
  if (!uuid) return '000000';
  let hash = 0;
  for (let i = 0; i < uuid.length; i++) {
    const char = uuid.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  const numericId = Math.abs(hash) % 1000000;
  return String(numericId).padStart(6, '0');
};


const IdCard = React.forwardRef<HTMLDivElement, IdCardProps>(({ person, type, schoolName, schoolLogo }, ref) => {
  const isStudent = type === 'Student';
  const studentData = person as Student;
  const displayId = getNumericId(person.id);

  const theme = {
    student: {
      bg: 'bg-[#1a233c]',
      panelBg: 'bg-orange-500',
      accentText: 'text-orange-500',
      avatarText: 'text-[#1a233c]',
    },
    teacher: {
      bg: 'bg-gray-800',
      panelBg: 'bg-teal-600',
      accentText: 'text-teal-500',
      avatarText: 'text-gray-800',
    }
  };

  const activeTheme = isStudent ? theme.student : theme.teacher;

  return (
    <div ref={ref} className={`w-[512px] h-[300px] ${activeTheme.bg} rounded-2xl shadow-lg flex font-sans overflow-hidden`}>
      {/* Left Part */}
      <div className={`w-2/5 ${activeTheme.panelBg} p-5 flex flex-col justify-between items-center relative`}>
        {/* Angled edge effect */}
        <div className={`absolute top-0 right-0 h-full w-16 ${activeTheme.panelBg} transform -skew-x-12 -translate-x-8`}></div>
        
        <div className="relative z-10 self-start flex items-center gap-2 text-white">
          <div className="bg-white/20 p-1.5 rounded-md">
            {schoolLogo ? (
                <img src={schoolLogo} alt="Logo" className="h-8 w-8 object-contain" />
            ) : (
                <Logo className="!text-white" />
            )}
          </div>
          <div>
            <h1 className="font-bold text-xs leading-tight uppercase" style={{ maxWidth: '100px' }}>{schoolName}</h1>
          </div>
        </div>

        <div className={`relative z-10 w-32 h-32 rounded-full border-4 border-white bg-gray-200 flex items-center justify-center overflow-hidden`}>
          {person.avatar ? (
            <img src={person.avatar} alt={person.name} className="w-full h-full object-cover" />
          ) : (
            <span className={`text-6xl font-bold ${activeTheme.avatarText} uppercase`}>
              {person.name.charAt(0)}
            </span>
          )}
        </div>
        
        <div className="relative z-10 h-8 text-center">
           {/* Shift removed */}
        </div>
      </div>

      {/* Right Part */}
      <div className="w-3/5 p-5 flex flex-col text-white">
        <div className="text-right">
            <p className={`font-bold text-lg ${activeTheme.accentText} tracking-widest`}>{isStudent ? 'STUDENT' : 'TEACHER'}</p>
        </div>

        <div className="flex-grow flex flex-col justify-center mt-2">
          <h2 className="text-3xl font-extrabold leading-tight uppercase">{person.name.split(' ')[0]}</h2>
          <h2 className="text-3xl font-extrabold leading-tight uppercase">{person.name.split(' ').slice(1).join(' ')}</h2>
          
          <div className="mt-6 space-y-2 text-sm">
              <div className="grid grid-cols-3">
                  <p className="font-semibold text-gray-300 col-span-1">ID No.</p>
                  <p className="font-medium col-span-2">{displayId}</p>
              </div>
              <div className="grid grid-cols-3">
                  <p className="font-semibold text-gray-300 col-span-1">{isStudent ? 'Class' : 'Subject'}</p>
                  <p className="font-medium col-span-2">{isStudent ? `${studentData.class}-${studentData.section}` : (person as Teacher).subject}</p>
              </div>
              <div className="grid grid-cols-3">
                  <p className="font-semibold text-gray-300 col-span-1">D.O.B.</p>
                  <p className="font-medium col-span-2">{person.dob}</p>
              </div>
          </div>
        </div>

        <div className="mt-auto flex justify-between items-end">
            <div className="text-xs text-gray-400">
                <p>Issued: {person.issuedDate}</p>
                <p>Expires: {person.expiryDate}</p>
            </div>
            <div className="flex flex-col items-center">
                <Barcode />
                <p className="text-[8px] tracking-widest text-gray-400 mt-1">{displayId}</p>
            </div>
        </div>
      </div>
    </div>
  );
});

IdCard.displayName = 'IdCard';

export default IdCard;
