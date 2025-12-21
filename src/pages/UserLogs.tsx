import React, { useState, useEffect } from 'react';
import { Shield, Clock, User, Search } from 'lucide-react';
import TableSkeleton from '../components/ui/TableSkeleton';
import { supabase } from '../lib/supabaseClient';
import { useGlobal } from '../context/GlobalContext';
import toast from 'react-hot-toast';

interface UserLog {
  id: string;
  user_name: string;
  role: string;
  ip_address: string;
  login_time: string;
  status: 'Success' | 'Failed';
}

const UserLogs: React.FC = () => {
  const { profile } = useGlobal();
  const [logs, setLogs] = useState<UserLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchLogs = async () => {
      if (!profile?.school_id && profile?.role !== 'system_admin') return;
      
      setLoading(true);
      try {
        let query = supabase
          .from('user_logs')
          .select('*')
          .order('login_time', { ascending: false })
          .limit(100);

        if (profile.role !== 'system_admin') {
            query = query.eq('school_id', profile.school_id);
        }

        const { data, error } = await query;
        if (error) throw error;
        setLogs(data || []);
      } catch (error: any) {
        toast.error('Failed to load logs');
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, [profile]);

  const filteredLogs = logs.filter(log => 
    (log.user_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (log.role || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <TableSkeleton title="User Logs" headers={['User', 'Role', 'Time', 'Status']} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-blue-100 rounded-lg text-blue-600">
          <Shield size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">User Logs</h1>
          <p className="text-slate-500">Track user login activity (Last 100 records)</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="Search logs..." 
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
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">User</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Time</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filteredLogs.map((log) => (
              <tr key={log.id} className="hover:bg-slate-50">
                <td className="px-6 py-4 flex items-center gap-2 font-medium text-slate-900">
                  <User size={16} className="text-slate-400" /> {log.user_name || 'Unknown'}
                </td>
                <td className="px-6 py-4 text-slate-600 capitalize">{log.role}</td>
                <td className="px-6 py-4 text-slate-600 flex items-center gap-2">
                  <Clock size={14} className="text-slate-400" /> {new Date(log.login_time).toLocaleString()}
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${log.status === 'Success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {log.status}
                  </span>
                </td>
              </tr>
            ))}
            {filteredLogs.length === 0 && (
                <tr><td colSpan={4} className="p-8 text-center text-slate-500">No logs found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserLogs;
