import React, { useState, useEffect, forwardRef } from 'react';
import { AttendanceRecord, Student, SchoolClass } from '../../types';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { Select } from '../ui/Select';

interface AttendanceFormProps {
  record?: AttendanceRecord | null;
  students: Student[];
  classes: SchoolClass[];
  onSubmit: (data: Omit<AttendanceRecord, 'id' | 'studentName'> & { id?: string }) => void;
}

const AttendanceForm = forwardRef<HTMLFormElement, AttendanceFormProps>(({ record, students, classes, onSubmit }, ref) => {
  const [formData, setFormData] = useState({
    studentId: students[0]?.id || '',
    date: new Date().toISOString().split('T')[0],
    status: 'present' as 'present' | 'absent' | 'late',
    class: classes[0]?.name || '',
    session: 'Morning' as 'Morning' | 'Afternoon',
  });

  useEffect(() => {
    if (record) {
      setFormData({
          studentId: record.studentId,
          date: record.date,
          status: record.status,
          class: record.class,
          session: record.session || 'Morning'
      });
    } else {
      setFormData({
        studentId: students[0]?.id || '',
        date: new Date().toISOString().split('T')[0],
        status: 'present',
        class: classes[0]?.name || '',
        session: 'Morning',
      });
    }
  }, [record, students, classes]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ ...formData, id: record?.id });
  };

  return (
    <form ref={ref} onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="studentId">Student</Label>
        <Select id="studentId" name="studentId" value={formData.studentId} onChange={handleChange}>
          {students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.id})</option>)}
        </Select>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="date">Date</Label>
          <Input id="date" name="date" type="date" value={formData.date} onChange={handleChange} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="session">Session</Label>
          <Select id="session" name="session" value={formData.session} onChange={handleChange}>
            <option value="Morning">Morning</option>
            <option value="Afternoon">Afternoon</option>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select id="status" name="status" value={formData.status} onChange={handleChange}>
            <option value="present">Present</option>
            <option value="absent">Absent</option>
            <option value="late">Late</option>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="class">Class</Label>
          <Select id="class" name="class" value={formData.class} onChange={handleChange}>
            {classes.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
          </Select>
        </div>
      </div>
      <button type="submit" className="hidden">Submit</button>
    </form>
  );
});

AttendanceForm.displayName = 'AttendanceForm';

export default AttendanceForm;
