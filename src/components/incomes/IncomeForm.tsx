import React, { useState, useEffect, forwardRef } from 'react';
import { Income } from '../../types';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { Select } from '../ui/Select';

interface IncomeFormProps {
  income?: Income | null;
  onSubmit: (data: Omit<Income, 'id'> & { id?: string }) => void;
}

const categories: Income['category'][] = ['donations', 'grants', 'rentals', 'fundraising', 'other'];

const IncomeForm = forwardRef<HTMLFormElement, IncomeFormProps>(({ income, onSubmit }, ref) => {
  const [formData, setFormData] = useState({
    title: '',
    category: categories[0],
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    description: '',
  });

  useEffect(() => {
    if (income) {
      setFormData(income);
    } else {
      setFormData({
        title: '',
        category: categories[0],
        amount: 0,
        date: new Date().toISOString().split('T')[0],
        description: '',
      });
    }
  }, [income]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'number' ? parseFloat(value) : value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ ...formData, id: income?.id });
  };

  return (
    <form ref={ref} onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input id="title" name="title" value={formData.title} onChange={handleChange} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Select id="category" name="category" value={formData.category} onChange={handleChange}>
            {categories.map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="amount">Amount (Birr)</Label>
          <Input id="amount" name="amount" type="number" min="0" value={formData.amount} onChange={handleChange} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="date">Date</Label>
          <Input id="date" name="date" type="date" value={formData.date} onChange={handleChange} required />
        </div>
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

IncomeForm.displayName = 'IncomeForm';

export default IncomeForm;
