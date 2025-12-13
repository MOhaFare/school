import React, { useState, useEffect, forwardRef } from 'react';
import { Fee, Student } from '../../types';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { Select } from '../ui/Select';
import toast from 'react-hot-toast';

interface FeeFormProps {
  fee?: Fee | null;
  students: Student[];
  onSubmit: (data: Omit<Fee, 'id' | 'studentName'> & { id?: string }) => void;
}

const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const FeeForm = forwardRef<HTMLFormElement, FeeFormProps>(({ fee, students, onSubmit }, ref) => {
  const [formData, setFormData] = useState({
    student_id: '',
    description: 'Tuition Fee',
    amount: 1000,
    due_date: new Date().toISOString().split('T')[0],
    status: 'unpaid' as 'paid' | 'unpaid' | 'overdue',
    payment_date: undefined as string | undefined,
    month: months[new Date().getMonth()],
  });

  useEffect(() => {
    if (fee) {
      setFormData({
        student_id: fee.student_id,
        description: fee.description,
        amount: fee.amount,
        due_date: fee.due_date,
        status: fee.status,
        payment_date: fee.payment_date,
        month: fee.month || months[new Date(fee.due_date).getMonth()],
      });
    } else {
      setFormData({
        student_id: students.length > 0 ? students[0].id : '',
        description: 'Tuition Fee',
        amount: 1000,
        due_date: new Date().toISOString().split('T')[0],
        status: 'unpaid',
        payment_date: undefined,
        month: months[new Date().getMonth()],
      });
    }
  }, [fee, students]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'number' ? parseFloat(value) : value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.student_id) {
        toast.error("Please select a student from the list.");
        return;
    }
    
    if (formData.amount <= 0) {
        toast.error("Amount must be greater than 0.");
        return;
    }

    onSubmit({ ...formData, id: fee?.id });
  };
  
  const isTuitionFee = formData.description === 'Tuition Fee';

  return (
    <form ref={ref} onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="student_id">Student</Label>
        {students.length > 0 ? (
          <Select id="student_id" name="student_id" value={formData.student_id} onChange={handleChange} required>
            {students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.id})</option>)}
          </Select>
        ) : (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm flex items-center">
            <span>No students found. Please add students in the Student module first.</span>
          </div>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Input id="description" name="description" value={formData.description} onChange={handleChange} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="amount">Amount (Birr)</Label>
          <Input 
            id="amount" 
            name="amount" 
            type="number" 
            min="0" 
            value={formData.amount} 
            onChange={handleChange} 
            required 
            disabled={isTuitionFee && !!fee}
            className={isTuitionFee && !!fee ? 'bg-gray-100' : ''}
          />
          {isTuitionFee && !!fee && <p className="text-xs text-gray-500 mt-1">Tuition fee amount is set globally in Settings.</p>}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="due_date">Due Date</Label>
          <Input id="due_date" name="due_date" type="date" value={formData.due_date} onChange={handleChange} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="month">Month</Label>
          <Select id="month" name="month" value={formData.month} onChange={handleChange}>
            {months.map(m => <option key={m} value={m}>{m}</option>)}
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <Select id="status" name="status" value={formData.status} onChange={handleChange}>
          <option value="unpaid">Unpaid</option>
          <option value="paid">Paid</option>
          <option value="overdue">Overdue</option>
        </Select>
      </div>
      {formData.status === 'paid' && (
        <div className="space-y-2">
          <Label htmlFor="payment_date">Payment Date</Label>
          <Input id="payment_date" name="payment_date" type="date" value={formData.payment_date} onChange={handleChange} />
        </div>
      )}
      <button type="submit" className="hidden">Submit</button>
    </form>
  );
});

FeeForm.displayName = 'FeeForm';

export default FeeForm;
