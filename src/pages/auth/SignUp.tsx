import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import Logo from '../../components/ui/Logo';
import { useGlobal } from '../../context/GlobalContext';
import { Mail, Lock, ArrowRight, ShieldAlert } from 'lucide-react';

const SignUp: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { schoolName } = useGlobal();

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    try {
      // 1. Check if email exists in students or teachers table
      const [studentCheck, teacherCheck] = await Promise.all([
        supabase.from('students').select('id, name').eq('email', email).single(),
        supabase.from('teachers').select('id, name').eq('email', email).single()
      ]);

      const student = studentCheck.data;
      const teacher = teacherCheck.data;

      if (!student && !teacher) {
        setError("No record found for this email. Please contact the school administrator to register your profile first.");
        setLoading(false);
        return;
      }

      const role = student ? 'student' : 'teacher';
      const fullName = student ? student.name : teacher?.name;

      // 2. Create Auth User
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { 
            role,
            full_name: fullName,
          },
          emailRedirectTo: window.location.origin,
        },
      });

      if (signUpError) {
        throw signUpError;
      }

      setMessage('Account activated successfully! Please check your email to confirm.');

    } catch (err: any) {
      setError(err.message || "An error occurred during activation.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex font-sans bg-white">
      {/* Left Side - Form */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:flex-none lg:px-20 xl:px-24 bg-white overflow-y-auto">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-6">
                <Logo />
                <span className="text-xl font-bold text-slate-900">{schoolName}</span>
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">Activate Account</h2>
            <p className="mt-2 text-sm text-slate-600">
              Enter your registered email to set up your login.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-100 text-sm text-red-600 flex items-start gap-2">
              <ShieldAlert className="h-5 w-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          {message && (
            <div className="mb-6 p-4 rounded-lg bg-green-50 border border-green-100 text-sm text-green-700 font-medium">
              {message}
            </div>
          )}

          <form onSubmit={handleActivate} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Registered Email</Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400" />
                </div>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@school.edu" className="pl-10" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Create Password</Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" className="pl-10" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <Input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required placeholder="••••••••" className="pl-10" />
              </div>
            </div>
            
            <Button type="submit" className="w-full h-11 text-base" loading={loading}>
              Activate Account <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>

          <p className="mt-8 text-center text-sm text-slate-600">
            Already activated?{' '}
            <Link to="/login" className="font-semibold text-blue-600 hover:text-blue-500">
              Sign in
            </Link>
          </p>
        </div>
      </div>

      {/* Right Side - Image/Branding */}
      <div className="hidden lg:block relative w-0 flex-1 bg-slate-900">
        <div className="absolute inset-0 h-full w-full bg-gradient-to-bl from-blue-900 to-slate-950 opacity-90" />
        <div className="absolute inset-0 flex flex-col justify-center items-center p-12 text-white z-10">
            <div className="max-w-lg text-center">
                <h1 className="text-4xl font-bold mb-6">Secure Access</h1>
                <p className="text-lg text-blue-100 leading-relaxed">
                    Your account must be pre-registered by the school administration before activation.
                </p>
            </div>
        </div>
        <img
          className="absolute inset-0 h-full w-full object-cover mix-blend-overlay opacity-20"
          src="https://images.unsplash.com/photo-1509062522246-3755977927d7?ixlib=rb-4.0.3&auto=format&fit=crop&w=1744&q=80"
          alt="Education"
        />
      </div>
    </div>
  );
};

export default SignUp;
