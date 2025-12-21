import React, { useState, useRef, useEffect } from 'react';
import { Search, Plus, Edit, Trash2, Users } from 'lucide-react';
import { HostelRoom, Student } from '../types';
import Modal from '../components/ui/Modal';
import { Button } from '../components/ui/Button';
import HostelRoomForm from '../components/hostel/HostelRoomForm';
import CardGridSkeleton from '../components/ui/CardGridSkeleton';
import { supabase } from '../lib/supabaseClient';
import toast from 'react-hot-toast';
import { useGlobal } from '../context/GlobalContext';

const transformRoomToCamelCase = (dbRoom: any): HostelRoom => ({
  id: dbRoom.id,
  created_at: dbRoom.created_at,
  roomNumber: dbRoom.room_number,
  building: dbRoom.building,
  capacity: dbRoom.capacity,
  occupants: dbRoom.occupants,
  status: dbRoom.status,
});

const Hostel: React.FC = () => {
  const { profile } = useGlobal();
  const [hostelRooms, setHostelRooms] = useState<HostelRoom[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setModalOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<HostelRoom | null>(null);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!profile?.school_id) return;
      setLoading(true);
      try {
        const [
          { data: roomsData, error: roomsError },
          { data: studentsData, error: studentsError }
        ] = await Promise.all([
          supabase.from('hostel_rooms').select('*').eq('school_id', profile.school_id).order('room_number'),
          supabase.from('students').select('id, name').eq('school_id', profile.school_id)
        ]);

        if (roomsError) throw roomsError;
        if (studentsError) throw studentsError;

        setHostelRooms(roomsData.map(transformRoomToCamelCase) || []);
        setStudents(studentsData || []);
      } catch (error: any) {
        const errorMessage = error?.message || (typeof error === 'object' ? JSON.stringify(error) : String(error));
        toast.error(`Failed to load data: ${errorMessage}`);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [profile]);

  const filteredRooms = hostelRooms.filter(room =>
    room.roomNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    room.building.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAdd = () => {
    setSelectedRoom(null);
    setModalOpen(true);
  };

  const handleEdit = (room: HostelRoom) => {
    setSelectedRoom(room);
    setModalOpen(true);
  };

  const handleDelete = (room: HostelRoom) => {
    setSelectedRoom(room);
    setDeleteModalOpen(true);
  };

  const handleSaveRoom = async (formData: Omit<HostelRoom, 'id' | 'created_at'> & { id?: string }) => {
    setIsSubmitting(true);
    const roomToSave = {
      room_number: formData.roomNumber,
      building: formData.building,
      capacity: formData.capacity,
      occupants: formData.occupants,
      status: formData.status,
      school_id: profile?.school_id
    };
    await toast.promise(
      (async () => {
        if (formData.id) {
          const { data, error } = await supabase.from('hostel_rooms').update(roomToSave).eq('id', formData.id).select().single();
          if (error) throw error;
          setHostelRooms(prev => prev.map(r => r.id === formData.id ? transformRoomToCamelCase(data) : r));
        } else {
          const { data, error } = await supabase.from('hostel_rooms').insert(roomToSave).select().single();
          if (error) throw error;
          setHostelRooms(prev => [transformRoomToCamelCase(data), ...prev]);
        }
      })(),
      {
        loading: 'Saving room...',
        success: 'Room saved successfully!',
        error: (err) => `Failed to save room: ${err.message}`,
      }
    );
    setIsSubmitting(false);
    setModalOpen(false);
  };

  const handleConfirmDelete = async () => {
    if (selectedRoom) {
      setIsSubmitting(true);
      await toast.promise(
        (async () => {
          const { error } = await supabase.from('hostel_rooms').delete().eq('id', selectedRoom.id);
          if (error) throw error;
          setHostelRooms(prev => prev.filter(r => r.id !== selectedRoom.id));
        })(),
        {
          loading: 'Deleting room...',
          success: 'Room deleted successfully!',
          error: (err) => `Failed to delete room: ${err.message}`,
        }
      );
      setIsSubmitting(false);
      setDeleteModalOpen(false);
      setSelectedRoom(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800';
      case 'full': return 'bg-red-100 text-red-800';
      case 'maintenance': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getOccupantNames = (occupantIds: string[]): string => {
    if (!occupantIds || occupantIds.length === 0) return 'No occupants';
    return occupantIds.map(id => students.find(s => s.id === id)?.name || id).join(', ');
  };

  if (loading) {
    return <CardGridSkeleton title="Hostel" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Hostel Management</h1>
          <p className="text-gray-600 mt-1">Manage hostel rooms and occupants</p>
        </div>
        <Button onClick={handleAdd}>
          <Plus size={20} className="mr-2" />
          Add Room
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search by room number or building..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRooms.map((room) => (
          <div key={room.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col">
            <div className="flex items-start justify-between mb-3">
              <h3 className="font-semibold text-gray-900 text-lg">Room {room.roomNumber}</h3>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(room.status)}`}>
                {room.status}
              </span>
            </div>
            <p className="text-sm text-gray-500 mb-4">{room.building}</p>

            <div className="flex items-center text-sm text-gray-600 mb-4">
              <Users size={16} className="mr-2" />
              Occupancy: {room.occupants.length} / {room.capacity}
            </div>

            <div className="flex-grow mb-4">
              <h4 className="text-xs font-semibold text-gray-500 mb-2">Occupants</h4>
              <div className="text-sm text-gray-800">
                {getOccupantNames(room.occupants)}
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100 mt-auto flex items-center justify-end">
              <Button variant="ghost" size="icon" onClick={() => handleEdit(room)}><Edit className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon" onClick={() => handleDelete(room)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
            </div>
          </div>
        ))}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
        title={selectedRoom ? 'Edit Room' : 'Add New Room'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={() => formRef.current?.requestSubmit()} loading={isSubmitting}>
              {selectedRoom ? 'Save Changes' : 'Add Room'}
            </Button>
          </>
        }
      >
        <HostelRoomForm ref={formRef} room={selectedRoom} students={students} onSubmit={handleSaveRoom} />
      </Modal>

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Room"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteModalOpen(false)}>Cancel</Button>
            <Button variant="danger" onClick={handleConfirmDelete} loading={isSubmitting}>Delete</Button>
          </>
        }
      >
        <p>Are you sure you want to delete room <strong>{selectedRoom?.roomNumber}</strong>? This action cannot be undone.</p>
      </Modal>
    </div>
  );
};

export default Hostel;
