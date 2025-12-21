import React, { useState, useRef, useEffect } from 'react';
import { Award, Printer } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { supabase } from '../lib/supabaseClient';
import { Select } from '../components/ui/Select';
import { useReactToPrint } from 'react-to-print';
import Logo from '../components/ui/Logo';
import { useGlobal } from '../context/GlobalContext';

const Certificates: React.FC = () => {
  const { profile, schoolName, schoolLogo, academicYear } = useGlobal();
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [certType, setCertType] = useState('Certificate of Completion');
  const componentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchStudents = async () => {
      if (!profile?.school_id) return;

      const { data } = await supabase
        .from('students')
        .select('id, name, class, section')
        .eq('school_id', profile.school_id)
        .eq('status', 'active')
        .order('name');
        
      if (data) setStudents(data);
    };
    fetchStudents();
  }, [profile]);

  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    documentTitle: 'Certificate',
    pageStyle: `
      @page { size: landscape; margin: 0; }
      @media print {
        body { -webkit-print-color-adjust: exact; }
      }
    `
  });

  const student = students.find(s => s.id === selectedStudent);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Certificates</h1>
          <p className="text-slate-500">Generate and print student certificates</p>
        </div>
        <Button onClick={handlePrint} disabled={!selectedStudent}>
          <Printer size={20} className="mr-2" /> Print Certificate
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Student</label>
            <Select value={selectedStudent} onChange={e => setSelectedStudent(e.target.value)}>
              <option value="">-- Select --</option>
              {students.map(s => <option key={s.id} value={s.id}>{s.name} (Class {s.class}-{s.section})</option>)}
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Certificate Type</label>
            <Select value={certType} onChange={e => setCertType(e.target.value)}>
              <option>Certificate of Completion</option>
              <option>Certificate of Excellence</option>
              <option>Character Certificate</option>
            </Select>
          </div>
        </div>

        {student ? (
          <div className="border-2 border-dashed border-slate-300 p-4 bg-slate-50 flex justify-center overflow-auto">
            <div ref={componentRef} className="w-[297mm] h-[210mm] bg-white border-[12px] border-double border-blue-900 p-16 flex flex-col items-center text-center relative print:break-inside-avoid shadow-xl mx-auto">
              
              {/* Watermark */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.05] z-0">
                 {schoolLogo ? <img src={schoolLogo} className="w-[500px] h-[500px] object-contain grayscale" /> : <Logo className="scale-[10]" />}
              </div>

              {/* Corner Decorations */}
              <div className="absolute top-4 left-4 w-16 h-16 border-t-4 border-l-4 border-yellow-500"></div>
              <div className="absolute top-4 right-4 w-16 h-16 border-t-4 border-r-4 border-yellow-500"></div>
              <div className="absolute bottom-4 left-4 w-16 h-16 border-b-4 border-l-4 border-yellow-500"></div>
              <div className="absolute bottom-4 right-4 w-16 h-16 border-b-4 border-r-4 border-yellow-500"></div>

              <div className="relative z-10 w-full flex flex-col items-center h-full">
                  {/* Header Logo */}
                  <div className="mb-6">
                    {schoolLogo ? (
                        <img src={schoolLogo} alt="School Logo" className="h-28 w-28 object-contain" />
                    ) : (
                        <Logo className="scale-[2]" />
                    )}
                  </div>
                  
                  <h1 className="text-5xl font-serif font-bold text-blue-900 uppercase tracking-widest mb-2">{schoolName}</h1>
                  <p className="text-slate-500 italic mb-10 text-lg">Excellence in Education</p>

                  <h2 className="text-4xl font-serif font-bold text-yellow-600 mb-12 uppercase border-b-2 border-yellow-600 pb-2 px-12">{certType}</h2>

                  <div className="flex-grow flex flex-col justify-center w-full">
                      <p className="text-2xl text-slate-600 mb-8 font-serif italic">This is to certify that</p>
                      
                      <h3 className="text-6xl font-serif font-bold text-slate-900 mb-8 italic px-12 py-2">
                        {student.name}
                      </h3>
                      
                      <p className="text-2xl text-slate-700 max-w-4xl mx-auto leading-relaxed font-serif">
                        has successfully completed the academic requirements for <br/>
                        <span className="font-bold text-blue-900 text-3xl mx-2">Class {student.class}</span> <br/>
                        during the academic year <strong>{academicYear}</strong>.
                      </p>
                  </div>

                  <div className="mt-auto flex justify-between w-full px-20 pt-16">
                    <div className="text-center">
                      <p className="text-xl font-bold text-slate-900">{new Date().toLocaleDateString()}</p>
                      <div className="w-64 h-0.5 bg-slate-900 mt-2"></div>
                      <p className="text-lg text-slate-500 mt-2 font-serif font-bold">Date</p>
                    </div>
                    <div className="text-center">
                      <div className="h-7"></div> {/* Signature Space */}
                      <div className="w-64 h-0.5 bg-slate-900 mt-2"></div>
                      <p className="text-lg text-slate-500 mt-2 font-serif font-bold">Principal Signature</p>
                    </div>
                  </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-20 text-slate-400 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
            <Award size={64} className="mx-auto mb-4 opacity-50" />
            <p className="text-lg">Select a student to generate their certificate</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Certificates;
