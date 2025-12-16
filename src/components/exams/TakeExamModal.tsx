import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Button } from '../ui/Button';
import { Clock, CheckCircle, AlertTriangle, ChevronRight, ChevronLeft, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { Skeleton } from '../ui/Skeleton';

interface Question {
  id: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: string;
  marks: number;
}

interface TakeExamModalProps {
  examId: string;
  examTitle: string;
  durationMinutes: number;
  studentId: string;
  onClose: () => void;
  onSuccess: () => void;
}

const TakeExamModal: React.FC<TakeExamModalProps> = ({ 
  examId, examTitle, durationMinutes, studentId, onClose, onSuccess 
}) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(durationMinutes * 60); // in seconds
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  useEffect(() => {
    const fetchQuestions = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('online_exam_questions')
        .select('*')
        .eq('exam_id', examId);
      
      if (error) {
        toast.error('Failed to load questions');
        onClose();
      } else {
        if (!data || data.length === 0) {
            toast.error('This exam has no questions yet.');
            onClose();
            return;
        }
        setQuestions(data);
      }
      setLoading(false);
    };
    fetchQuestions();
  }, [examId]);

  // Timer Logic
  useEffect(() => {
    if (loading || submitting) return;
    
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit(true); // Auto-submit
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [loading, submitting]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleOptionSelect = (questionId: string, option: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: option }));
  };

  const handleSubmit = async (autoSubmit = false) => {
    if (!autoSubmit && !confirm('Are you sure you want to submit your exam?')) return;

    setSubmitting(true);
    
    // Calculate Score locally (secure enough for this level, ideally backend function)
    let score = 0;
    let correctCount = 0;
    let totalMarks = 0;

    questions.forEach(q => {
      totalMarks += q.marks;
      if (answers[q.id] === q.correct_option) {
        score += q.marks;
        correctCount++;
      }
    });

    try {
      const { error } = await supabase.from('online_exam_results').insert({
        exam_id: examId,
        student_id: studentId,
        score,
        total_marks: totalMarks,
        correct_answers: correctCount,
        total_questions: questions.length
      });

      if (error) throw error;

      toast.success(`Exam submitted! You scored ${score}/${totalMarks}`);
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(`Submission failed: ${error.message}`);
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-8"><Skeleton className="h-64 w-full" /></div>;

  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;

  return (
    <div className="flex flex-col h-[80vh]">
      {/* Header */}
      <div className="flex justify-between items-center bg-slate-50 p-4 rounded-t-xl border-b border-slate-200">
        <div>
          <h2 className="text-lg font-bold text-slate-900">{examTitle}</h2>
          <p className="text-sm text-slate-500">Question {currentQuestionIndex + 1} of {questions.length}</p>
        </div>
        <div className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono font-bold text-lg ${timeLeft < 300 ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
          <Clock size={20} />
          {formatTime(timeLeft)}
        </div>
      </div>

      {/* Question Area */}
      <div className="flex-grow overflow-y-auto p-6">
        <div className="max-w-3xl mx-auto">
          <div className="mb-6">
            <h3 className="text-xl font-medium text-slate-900 mb-2">
              {currentQuestionIndex + 1}. {currentQuestion.question_text}
            </h3>
            <span className="text-xs font-semibold bg-gray-100 text-gray-600 px-2 py-1 rounded">
              {currentQuestion.marks} Marks
            </span>
          </div>

          <div className="space-y-3">
            {['a', 'b', 'c', 'd'].map((optKey) => {
              const optionText = currentQuestion[`option_${optKey}` as keyof Question];
              if (!optionText) return null; // Handle optional c/d
              
              const isSelected = answers[currentQuestion.id] === optKey;
              
              return (
                <div 
                  key={optKey}
                  onClick={() => handleOptionSelect(currentQuestion.id, optKey)}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all flex items-center gap-3 ${
                    isSelected 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full border flex items-center justify-center text-xs font-bold ${
                    isSelected ? 'bg-blue-500 border-blue-500 text-white' : 'border-slate-400 text-slate-500'
                  }`}>
                    {optKey.toUpperCase()}
                  </div>
                  <span className={`text-sm ${isSelected ? 'text-blue-900 font-medium' : 'text-slate-700'}`}>
                    {optionText}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="bg-white p-4 border-t border-slate-200 flex justify-between items-center">
        <Button 
          variant="secondary" 
          onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
          disabled={currentQuestionIndex === 0}
        >
          <ChevronLeft size={18} className="mr-1" /> Previous
        </Button>

        <div className="flex gap-2">
            {/* Question Palette (Dots) */}
            <div className="hidden sm:flex gap-1 items-center mr-4">
                {questions.map((_, idx) => (
                    <div 
                        key={idx} 
                        className={`w-2 h-2 rounded-full ${
                            idx === currentQuestionIndex ? 'bg-blue-600' : 
                            answers[questions[idx].id] ? 'bg-green-400' : 'bg-slate-200'
                        }`} 
                    />
                ))}
            </div>

            {isLastQuestion ? (
              <Button onClick={() => handleSubmit(false)} variant="primary" className="bg-green-600 hover:bg-green-700" loading={submitting}>
                <Save size={18} className="mr-2" /> Submit Exam
              </Button>
            ) : (
              <Button onClick={() => setCurrentQuestionIndex(prev => Math.min(questions.length - 1, prev + 1))}>
                Next <ChevronRight size={18} className="ml-1" />
              </Button>
            )}
        </div>
      </div>
    </div>
  );
};

export default TakeExamModal;
