import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { Select } from '../ui/Select';
import toast from 'react-hot-toast';
import { useGlobal } from '../../context/GlobalContext';
import { Calendar, Users, AlertCircle } from 'lucide-react';

interface GenerateFeesModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const GenerateFeesModal: React.FC<GenerateFeesModalProps> = ({ onClose, onSuccess }) => {
  const { schoolFee } = useGlobal();
  const [loading, setLoading] = useState(false);
  
  // Form State
  const [generationType, setGenerationType] = useState<'single' | 'year'>('single');
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState(months[new Date().getMonth()]);
  const [year, setYear] = useState(new Date().getFullYear());
  const [amount, setAmount] = useState(schoolFee);
  const [dueDate, setDueDate] = useState('');
  const [classes, setClasses] = useState<string[]>([]);
  const [studentCount, setStudentCount] = useState<number | null>(null);

  // Update amount if global schoolFee changes
  useEffect(() => {
    setAmount(schoolFee);
  }, [schoolFee]);

  useEffect(() => {
    const fetchClasses = async () => {
      const { data } = await supabase.from('classes').select('name').order('name');
      if (data) setClasses(data.map(c => c.name));
    };
    fetchClasses();
    
    // Set default due date to the 5th of next month
    const date = new Date();
    const nextMonth = new Date(date.getFullYear(), date.getMonth() + 1, 5);
    setDueDate(nextMonth.toISOString().split('T')[0]);
  }, []);

  // Estimate student count when class changes
  useEffect(() => {
    const estimateStudents = async () => {
      let query = supabase.from('students').select('id', { count: 'exact', head: true }).eq('status', 'active');
      
      if (selectedClass !== 'all') {
        const parts = selectedClass.split('-');
        if (parts.length >= 1) query = query.eq('class', parts[0]);
        if (parts.length >= 2) query = query.eq('section', parts[1]);
      }
      
      const { count } = await query;
      setStudentCount(count);
    };
    estimateStudents();
  }, [selectedClass]);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      // 1. Fetch Active Students
      let query = supabase.from('students').select('id, name, class, section').eq('status', 'active');
      
      if (selectedClass !== 'all') {
        const parts = selectedClass.split('-');
        if (parts.length >= 1) query = query.eq('class', parts[0]);
        if (parts.length >= 2) query = query.eq('section', parts[1]);
      }
      
      const { data: students, error: studentError } = await query;
      if (studentError) throw studentError;
      
      if (!students || students.length === 0) {
        toast.error("No active students found for the selected criteria.");
        setLoading(false);
        return;
      }

      // 2. Prepare Fee Records
      const feesToInsert: any[] = [];
      
      if (generationType === 'single') {
        // Generate for single month
        students.forEach(student => {
          feesToInsert.push({
            student_id: student.id,
            description: `Tuition Fee - ${selectedMonth} ${year}`,
            amount,
            due_date: dueDate,
            status: 'unpaid',
            month: selectedMonth,
          });
        });
      } else {
        // Generate for FULL YEAR (all 12 months)
        students.forEach(student => {
          months.forEach((month, index) => {
            // Calculate due date for each month (e.g., 5th of each month)
            const monthDueDate = new Date(year, index, 5).toISOString().split('T')[0];
            
            feesToInsert.push({
              student_id: student.id,
              description: `Tuition Fee - ${month} ${year}`,
              amount,
              due_date: monthDueDate,
              status: 'unpaid',
              month: month,
            });
          });
        });
      }

      // 3. Insert in batches
      const BATCH_SIZE = 100;
      for (let i = 0; i < feesToInsert.length; i += BATCH_SIZE) {
        const batch = feesToInsert.slice(i, i + BATCH_SIZE);
        const { error: insertError } = await supabase.from('fees').insert(batch);
        if (insertError) throw insertError;
      }

      toast.success(`Successfully generated ${feesToInsert.length} fee records for ${students.length} students.`);
      onSuccess();
      onClose();

    } catch (error: any) {
      toast.error(`Error generating fees: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
        <div>
          <h4 className="text-sm font-semibold text-blue-800">Monthly Tuition Fee Generation</h4>
          <p className="text-xs text-blue-600 mt-1">
            This will create fee records based on the Base Fee ({schoolFee} Birr) for {studentCount !== null ? <strong>{studentCount}</strong> : 'all'} active students. 
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Generation Type</Label>
          <div className="flex bg-gray-100 p-1 rounded-lg">
            <button
              type="button"
              onClick={() => setGenerationType('single')}
              className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${generationType === 'single' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Single Month
            </button>
            <button
              type="button"
              onClick={() => setGenerationType('year')}
              className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${generationType === 'year' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Full Year
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Target Class</Label>
          <Select value={selectedClass} onChange={e => setSelectedClass(e.target.value)}>
            <option value="all">All Classes</option>
            {classes.map(c => <option key={c} value={c}>{c}</option>)}
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Academic Year</Label>
          <Input type="number" value={year} onChange={e => setYear(parseInt(e.target.value))} />
        </div>
        
        {generationType === 'single' && (
          <div className="space-y-2">
            <Label>Month</Label>
            <Select value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)}>
              {months.map(m => <option key={m} value={m}>{m}</option>)}
            </Select>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Amount (Birr)</Label>
          <Input type="number" value={amount} onChange={e => setAmount(parseFloat(e.target.value))} />
          <p className="text-xs text-gray-500 mt-1">Default: {schoolFee} (Base Fee)</p>
        </div>
        
        {generationType === 'single' && (
          <div className="space-y-2">
            <Label>Due Date</Label>
            <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button onClick={handleGenerate} loading={loading}>
          {generationType === 'single' ? 'Generate Monthly Fees' : 'Generate Full Year Fees'}
        </Button>
      </div>
    </div>
  );
};

export default GenerateFeesModal;
