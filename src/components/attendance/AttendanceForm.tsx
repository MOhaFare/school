import React, { useState, useEffect, forwardRef, useMemo } from 'react';
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
    studentId: '',
    date: new Date().toISOString().split('T')[0],
    status: 'present' as 'present' | 'absent' | 'late',
    class: classes[0]?.name || '',
    session: 'Morning' as 'Morning' | 'Afternoon',
  });

  // Filter students based on selected class
  const filteredStudents = useMemo(() => {
      if (!formData.class) return [];
      // Class name format from parent is "Class 9-A"
      // Student class/section is "9" and "A"
      const cleanClassName = formData.class.replace('Class ', '');
      return students.filter(s => `${s.class}-${s.section}` === cleanClassName).sort((a, b) => a.name.localeCompare(b.name));
  }, [formData.class, students]);

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
      // Reset form when opening new
      // Default to first class if available
      const defaultClass = classes.length > 0 ? classes[0].name : '';
      
      // Calculate students for default class to set default student ID
      const cleanClassName = defaultClass.replace('Class ', '');
      const defaultStudents = students.filter(s => `${s.class}-${s.section}` === cleanClassName);
      
      setFormData({
        studentId: defaultStudents.length > 0 ? defaultStudents[0].id : '',
        date: new Date().toISOString().split('T')[0],
        status: 'present',
        class: defaultClass,
        session: 'Morning',
      });
    }
  }, [record, classes]); // Removed students dependency to avoid reset loops

  // Update student ID when class changes
  useEffect(() => {
      if (!record && filteredStudents.length > 0 && !filteredStudents.find(s => s.id === formData.studentId)) {
          setFormData(prev => ({ ...prev, studentId: filteredStudents[0].id }));
      } else if (!record && filteredStudents.length === 0) {
          setFormData(prev => ({ ...prev, studentId: '' }));
      }
  }, [formData.class, filteredStudents, record]);

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
        <Label htmlFor="class">Class</Label>
        {classes.length > 0 ? (
            <Select id="class" name="class" value={formData.class} onChange={handleChange} disabled={!!record}>
            {classes.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
            </Select>
        ) : (
            <div className="p-2 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
                You are not assigned to any classes.
            </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="studentId">Student</Label>
        <Select id="studentId" name="studentId" value={formData.studentId} onChange={handleChange} disabled={filteredStudents.length === 0}>
          {filteredStudents.length > 0 ? (
              filteredStudents.map(s => <option key={s.id} value={s.id}>{s.name} ({s.id})</option>)
          ) : (
              <option value="">No students in this class</option>
          )}
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
      
      <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select id="status" name="status" value={formData.status} onChange={handleChange}>
            <option value="present">Present</option>
            <option value="absent">Absent</option>
            <option value="late">Late</option>
          </Select>
      </div>
      
      <button type="submit" className="hidden">Submit</button>
    </form>
  );
});

AttendanceForm.displayName = 'AttendanceForm';

export default AttendanceForm;
