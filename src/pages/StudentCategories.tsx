import React, { useState, useEffect } from 'react';
import { Tag, Plus, Edit, Trash2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import Modal from '../components/ui/Modal';
import TableSkeleton from '../components/ui/TableSkeleton';
import { supabase } from '../lib/supabaseClient';
import toast from 'react-hot-toast';

interface Category {
  id: string;
  name: string;
}

const StudentCategories: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [categoryName, setCategoryName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('student_categories').select('*').order('name');
    if (error) toast.error('Failed to load categories');
    else setCategories(data || []);
    setLoading(false);
  };

  const handleOpenModal = (category?: Category) => {
    setSelectedCategory(category || null);
    setCategoryName(category?.name || '');
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (selectedCategory) {
        const { error } = await supabase.from('student_categories').update({ name: categoryName }).eq('id', selectedCategory.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('student_categories').insert({ name: categoryName });
        if (error) throw error;
      }
      toast.success('Category saved successfully');
      setModalOpen(false);
      fetchCategories();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return;
    const { error } = await supabase.from('student_categories').delete().eq('id', id);
    if (error) toast.error(error.message);
    else {
      toast.success('Category deleted');
      setCategories(prev => prev.filter(c => c.id !== id));
    }
  };

  if (loading) return <TableSkeleton title="Student Categories" headers={['Category Name', 'Actions']} />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Student Categories</h1>
          <p className="text-slate-500">Manage student classifications (e.g., General, Scholarship)</p>
        </div>
        <Button onClick={() => handleOpenModal()}><Plus size={20} className="mr-2"/> Add Category</Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden max-w-3xl">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase w-full">Category Name</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase w-32">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {categories.map(category => (
              <tr key={category.id} className="hover:bg-slate-50">
                <td className="px-6 py-4 font-medium text-slate-900 flex items-center gap-2">
                    <Tag size={16} className="text-blue-500" />
                    {category.name}
                </td>
                <td className="px-6 py-4 text-right flex justify-end gap-2">
                  <Button variant="ghost" size="icon" onClick={() => handleOpenModal(category)}><Edit size={16}/></Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(category.id)}><Trash2 size={16} className="text-red-500"/></Button>
                </td>
              </tr>
            ))}
            {categories.length === 0 && <tr><td colSpan={2} className="px-6 py-8 text-center text-slate-500">No categories found.</td></tr>}
          </tbody>
        </table>
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setModalOpen(false)} 
        title={selectedCategory ? 'Edit Category' : 'Add Category'} 
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} loading={isSubmitting}>Save</Button>
          </>
        }
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-2">
            <Label>Category Name</Label>
            <Input value={categoryName} onChange={e => setCategoryName(e.target.value)} placeholder="e.g. General, Sibling, Staff Child" required />
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default StudentCategories;
