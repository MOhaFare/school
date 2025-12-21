import React, { useState, useEffect, forwardRef, useMemo } from 'react';
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
        studentId: grade.student_id, // Fix: use snake_case from prop if that's what's passed, or camelCase if transformed. 
        // The parent passes transformed data, let's check Grades.tsx. 
        // Grades.tsx passes `grade` which is `Grade` type. 
        // `Grade` type has `student_id` (snake_case) based on previous context, but let's be safe.
        // Actually `transformGradeToCamelCase` uses `student_id`.
        // Let's stick to the state structure.
        examId: grade.exam_id,
        marksObtained: grade.marks_obtained,
      });
      const selectedExam = exams.find(e => e.id === grade.exam_id);
      setTotalMarks(selectedExam?.totalMarks);
    } else {
      // Default state
      setFormData({
        studentId: '',
        examId: '',
        marksObtained: 0,
      });
    }
  }, [grade, exams]); // Removed students from dependency to prevent reset on list change

  // Filter students based on selected Exam
  const availableStudents = useMemo(() => {
    if (!formData.examId) return [];
    
    const selectedExam = exams.find(e => e.id === formData.examId);
    if (!selectedExam) return [];

    // Filter students matching the exam's class
    return students.filter(s => s.class === selectedExam.class).sort((a, b) => a.name.localeCompare(b.name));
  }, [formData.examId, students, exams]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const isNumber = e.target.type === 'number';

    if (name === 'examId') {
      const selectedExam = exams.find(e => e.id === value);
      setTotalMarks(selectedExam?.totalMarks);
      // Reset student when exam changes (unless in edit mode and class matches)
      if (!grade) {
        setFormData(prev => ({ ...prev, studentId: '', [name]: value }));
        return;
      }
    }

    setFormData(prev => ({ ...prev, [name]: isNumber ? parseFloat(value) : value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.examId) {
        toast.error("Please select an exam first.");
        return;
    }

    if (!formData.studentId) {
        toast.error("Please select a student.");
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
        <Label htmlFor="examId">Exam</Label>
        {exams.length > 0 ? (
          <Select id="examId" name="examId" value={formData.examId} onChange={handleChange} required disabled={!!grade}>
            <option value="">-- Select Exam --</option>
            {exams.map(e => (
              <option key={e.id} value={e.id}>
                {e.name} - {e.subject} (Class {e.class})
              </option>
            ))}
          </Select>
        ) : (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
            No exams scheduled. Please schedule an exam first.
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="studentId">Student</Label>
        <Select 
            id="studentId" 
            name="studentId" 
            value={formData.studentId} 
            onChange={handleChange} 
            required 
            disabled={!formData.examId || !!grade}
        >
            <option value="">
                {!formData.examId ? "-- Select an Exam First --" : "-- Select Student --"}
            </option>
            {availableStudents.map(s => (
                <option key={s.id} value={s.id}>
                    {s.name} (Roll: {s.rollNumber}, Sec: {s.section})
                </option>
            ))}
        </Select>
        {formData.examId && availableStudents.length === 0 && (
            <p className="text-xs text-red-500 mt-1">
                No active students found in the class for this exam.
            </p>
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
