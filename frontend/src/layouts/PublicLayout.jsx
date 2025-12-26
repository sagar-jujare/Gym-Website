import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Dumbbell } from 'lucide-react';
import { Button } from '../components/ui/button';

const navLinks = [
  { name: 'Home', path: '/' },
  { name: 'Plans', path: '/plans' },
  { name: 'Trainers', path: '/trainers' },
  { name: 'Contact', path: '/contact' },
];

export const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/10">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group" data-testid="logo-link">
            <div className="w-10 h-10 bg-red-500 rounded-sm flex items-center justify-center group-hover:scale-105 transition-transform">
              <Dumbbell className="w-6 h-6 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-heading text-2xl text-white leading-none">IRON & NEON</span>
              <span className="text-xs text-zinc-500 tracking-widest uppercase">Forge Your Legacy</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                data-testid={`nav-${link.name.toLowerCase()}`}
                className={`nav-link text-sm uppercase tracking-widest font-medium transition-colors ${
                  location.pathname === link.path
                    ? 'text-red-500'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {link.name}
              </Link>
            ))}
            <Link to="/plans">
              <Button 
                data-testid="nav-join-btn"
                className="bg-red-500 hover:bg-red-600 text-white rounded-sm uppercase tracking-wider text-sm px-6"
              >
                Join Now
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-white p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            data-testid="mobile-menu-btn"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-white/10 mobile-menu-enter">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`block py-3 text-sm uppercase tracking-widest font-medium ${
                  location.pathname === link.path
                    ? 'text-red-500'
                    : 'text-zinc-400'
                }`}
              >
                {link.name}
              </Link>
            ))}
            <Link to="/plans" onClick={() => setMobileMenuOpen(false)}>
              <Button className="w-full mt-4 bg-red-500 hover:bg-red-600 text-white rounded-sm uppercase tracking-wider text-sm">
                Join Now
              </Button>
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
};

export const Footer = () => {
  return (
    <footer className="bg-zinc-950 border-t border-zinc-800 py-16">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-500 rounded-sm flex items-center justify-center">
                <Dumbbell className="w-6 h-6 text-white" />
              </div>
              <span className="font-heading text-2xl text-white">IRON & NEON</span>
            </div>
            <p className="text-zinc-500 text-sm max-w-md">
              Where raw power meets cutting-edge training. Push beyond your limits in our 
              industrial-grade facility designed for serious athletes.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-heading text-lg text-white mb-4">Quick Links</h4>
            <ul className="space-y-2">
              {navLinks.map((link) => (
                <li key={link.path}>
                  <Link 
                    to={link.path}
                    className="text-zinc-500 hover:text-red-500 text-sm transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-heading text-lg text-white mb-4">Contact</h4>
            <ul className="space-y-2 text-sm text-zinc-500">
              <li>123 Muscle Street</li>
              <li>Fitness City, FC 12345</li>
              <li className="pt-2">+1 (555) 123-4567</li>
              <li>info@ironandneon.com</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-zinc-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-zinc-600 text-sm">
            © 2024 Iron & Neon. All rights reserved.
          </p>
          <Link 
            to="/admin/login"
            className="text-zinc-600 hover:text-zinc-400 text-sm transition-colors"
            data-testid="admin-login-footer"
          >
            Admin Portal
          </Link>
        </div>
      </div>
    </footer>
  );
};

export default function PublicLayout({ children }) {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20">
        {children}
      </main>
      <Footer />
    </div>
  );
}
