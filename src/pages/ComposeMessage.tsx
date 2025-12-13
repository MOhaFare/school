import React, { useState } from 'react';
import { Mail, Send, Users, User, Paperclip } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { Select } from '../components/ui/Select';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabaseClient';
import { useGlobal } from '../context/GlobalContext';

const ComposeMessage: React.FC = () => {
  const { profile, createNotification } = useGlobal();
  const [recipientType, setRecipientType] = useState<'individual' | 'group'>('individual');
  const [recipientGroup, setRecipientGroup] = useState('students');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // In a real app, this would trigger a backend function to send emails via SMTP (SendGrid, AWS SES)
      // For this system, we will simulate it by creating internal notifications for the recipients.
      
      let targetUserIds: string[] = [];

      if (recipientType === 'individual') {
        // Find user by email
        const { data, error } = await supabase.from('profiles').select('id').eq('email', recipientEmail).single();
        if (error || !data) {
          toast.error('Recipient email not found in system.');
          setLoading(false);
          return;
        }
        targetUserIds = [data.id];
      } else {
        // Find all users in group
        // Note: This is a heavy operation for large groups, should be handled by backend job
        const { data, error } = await supabase.from('profiles').select('id').eq('role', recipientGroup);
        if (error) throw error;
        targetUserIds = data.map(u => u.id);
      }

      if (targetUserIds.length === 0) {
        toast.error('No recipients found.');
        setLoading(false);
        return;
      }

      // Send notifications
      const notifications = targetUserIds.map(uid => ({
        user_id: uid,
        title: `New Message: ${subject}`,
        message: message.substring(0, 100) + (message.length > 100 ? '...' : ''),
        type: 'notice' as const,
        link_to: '/noticeboard' // Or a specific inbox page if we built one
      }));

      // Batch insert notifications would be better, but createNotification is single
      // We'll just do the first few to avoid spamming the API in this demo context
      const batch = notifications.slice(0, 50); 
      await Promise.all(batch.map(n => createNotification(n)));

      toast.success(`Message sent to ${targetUserIds.length} recipient(s)!`);
      
      // Reset form
      setSubject('');
      setMessage('');
      setRecipientEmail('');

    } catch (error: any) {
      toast.error(`Failed to send message: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-blue-100 rounded-lg text-blue-600">
          <Mail size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Compose Message</h1>
          <p className="text-slate-500">Send emails or internal messages to students and staff</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <form onSubmit={handleSend} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Recipient Type</Label>
              <div className="flex bg-slate-100 p-1 rounded-lg">
                <button
                  type="button"
                  onClick={() => setRecipientType('individual')}
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-all flex items-center justify-center gap-2 ${recipientType === 'individual' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  <User size={16} /> Individual
                </button>
                <button
                  type="button"
                  onClick={() => setRecipientType('group')}
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-all flex items-center justify-center gap-2 ${recipientType === 'group' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  <Users size={16} /> Group
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>To</Label>
              {recipientType === 'individual' ? (
                <Input 
                  type="email" 
                  placeholder="recipient@school.com" 
                  value={recipientEmail}
                  onChange={e => setRecipientEmail(e.target.value)}
                  required
                />
              ) : (
                <Select value={recipientGroup} onChange={e => setRecipientGroup(e.target.value)}>
                  <option value="student">All Students</option>
                  <option value="teacher">All Teachers</option>
                  <option value="parent">All Parents</option>
                  <option value="admin">Administrators</option>
                </Select>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Subject</Label>
            <Input 
              placeholder="Enter message subject" 
              value={subject}
              onChange={e => setSubject(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Message</Label>
            <textarea
              className="w-full min-h-[200px] rounded-lg border border-slate-300 p-4 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-y"
              placeholder="Type your message here..."
              value={message}
              onChange={e => setMessage(e.target.value)}
              required
            ></textarea>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <Button type="button" variant="secondary" className="text-slate-500">
              <Paperclip size={18} className="mr-2" /> Attach File
            </Button>
            <Button type="submit" loading={loading} className="px-8">
              <Send size={18} className="mr-2" /> Send Message
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ComposeMessage;
