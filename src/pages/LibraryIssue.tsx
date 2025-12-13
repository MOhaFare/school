import React, { useState, useEffect } from 'react';
import { BookOpen, Plus, CheckCircle, RotateCcw, Edit, Trash2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { supabase } from '../lib/supabaseClient';
import toast from 'react-hot-toast';
import TableSkeleton from '../components/ui/TableSkeleton';
import { formatDate } from '../utils/format';
import Modal from '../components/ui/Modal';
import { Label } from '../components/ui/Label';
import { Select } from '../components/ui/Select';
import { Input } from '../components/ui/Input';

interface IssueRecord {
  id: string;
  book_id: string;
  student_id: string;
  book_title: string;
  student_name: string;
  issue_date: string;
  due_date: string;
  return_date: string | null;
  status: string;
}

const LibraryIssue: React.FC = () => {
  const [issues, setIssues] = useState<IssueRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<IssueRecord | null>(null);
  
  const [books, setBooks] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    book_id: '',
    student_id: '',
    issue_date: new Date().toISOString().split('T')[0],
    due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchIssues();
    fetchOptions();
  }, []);

  const fetchIssues = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('library_issues')
      .select(`
        id, book_id, student_id, issue_date, due_date, return_date, status,
        library_books(title),
        students(name)
      `)
      .order('issue_date', { ascending: false });

    if (error) toast.error('Failed to load records');
    else {
      setIssues(data.map((i: any) => ({
        id: i.id,
        book_id: i.book_id,
        student_id: i.student_id,
        book_title: i.library_books?.title || 'Unknown',
        student_name: i.students?.name || 'Unknown',
        issue_date: i.issue_date,
        due_date: i.due_date,
        return_date: i.return_date,
        status: i.status
      })));
    }
    setLoading(false);
  };

  const fetchOptions = async () => {
    const { data: booksData } = await supabase.from('library_books').select('id, title').eq('status', 'available');
    const { data: studentsData } = await supabase.from('students').select('id, name');
    if (booksData) setBooks(booksData);
    if (studentsData) setStudents(studentsData);
  };

  const handleOpenModal = (issue?: IssueRecord) => {
    if (issue) {
      setSelectedIssue(issue);
      setFormData({
        book_id: issue.book_id,
        student_id: issue.student_id,
        issue_date: issue.issue_date,
        due_date: issue.due_date
      });
    } else {
      setSelectedIssue(null);
      setFormData({
        book_id: books[0]?.id || '',
        student_id: students[0]?.id || '',
        issue_date: new Date().toISOString().split('T')[0],
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    try {
      if (selectedIssue) {
        const { error } = await supabase.from('library_issues').update({
          issue_date: formData.issue_date,
          due_date: formData.due_date
        }).eq('id', selectedIssue.id);
        if (error) throw error;
        toast.success('Record updated');
      } else {
        const { error } = await supabase.from('library_issues').insert(formData);
        if (error) throw error;
        // Update book availability
        await supabase.rpc('decrement_book_count', { book_id: formData.book_id });
        toast.success('Book issued successfully');
      }
      setIsModalOpen(false);
      fetchIssues();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleReturn = async (id: string) => {
    try {
      const { error } = await supabase.from('library_issues').update({
        status: 'returned',
        return_date: new Date().toISOString().split('T')[0]
      }).eq('id', id);
      
      if (error) throw error;
      toast.success('Book returned');
      fetchIssues();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure?')) return;
    try {
      const { error } = await supabase.from('library_issues').delete().eq('id', id);
      if (error) throw error;
      toast.success('Record deleted');
      fetchIssues();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  if (loading) return <TableSkeleton title="Issue / Return" headers={['Book', 'Student', 'Issue Date', 'Due Date', 'Status', 'Actions']} />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Library Circulation</h1>
          <p className="text-slate-500">Manage book issues and returns</p>
        </div>
        <Button onClick={() => handleOpenModal()}><Plus size={20} className="mr-2"/> Issue Book</Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Book</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Student</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Issue Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Due Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {issues.map(issue => (
              <tr key={issue.id} className="hover:bg-slate-50">
                <td className="px-6 py-4 font-medium text-slate-900">{issue.book_title}</td>
                <td className="px-6 py-4 text-slate-600">{issue.student_name}</td>
                <td className="px-6 py-4 text-slate-600">{formatDate(issue.issue_date)}</td>
                <td className="px-6 py-4 text-slate-600">{formatDate(issue.due_date)}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${issue.status === 'returned' ? 'bg-green-100 text-green-700' : issue.status === 'overdue' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                    {issue.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right flex justify-end gap-2">
                  {issue.status === 'issued' && (
                    <Button variant="secondary" size="sm" onClick={() => handleReturn(issue.id)}>
                      <RotateCcw size={14} className="mr-1"/> Return
                    </Button>
                  )}
                  <button onClick={() => handleOpenModal(issue)} className="text-slate-500 hover:text-blue-600 p-1"><Edit size={16}/></button>
                  <button onClick={() => handleDelete(issue.id)} className="text-slate-500 hover:text-red-600 p-1"><Trash2 size={16}/></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={selectedIssue ? 'Edit Issue Record' : 'Issue Book'} footer={<><Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button><Button onClick={handleSave}>Save</Button></>}>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Book</Label>
            <Select value={formData.book_id} onChange={e => setFormData({...formData, book_id: e.target.value})} disabled={!!selectedIssue}>
              <option value="">Select Book</option>
              {books.map(b => <option key={b.id} value={b.id}>{b.title}</option>)}
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Student</Label>
            <Select value={formData.student_id} onChange={e => setFormData({...formData, student_id: e.target.value})} disabled={!!selectedIssue}>
              <option value="">Select Student</option>
              {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Issue Date</Label><Input type="date" value={formData.issue_date} onChange={e => setFormData({...formData, issue_date: e.target.value})} /></div>
            <div className="space-y-2"><Label>Due Date</Label><Input type="date" value={formData.due_date} onChange={e => setFormData({...formData, due_date: e.target.value})} /></div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default LibraryIssue;
