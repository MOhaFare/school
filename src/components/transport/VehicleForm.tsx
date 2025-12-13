import React, { useState, useEffect, forwardRef } from 'react';
import { TransportVehicle } from '../../types';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';

interface VehicleFormProps {
  vehicle?: TransportVehicle | null;
  onSubmit: (data: Omit<TransportVehicle, 'id'> & { id?: string }) => void;
}

const VehicleForm = forwardRef<HTMLFormElement, VehicleFormProps>(({ vehicle, onSubmit }, ref) => {
  const [formData, setFormData] = useState({
    vehicleNumber: '',
    driverName: '',
    route: '',
    capacity: 20,
    studentCount: 15,
  });

  useEffect(() => {
    if (vehicle) {
      setFormData(vehicle);
    } else {
      setFormData({
        vehicleNumber: '',
        driverName: '',
        route: '',
        capacity: 20,
        studentCount: 15,
      });
    }
  }, [vehicle]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'number' ? parseInt(value) : value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ ...formData, id: vehicle?.id });
  };

  return (
    <form ref={ref} onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="vehicleNumber">Vehicle Number</Label>
          <Input id="vehicleNumber" name="vehicleNumber" value={formData.vehicleNumber} onChange={handleChange} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="driverName">Driver Name</Label>
          <Input id="driverName" name="driverName" value={formData.driverName} onChange={handleChange} required />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="route">Route</Label>
        <textarea
          id="route"
          name="route"
          value={formData.route}
          onChange={handleChange}
          rows={3}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="capacity">Capacity</Label>
          <Input id="capacity" name="capacity" type="number" min="1" value={formData.capacity} onChange={handleChange} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="studentCount">Student Count</Label>
          <Input id="studentCount" name="studentCount" type="number" min="0" value={formData.studentCount} onChange={handleChange} required />
        </div>
      </div>
      <button type="submit" className="hidden">Submit</button>
    </form>
  );
});

VehicleForm.displayName = 'VehicleForm';

export default VehicleForm;
