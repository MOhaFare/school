import React, { useState, useEffect, forwardRef } from 'react';
import { Exam } from '../../types';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { Select } from '../ui/Select';

interface ExamFormProps {
  exam?: Exam | null;
  onSubmit: (data: Omit<Exam, 'id'> & { id?: string }) => void;
}

const subjects = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'History', 'Geography', 'Computer Science', 'Amharic', 'General Science', 'Social Studies'];
// Updated class list: KG1 to 12
const classes = ['KG1', 'KG2', 'KG3', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];

const ExamForm = forwardRef<HTMLFormElement, ExamFormProps>(({ exam, onSubmit }, ref) => {
  const [formData, setFormData] = useState({
    name: '',
    subject: subjects[0],
    class: classes[0],
    date: new Date().toISOString().split('T')[0],
    totalMarks: 100,
    passingMarks: 40,
    duration: '120 minutes',
    status: 'upcoming' as 'upcoming' | 'ongoing' | 'completed',
  });

  useEffect(() => {
    if (exam) {
      setFormData(exam);
    } else {
      setFormData({
        name: '',
        subject: subjects[0],
        class: classes[0],
        date: new Date().toISOString().split('T')[0],
        totalMarks: 100,
        passingMarks: 40,
        duration: '120 minutes',
        status: 'upcoming',
      });
    }
  }, [exam]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'number' ? parseInt(value) : value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ ...formData, id: exam?.id });
  };

  return (
    <form ref={ref} onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">Exam Name</Label>
        <Input id="name" name="name" value={formData.name} onChange={handleChange} required />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="subject">Subject</Label>
          <Select id="subject" name="subject" value={formData.subject} onChange={handleChange}>
            {subjects.map(s => <option key={s} value={s}>{s}</option>)}
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="class">Class</Label>
          <Select id="class" name="class" value={formData.class} onChange={handleChange}>
            {classes.map(c => <option key={c} value={c}>{c}</option>)}
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="date">Date</Label>
          <Input id="date" name="date" type="date" value={formData.date} onChange={handleChange} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="duration">Duration (e.g., 120 minutes)</Label>
          <Input id="duration" name="duration" value={formData.duration} onChange={handleChange} required />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="totalMarks">Total Marks</Label>
          <Input id="totalMarks" name="totalMarks" type="number" value={formData.totalMarks} onChange={handleChange} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="passingMarks">Passing Marks</Label>
          <Input id="passingMarks" name="passingMarks" type="number" value={formData.passingMarks} onChange={handleChange} required />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <Select id="status" name="status" value={formData.status} onChange={handleChange}>
          <option value="upcoming">Upcoming</option>
          <option value="ongoing">Ongoing</option>
          <option value="completed">Completed</option>
        </Select>
      </div>
      <button type="submit" className="hidden">Submit</button>
    </form>
  );
});

ExamForm.displayName = 'ExamForm';

export default ExamForm;
