import React from 'react';
import { Shield, Clock, User } from 'lucide-react';
import TableSkeleton from '../components/ui/TableSkeleton';
import { formatDate } from '../utils/format';

// Mock data since backend auth logs are restricted
const mockLogs = [
  { id: 1, user: 'Admin User', role: 'Admin', ip: '192.168.1.1', time: new Date().toISOString(), status: 'Success' },
  { id: 2, user: 'John Teacher', role: 'Teacher', ip: '192.168.1.45', time: new Date(Date.now() - 3600000).toISOString(), status: 'Success' },
  { id: 3, user: 'Sarah Student', role: 'Student', ip: '10.0.0.12', time: new Date(Date.now() - 7200000).toISOString(), status: 'Failed' },
  { id: 4, user: 'Admin User', role: 'Admin', ip: '192.168.1.1', time: new Date(Date.now() - 86400000).toISOString(), status: 'Success' },
];

const UserLogs: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-blue-100 rounded-lg text-blue-600">
          <Shield size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">User Logs</h1>
          <p className="text-slate-500">Track user login activity and security events</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">User</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">IP Address</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Time</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {mockLogs.map((log) => (
              <tr key={log.id} className="hover:bg-slate-50">
                <td className="px-6 py-4 flex items-center gap-2 font-medium text-slate-900">
                  <User size={16} className="text-slate-400" /> {log.user}
                </td>
                <td className="px-6 py-4 text-slate-600">{log.role}</td>
                <td className="px-6 py-4 text-slate-600 font-mono text-xs">{log.ip}</td>
                <td className="px-6 py-4 text-slate-600 flex items-center gap-2">
                  <Clock size={14} className="text-slate-400" /> {new Date(log.time).toLocaleString()}
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${log.status === 'Success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {log.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserLogs;
