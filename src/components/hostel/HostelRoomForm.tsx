import React, { useState, useEffect, forwardRef } from 'react';
import { HostelRoom, Student } from '../../types';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { Select } from '../ui/Select';

interface HostelRoomFormProps {
  room?: HostelRoom | null;
  students: Student[];
  onSubmit: (data: Omit<HostelRoom, 'id'> & { id?: string }) => void;
}

const HostelRoomForm = forwardRef<HTMLFormElement, HostelRoomFormProps>(({ room, students, onSubmit }, ref) => {
  const [formData, setFormData] = useState({
    roomNumber: '',
    building: 'North Wing',
    capacity: 2,
    occupants: [] as string[],
    status: 'available' as 'available' | 'full' | 'maintenance',
  });

  useEffect(() => {
    if (room) {
      setFormData(room);
    } else {
      setFormData({
        roomNumber: '',
        building: 'North Wing',
        capacity: 2,
        occupants: [],
        status: 'available',
      });
    }
  }, [room]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'number' ? parseInt(value) : value }));
  };
  
  const handleOccupantsChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
    setFormData(prev => ({ ...prev, occupants: selectedOptions }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ ...formData, id: room?.id });
  };

  return (
    <form ref={ref} onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="roomNumber">Room Number</Label>
          <Input id="roomNumber" name="roomNumber" value={formData.roomNumber} onChange={handleChange} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="building">Building</Label>
          <Select id="building" name="building" value={formData.building} onChange={handleChange}>
            <option>North Wing</option>
            <option>South Wing</option>
            <option>East Wing</option>
            <option>West Wing</option>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="capacity">Capacity</Label>
          <Input id="capacity" name="capacity" type="number" min="1" max="4" value={formData.capacity} onChange={handleChange} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select id="status" name="status" value={formData.status} onChange={handleChange}>
            <option value="available">Available</option>
            <option value="full">Full</option>
            <option value="maintenance">Maintenance</option>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="occupants">Occupants</Label>
        <Select id="occupants" name="occupants" value={formData.occupants} onChange={handleOccupantsChange} multiple className="h-32">
          {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </Select>
        <p className="text-xs text-muted-foreground">Hold Ctrl/Cmd to select multiple students.</p>
      </div>
      <button type="submit" className="hidden">Submit</button>
    </form>
  );
});

HostelRoomForm.displayName = 'HostelRoomForm';

export default HostelRoomForm;
