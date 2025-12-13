import React, { useState, useRef, useEffect } from 'react';
import { Award, Printer } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { supabase } from '../lib/supabaseClient';
import { Select } from '../components/ui/Select';
import { useReactToPrint } from 'react-to-print';
import Logo from '../components/ui/Logo';
import { useGlobal } from '../context/GlobalContext';

const Certificates: React.FC = () => {
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [certType, setCertType] = useState('Completion');
  const componentRef = useRef<HTMLDivElement>(null);
  const { schoolName } = useGlobal();

  useEffect(() => {
    const fetchStudents = async () => {
      const { data } = await supabase.from('students').select('id, name, class, section').order('name');
      if (data) setStudents(data);
    };
    fetchStudents();
  }, []);

  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    documentTitle: 'Certificate',
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
          <div className="border-2 border-dashed border-slate-300 p-8 bg-slate-50 flex justify-center">
            <div ref={componentRef} className="w-[800px] h-[600px] bg-white border-[10px] border-double border-blue-900 p-12 flex flex-col items-center text-center relative print:break-inside-avoid">
              <div className="absolute top-8 left-8 opacity-10"><Logo className="scale-[2]" /></div>
              <div className="absolute bottom-8 right-8 opacity-10"><Logo className="scale-[2]" /></div>
              
              <Logo className="scale-150 mb-6" />
              <h1 className="text-4xl font-serif font-bold text-blue-900 uppercase tracking-widest mb-2">{schoolName}</h1>
              <p className="text-slate-500 italic mb-12">Excellence in Education</p>

              <h2 className="text-3xl font-serif font-bold text-yellow-600 mb-8 uppercase border-b-2 border-yellow-600 pb-2 px-8">{certType}</h2>

              <p className="text-lg text-slate-700 mb-4">This is to certify that</p>
              <h3 className="text-4xl font-script font-bold text-slate-900 mb-4 italic">{student.name}</h3>
              <p className="text-lg text-slate-700 mb-8 max-w-lg">
                has successfully completed the academic requirements for <strong>Class {student.class}</strong> during the academic year 2024-2025.
              </p>

              <div className="mt-auto flex justify-between w-full px-12">
                <div className="text-center">
                  <p className="text-lg font-bold text-slate-900">{new Date().toLocaleDateString()}</p>
                  <div className="w-40 h-px bg-slate-900 mt-1"></div>
                  <p className="text-sm text-slate-500 mt-1">Date</p>
                </div>
                <div className="text-center">
                  <div className="h-8"></div> {/* Signature Space */}
                  <div className="w-40 h-px bg-slate-900 mt-1"></div>
                  <p className="text-sm text-slate-500 mt-1">Principal Signature</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-slate-400">
            <Award size={48} className="mx-auto mb-4 opacity-50" />
            <p>Select a student to preview the certificate</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Certificates;
