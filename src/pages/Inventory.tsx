import React, { useState, useEffect } from 'react';
import { Box, Plus, Search, Edit, Trash2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import { Label } from '../components/ui/Label';
import { Select } from '../components/ui/Select';
import { supabase } from '../lib/supabaseClient';
import toast from 'react-hot-toast';
import TableSkeleton from '../components/ui/TableSkeleton';
import { formatCurrency } from '../utils/format';
import { useGlobal } from '../context/GlobalContext';

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit_price: number;
  supplier: string;
  purchase_date: string;
}

const Inventory: React.FC = () => {
  const { profile } = useGlobal();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [formData, setFormData] = useState({
    name: '', category: 'Stationery', quantity: 0, unit_price: 0, supplier: '', purchase_date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchItems();
  }, [profile]);

  const fetchItems = async () => {
    if (!profile?.school_id) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('inventory_items')
      .select('*')
      .eq('school_id', profile.school_id)
      .order('name');
      
    if (error) toast.error('Failed to load inventory');
    else setItems(data || []);
    setLoading(false);
  };

  const handleSave = async () => {
    try {
      const payload = { ...formData, school_id: profile?.school_id };
      
      if (selectedItem) {
        const { error } = await supabase.from('inventory_items').update(payload).eq('id', selectedItem.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('inventory_items').insert(payload);
        if (error) throw error;
      }
      toast.success(selectedItem ? 'Item updated' : 'Item added');
      setIsModalOpen(false);
      fetchItems();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure?')) return;
    const { error } = await supabase.from('inventory_items').delete().eq('id', id);
    if (error) toast.error(error.message);
    else {
      toast.success('Item deleted');
      setItems(prev => prev.filter(i => i.id !== id));
    }
  };

  const openModal = (item?: InventoryItem) => {
    setSelectedItem(item || null);
    if (item) {
      setFormData({
        name: item.name, category: item.category, quantity: item.quantity,
        unit_price: item.unit_price, supplier: item.supplier, purchase_date: item.purchase_date
      });
    } else {
      setFormData({
        name: '', category: 'Stationery', quantity: 0, unit_price: 0, supplier: '', purchase_date: new Date().toISOString().split('T')[0]
      });
    }
    setIsModalOpen(true);
  };

  const filteredItems = items.filter(i => i.name.toLowerCase().includes(searchTerm.toLowerCase()));

  if (loading) return <TableSkeleton title="Inventory" headers={['Item', 'Category', 'Stock', 'Value', 'Supplier', 'Actions']} />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Inventory</h1>
          <p className="text-slate-500">Manage school assets and stock</p>
        </div>
        <Button onClick={() => openModal()}><Plus size={20} className="mr-2"/> Add Item</Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input type="text" placeholder="Search items..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg" />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Item Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Quantity</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Unit Price</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Supplier</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filteredItems.map(item => (
              <tr key={item.id} className="hover:bg-slate-50">
                <td className="px-6 py-4 font-medium text-slate-900">{item.name}</td>
                <td className="px-6 py-4 text-slate-600">{item.category}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${item.quantity < 10 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                    {item.quantity}
                  </span>
                </td>
                <td className="px-6 py-4 text-slate-600">{formatCurrency(item.unit_price)}</td>
                <td className="px-6 py-4 text-slate-600">{item.supplier}</td>
                <td className="px-6 py-4 text-right flex justify-end gap-2">
                  <Button variant="ghost" size="icon" onClick={() => openModal(item)}><Edit size={16} /></Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}><Trash2 size={16} className="text-red-500" /></Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={selectedItem ? 'Edit Item' : 'Add Item'} footer={<><Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button><Button onClick={handleSave}>Save</Button></>}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Name</Label><Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} /></div>
            <div className="space-y-2"><Label>Category</Label><Select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}><option>Stationery</option><option>Furniture</option><option>Electronics</option><option>Sports</option></Select></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Quantity</Label><Input type="number" value={formData.quantity} onChange={e => setFormData({...formData, quantity: parseInt(e.target.value)})} /></div>
            <div className="space-y-2"><Label>Unit Price</Label><Input type="number" value={formData.unit_price} onChange={e => setFormData({...formData, unit_price: parseFloat(e.target.value)})} /></div>
          </div>
          <div className="space-y-2"><Label>Supplier</Label><Input value={formData.supplier} onChange={e => setFormData({...formData, supplier: e.target.value})} /></div>
          <div className="space-y-2"><Label>Purchase Date</Label><Input type="date" value={formData.purchase_date} onChange={e => setFormData({...formData, purchase_date: e.target.value})} /></div>
        </div>
      </Modal>
    </div>
  );
};

export default Inventory;
