import React, { useState, useRef, useEffect } from 'react';
import { Printer, Settings, Layout, Type, Image as ImageIcon, Palette } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import { Student, Exam } from '../types';
import AdmitCard from '../components/exams/AdmitCard';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { supabase } from '../lib/supabaseClient';
import toast from 'react-hot-toast';
import { useGlobal } from '../context/GlobalContext';
import { Skeleton } from '../components/ui/Skeleton';

const AdmitCardDesign: React.FC = () => {
  const { schoolName } = useGlobal();
  const [loading, setLoading] = useState(true);
  
  // Data State
  const [exams, setExams] = useState<Exam[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  
  // Selection State
  const [selectedExamId, setSelectedExamId] = useState<string>('');
  
  // Template State
  const [template, setTemplate] = useState({
    title: 'ADMIT CARD',
    showPhoto: true,
    showSchoolName: true,
    showBorder: true,
    footerText: 'Principal Signature',
    themeColor: 'blue'
  });

  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const { data: examsData } = await supabase.from('exams').select('*').order('date', { ascending: false });
        if (examsData) {
            setExams(examsData.map((e: any) => ({
                id: e.id,
                name: e.name,
                subject: e.subject,
                class: e.class,
                date: e.date,
                duration: e.duration,
                totalMarks: e.total_marks,
                passingMarks: e.passing_marks,
                status: e.status
            })));
            if (examsData.length > 0) setSelectedExamId(examsData[0].id);
        }
      } catch (error) {
        toast.error('Failed to load exams');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (!selectedExamId) return;

    const fetchStudents = async () => {
      const exam = exams.find(e => e.id === selectedExamId);
      if (!exam) return;

      const { data } = await supabase
        .from('students')
        .select('*')
        .eq('class', exam.class)
        .eq('status', 'active')
        .limit(5); // Limit for preview purposes
      
      if (data) {
        setStudents(data.map((s: any) => ({
            id: s.id,
            name: s.name,
            email: s.email,
            class: s.class,
            section: s.section,
            rollNumber: s.roll_number,
            phone: s.phone,
            enrollmentDate: s.enrollment_date,
            issuedDate: s.issued_date,
            expiryDate: s.expiry_date,
            dob: s.dob,
            status: s.status,
            grade: s.grade,
            avatar: s.avatar
        })));
      }
    };
    fetchStudents();
  }, [selectedExamId, exams]);

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: 'Admit Cards',
    onBeforeGetContent: () => {
      if (!printRef.current) {
        toast.error("Content not ready for printing");
        return Promise.reject();
      }
    }
  });

  const selectedExam = exams.find(e => e.id === selectedExamId);
  const previewStudent = students[0];

  if (loading) return <div className="p-8"><Skeleton className="h-96 w-full" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Design Admit Card</h1>
          <p className="text-slate-500 mt-1">Customize and generate admit cards for examinations</p>
        </div>
        <Button onClick={handlePrint} disabled={!selectedExam || students.length === 0}>
          <Printer size={20} className="mr-2" /> Generate & Print
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Settings Panel */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
              <Settings size={20} className="mr-2 text-slate-500" /> Configuration
            </h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Select Exam</Label>
                <Select value={selectedExamId} onChange={e => setSelectedExamId(e.target.value)}>
                  {exams.map(e => (
                    <option key={e.id} value={e.id}>{e.name} - {e.subject} (Class {e.class})</option>
                  ))}
                </Select>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <h4 className="text-sm font-medium text-slate-700 mb-3 flex items-center">
                  <Type size={16} className="mr-2" /> Content
                </h4>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Header Title</Label>
                    <Input 
                      value={template.title} 
                      onChange={e => setTemplate({...template, title: e.target.value})} 
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Footer Text</Label>
                    <Input 
                      value={template.footerText} 
                      onChange={e => setTemplate({...template, footerText: e.target.value})} 
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <h4 className="text-sm font-medium text-slate-700 mb-3 flex items-center">
                  <Layout size={16} className="mr-2" /> Layout
                </h4>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={template.showSchoolName} 
                      onChange={e => setTemplate({...template, showSchoolName: e.target.checked})}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-slate-600">Show School Name</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={template.showPhoto} 
                      onChange={e => setTemplate({...template, showPhoto: e.target.checked})}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-slate-600">Show Student Photo</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={template.showBorder} 
                      onChange={e => setTemplate({...template, showBorder: e.target.checked})}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-slate-600">Show Border</span>
                  </label>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <h4 className="text-sm font-medium text-slate-700 mb-3 flex items-center">
                  <Palette size={16} className="mr-2" /> Theme
                </h4>
                <div className="flex gap-3">
                  {['blue', 'red', 'green', 'black'].map(color => (
                    <button
                      key={color}
                      onClick={() => setTemplate({...template, themeColor: color})}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${template.themeColor === color ? 'border-slate-900 scale-110' : 'border-transparent hover:scale-105'}`}
                      style={{ backgroundColor: color }}
                      title={color.charAt(0).toUpperCase() + color.slice(1)}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Preview Panel */}
        <div className="lg:col-span-2">
          <div className="bg-slate-100 rounded-xl border border-slate-200 p-8 flex items-center justify-center min-h-[600px] overflow-auto">
            {selectedExam && previewStudent ? (
              <div className="scale-90 origin-top">
                <AdmitCard 
                  student={previewStudent} 
                  exam={selectedExam} 
                  schoolName={schoolName}
                  template={template}
                />
              </div>
            ) : (
              <div className="text-center text-slate-400">
                <ImageIcon size={48} className="mx-auto mb-4 opacity-50" />
                <p>Select an exam to preview admit card</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Hidden Print Container */}
      <div style={{ display: 'none' }}>
        <div ref={printRef} className="print-container">
          {selectedExam && students.map(student => (
            <div key={student.id} className="break-after-page p-4">
              <AdmitCard 
                student={student} 
                exam={selectedExam} 
                schoolName={schoolName}
                template={template}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdmitCardDesign;
