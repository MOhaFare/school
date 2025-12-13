import React, { useState, useEffect } from 'react';
import { Box, Plus, Search, RotateCcw, Trash2, User } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import { Label } from '../components/ui/Label';
import { Select } from '../components/ui/Select';
import { supabase } from '../lib/supabaseClient';
import toast from 'react-hot-toast';
import TableSkeleton from '../components/ui/TableSkeleton';
import { formatDate } from '../utils/format';
import Badge from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';

interface InventoryIssueRecord {
  id: string;
  item_id: string;
  item_name: string;
  issued_to: string;
  quantity: number;
  issue_date: string;
  return_date: string | null;
  status: 'issued' | 'returned' | 'consumed';
}

const InventoryIssue: React.FC = () => {
  const [issues, setIssues] = useState<InventoryIssueRecord[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<InventoryIssueRecord | null>(null);
  const [formData, setFormData] = useState({
    item_id: '',
    issued_to: '',
    quantity: 1,
    issue_date: new Date().toISOString().split('T')[0],
    status: 'issued' as 'issued' | 'returned' | 'consumed'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [issuesRes, itemsRes] = await Promise.all([
        supabase.from('inventory_issues').select('*, inventory_items(name)').order('issue_date', { ascending: false }),
        supabase.from('inventory_items').select('id, name, quantity').gt('quantity', 0)
      ]);

      if (issuesRes.error) throw issuesRes.error;
      if (itemsRes.error) throw itemsRes.error;

      setItems(itemsRes.data || []);
      setIssues(issuesRes.data?.map((i: any) => ({
        ...i,
        item_name: i.inventory_items?.name || 'Unknown Item'
      })) || []);

    } catch (error: any) {
      toast.error(`Failed to load data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (issue?: InventoryIssueRecord) => {
    if (issue) {
      setSelectedIssue(issue);
      setFormData({
        item_id: issue.item_id,
        issued_to: issue.issued_to,
        quantity: issue.quantity,
        issue_date: issue.issue_date,
        status: issue.status
      });
    } else {
      setSelectedIssue(null);
      setFormData({
        item_id: items[0]?.id || '',
        issued_to: '',
        quantity: 1,
        issue_date: new Date().toISOString().split('T')[0],
        status: 'issued'
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    try {
      if (selectedIssue) {
        const { error } = await supabase.from('inventory_issues').update(formData).eq('id', selectedIssue.id);
        if (error) throw error;
      } else {
        // Check stock
        const item = items.find(i => i.id === formData.item_id);
        if (item && item.quantity < formData.quantity) {
          toast.error(`Insufficient stock. Only ${item.quantity} available.`);
          return;
        }

        const { error } = await supabase.from('inventory_issues').insert(formData);
        if (error) throw error;

        // Update stock
        await supabase.rpc('decrement_inventory_stock', { 
          item_id: formData.item_id, 
          qty: formData.quantity 
        });
      }
      
      toast.success(selectedIssue ? 'Record updated' : 'Item issued successfully');
      setIsModalOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleReturn = async (issue: InventoryIssueRecord) => {
    try {
      const { error } = await supabase.from('inventory_issues').update({
        status: 'returned',
        return_date: new Date().toISOString().split('T')[0]
      }).eq('id', issue.id);
      
      if (error) throw error;

      // Return stock
      await supabase.rpc('increment_inventory_stock', { 
        item_id: issue.item_id, 
        qty: issue.quantity 
      });

      toast.success('Item marked as returned');
      fetchData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure?')) return;
    try {
      const { error } = await supabase.from('inventory_issues').delete().eq('id', id);
      if (error) throw error;
      toast.success('Record deleted');
      setIssues(prev => prev.filter(i => i.id !== id));
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const filteredIssues = issues.filter(i => 
    i.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.issued_to.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <TableSkeleton title="Inventory Issue" headers={['Item', 'Issued To', 'Quantity', 'Date', 'Status', 'Actions']} />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Issue Items</h1>
          <p className="text-slate-500">Distribute inventory to staff or students</p>
        </div>
        <Button onClick={() => handleOpenModal()}><Plus size={20} className="mr-2"/> Issue Item</Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="Search by item or person..." 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)} 
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Item</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Issued To</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Quantity</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filteredIssues.map(issue => (
              <tr key={issue.id} className="hover:bg-slate-50">
                <td className="px-6 py-4 font-medium text-slate-900">{issue.item_name}</td>
                <td className="px-6 py-4 text-slate-600 flex items-center gap-2">
                  <User size={14} className="text-slate-400"/> {issue.issued_to}
                </td>
                <td className="px-6 py-4 text-slate-600">{issue.quantity}</td>
                <td className="px-6 py-4 text-slate-600">{formatDate(issue.issue_date)}</td>
                <td className="px-6 py-4">
                  <Badge variant={issue.status === 'returned' ? 'success' : issue.status === 'consumed' ? 'neutral' : 'warning'} className="capitalize">
                    {issue.status}
                  </Badge>
                </td>
                <td className="px-6 py-4 text-right flex justify-end gap-2">
                  {issue.status === 'issued' && (
                    <Button variant="secondary" size="sm" onClick={() => handleReturn(issue)}>
                      <RotateCcw size={14} className="mr-1"/> Return
                    </Button>
                  )}
                  <button onClick={() => handleDelete(issue.id)} className="text-slate-400 hover:text-red-600 p-1"><Trash2 size={16}/></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredIssues.length === 0 && <EmptyState title="No records found" description="No items have been issued yet." icon={Box} />}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={selectedIssue ? 'Edit Record' : 'Issue Item'} footer={<><Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button><Button onClick={handleSave}>Save</Button></>}>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Item</Label>
            <Select value={formData.item_id} onChange={e => setFormData({...formData, item_id: e.target.value})} disabled={!!selectedIssue}>
              {items.map(i => <option key={i.id} value={i.id}>{i.name} ({i.quantity} in stock)</option>)}
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Issued To (Name/ID)</Label>
            <Input value={formData.issued_to} onChange={e => setFormData({...formData, issued_to: e.target.value})} placeholder="e.g. John Doe" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Quantity</Label><Input type="number" min="1" value={formData.quantity} onChange={e => setFormData({...formData, quantity: parseInt(e.target.value)})} /></div>
            <div className="space-y-2"><Label>Date</Label><Input type="date" value={formData.issue_date} onChange={e => setFormData({...formData, issue_date: e.target.value})} /></div>
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as any})}>
              <option value="issued">Issued (Returnable)</option>
              <option value="consumed">Consumed (Non-returnable)</option>
              <option value="returned">Returned</option>
            </Select>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default InventoryIssue;
