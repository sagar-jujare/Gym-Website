import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dumbbell, LogIn, Loader2, Eye, EyeOff } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import axios from 'axios';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(`${API}/admin/login`, { email, password });
      localStorage.setItem('adminToken', response.data.token);
      toast.success('Login successful!');
      navigate('/admin/dashboard');
    } catch (error) {
      console.error('Login error:', error);
      toast.error(error.response?.data?.detail || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-red-500 rounded-sm flex items-center justify-center">
              <Dumbbell className="w-7 h-7 text-white" />
            </div>
            <div className="text-left">
              <span className="font-heading text-3xl text-white block leading-none">IRON & NEON</span>
              <span className="text-xs text-zinc-500 uppercase tracking-widest">Admin Portal</span>
            </div>
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-sm p-8">
          <h1 className="font-heading text-3xl text-white mb-2 text-center">WELCOME BACK</h1>
          <p className="text-zinc-500 text-sm text-center mb-8">
            Sign in to access the admin dashboard
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="email" className="text-zinc-400 text-sm uppercase tracking-wider">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="admin@ironandneon.com"
                className="mt-2 bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-600 rounded-sm focus:border-red-500"
                data-testid="login-email"
              />
            </div>

            <div>
              <Label htmlFor="password" className="text-zinc-400 text-sm uppercase tracking-wider">
                Password
              </Label>
              <div className="relative mt-2">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-600 rounded-sm focus:border-red-500 pr-10"
                  data-testid="login-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-red-500 hover:bg-red-600 text-white py-6 rounded-sm uppercase tracking-wider"
              data-testid="login-submit"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Signing In...
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5 mr-2" />
                  Sign In
                </>
              )}
            </Button>
          </form>

          {/* Demo Credentials */}
          <div className="mt-8 p-4 bg-zinc-800/50 rounded-sm border border-zinc-700">
            <p className="text-zinc-500 text-xs uppercase tracking-wider mb-2">Demo Credentials</p>
            <p className="text-zinc-400 text-sm font-mono">admin@ironandneon.com</p>
            <p className="text-zinc-400 text-sm font-mono">admin123</p>
          </div>
        </div>

        {/* Back to Website */}
        <p className="text-center mt-6">
          <a href="/" className="text-zinc-500 hover:text-red-500 text-sm transition-colors">
            ← Back to Website
          </a>
        </p>
      </div>
    </div>
  );
}
