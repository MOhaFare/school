import React, { useState, useRef, useEffect } from 'react';
import { Search, Plus, Edit, Trash2, User, Calendar } from 'lucide-react';
import { Notice } from '../types';
import Modal from '../components/ui/Modal';
import { Button } from '../components/ui/Button';
import NoticeForm from '../components/noticeboard/NoticeForm';
import CardGridSkeleton from '../components/ui/CardGridSkeleton';
import { supabase } from '../lib/supabaseClient';
import toast from 'react-hot-toast';
import { useGlobal } from '../context/GlobalContext';

const Noticeboard: React.FC = () => {
  const { profile, createNotification } = useGlobal();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setModalOpen] = useState(false);
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formRef = useRef<HTMLFormElement>(null);
  const canManage = ['system_admin', 'admin', 'principal', 'teacher'].includes(profile?.role || '');

  useEffect(() => {
    const fetchNotices = async () => {
      if (!profile?.school_id) return;
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('notices')
          .select('*')
          .eq('school_id', profile.school_id)
          .order('date', { ascending: false });
          
        if (error) throw error;
        setNotices(data);
      } catch (error: any) {
        toast.error(`Failed to fetch notices: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };
    fetchNotices();
  }, [profile]);

  const filteredNotices = notices.filter(n =>
    n.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAdd = () => {
    setSelectedNotice(null);
    setModalOpen(true);
  };

  const handleEdit = (notice: Notice) => {
    setSelectedNotice(notice);
    setModalOpen(true);
  };

  const handleDelete = (notice: Notice) => {
    setSelectedNotice(notice);
    setDeleteModalOpen(true);
  };

  const handleSaveNotice = async (formData: Omit<Notice, 'id' | 'authorName' | 'created_at'> & { id?: string }) => {
    setIsSubmitting(true);
    await toast.promise(
      (async () => {
        const noticeToSave = {
          ...formData,
          author_name: profile?.name || 'Admin',
          school_id: profile?.school_id
        };

        if (formData.id) {
          const { data, error } = await supabase.from('notices').update(noticeToSave).eq('id', formData.id).select().single();
          if (error) throw error;
          setNotices(prev => prev.map(n => n.id === formData.id ? data : n));
        } else {
          const { data, error } = await supabase.from('notices').insert(noticeToSave).select().single();
          if (error) throw error;
          setNotices(prev => [data, ...prev]);

          // Notify Logic (Simplified for demo)
          // In a real app, you'd fetch users from the same school
        }
      })(),
      {
        loading: 'Saving notice...',
        success: 'Notice saved successfully!',
        error: (err) => `Failed to save notice: ${err.message}`,
      }
    );
    setIsSubmitting(false);
    setModalOpen(false);
  };

  const handleConfirmDelete = async () => {
    if (selectedNotice) {
      setIsSubmitting(true);
      await toast.promise(
        (async () => {
          const { error } = await supabase.from('notices').delete().eq('id', selectedNotice.id);
          if (error) throw error;
          setNotices(prev => prev.filter(n => n.id !== selectedNotice.id));
        })(),
        {
          loading: 'Deleting notice...',
          success: 'Notice deleted successfully!',
          error: (err) => `Failed to delete notice: ${err.message}`,
        }
      );
      setIsSubmitting(false);
      setDeleteModalOpen(false);
      setSelectedNotice(null);
    }
  };

  if (loading) {
    return <CardGridSkeleton title="Noticeboard" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Noticeboard</h1>
          <p className="text-gray-600 mt-1">Manage school announcements and notices</p>
        </div>
        {canManage && (
          <Button onClick={handleAdd}>
            <Plus size={20} className="mr-2" />
            Post Notice
          </Button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search notices by title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
          />
        </div>
      </div>

      <div className="space-y-4">
        {filteredNotices.map((notice) => (
          <div key={notice.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-semibold text-gray-900 text-lg">{notice.title}</h3>
              {canManage && (
                <div className="flex items-center">
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(notice)}><Edit className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(notice)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                </div>
              )}
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                <div className="flex items-center"><User size={12} className="mr-1"/>{notice.authorName}</div>
                <div className="flex items-center"><Calendar size={12} className="mr-1"/>{notice.date}</div>
                <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">For: {notice.audience}</span>
            </div>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">{notice.content}</p>
          </div>
        ))}
        {filteredNotices.length === 0 && <div className="text-center py-12 text-gray-500">No notices found.</div>}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
        title={selectedNotice ? 'Edit Notice' : 'Post New Notice'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={() => formRef.current?.requestSubmit()} loading={isSubmitting}>
              {selectedNotice ? 'Save Changes' : 'Post Notice'}
            </Button>
          </>
        }
      >
        <NoticeForm ref={formRef} notice={selectedNotice} onSubmit={handleSaveNotice} />
      </Modal>

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Notice"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteModalOpen(false)}>Cancel</Button>
            <Button variant="danger" onClick={handleConfirmDelete} loading={isSubmitting}>Delete</Button>
          </>
        }
      >
        <p>Are you sure you want to delete the notice <strong>"{selectedNotice?.title}"</strong>? This action cannot be undone.</p>
      </Modal>
    </div>
  );
};

export default Noticeboard;
