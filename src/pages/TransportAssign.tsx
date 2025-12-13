import React, { useState, useEffect } from 'react';
import { Bus, Search, Save, User } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import TableSkeleton from '../components/ui/TableSkeleton';
import { supabase } from '../lib/supabaseClient';
import toast from 'react-hot-toast';
import { Student, TransportVehicle } from '../types';

const TransportAssign: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [vehicles, setVehicles] = useState<TransportVehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [assignments, setAssignments] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [studentsRes, vehiclesRes] = await Promise.all([
          supabase.from('students').select('*').order('name'),
          supabase.from('transport_vehicles').select('*')
        ]);

        if (studentsRes.error) throw studentsRes.error;
        if (vehiclesRes.error) throw vehiclesRes.error;

        // Map DB fields to CamelCase for local usage
        const mappedStudents = (studentsRes.data || []).map((s: any) => ({
            ...s,
            rollNumber: s.roll_number,
            transportId: s.transport_id
        }));

        const mappedVehicles = (vehiclesRes.data || []).map((v: any) => ({
            id: v.id,
            vehicleNumber: v.vehicle_number,
            route: v.route,
            capacity: v.capacity
        }));

        setStudents(mappedStudents);
        setVehicles(mappedVehicles);
        
        // Initialize assignments state
        const initialAssignments: Record<string, string> = {};
        mappedStudents.forEach((s: any) => {
            if (s.transportId) initialAssignments[s.id] = s.transportId;
        });
        setAssignments(initialAssignments);

      } catch (error: any) {
        toast.error(`Failed to load data: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleAssignmentChange = (studentId: string, vehicleId: string) => {
    setAssignments(prev => ({ ...prev, [studentId]: vehicleId }));
  };

  const handleSave = async (studentId: string) => {
    const vehicleId = assignments[studentId];
    // Allow empty string to unassign
    const updateValue = vehicleId === '' ? null : vehicleId;

    setSaving(true);
    try {
      const { error } = await supabase.from('students').update({ transport_id: updateValue }).eq('id', studentId);
      if (error) throw error;
      
      // Update local state
      setStudents(prev => prev.map(s => s.id === studentId ? { ...s, transportId: updateValue } : s));
      toast.success('Transport assigned successfully');
    } catch (error: any) {
      toast.error(`Failed to assign transport: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.rollNumber.includes(searchTerm)
  );

  if (loading) return <TableSkeleton title="Assign Transport" headers={['Student', 'Class', 'Current Route', 'Assign Vehicle', 'Action']} />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Assign Transport</h1>
          <p className="text-slate-500">Allocate students to bus routes</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="Search students..." 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)} 
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Student</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Class</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Current Route</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Assign Vehicle</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filteredStudents.map(student => {
                const currentVehicle = vehicles.find(v => v.id === (student as any).transportId);
                return (
                  <tr key={student.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-medium text-slate-900 flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500">
                            {student.name.charAt(0)}
                        </div>
                        {student.name}
                    </td>
                    <td className="px-6 py-4 text-slate-600">{student.class}-{student.section}</td>
                    <td className="px-6 py-4 text-slate-600">
                        {currentVehicle ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                <Bus size={12} className="mr-1"/> {currentVehicle.route}
                            </span>
                        ) : (
                            <span className="text-slate-400 italic">Not Assigned</span>
                        )}
                    </td>
                    <td className="px-6 py-4">
                      <Select 
                        value={assignments[student.id] || ''} 
                        onChange={e => handleAssignmentChange(student.id, e.target.value)}
                        className="w-full max-w-xs"
                      >
                        <option value="">-- No Transport --</option>
                        {vehicles.map(v => (
                            <option key={v.id} value={v.id}>
                                {v.vehicleNumber} - {v.route}
                            </option>
                        ))}
                      </Select>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button 
                        size="sm" 
                        onClick={() => handleSave(student.id)} 
                        disabled={saving || assignments[student.id] === (student as any).transportId}
                      >
                        <Save size={16} className="mr-1"/> Save
                      </Button>
                    </td>
                  </tr>
                );
            })}
            {filteredStudents.length === 0 && (
                <tr><td colSpan={5} className="p-8 text-center text-slate-500">No students found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TransportAssign;
