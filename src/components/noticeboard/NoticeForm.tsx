import React, { useState, useEffect, forwardRef } from 'react';
import { Notice } from '../../types';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { Select } from '../ui/Select';

interface NoticeFormProps {
  notice?: Notice | null;
  onSubmit: (data: Omit<Notice, 'id' | 'authorName'> & { id?: string }) => void;
}

const NoticeForm = forwardRef<HTMLFormElement, NoticeFormProps>(({ notice, onSubmit }, ref) => {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    date: new Date().toISOString().split('T')[0],
    audience: 'all' as 'all' | 'students' | 'teachers',
  });

  useEffect(() => {
    if (notice) {
      setFormData({
        title: notice.title,
        content: notice.content,
        date: notice.date,
        audience: notice.audience,
      });
    } else {
      setFormData({
        title: '',
        content: '',
        date: new Date().toISOString().split('T')[0],
        audience: 'all',
      });
    }
  }, [notice]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ ...formData, id: notice?.id });
  };

  return (
    <form ref={ref} onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input id="title" name="title" value={formData.title} onChange={handleChange} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="content">Content</Label>
        <textarea
          id="content"
          name="content"
          value={formData.content}
          onChange={handleChange}
          rows={6}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          required
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="date">Date</Label>
          <Input id="date" name="date" type="date" value={formData.date} onChange={handleChange} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="audience">Audience</Label>
          <Select id="audience" name="audience" value={formData.audience} onChange={handleChange}>
            <option value="all">All</option>
            <option value="students">Students</option>
            <option value="teachers">Teachers</option>
          </Select>
        </div>
      </div>
      <button type="submit" className="hidden">Submit</button>
    </form>
  );
});

NoticeForm.displayName = 'NoticeForm';

export default NoticeForm;
