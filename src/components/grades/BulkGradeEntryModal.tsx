import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { Student, Exam } from '../../types';
import toast from 'react-hot-toast';
import { Search, Save, AlertCircle, Loader } from 'lucide-react';
import { useGlobal } from '../../context/GlobalContext';

interface BulkGradeEntryModalProps {
  onClose: () => void;
  onSuccess: () => void;
  initialExamId?: string;
}

const BulkGradeEntryModal: React.FC<BulkGradeEntryModalProps> = ({ onClose, onSuccess, initialExamId }) => {
  const { profile } = useGlobal();
  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string>(initialExamId || '');
  const [students, setStudents] = useState<Student[]>([]);
  const [marks, setMarks] = useState<Record<string, string>>({}); // studentId -> marks
  const [existingGrades, setExistingGrades] = useState<Record<string, string>>({}); // studentId -> gradeId
  
  const [loadingExams, setLoadingExams] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch Exams on mount
  useEffect(() => {
    const fetchExams = async () => {
      try {
        const { data, error } = await supabase
          .from('exams')
          .select('*')
          .neq('status', 'completed') // Only show upcoming or ongoing exams
          .order('date', { ascending: false });
        
        if (error) throw error;
        
        const mappedExams = data.map((e: any) => ({
            id: e.id,
            name: e.name,
            subject: e.subject,
            class: e.class,
            totalMarks: e.total_marks,
            passingMarks: e.passing_marks,
            date: e.date,
        } as Exam));

        setExams(mappedExams);
      } catch (error) {
        toast.error('Failed to load exams');
      } finally {
        setLoadingExams(false);
      }
    };
    fetchExams();
  }, []);

  // Fetch Students and Existing Grades when Exam changes
  useEffect(() => {
    if (!selectedExamId) {
      setStudents([]);
      setMarks({});
      return;
    }

    const fetchData = async () => {
      setLoadingStudents(true);
      try {
        const exam = exams.find(e => e.id === selectedExamId);
        if (!exam) return;

        // 1. Fetch Students in Exam Class
        const { data: studentsData, error: studentsError } = await supabase
          .from('students')
          .select('*')
          .eq('class', exam.class)
          .eq('status', 'active')
          .order('name');

        if (studentsError) throw studentsError;

        // 2. Fetch Existing Grades for this Exam
        const { data: gradesData, error: gradesError } = await supabase
          .from('grades')
          .select('id, student_id, marks_obtained')
          .eq('exam_id', selectedExamId);

        if (gradesError) throw gradesError;

        // Map Students
        const mappedStudents = studentsData.map((s: any) => ({
            id: s.id,
            name: s.name,
            rollNumber: s.roll_number,
            class: s.class,
            section: s.section,
            avatar: s.avatar
        } as Student));

        setStudents(mappedStudents);

        // Pre-fill Marks
        const marksMap: Record<string, string> = {};
        const gradeIdMap: Record<string, string> = {};
        
        gradesData.forEach((g: any) => {
            marksMap[g.student_id] = g.marks_obtained.toString();
            gradeIdMap[g.student_id] = g.id;
        });

        setMarks(marksMap);
        setExistingGrades(gradeIdMap);

      } catch (error: any) {
        toast.error(`Error loading data: ${error.message}`);
      } finally {
        setLoadingStudents(false);
      }
    };

    fetchData();
  }, [selectedExamId, exams]);

  const handleMarkChange = (studentId: string, value: string) => {
    setMarks(prev => ({ ...prev, [studentId]: value }));
  };

  const calculateGrade = (marks: number, total: number) => {
    const percentage = (marks / total) * 100;
    let gpa = 0.0;
    let grade = 'F';

    if (percentage >= 90) { gpa = 4.0; grade = 'A+'; }
    else if (percentage >= 80) { gpa = 3.5; grade = 'A'; }
    else if (percentage >= 70) { gpa = 3.0; grade = 'B+'; }
    else if (percentage >= 60) { gpa = 2.5; grade = 'B'; }
    else if (percentage >= 50) { gpa = 2.0; grade = 'C+'; }
    else if (percentage >= 40) { gpa = 1.5; grade = 'C'; }
    else if (percentage >= 33) { gpa = 1.0; grade = 'D'; }

    return { percentage: parseFloat(percentage.toFixed(2)), gpa, grade };
  };

  const handleSave = async () => {
    const exam = exams.find(e => e.id === selectedExamId);
    if (!exam) return;

    setSaving(true);
    const updates: any[] = [];
    const inserts: any[] = [];

    Object.entries(marks).forEach(([studentId, markStr]) => {
      const mark = parseFloat(markStr);
      if (isNaN(mark)) return; // Skip empty or invalid

      if (mark > exam.totalMarks) {
         return; 
      }

      const { percentage, gpa, grade } = calculateGrade(mark, exam.totalMarks);
      const gradeId = existingGrades[studentId];

      const payload = {
        student_id: studentId,
        exam_id: selectedExamId,
        marks_obtained: mark,
        percentage,
        gpa,
        grade,
        date: exam.date,
        school_id: profile?.school_id // Explicitly add school_id
      };

      if (gradeId) {
        updates.push({ ...payload, id: gradeId });
      } else {
        inserts.push(payload);
      }
    });

    try {
      if (updates.length > 0) {
        const { error } = await supabase.from('grades').upsert(updates);
        if (error) throw error;
      }
      if (inserts.length > 0) {
        const { error } = await supabase.from('grades').insert(inserts);
        if (error) throw error;
      }

      toast.success(`Successfully saved grades for ${updates.length + inserts.length} students.`);
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(`Failed to save grades: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.rollNumber.includes(searchTerm)
  );

  const selectedExamObj = exams.find(e => e.id === selectedExamId);

  return (
    <div className="space-y-6 h-full flex flex-col">
      {/* Header Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Select Exam</Label>
          <Select 
            value={selectedExamId} 
            onChange={e => setSelectedExamId(e.target.value)}
            disabled={loadingExams}
          >
            <option value="">-- Choose Exam --</option>
            {exams.map(e => (
              <option key={e.id} value={e.id}>
                {e.name} - {e.subject} (Class {e.class})
              </option>
            ))}
          </Select>
        </div>
        
        {selectedExamId && (
          <div className="space-y-2">
            <Label>Search Student</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <Input 
                value={searchTerm} 
                onChange={e => setSearchTerm(e.target.value)} 
                placeholder="Name or Roll No..." 
                className="pl-10"
              />
            </div>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-grow overflow-hidden border border-slate-200 rounded-lg bg-slate-50 relative">
        {!selectedExamId ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400">
            <AlertCircle size={48} className="mb-4 opacity-50" />
            <p>Please select an exam to start entering grades.</p>
          </div>
        ) : loadingStudents ? (
          <div className="flex items-center justify-center h-64">
            <Loader className="animate-spin text-blue-600" size={32} />
          </div>
        ) : students.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-500">
            <p>No active students found in Class {selectedExamObj?.class}.</p>
          </div>
        ) : (
          <div className="absolute inset-0 overflow-auto">
            <table className="min-w-full divide-y divide-slate-200 bg-white">
              <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-20">Roll No</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Student Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-40">Marks (Max: {selectedExamObj?.totalMarks})</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-32">Grade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredStudents.map(student => {
                  const currentMark = parseFloat(marks[student.id] || '0');
                  const { grade } = calculateGrade(currentMark, selectedExamObj?.totalMarks || 100);
                  const isInvalid = currentMark > (selectedExamObj?.totalMarks || 100);

                  return (
                    <tr key={student.id} className="hover:bg-slate-50">
                      <td className="px-6 py-3 text-sm text-slate-600 font-mono">{student.rollNumber}</td>
                      <td className="px-6 py-3">
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500 mr-3">
                            {student.avatar ? <img src={student.avatar} className="w-full h-full object-cover rounded-full"/> : student.name.charAt(0)}
                          </div>
                          <span className="text-sm font-medium text-slate-900">{student.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-3">
                        <Input 
                          type="number" 
                          min="0" 
                          max={selectedExamObj?.totalMarks} 
                          value={marks[student.id] || ''} 
                          onChange={e => handleMarkChange(student.id, e.target.value)}
                          className={`h-9 ${isInvalid ? 'border-red-500 focus:ring-red-500' : ''}`}
                          placeholder="0"
                        />
                      </td>
                      <td className="px-6 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          grade === 'F' ? 'bg-red-100 text-red-800' : 
                          grade.startsWith('A') ? 'bg-green-100 text-green-800' : 
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {marks[student.id] ? grade : '-'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} loading={saving} disabled={!selectedExamId || students.length === 0}>
          <Save size={18} className="mr-2" /> Save All Grades
        </Button>
      </div>
    </div>
  );
};

export default BulkGradeEntryModal;
