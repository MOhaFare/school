import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, Plus, Edit, Trash2, Filter, Sun, Moon } from 'lucide-react';
import { AttendanceRecord, Student, SchoolClass } from '../types';
import Modal from '../components/ui/Modal';
import { Button } from '../components/ui/Button';
import AttendanceForm from '../components/attendance/AttendanceForm';
import TableSkeleton from '../components/ui/TableSkeleton';
import { supabase } from '../lib/supabaseClient';
import toast from 'react-hot-toast';
import { useGlobal } from '../context/GlobalContext';

const Attendance: React.FC = () => {
  const { profile } = useGlobal();
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formRef = useRef<HTMLFormElement>(null);

  const canEdit = ['system_admin', 'admin', 'principal', 'teacher'].includes(profile?.role || '');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [
          { data: attendanceData, error: attendanceError },
          { data: studentsData, error: studentsError },
          { data: classesData, error: classesError }
        ] = await Promise.all([
          supabase.from('attendance').select('*').order('date', { ascending: false }),
          supabase.from('students').select('id, name'),
          supabase.from('classes').select('id, name')
        ]);

        if (attendanceError) throw attendanceError;
        if (studentsError) throw studentsError;
        if (classesError) throw classesError;

        setAttendanceRecords(attendanceData || []);
        setStudents(studentsData || []);
        setClasses(classesData.map((c: any) => ({...c, name: `Class ${c.name}`})) || []);
      } catch (error: any) {
        toast.error(`Failed to load data: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const enrichedRecords = useMemo(() => {
    return attendanceRecords.map(record => ({
      ...record,
      studentName: students.find(s => s.id === record.studentId)?.name || 'Unknown Student',
    }));
  }, [attendanceRecords, students]);

  const filteredRecords = enrichedRecords.filter(record =>
    record.studentName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAdd = () => {
    setSelectedRecord(null);
    setModalOpen(true);
  };

  const handleEdit = (record: AttendanceRecord) => {
    setSelectedRecord(record);
    setModalOpen(true);
  };

  const handleDelete = (record: AttendanceRecord) => {
    setSelectedRecord(record);
    setDeleteModalOpen(true);
  };

  const handleSaveRecord = async (formData: Omit<AttendanceRecord, 'id' | 'studentName' | 'created_at'> & { id?: string }) => {
    setIsSubmitting(true);
    await toast.promise(
      (async () => {
        const recordToSave = {
          student_id: formData.studentId,
          date: formData.date,
          status: formData.status,
          class: formData.class,
          session: formData.session,
        };
        if (formData.id) {
          const { data, error } = await supabase.from('attendance').update(recordToSave).eq('id', formData.id).select().single();
          if (error) throw error;
          setAttendanceRecords(prev => prev.map(r => r.id === formData.id ? data : r));
        } else {
          const { data, error } = await supabase.from('attendance').insert(recordToSave).select().single();
          if (error) throw error;
          setAttendanceRecords(prev => [data, ...prev]);
        }
      })(),
      {
        loading: 'Saving attendance...',
        success: 'Attendance saved successfully!',
        error: (err) => `Failed to save attendance: ${err.message}`,
      }
    );
    setIsSubmitting(false);
    setModalOpen(false);
  };

  const handleConfirmDelete = async () => {
    if (selectedRecord) {
      setIsSubmitting(true);
      await toast.promise(
        (async () => {
          const { error } = await supabase.from('attendance').delete().eq('id', selectedRecord.id);
          if (error) throw error;
          setAttendanceRecords(prev => prev.filter(r => r.id !== selectedRecord.id));
        })(),
        {
          loading: 'Deleting record...',
          success: 'Record deleted successfully!',
          error: (err) => `Failed to delete record: ${err.message}`,
        }
      );
      setIsSubmitting(false);
      setDeleteModalOpen(false);
      setSelectedRecord(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present': return 'bg-green-100 text-green-800';
      case 'absent': return 'bg-red-100 text-red-800';
      case 'late': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <TableSkeleton title="Attendance" headers={['Student', 'Class', 'Date', 'Session', 'Status', 'Actions']} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Attendance</h1>
          <p className="text-gray-600 mt-1">Track student daily attendance</p>
        </div>
        {canEdit && (
          <Button onClick={handleAdd}>
            <Plus size={20} className="mr-2" />
            Mark Attendance
          </Button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search by student name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex gap-2">
            <input type="date" defaultValue={new Date().toISOString().split('T')[0]} className="border border-gray-300 rounded-lg px-3 py-2"/>
            <Button variant="secondary"><Filter className="mr-2 h-4 w-4"/>Filter</Button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Class</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Session</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRecords.map((record) => (
                <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{record.studentName}</div>
                    <div className="text-sm text-gray-500">{record.studentId}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell text-sm text-gray-700">{record.class}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{record.date}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    <div className="flex items-center gap-1">
                        {record.session === 'Afternoon' ? <Moon size={14} className="text-purple-500"/> : <Sun size={14} className="text-orange-500"/>}
                        {record.session || 'Morning'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(record.status)}`}>
                      {record.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                     {canEdit && (
                       <>
                         <Button variant="ghost" size="icon" onClick={() => handleEdit(record)}><Edit className="h-4 w-4" /></Button>
                         <Button variant="ghost" size="icon" onClick={() => handleDelete(record)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                       </>
                     )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
        title={selectedRecord ? 'Edit Attendance' : 'Mark Attendance'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={() => formRef.current?.requestSubmit()} loading={isSubmitting}>
              {selectedRecord ? 'Save Changes' : 'Save Record'}
            </Button>
          </>
        }
      >
        <AttendanceForm ref={formRef} record={selectedRecord} students={students} classes={classes} onSubmit={handleSaveRecord} />
      </Modal>

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Attendance Record"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteModalOpen(false)}>Cancel</Button>
            <Button variant="danger" onClick={handleConfirmDelete} loading={isSubmitting}>Delete</Button>
          </>
        }
      >
        <p>Are you sure you want to delete the attendance record for <strong>{selectedRecord?.studentName}</strong>? This action cannot be undone.</p>
      </Modal>
    </div>
  );
};

export default Attendance;
