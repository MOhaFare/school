import React, { useState, useEffect, forwardRef } from 'react';
import { Grade, Student, Exam } from '../../types';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { Select } from '../ui/Select';
import toast from 'react-hot-toast';

interface GradeFormProps {
  grade?: Grade | null;
  students: Student[];
  exams: Exam[];
  onSubmit: (data: { studentId: string; examId: string; marksObtained: number; id?: string }) => void;
}

const GradeForm = forwardRef<HTMLFormElement, GradeFormProps>(({ grade, students, exams, onSubmit }, ref) => {
  const [formData, setFormData] = useState({
    studentId: '',
    examId: '',
    marksObtained: 0,
  });
  const [totalMarks, setTotalMarks] = useState<number | undefined>(100);

  useEffect(() => {
    if (grade) {
      setFormData({
        studentId: grade.studentId,
        examId: grade.examId,
        marksObtained: grade.marksObtained,
      });
      const selectedExam = exams.find(e => e.id === grade.examId);
      setTotalMarks(selectedExam?.totalMarks);
    } else {
      setFormData({
        studentId: students.length > 0 ? students[0].id : '',
        examId: exams.length > 0 ? exams[0].id : '',
        marksObtained: 0,
      });
      if (exams.length > 0) setTotalMarks(exams[0].totalMarks);
    }
  }, [grade, students, exams]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const isNumber = e.target.type === 'number';

    if (name === 'examId') {
      const selectedExam = exams.find(e => e.id === value);
      setTotalMarks(selectedExam?.totalMarks);
    }

    setFormData(prev => ({ ...prev, [name]: isNumber ? parseFloat(value) : value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.studentId) {
        toast.error("Please select a student.");
        return;
    }
    
    if (!formData.examId) {
        toast.error("Please select an exam.");
        return;
    }

    if (totalMarks !== undefined && formData.marksObtained > totalMarks) {
        toast.error(`Marks obtained cannot exceed total marks (${totalMarks}).`);
        return;
    }

    onSubmit({ ...formData, id: grade?.id });
  };

  return (
    <form ref={ref} onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="studentId">Student</Label>
        {students.length > 0 ? (
          <Select id="studentId" name="studentId" value={formData.studentId} onChange={handleChange} required>
            {students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.id})</option>)}
          </Select>
        ) : (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
            No students available. Please add students first.
          </div>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="examId">Exam</Label>
        {exams.length > 0 ? (
          <Select id="examId" name="examId" value={formData.examId} onChange={handleChange} required>
            {exams.map(e => <option key={e.id} value={e.id}>{e.name} - {e.subject} (Class {e.class})</option>)}
          </Select>
        ) : (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
            No exams scheduled. Please schedule an exam first.
          </div>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="marksObtained">Marks Obtained</Label>
        <div className="relative">
          <Input 
            id="marksObtained" 
            name="marksObtained" 
            type="number" 
            min="0"
            max={totalMarks}
            value={formData.marksObtained} 
            onChange={handleChange} 
            required 
          />
          {totalMarks !== undefined && (
            <span className="absolute inset-y-0 right-4 flex items-center text-sm text-gray-500">
              / {totalMarks}
            </span>
          )}
        </div>
      </div>
      <button type="submit" className="hidden">Submit</button>
    </form>
  );
});

GradeForm.displayName = 'GradeForm';

export default GradeForm;
