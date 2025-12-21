import React, { useState, useEffect } from 'react';
import { Users, Calendar, Plus, Search, MapPin, Clock, Trash2, Edit } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import Modal from '../components/ui/Modal';
import TableSkeleton from '../components/ui/TableSkeleton';
import { supabase } from '../lib/supabaseClient';
import toast from 'react-hot-toast';
import { formatDate } from '../utils/format';
import { Student } from '../types';
import { useGlobal } from '../context/GlobalContext';

const Alumni: React.FC = () => {
  const { profile } = useGlobal();
  const [activeTab, setActiveTab] = useState<'list' | 'events'>('list');
  const [alumni, setAlumni] = useState<Student[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Event Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [eventForm, setEventForm] = useState({
    title: '', event_date: '', time: '', location: '', description: ''
  });

  useEffect(() => {
    fetchData();
  }, [activeTab, profile]);

  const fetchData = async () => {
    if (!profile?.school_id) return;
    setLoading(true);
    try {
      if (activeTab === 'list') {
        const { data, error } = await supabase
          .from('students')
          .select('*')
          .eq('school_id', profile.school_id)
          .eq('status', 'alumni')
          .order('name');
        if (error) throw error;
        setAlumni(data.map((s: any) => ({
            id: s.id,
            name: s.name,
            email: s.email,
            phone: s.phone,
            class: s.class, // Graduating class
            section: s.section,
            status: s.status,
            // ... map other fields if needed
        } as Student)));
      } else {
        const { data, error } = await supabase
          .from('alumni_events')
          .select('*')
          .eq('school_id', profile.school_id)
          .order('event_date', { ascending: false });
        if (error) throw error;
        setEvents(data || []);
      }
    } catch (error: any) {
      toast.error(`Failed to load data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (event?: any) => {
    setSelectedEvent(event || null);
    if (event) {
      setEventForm(event);
    } else {
      setEventForm({
        title: '', event_date: new Date().toISOString().split('T')[0], time: '10:00', location: '', description: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = { ...eventForm, school_id: profile?.school_id };
      
      if (selectedEvent) {
        const { error } = await supabase.from('alumni_events').update(payload).eq('id', selectedEvent.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('alumni_events').insert(payload);
        if (error) throw error;
      }
      toast.success('Event saved');
      setIsModalOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDeleteEvent = async (id: string) => {
    if (!confirm('Delete this event?')) return;
    const { error } = await supabase.from('alumni_events').delete().eq('id', id);
    if (error) toast.error(error.message);
    else {
      toast.success('Deleted');
      setEvents(prev => prev.filter(e => e.id !== id));
    }
  };

  const filteredAlumni = alumni.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Alumni Management</h1>
          <p className="text-slate-500">Manage former students and events</p>
        </div>
        <div className="flex bg-white rounded-lg p-1 border border-slate-200">
            <button 
                onClick={() => setActiveTab('list')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'list' ? 'bg-blue-100 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}
            >
                <Users size={16} className="inline mr-2"/> Alumni List
            </button>
            <button 
                onClick={() => setActiveTab('events')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'events' ? 'bg-blue-100 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}
            >
                <Calendar size={16} className="inline mr-2"/> Events
            </button>
        </div>
      </div>

      {activeTab === 'list' ? (
        <div className="space-y-4">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input 
                        type="text" 
                        placeholder="Search alumni..." 
                        value={searchTerm} 
                        onChange={e => setSearchTerm(e.target.value)} 
                        className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg"
                    />
                </div>
            </div>
            
            {loading ? <TableSkeleton title="Alumni" headers={['Name', 'Phone', 'Email', 'Graduated Class']} /> : (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Phone</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Email</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Graduated From</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {filteredAlumni.map(s => (
                                <tr key={s.id} className="hover:bg-slate-50">
                                    <td className="px-6 py-4 font-medium text-slate-900">{s.name}</td>
                                    <td className="px-6 py-4 text-slate-600">{s.phone}</td>
                                    <td className="px-6 py-4 text-slate-600">{s.email}</td>
                                    <td className="px-6 py-4 text-slate-600">Class {s.class}-{s.section}</td>
                                </tr>
                            ))}
                            {filteredAlumni.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-slate-500">No alumni records found.</td></tr>}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
      ) : (
        <div className="space-y-4">
            <div className="flex justify-end">
                <Button onClick={() => handleOpenModal()}><Plus size={20} className="mr-2"/> Add Event</Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {events.map(event => (
                    <div key={event.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="font-bold text-lg text-slate-900">{event.title}</h3>
                            <div className="flex gap-1">
                                <button onClick={() => handleOpenModal(event)} className="p-1 text-slate-400 hover:text-blue-600"><Edit size={16}/></button>
                                <button onClick={() => handleDeleteEvent(event.id)} className="p-1 text-slate-400 hover:text-red-600"><Trash2 size={16}/></button>
                            </div>
                        </div>
                        <div className="space-y-2 text-sm text-slate-600 mb-4">
                            <div className="flex items-center gap-2"><Calendar size={14}/> {formatDate(event.event_date)}</div>
                            <div className="flex items-center gap-2"><Clock size={14}/> {event.time}</div>
                            <div className="flex items-center gap-2"><MapPin size={14}/> {event.location}</div>
                        </div>
                        <p className="text-sm text-slate-500">{event.description}</p>
                    </div>
                ))}
                {events.length === 0 && <div className="col-span-full text-center py-12 text-slate-500">No events scheduled.</div>}
            </div>
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={selectedEvent ? 'Edit Event' : 'Add Alumni Event'} footer={<><Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button><Button onClick={handleSaveEvent}>Save</Button></>}>
        <form onSubmit={handleSaveEvent} className="space-y-4">
            <div className="space-y-2"><Label>Event Title</Label><Input value={eventForm.title} onChange={e => setEventForm({...eventForm, title: e.target.value})} required /></div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Date</Label><Input type="date" value={eventForm.event_date} onChange={e => setEventForm({...eventForm, event_date: e.target.value})} required /></div>
                <div className="space-y-2"><Label>Time</Label><Input type="time" value={eventForm.time} onChange={e => setEventForm({...eventForm, time: e.target.value})} /></div>
            </div>
            <div className="space-y-2"><Label>Location</Label><Input value={eventForm.location} onChange={e => setEventForm({...eventForm, location: e.target.value})} /></div>
            <div className="space-y-2"><Label>Description</Label><textarea className="w-full rounded-md border border-slate-300 p-2 text-sm" rows={3} value={eventForm.description} onChange={e => setEventForm({...eventForm, description: e.target.value})} /></div>
        </form>
      </Modal>
    </div>
  );
};

export default Alumni;
