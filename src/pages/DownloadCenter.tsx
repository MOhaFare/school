import React, { useState, useEffect } from 'react';
import { Download, Upload, Trash2, FileText, Book } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { Select } from '../components/ui/Select';
import Modal from '../components/ui/Modal';
import TableSkeleton from '../components/ui/TableSkeleton';
import { supabase } from '../lib/supabaseClient';
import toast from 'react-hot-toast';
import { formatDate } from '../utils/format';
import { useGlobal } from '../context/GlobalContext';

const DownloadCenter: React.FC = () => {
  const { profile } = useGlobal();
  const [contents, setContents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '', type: 'assignment', class: '', upload_date: new Date().toISOString().split('T')[0], description: '', file_url: ''
  });
  const [file, setFile] = useState<File | null>(null);

  const canUpload = ['system_admin', 'admin', 'principal', 'teacher'].includes(profile?.role || '');

  useEffect(() => {
    fetchContents();
  }, []);

  const fetchContents = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('contents').select('*').order('upload_date', { ascending: false });
    if (error) toast.error('Failed to load contents');
    else setContents(data || []);
    setLoading(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let fileUrl = formData.file_url;
      if (file) {
        const fileExt = file.name.split('.').pop();
        const filePath = `downloads/${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file); // Reusing avatars bucket for demo
        if (uploadError) throw uploadError;
        const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
        fileUrl = data.publicUrl;
      }

      const { error } = await supabase.from('contents').insert({ ...formData, file_url: fileUrl });
      if (error) throw error;
      
      toast.success('Content uploaded');
      setModalOpen(false);
      fetchContents();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure?')) return;
    const { error } = await supabase.from('contents').delete().eq('id', id);
    if (error) toast.error(error.message);
    else {
      toast.success('Deleted');
      setContents(prev => prev.filter(c => c.id !== id));
    }
  };

  if (loading) return <TableSkeleton title="Download Center" headers={['Title', 'Type', 'Class', 'Date', 'Actions']} />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Download Center</h1>
          <p className="text-slate-500">Assignments, Syllabus, and Study Materials</p>
        </div>
        {canUpload && (
          <Button onClick={() => setModalOpen(true)}><Upload size={18} className="mr-2"/> Upload Content</Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {contents.map(content => (
          <div key={content.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
                {content.type === 'assignment' ? <FileText size={24} /> : <Book size={24} />}
              </div>
              <div className="flex gap-2">
                {content.file_url && (
                  <a href={content.file_url} target="_blank" rel="noopener noreferrer" className="p-2 text-slate-400 hover:text-blue-600 rounded-full hover:bg-blue-50 transition-colors">
                    <Download size={18} />
                  </a>
                )}
                {canUpload && (
                  <button onClick={() => handleDelete(content.id)} className="p-2 text-slate-400 hover:text-red-600 rounded-full hover:bg-red-50 transition-colors"><Trash2 size={18}/></button>
                )}
              </div>
            </div>
            <h3 className="font-bold text-lg text-slate-900 mb-1">{content.title}</h3>
            <div className="flex gap-2 mb-4">
                <span className="text-xs font-medium px-2 py-1 bg-slate-100 rounded text-slate-600 capitalize">{content.type.replace('_', ' ')}</span>
                {content.class && <span className="text-xs font-medium px-2 py-1 bg-slate-100 rounded text-slate-600">Class {content.class}</span>}
            </div>
            <p className="text-sm text-slate-500 mb-4 flex-grow">{content.description}</p>
            <div className="text-xs text-slate-400 pt-4 border-t border-slate-100">
                Uploaded: {formatDate(content.upload_date)}
            </div>
          </div>
        ))}
        {contents.length === 0 && (
            <div className="col-span-full text-center py-12 text-slate-500">No content available for download.</div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setModalOpen(false)} title="Upload Content" footer={<><Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button><Button onClick={handleSave}>Upload</Button></>}>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-2"><Label>Title</Label><Input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required /></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Type</Label><Select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}><option value="assignment">Assignment</option><option value="syllabus">Syllabus</option><option value="study_material">Study Material</option><option value="other">Other</option></Select></div>
            <div className="space-y-2"><Label>Class (Optional)</Label><Input value={formData.class} onChange={e => setFormData({...formData, class: e.target.value})} placeholder="e.g. 10" /></div>
          </div>
          <div className="space-y-2"><Label>Description</Label><Input value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} /></div>
          <div className="space-y-2"><Label>File</Label><Input type="file" onChange={handleFileChange} required /></div>
        </form>
      </Modal>
    </div>
  );
};

export default DownloadCenter;
