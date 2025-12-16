import React, { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import toast from 'react-hot-toast';
import { UploadCloud, FileText } from 'lucide-react';

interface SubmitHomeworkModalProps {
  homeworkId: string;
  studentId: string;
  onClose: () => void;
  onSuccess: () => void;
}

const SubmitHomeworkModal: React.FC<SubmitHomeworkModalProps> = ({ homeworkId, studentId, onClose, onSuccess }) => {
  const [message, setMessage] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let fileUrl = '';

      if (file) {
        const fileExt = file.name.split('.').pop();
        const filePath = `homework/${homeworkId}/${studentId}-${Date.now()}.${fileExt}`;
        // Using 'avatars' bucket for demo simplicity, ideally use a 'documents' bucket
        const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file);
        
        if (uploadError) throw uploadError;
        
        const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
        fileUrl = data.publicUrl;
      }

      const { error } = await supabase.from('homework_submissions').insert({
        homework_id: homeworkId,
        student_id: studentId,
        message,
        file_url: fileUrl,
        status: 'submitted'
      });

      if (error) throw error;

      toast.success('Homework submitted successfully!');
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(`Submission failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label>Message / Note</Label>
        <textarea
          className="w-full rounded-md border border-slate-300 p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          rows={4}
          placeholder="Add a note for your teacher..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label>Attach File</Label>
        <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:bg-slate-50 transition-colors">
          {file ? (
            <div className="flex items-center justify-center text-blue-600">
              <FileText className="mr-2" />
              <span className="text-sm font-medium">{file.name}</span>
            </div>
          ) : (
            <>
              <UploadCloud className="mx-auto h-10 w-10 text-slate-400 mb-2" />
              <p className="text-sm text-slate-500">Click to upload assignment file</p>
              <p className="text-xs text-slate-400 mt-1">PDF, DOC, JPG supported</p>
            </>
          )}
          <input 
            type="file" 
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            onChange={handleFileChange}
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
        <Button type="submit" loading={loading}>Submit Homework</Button>
      </div>
    </form>
  );
};

export default SubmitHomeworkModal;
