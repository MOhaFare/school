import React, { useState, useEffect, forwardRef } from 'react';
import { Department, Teacher } from '../../types';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { Select } from '../ui/Select';

interface DepartmentFormProps {
  department?: Department | null;
  teachers: Teacher[];
  onSubmit: (data: Omit<Department, 'id' | 'headOfDepartmentName' | 'courseCount'> & { id?: string }) => void;
}

const DepartmentForm = forwardRef<HTMLFormElement, DepartmentFormProps>(({ department, teachers, onSubmit }, ref) => {
  const [formData, setFormData] = useState({
    name: '',
    headOfDepartmentId: teachers[0]?.id || '',
    description: '',
  });

  useEffect(() => {
    if (department) {
      setFormData({
        name: department.name,
        headOfDepartmentId: department.headOfDepartmentId,
        description: department.description,
      });
    } else {
      setFormData({
        name: '', headOfDepartmentId: teachers[0]?.id || '', description: '',
      });
    }
  }, [department, teachers]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ ...formData, id: department?.id });
  };

  return (
    <form ref={ref} onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">Department Name</Label>
        <Input id="name" name="name" value={formData.name} onChange={handleChange} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="headOfDepartmentId">Head of Department (HOD)</Label>
        <Select id="headOfDepartmentId" name="headOfDepartmentId" value={formData.headOfDepartmentId} onChange={handleChange} disabled={teachers.length === 0}>
          {teachers.length > 0 ? (
            teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)
          ) : (
            <option>No teachers available</option>
          )}
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows={3}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
      </div>
      <button type="submit" className="hidden">Submit</button>
    </form>
  );
});

DepartmentForm.displayName = 'DepartmentForm';

export default DepartmentForm;
