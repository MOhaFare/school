import React, { useState, useRef, useEffect } from 'react';
import { Search, Plus, Edit, Trash2, Calendar, Clock, MapPin } from 'lucide-react';
import { Event } from '../types';
import Modal from '../components/ui/Modal';
import { Button } from '../components/ui/Button';
import EventForm from '../components/events/EventForm';
import CardGridSkeleton from '../components/ui/CardGridSkeleton';
import { supabase } from '../lib/supabaseClient';
import toast from 'react-hot-toast';
import { useGlobal } from '../context/GlobalContext';

const Events: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { createNotification, profile } = useGlobal();

  const formRef = useRef<HTMLFormElement>(null);
  const canManage = ['system_admin', 'admin', 'principal', 'teacher'].includes(profile?.role || '');

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.from('events').select('*').order('date', { ascending: false });
        if (error) throw error;
        setEvents(data);
      } catch (error: any) {
        toast.error(`Failed to fetch events: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  const filteredEvents = events.filter(event =>
    event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAdd = () => {
    setSelectedEvent(null);
    setModalOpen(true);
  };

  const handleEdit = (event: Event) => {
    setSelectedEvent(event);
    setModalOpen(true);
  };

  const handleDelete = (event: Event) => {
    setSelectedEvent(event);
    setDeleteModalOpen(true);
  };

  const handleSaveEvent = async (formData: Omit<Event, 'id' | 'created_at'> & { id?: string }) => {
    setIsSubmitting(true);
    await toast.promise(
      (async () => {
        if (formData.id) {
          const { data, error } = await supabase.from('events').update(formData).eq('id', formData.id).select().single();
          if (error) throw error;
          setEvents(prev => prev.map(e => e.id === formData.id ? data : e));
        } else {
          const { data, error } = await supabase.from('events').insert(formData).select().single();
          if (error) throw error;
          setEvents(prev => [data, ...prev]);

          const { data: usersToNotify } = await supabase.from('profiles').select('id');
           if (usersToNotify) {
            const notifications = usersToNotify.map(u => ({
              user_id: u.id,
              title: `New Event: ${formData.title}`,
              message: `An event has been scheduled on ${formData.date} at ${formData.location}.`,
              type: 'event' as const,
              link_to: '/events'
            }));
            await Promise.all(notifications.map(n => createNotification(n)));
          }
        }
      })(),
      {
        loading: 'Saving event...',
        success: 'Event saved successfully!',
        error: (err) => `Failed to save event: ${err.message}`,
      }
    );
    setIsSubmitting(false);
    setModalOpen(false);
  };

  const handleConfirmDelete = async () => {
    if (selectedEvent) {
      setIsSubmitting(true);
      await toast.promise(
        (async () => {
          const { error } = await supabase.from('events').delete().eq('id', selectedEvent.id);
          if (error) throw error;
          setEvents(prev => prev.filter(e => e.id !== selectedEvent.id));
        })(),
        {
          loading: 'Deleting event...',
          success: 'Event deleted successfully!',
          error: (err) => `Failed to delete event: ${err.message}`,
        }
      );
      setIsSubmitting(false);
      setDeleteModalOpen(false);
      setSelectedEvent(null);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'academic': return 'bg-blue-100 text-blue-800';
      case 'sports': return 'bg-green-100 text-green-800';
      case 'cultural': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <CardGridSkeleton title="Events" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Events</h1>
          <p className="text-gray-600 mt-1">Manage school events and activities</p>
        </div>
        {canManage && (
          <Button onClick={handleAdd}>
            <Plus size={20} className="mr-2" />
            Create Event
          </Button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search events by title or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEvents.map((event) => (
          <div key={event.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col">
            <div className="flex items-start justify-between mb-3">
              <h3 className="font-semibold text-gray-900 text-lg flex-grow pr-2">{event.title}</h3>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(event.type)}`}>
                {event.type}
              </span>
            </div>

            <div className="space-y-2 text-sm text-gray-600 mb-4">
              <div className="flex items-center"><Calendar size={14} className="mr-2 text-gray-400" /> {event.date}</div>
              <div className="flex items-center"><Clock size={14} className="mr-2 text-gray-400" /> {event.time}</div>
              <div className="flex items-center"><MapPin size={14} className="mr-2 text-gray-400" /> {event.location}</div>
            </div>

            <p className="text-sm text-gray-500 flex-grow mb-4">{event.description.substring(0, 100)}...</p>

            {canManage && (
              <div className="pt-4 border-t border-gray-100 mt-auto flex items-center justify-end">
                <Button variant="ghost" size="icon" onClick={() => handleEdit(event)}><Edit className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(event)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
              </div>
            )}
          </div>
        ))}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
        title={selectedEvent ? 'Edit Event' : 'Create New Event'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={() => formRef.current?.requestSubmit()} loading={isSubmitting}>
              {selectedEvent ? 'Save Changes' : 'Create Event'}
            </Button>
          </>
        }
      >
        <EventForm ref={formRef} event={selectedEvent} onSubmit={handleSaveEvent} />
      </Modal>

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Event"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteModalOpen(false)}>Cancel</Button>
            <Button variant="danger" onClick={handleConfirmDelete} loading={isSubmitting}>Delete</Button>
          </>
        }
      >
        <p>Are you sure you want to delete the event <strong>"{selectedEvent?.title}"</strong>? This action cannot be undone.</p>
      </Modal>
    </div>
  );
};

export default Events;
