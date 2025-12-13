import React, { useState, useEffect, forwardRef } from 'react';
import { Expense } from '../../types';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { Select } from '../ui/Select';

interface ExpenseFormProps {
  expense?: Expense | null;
  onSubmit: (data: Omit<Expense, 'id'> & { id?: string }) => void;
}

const categories: Expense['category'][] = ['salaries', 'utilities', 'maintenance', 'supplies', 'technology', 'other'];

const ExpenseForm = forwardRef<HTMLFormElement, ExpenseFormProps>(({ expense, onSubmit }, ref) => {
  const [formData, setFormData] = useState({
    title: '',
    category: categories[0],
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    description: '',
  });

  useEffect(() => {
    if (expense) {
      setFormData(expense);
    } else {
      setFormData({
        title: '',
        category: categories[0],
        amount: 0,
        date: new Date().toISOString().split('T')[0],
        description: '',
      });
    }
  }, [expense]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'number' ? parseFloat(value) : value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ ...formData, id: expense?.id });
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

ExpenseForm.displayName = 'ExpenseForm';

export default ExpenseForm;
