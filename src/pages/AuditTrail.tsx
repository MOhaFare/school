import React, { useState, useEffect } from 'react';
import { Activity, Search } from 'lucide-react';
import TableSkeleton from '../components/ui/TableSkeleton';
import { supabase } from '../lib/supabaseClient';
import { useGlobal } from '../context/GlobalContext';
import toast from 'react-hot-toast';

interface AuditLog {
  id: string;
  action: string;
  module: string;
  user_name: string;
  details: string;
  created_at: string;
}

const AuditTrail: React.FC = () => {
  const { profile } = useGlobal();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchLogs = async () => {
      if (!profile?.school_id && profile?.role !== 'system_admin') return;
      
      setLoading(true);
      try {
        let query = supabase
          .from('audit_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100);

        if (profile.role !== 'system_admin') {
            query = query.eq('school_id', profile.school_id);
        }

        const { data, error } = await query;
        if (error) throw error;
        setLogs(data || []);
      } catch (error: any) {
        toast.error('Failed to load audit trail');
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, [profile]);

  const filteredLogs = logs.filter(log => 
    log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.module.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.user_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <TableSkeleton title="Audit Trail" headers={['Action', 'Module', 'User', 'Details', 'Timestamp']} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-orange-100 rounded-lg text-orange-600">
          <Activity size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Audit Trail</h1>
          <p className="text-slate-500">Log of system modifications (Last 100 actions)</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="Search actions..." 
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
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Action</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Module</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">User</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Details</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Timestamp</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filteredLogs.map((log) => (
              <tr key={log.id} className="hover:bg-slate-50">
                <td className="px-6 py-4 font-medium text-slate-900">{log.action}</td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 bg-slate-100 rounded text-xs font-medium text-slate-600">{log.module}</span>
                </td>
                <td className="px-6 py-4 text-slate-600">{log.user_name || 'System'}</td>
                <td className="px-6 py-4 text-slate-600 text-sm max-w-xs truncate" title={log.details}>{log.details}</td>
                <td className="px-6 py-4 text-slate-500 text-xs">{new Date(log.created_at).toLocaleString()}</td>
              </tr>
            ))}
            {filteredLogs.length === 0 && (
                <tr><td colSpan={5} className="p-8 text-center text-slate-500">No activity recorded.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AuditTrail;
