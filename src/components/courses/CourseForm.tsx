import React, { useState, useEffect, forwardRef } from 'react';
import { Course, Teacher, Department } from '../../types';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { Select } from '../ui/Select';

interface CourseFormProps {
  course?: Course | null;
  teachers: Teacher[];
  departments: Department[];
  onSubmit: (data: Omit<Course, 'id' | 'teacherName' | 'departmentName'> & { id?: string }) => void;
}

const CourseForm = forwardRef<HTMLFormElement, CourseFormProps>(({ course, teachers, departments, onSubmit }, ref) => {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    teacherId: teachers[0]?.id || '',
    departmentId: departments[0]?.id || '',
    credits: 3,
  });

  useEffect(() => {
    if (course) {
      setFormData({
        name: course.name,
        code: course.code,
        teacherId: course.teacherId,
        departmentId: course.departmentId,
        credits: course.credits,
      });
    } else {
      setFormData({
        name: '', code: '', teacherId: teachers[0]?.id || '', departmentId: departments[0]?.id || '', credits: 3,
      });
    }
  }, [course, teachers, departments]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'number' ? parseInt(value) : value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ ...formData, id: course?.id });
  };

  return (
    <form ref={ref} onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Course Name</Label>
          <Input id="name" name="name" value={formData.name} onChange={handleChange} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="code">Course Code</Label>
          <Input id="code" name="code" value={formData.code} onChange={handleChange} required />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="teacherId">Teacher</Label>
          <Select id="teacherId" name="teacherId" value={formData.teacherId} onChange={handleChange}>
            {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="departmentId">Department</Label>
          <Select id="departmentId" name="departmentId" value={formData.departmentId} onChange={handleChange}>
            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="credits">Credits</Label>
        <Input id="credits" name="credits" type="number" min="1" max="5" value={formData.credits} onChange={handleChange} required />
      </div>
      <button type="submit" className="hidden">Submit</button>
    </form>
  );
});

CourseForm.displayName = 'CourseForm';

export default CourseForm;
