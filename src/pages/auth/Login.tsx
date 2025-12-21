import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import Logo from '../../components/ui/Logo';
import { useGlobal } from '../../context/GlobalContext';
import { Lock, Mail, ArrowRight, AlertCircle, WifiOff } from 'lucide-react';
import { logUserLogin } from '../../services/logger';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const navigate = useNavigate();
  const { schoolName } = useGlobal();

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isOffline) {
      setError('You are currently offline. Please check your internet connection.');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        throw error;
      }
      
      if (data.session) {
        // Fetch profile for logging
        const { data: profile } = await supabase.from('profiles').select('name, role, school_id').eq('id', data.user.id).single();
        
        if (profile) {
            await logUserLogin(data.user.id, profile.name, profile.role, 'Success', profile.school_id);
        }
        
        navigate('/');
      } else {
        setError('Login failed. Please check your credentials.');
      }
    } catch (err: any) {
      console.error("Login error:", err);
      
      // Handle specific error cases
      if (err.message === 'Failed to fetch' || err.name === 'TypeError') {
        setError('Unable to connect to the server. Please check your internet connection or try again later.');
      } else if (err.message === 'Invalid login credentials') {
        setError('Invalid email or password. Please try again.');
      } else if (err.message.includes('Email not confirmed')) {
        setError('Please verify your email address before logging in.');
      } else {
        setError(err.message || 'An unexpected error occurred during sign in.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex font-sans bg-white">
      {/* Left Side - Form */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:flex-none lg:px-20 xl:px-24 bg-white">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <div className="mb-10">
            <div className="flex items-center gap-2 mb-6">
                <Logo />
                <span className="text-xl font-bold text-slate-900">{schoolName}</span>
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">Welcome back</h2>
            <p className="mt-2 text-sm text-slate-600">
              Please enter your details to sign in.
            </p>
          </div>

          {isOffline && (
            <div className="mb-6 p-4 rounded-lg bg-yellow-50 border border-yellow-100 text-sm text-yellow-800 flex items-start gap-2">
              <WifiOff className="h-5 w-5 shrink-0 mt-0.5" />
              <span>You are offline. Some features may not work.</span>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-100 text-sm text-red-600 flex items-start gap-2 animate-in fade-in slide-in-from-top-2">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400" />
                </div>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="pl-10"
                  placeholder="Enter your email"
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link to="/forgot-password" tabIndex={-1} className="text-sm font-medium text-blue-600 hover:text-blue-500">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pl-10"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
              </div>
            </div>

            <Button type="submit" className="w-full h-11 text-base" loading={loading} disabled={isOffline}>
              Sign in <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>

          <p className="mt-8 text-center text-sm text-slate-500">
            Don't have an account? Contact your school administrator.
          </p>
        </div>
      </div>

      {/* Right Side - Image/Branding */}
      <div className="hidden lg:block relative w-0 flex-1 bg-slate-900">
        <div className="absolute inset-0 h-full w-full bg-gradient-to-br from-blue-600 to-slate-900 opacity-90" />
        <div className="absolute inset-0 flex flex-col justify-center items-center p-12 text-white z-10">
            <div className="max-w-lg text-center">
                <h1 className="text-4xl font-bold mb-6">Streamline Your School Management</h1>
                <p className="text-lg text-blue-100 leading-relaxed">
                    Experience a comprehensive platform designed to manage students, teachers, academics, and finances efficiently in one place.
                </p>
            </div>
            {/* Abstract decoration */}
            <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-slate-900 to-transparent opacity-50"></div>
        </div>
        <img
          className="absolute inset-0 h-full w-full object-cover mix-blend-overlay opacity-20"
          src="https://images.unsplash.com/photo-1523050854058-8df90110c9f1?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1740&q=80"
          alt="School Campus"
        />
      </div>
    </div>
  );
};

export default Login;
