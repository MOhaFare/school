import React, { useState, useEffect, forwardRef } from 'react';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { Select } from '../ui/Select';

interface FeeMaster {
  id?: string;
  name: string;
  amount: number;
  grade: string | null;
  description: string;
  frequency: 'monthly' | 'one-time' | 'yearly';
}

interface FeeMasterFormProps {
  feeMaster?: FeeMaster | null;
  onSubmit: (data: Omit<FeeMaster, 'id'> & { id?: string }) => void;
}

// Ensure these match the student grade format exactly
const grades = ['KG1', 'KG2', 'KG3', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];

const FeeMasterForm = forwardRef<HTMLFormElement, FeeMasterFormProps>(({ feeMaster, onSubmit }, ref) => {
  const [formData, setFormData] = useState<FeeMaster>({
    name: '',
    amount: 0,
    grade: 'All', // 'All' represents null in UI for better UX
    description: '',
    frequency: 'monthly',
  });

  useEffect(() => {
    if (feeMaster) {
      setFormData({
        name: feeMaster.name,
        amount: feeMaster.amount,
        grade: feeMaster.grade || 'All',
        description: feeMaster.description || '',
        frequency: feeMaster.frequency || 'monthly',
      });
    } else {
      setFormData({
        name: '',
        amount: 0,
        grade: 'All',
        description: '',
        frequency: 'monthly',
      });
    }
  }, [feeMaster]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'amount' ? parseFloat(value) : value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      grade: formData.grade === 'All' ? null : formData.grade,
      id: feeMaster?.id
    });
  };

  return (
    <form ref={ref} onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Fee Name</Label>
          <Input 
            id="name" 
            name="name" 
            value={formData.name} 
            onChange={handleChange} 
            placeholder="e.g. Tuition Fee" 
            required 
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="amount">Amount</Label>
          <Input 
            id="amount" 
            name="amount" 
            type="number" 
            min="0" 
            value={formData.amount} 
            onChange={handleChange} 
            required 
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="grade">Applicable Grade</Label>
          <Select id="grade" name="grade" value={formData.grade || 'All'} onChange={handleChange}>
            <option value="All">All Grades</option>
            {grades.map(g => {
              // Ensure format matches Student records: "KG1" or "Grade 1"
              const gradeValue = g.startsWith('KG') ? g : `Grade ${g}`;
              return (
                <option key={g} value={gradeValue}>{gradeValue}</option>
              );
            })}
          </Select>
          <p className="text-xs text-gray-500">Select 'All Grades' for common fees like Transport.</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="frequency">Frequency</Label>
          <Select id="frequency" name="frequency" value={formData.frequency} onChange={handleChange}>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
            <option value="one-time">One Time</option>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description (Optional)</Label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows={3}
          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <button type="submit" className="hidden">Submit</button>
    </form>
  );
});

FeeMasterForm.displayName = 'FeeMasterForm';

export default FeeMasterForm;
