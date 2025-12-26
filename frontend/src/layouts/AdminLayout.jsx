import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  CreditCard, 
  FileText, 
  LogOut, 
  Menu,
  X,
  Dumbbell
} from 'lucide-react';
import { Button } from '../components/ui/button';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const sidebarLinks = [
  { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'Members', path: '/admin/members', icon: Users },
  { name: 'Payments', path: '/admin/payments', icon: CreditCard },
  { name: 'Reports', path: '/admin/reports', icon: FileText },
];

export default function AdminLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        navigate('/admin/login');
        return;
      }

      try {
        const response = await axios.get(`${API}/admin/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setAdmin(response.data.admin);
      } catch (error) {
        localStorage.removeItem('adminToken');
        navigate('/admin/login');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    navigate('/admin/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex flex-col w-64 bg-zinc-950 border-r border-zinc-800 fixed h-full">
        {/* Logo */}
        <div className="h-20 flex items-center px-6 border-b border-zinc-800">
          <Link to="/admin/dashboard" className="flex items-center gap-3" data-testid="admin-logo">
            <div className="w-8 h-8 bg-red-500 rounded-sm flex items-center justify-center">
              <Dumbbell className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-heading text-xl text-white leading-none">IRON & NEON</span>
              <span className="text-[10px] text-zinc-500 uppercase tracking-widest">Admin Panel</span>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6 px-4">
          <ul className="space-y-1">
            {sidebarLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.path;
              return (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    data-testid={`admin-nav-${link.name.toLowerCase()}`}
                    className={`flex items-center gap-3 px-4 py-3 rounded-sm text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-red-500/10 text-red-500 border-l-2 border-red-500'
                        : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {link.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User Info & Logout */}
        <div className="p-4 border-t border-zinc-800">
          <div className="px-4 py-2 mb-2">
            <p className="text-sm text-white font-medium">{admin?.username || 'Admin'}</p>
            <p className="text-xs text-zinc-500">{admin?.email}</p>
          </div>
          <Button
            onClick={handleLogout}
            variant="ghost"
            className="w-full justify-start gap-3 text-zinc-400 hover:text-red-500 hover:bg-red-500/10"
            data-testid="admin-logout-btn"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between px-4 z-50">
        <Link to="/admin/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-red-500 rounded-sm flex items-center justify-center">
            <Dumbbell className="w-5 h-5 text-white" />
          </div>
          <span className="font-heading text-lg text-white">ADMIN</span>
        </Link>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 text-white"
          data-testid="admin-mobile-menu"
        >
          {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/80 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside className={`lg:hidden fixed top-16 left-0 bottom-0 w-64 bg-zinc-950 border-r border-zinc-800 z-50 transform transition-transform ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <nav className="py-6 px-4">
          <ul className="space-y-1">
            {sidebarLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.path;
              return (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-sm text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-red-500/10 text-red-500'
                        : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {link.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-zinc-800">
          <Button
            onClick={handleLogout}
            variant="ghost"
            className="w-full justify-start gap-3 text-zinc-400 hover:text-red-500"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:ml-64 min-h-screen">
        <div className="pt-16 lg:pt-0">
          {children}
        </div>
      </main>
    </div>
  );
}
