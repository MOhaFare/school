import React, { useState, useEffect, forwardRef } from 'react';
import { Payroll, Teacher } from '../../types';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { Select } from '../ui/Select';

interface PayrollFormProps {
  payroll?: Payroll | null;
  teachers: Teacher[];
  onSubmit: (data: Omit<Payroll, 'id' | 'teacherName' | 'baseSalary' | 'netSalary'> & { id?: string }) => void;
}

const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const PayrollForm = forwardRef<HTMLFormElement, PayrollFormProps>(({ payroll, teachers, onSubmit }, ref) => {
  const [formData, setFormData] = useState({
    teacherId: teachers[0]?.id || '',
    month: months[new Date().getMonth()],
    year: new Date().getFullYear(),
    bonus: 0,
    deductions: 0,
    status: 'pending' as 'paid' | 'pending' | 'processing',
    paidDate: undefined as string | undefined,
  });

  const [baseSalary, setBaseSalary] = useState<number>(0);

  useEffect(() => {
    if (payroll) {
      // When editing, use the data from the existing payroll record
      setFormData({
        teacherId: payroll.teacherId,
        month: payroll.month,
        year: payroll.year,
        bonus: payroll.bonus,
        deductions: payroll.deductions,
        status: payroll.status,
        paidDate: payroll.paidDate,
      });
      // Use the historical base salary from the record itself for accuracy
      setBaseSalary(payroll.baseSalary);
    } else {
      // When creating a new record, default to the first teacher
      const firstTeacher = teachers[0];
      setFormData({
        teacherId: firstTeacher?.id || '',
        month: months[new Date().getMonth()],
        year: new Date().getFullYear(),
        bonus: 0,
        deductions: 0,
        status: 'pending',
        paidDate: undefined,
      });
      // And use their current salary
      setBaseSalary(firstTeacher?.salary || 0);
    }
  }, [payroll, teachers]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (name === 'teacherId') {
      const teacher = teachers.find(t => t.id === value);
      setBaseSalary(teacher?.salary || 0);
    }
    setFormData(prev => ({ ...prev, [name]: type === 'number' ? parseFloat(value) : value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ ...formData, id: payroll?.id });
  };

  const netSalary = (baseSalary || 0) + (formData.bonus || 0) - (formData.deductions || 0);

  return (
    <form ref={ref} onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="teacherId">Teacher</Label>
        <Select id="teacherId" name="teacherId" value={formData.teacherId} onChange={handleChange} disabled={!!payroll}>
          {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </Select>
        {!!payroll && <p className="text-xs text-muted-foreground mt-1">Cannot change the teacher on an existing payroll record.</p>}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="month">Month</Label>
          <Select id="month" name="month" value={formData.month} onChange={handleChange}>
            {months.map(m => <option key={m} value={m}>{m}</option>)}
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="year">Year</Label>
          <Input id="year" name="year" type="number" value={formData.year} onChange={handleChange} />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
        <div className="space-y-2">
          <Label>Base Salary</Label>
          <p className="text-lg font-semibold">{baseSalary.toFixed(2)} Birr</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="bonus">Bonus (Birr)</Label>
          <Input id="bonus" name="bonus" type="number" min="0" value={formData.bonus} onChange={handleChange} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="deductions">Deductions (Birr)</Label>
          <Input id="deductions" name="deductions" type="number" min="0" value={formData.deductions} onChange={handleChange} />
        </div>
      </div>
      <div className="p-4 bg-gray-50 rounded-lg text-right">
        <Label>Net Salary</Label>
        <p className="text-2xl font-bold text-blue-600">{netSalary.toFixed(2)} Birr</p>
      </div>
       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select id="status" name="status" value={formData.status} onChange={handleChange}>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="paid">Paid</option>
            </Select>
        </div>
        {formData.status === 'paid' && (
            <div className="space-y-2">
                <Label htmlFor="paidDate">Paid Date</Label>
                <Input id="paidDate" name="paidDate" type="date" value={formData.paidDate} onChange={handleChange} />
            </div>
        )}
       </div>
      <button type="submit" className="hidden">Submit</button>
    </form>
  );
});

PayrollForm.displayName = 'PayrollForm';

export default PayrollForm;
