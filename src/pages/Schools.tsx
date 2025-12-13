import React, { useState, useEffect } from 'react';
import { Building2, Plus, Edit, Globe, Mail, Phone, CheckCircle, XCircle, UserPlus } from 'lucide-react';
import { School } from '../types';
import { Button } from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { Select } from '../components/ui/Select';
import TableSkeleton from '../components/ui/TableSkeleton';
import { supabase } from '../lib/supabaseClient';
import toast from 'react-hot-toast';
import Badge from '../components/ui/Badge';
import ImageUpload from '../components/ui/ImageUpload';
import CreateSchoolAdminModal from '../components/schools/CreateSchoolAdminModal';

const Schools: React.FC = () => {
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    address: '',
    email: '',
    phone: '',
    website: '',
    subscription_plan: 'basic',
    is_active: true,
    logo_url: '' as string | undefined
  });
  const [imageFile, setImageFile] = useState<File | null>(null);

  useEffect(() => {
    fetchSchools();
  }, []);

  const fetchSchools = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('schools').select('*').order('created_at', { ascending: false });
    if (error) toast.error('Failed to load schools');
    else setSchools(data || []);
    setLoading(false);
  };

  const handleOpenModal = (school?: School) => {
    setImageFile(null);
    if (school) {
      setSelectedSchool(school);
      setFormData({
        name: school.name,
        address: school.address || '',
        email: school.email || '',
        phone: school.phone || '',
        website: school.website || '',
        subscription_plan: school.subscription_plan || 'basic',
        is_active: school.is_active,
        logo_url: school.logo_url
      });
    } else {
      setSelectedSchool(null);
      setFormData({
        name: '', address: '', email: '', phone: '', website: '', subscription_plan: 'basic', is_active: true, logo_url: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleOpenAdminModal = (school: School) => {
    setSelectedSchool(school);
    setIsAdminModalOpen(true);
  };

  const uploadLogo = async (file: File, schoolId: string): Promise<string | null> => {
    const fileExt = file.name.split('.').pop();
    const filePath = `school-logos/${schoolId}-${Date.now()}.${fileExt}`;
    const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file);
    if (uploadError) {
      toast.error(`Logo upload failed: ${uploadError.message}`);
      return null;
    }
    const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
    return data.publicUrl;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      let logoUrl = formData.logo_url;
      
      // If creating new, we need an ID for the image path, or use a temp one
      const tempId = selectedSchool?.id || `new-${Date.now()}`;

      if (imageFile) {
        const uploadedUrl = await uploadLogo(imageFile, tempId);
        if (uploadedUrl) logoUrl = uploadedUrl;
      }

      const payload = { ...formData, logo_url: logoUrl };

      if (selectedSchool) {
        const { error } = await supabase.from('schools').update(payload).eq('id', selectedSchool.id);
        if (error) throw error;
        toast.success('School updated successfully');
      } else {
        const { error } = await supabase.from('schools').insert(payload);
        if (error) throw error;
        toast.success('New school created successfully');
      }
      setIsModalOpen(false);
      fetchSchools();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <TableSkeleton title="Schools Management" headers={['Name', 'Contact', 'Plan', 'Status', 'Actions']} />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Schools</h1>
          <p className="text-slate-500">Manage multi-tenant school instances</p>
        </div>
        <Button onClick={() => handleOpenModal()}><Plus size={20} className="mr-2"/> Create School</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {schools.map(school => (
          <div key={school.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 overflow-hidden">
                  {school.logo_url ? (
                    <img src={school.logo_url} alt={school.name} className="w-full h-full object-cover" />
                  ) : (
                    <Building2 size={24} />
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-900">{school.name}</h3>
                  <Badge variant={school.is_active ? 'success' : 'danger'}>
                    {school.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => handleOpenModal(school)}><Edit size={16}/></Button>
            </div>

            <div className="space-y-2 text-sm text-slate-600 mb-4 flex-grow">
              {school.email && <div className="flex items-center gap-2"><Mail size={14}/> {school.email}</div>}
              {school.phone && <div className="flex items-center gap-2"><Phone size={14}/> {school.phone}</div>}
              {school.website && <div className="flex items-center gap-2"><Globe size={14}/> {school.website}</div>}
              <div className="mt-2 pt-2 border-t border-slate-100">
                <span className="text-xs text-slate-400 uppercase font-bold">Plan:</span> 
                <span className="ml-2 font-medium capitalize text-slate-800">{school.subscription_plan}</span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
                <Button 
                    variant="secondary" 
                    className="w-full text-xs" 
                    onClick={() => handleOpenAdminModal(school)}
                >
                    <UserPlus size={14} className="mr-2" /> Create Admin
                </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Edit/Create School Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={selectedSchool ? 'Edit School' : 'Create School'} footer={<><Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button><Button onClick={handleSave} loading={isSubmitting}>Save</Button></>}>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="flex justify-center mb-4">
            <div className="space-y-2 text-center">
              <Label>School Logo</Label>
              <ImageUpload 
                onFileChange={setImageFile} 
                initialPreviewUrl={formData.logo_url}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>School Name</Label>
            <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
          </div>
          <div className="space-y-2">
            <Label>Address</Label>
            <Input value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Email</Label><Input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} /></div>
            <div className="space-y-2"><Label>Phone</Label><Input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Subscription Plan</Label>
              <Select value={formData.subscription_plan} onChange={e => setFormData({...formData, subscription_plan: e.target.value})}>
                <option value="basic">Basic</option>
                <option value="pro">Pro</option>
                <option value="enterprise">Enterprise</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={formData.is_active ? 'true' : 'false'} onChange={e => setFormData({...formData, is_active: e.target.value === 'true'})}>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </Select>
            </div>
          </div>
          
        </form>
      </Modal>

      {/* Create Admin Modal */}
      <Modal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        title="Create School Admin"
      >
        {selectedSchool && (
            <CreateSchoolAdminModal 
                schoolId={selectedSchool.id}
                schoolName={selectedSchool.name}
                onClose={() => setIsAdminModalOpen(false)}
            />
        )}
      </Modal>
    </div>
  );
};

export default Schools;
