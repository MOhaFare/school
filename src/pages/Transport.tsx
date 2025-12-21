import React, { useState, useRef, useEffect } from 'react';
import { Search, Plus, Edit, Trash2, Bus, User } from 'lucide-react';
import { TransportVehicle } from '../types';
import Modal from '../components/ui/Modal';
import { Button } from '../components/ui/Button';
import VehicleForm from '../components/transport/VehicleForm';
import TableSkeleton from '../components/ui/TableSkeleton';
import { supabase } from '../lib/supabaseClient';
import toast from 'react-hot-toast';
import { useGlobal } from '../context/GlobalContext';

const transformVehicleToCamelCase = (dbVehicle: any): TransportVehicle => ({
  id: dbVehicle.id,
  created_at: dbVehicle.created_at,
  vehicleNumber: dbVehicle.vehicle_number,
  driverName: dbVehicle.driver_name,
  route: dbVehicle.route,
  capacity: dbVehicle.capacity,
  studentCount: dbVehicle.student_count,
});

const Transport: React.FC = () => {
  const { profile } = useGlobal();
  const [transportVehicles, setTransportVehicles] = useState<TransportVehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setModalOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<TransportVehicle | null>(null);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const fetchVehicles = async () => {
      if (!profile?.school_id) return;
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('transport_vehicles')
          .select('*')
          .eq('school_id', profile.school_id)
          .order('vehicle_number');
          
        if (error) throw error;
        setTransportVehicles(data.map(transformVehicleToCamelCase));
      } catch (error: any) {
        const errorMessage = error?.message || (typeof error === 'object' ? JSON.stringify(error) : String(error));
        toast.error(`Failed to fetch vehicles: ${errorMessage}`);
      } finally {
        setLoading(false);
      }
    };
    fetchVehicles();
  }, [profile]);

  const filteredVehicles = transportVehicles.filter(v =>
    v.vehicleNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.driverName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.route.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAdd = () => {
    setSelectedVehicle(null);
    setModalOpen(true);
  };

  const handleEdit = (vehicle: TransportVehicle) => {
    setSelectedVehicle(vehicle);
    setModalOpen(true);
  };

  const handleDelete = (vehicle: TransportVehicle) => {
    setSelectedVehicle(vehicle);
    setDeleteModalOpen(true);
  };

  const handleSaveVehicle = async (formData: Omit<TransportVehicle, 'id' | 'created_at'> & { id?: string }) => {
    setIsSubmitting(true);
    const vehicleToSave = {
      vehicle_number: formData.vehicleNumber,
      driver_name: formData.driverName,
      route: formData.route,
      capacity: formData.capacity,
      student_count: formData.studentCount,
      school_id: profile?.school_id
    };
    await toast.promise(
      (async () => {
        if (formData.id) {
          const { data, error } = await supabase.from('transport_vehicles').update(vehicleToSave).eq('id', formData.id).select().single();
          if (error) throw error;
          setTransportVehicles(prev => prev.map(v => v.id === formData.id ? transformVehicleToCamelCase(data) : v));
        } else {
          const { data, error } = await supabase.from('transport_vehicles').insert(vehicleToSave).select().single();
          if (error) throw error;
          setTransportVehicles(prev => [transformVehicleToCamelCase(data), ...prev]);
        }
      })(),
      {
        loading: 'Saving vehicle...',
        success: 'Vehicle saved successfully!',
        error: (err) => `Failed to save vehicle: ${err.message}`,
      }
    );
    setIsSubmitting(false);
    setModalOpen(false);
  };

  const handleConfirmDelete = async () => {
    if (selectedVehicle) {
      setIsSubmitting(true);
      await toast.promise(
        (async () => {
          const { error } = await supabase.from('transport_vehicles').delete().eq('id', selectedVehicle.id);
          if (error) throw error;
          setTransportVehicles(prev => prev.filter(v => v.id !== selectedVehicle.id));
        })(),
        {
          loading: 'Deleting vehicle...',
          success: 'Vehicle deleted successfully!',
          error: (err) => `Failed to delete vehicle: ${err.message}`,
        }
      );
      setIsSubmitting(false);
      setDeleteModalOpen(false);
      setSelectedVehicle(null);
    }
  };

  if (loading) {
    return <TableSkeleton title="Transport" headers={['Vehicle', 'Driver', 'Route', 'Occupancy', 'Actions']} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Transport</h1>
          <p className="text-gray-600 mt-1">Manage school transportation fleet</p>
        </div>
        <Button onClick={handleAdd}>
          <Plus size={20} className="mr-2" />
          Add Vehicle
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search by vehicle number, driver, or route..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vehicle</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden md:table-cell">Driver</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden lg:table-cell">Route</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Occupancy</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredVehicles.map((vehicle) => (
                <tr key={vehicle.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Bus size={18} className="text-gray-500 mr-3" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">{vehicle.vehicleNumber}</div>
                        <div className="text-sm text-gray-500">{vehicle.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell">
                    <div className="flex items-center text-sm text-gray-900">
                      <User size={14} className="mr-2 text-gray-400" />
                      {vehicle.driverName}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap hidden lg:table-cell text-sm text-gray-700 truncate max-w-sm">{vehicle.route}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{vehicle.studentCount} / {vehicle.capacity}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                     <Button variant="ghost" size="icon" onClick={() => handleEdit(vehicle)}><Edit className="h-4 w-4" /></Button>
                     <Button variant="ghost" size="icon" onClick={() => handleDelete(vehicle)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
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
        title={selectedVehicle ? 'Edit Vehicle' : 'Add New Vehicle'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={() => formRef.current?.requestSubmit()} loading={isSubmitting}>
              {selectedVehicle ? 'Save Changes' : 'Add Vehicle'}
            </Button>
          </>
        }
      >
        <VehicleForm ref={formRef} vehicle={selectedVehicle} onSubmit={handleSaveVehicle} />
      </Modal>

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Vehicle"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteModalOpen(false)}>Cancel</Button>
            <Button variant="danger" onClick={handleConfirmDelete} loading={isSubmitting}>Delete</Button>
          </>
        }
      >
        <p>Are you sure you want to delete vehicle <strong>{selectedVehicle?.vehicleNumber}</strong>? This action cannot be undone.</p>
      </Modal>
    </div>
  );
};

export default Transport;
