import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useGlobal } from '../../context/GlobalContext';
import { Button } from '../ui/Button';
import { Label } from '../ui/Label';
import { Select } from '../ui/Select';
import { Input } from '../ui/Input';
import toast from 'react-hot-toast';

interface GenerateFeesModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const GenerateFeesModal: React.FC<GenerateFeesModalProps> = ({ onClose, onSuccess }) => {
  const { profile } = useGlobal();
  const [loading, setLoading] = useState(false);
  const [feeMasters, setFeeMasters] = useState<any[]>([]);
  
  const [selectedFeeId, setSelectedFeeId] = useState('');
  const [month, setMonth] = useState(new Date().toLocaleString('default', { month: 'long' }));
  const [dueDate, setDueDate] = useState('');
  
  // Stats
  const [targetGrade, setTargetGrade] = useState<string | null>(null);

  useEffect(() => {
    const fetchMasters = async () => {
      if (!profile?.school_id) return;
      const { data } = await supabase
        .from('fee_masters')
        .select('*')
        .eq('school_id', profile.school_id)
        .order('name');
      setFeeMasters(data || []);
    };
    fetchMasters();
  }, [profile]);

  // When fee type changes, check if it's grade specific
  useEffect(() => {
    const fee = feeMasters.find(f => f.id === selectedFeeId);
    if (fee && fee.grade) {
      setTargetGrade(fee.grade);
    } else {
      setTargetGrade(null);
    }
  }, [selectedFeeId, feeMasters]);

  const handleGenerate = async () => {
    if (!selectedFeeId || !dueDate) {
      toast.error('Please select a fee type and due date');
      return;
    }

    setLoading(true);
    try {
      const feeType = feeMasters.find(f => f.id === selectedFeeId);
      if (!feeType) throw new Error('Invalid fee type');

      // 1. Fetch Students
      let query = supabase
        .from('students')
        .select('id, name, grade')
        .eq('school_id', profile?.school_id)
        .eq('status', 'active');

      // If fee is grade-specific, filter students
      if (feeType.grade) {
        query = query.eq('grade', feeType.grade);
      }

      const { data: students, error: studentError } = await query;
      if (studentError) throw studentError;

      if (!students || students.length === 0) {
        toast.error(feeType.grade ? `No active students found in ${feeType.grade}` : 'No active students found');
        setLoading(false);
        return;
      }

      // 2. Prepare Fee Records
      const feesToInsert = students.map(student => ({
        student_id: student.id,
        amount: feeType.amount,
        description: `${feeType.name} - ${month}`,
        due_date: dueDate,
        status: 'unpaid',
        school_id: profile?.school_id,
        month: month, // Store month to prevent duplicates later
        payment_mode: null,
        remarks: null
      }));

      // 3. Insert (Skip duplicates logic should ideally be here, but for now we insert)
      // Ideally we check if fee exists for student+month+description
      
      const { error: insertError } = await supabase.from('fees').insert(feesToInsert);
      if (insertError) throw insertError;

      toast.success(`Generated fees for ${students.length} students!`);
      onSuccess();
      onClose();

    } catch (error: any) {
      toast.error(`Failed to generate: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Select Fee Type</Label>
        <Select value={selectedFeeId} onChange={(e) => setSelectedFeeId(e.target.value)}>
          <option value="">-- Select Fee --</option>
          {feeMasters.map(fee => (
            <option key={fee.id} value={fee.id}>
              {fee.name} ({fee.grade || 'All Grades'}) - ${fee.amount}
            </option>
          ))}
        </Select>
      </div>

      {targetGrade && (
        <div className="p-3 bg-blue-50 text-blue-700 rounded-md text-sm border border-blue-100">
          <strong>Note:</strong> This fee will only be applied to students in <strong>{targetGrade}</strong>.
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>For Month</Label>
          <Select value={month} onChange={(e) => setMonth(e.target.value)}>
            {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Due Date</Label>
          <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button onClick={handleGenerate} loading={loading} disabled={!selectedFeeId}>
          Generate Fees
        </Button>
      </div>
    </div>
  );
};

export default GenerateFeesModal;
