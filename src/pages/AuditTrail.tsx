import React from 'react';
import { FileText, Activity } from 'lucide-react';

// Mock data for Audit Trail
const auditLogs = [
  { id: 1, action: 'Created Student', module: 'Students', user: 'Admin', details: 'Added John Doe to Class 10-A', time: new Date().toISOString() },
  { id: 2, action: 'Updated Fee', module: 'Finance', user: 'Accountant', details: 'Updated Tuition Fee for Grade 9', time: new Date(Date.now() - 1800000).toISOString() },
  { id: 3, action: 'Deleted Exam', module: 'Examinations', user: 'Admin', details: 'Removed Mid-Term Math Exam', time: new Date(Date.now() - 3600000).toISOString() },
  { id: 4, action: 'Posted Notice', module: 'Noticeboard', user: 'Principal', details: 'Holiday Announcement', time: new Date(Date.now() - 7200000).toISOString() },
];

const AuditTrail: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-orange-100 rounded-lg text-orange-600">
          <Activity size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Audit Trail</h1>
          <p className="text-slate-500">Log of all system modifications and actions</p>
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
            {auditLogs.map((log) => (
              <tr key={log.id} className="hover:bg-slate-50">
                <td className="px-6 py-4 font-medium text-slate-900">{log.action}</td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 bg-slate-100 rounded text-xs font-medium text-slate-600">{log.module}</span>
                </td>
                <td className="px-6 py-4 text-slate-600">{log.user}</td>
                <td className="px-6 py-4 text-slate-600 text-sm">{log.details}</td>
                <td className="px-6 py-4 text-slate-500 text-xs">{new Date(log.time).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AuditTrail;
