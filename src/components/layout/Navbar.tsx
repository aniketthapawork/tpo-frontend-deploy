import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { LogOut, User, Briefcase, UserPlus, LogIn, UserCircle2, AlignJustify, X } from 'lucide-react';

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setMenuOpen(false);
  };

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [menuOpen]);

  // Hamburger icon animation
  const HamburgerIcon = ({ open }) => (
    <span className="relative w-7 h-7 flex flex-col justify-center items-center">
      <span
        className={`block absolute h-0.5 w-6 bg-white rounded transition-all duration-300 ${open ? 'rotate-45 top-3.5' : 'top-2'}`}
      ></span>
      <span
        className={`block absolute h-0.5 w-6 bg-white rounded transition-all duration-300 ${open ? 'opacity-0' : 'top-3.5'}`}
      ></span>
      <span
        className={`block absolute h-0.5 w-6 bg-white rounded transition-all duration-300 ${open ? '-rotate-45 top-3.5' : 'top-5'}`}
      ></span>
    </span>
  );

  return (
    <nav className="bg-slate-900 text-white p-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="md:text-2xl text-xl font-bold hover:text-slate-300 transition-colors">
          TPO Platform
        </Link>
        {/* Hamburger for mobile */}
        <button
          className={`md:hidden p-2 rounded-lg shadow focus:outline-none focus:ring-2 focus:ring-slate-400 transition bg-slate-800 hover:bg-slate-700 active:scale-95 ${menuOpen ? 'ring-2 ring-slate-400' : ''}`}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((v) => !v)}
        >
          <HamburgerIcon open={menuOpen} />
        </button>
        {/* Desktop Menu */}
        <div className="hidden md:flex space-x-4 items-center">
          {isAuthenticated ? (
            <>
              <Link to="/placements" className="hover:text-slate-300 flex items-center transition-colors px-2 py-1 rounded hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400">
                <Briefcase className="mr-2 h-5 w-5" /> Placements
              </Link>
              <Link to="/profile" className="hover:text-slate-300 flex items-center transition-colors px-2 py-1 rounded hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400">
                <UserCircle2 className="mr-2 h-5 w-5" /> Profile
              </Link>
              <span className="text-slate-300 text-sm px-2">{user?.name} ({user?.role})</span>
              <Button onClick={handleLogout} variant="ghost" className="hover:bg-red-950 hover:text-white text-sm px-3 py-3 h-auto">
                <LogOut className="mr-1.5 h-4 w-4" /> Logout
              </Button>
            </>
          ) : (
            <>
              <Link to="/login" className="hover:text-slate-300 flex items-center px-2 py-1 rounded hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400">
                <LogIn className="mr-2 h-5 w-5" /> Login
              </Link>
              <Link to="/signup" className="hover:text-slate-300 flex items-center px-2 py-1 rounded hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400">
                <UserPlus className="mr-2 h-5 w-5" /> Signup
              </Link>
            </>
          )}
        </div>
      </div>
      {/* Mobile Dropdown Menu & Backdrop */}
      {menuOpen && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40 animate-fade-in" aria-hidden onClick={() => setMenuOpen(false)} />
          <div
            ref={menuRef}
            className="md:hidden fixed left-0 right-0 top-16 bg-slate-900 shadow-lg border-t border-slate-800 z-50 animate-slide-down rounded-b-xl mx-2"
            style={{ maxWidth: '480px', marginLeft: 'auto', marginRight: 'auto' }}
          >
            <div className="flex flex-col space-y-2 py-4 px-6">
              {isAuthenticated ? (
                <>
                  <Link to="/placements" onClick={() => setMenuOpen(false)} className="flex items-center py-2 px-2 rounded hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400">
                    <Briefcase className="mr-2 h-5 w-5" /> Placements
                  </Link>
                  <Link to="/profile" onClick={() => setMenuOpen(false)} className="flex items-center py-2 px-2 rounded hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400">
                    <UserCircle2 className="mr-2 h-5 w-5" /> Profile
                  </Link>
                  <span className="text-slate-300 text-sm py-2 px-2">{user?.name} ({user?.role})</span>
                  <Button onClick={handleLogout} variant="ghost" className="hover:bg-red-950 hover:text-white text-sm px-3 py-3 h-auto w-full flex justify-start">
                    <LogOut className="mr-1.5 h-4 w-4" /> Logout
                  </Button>
                </>
              ) : (
                <>
                  <Link to="/login" onClick={() => setMenuOpen(false)} className="flex items-center py-2 px-2 rounded hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400">
                    <LogIn className="mr-2 h-5 w-5" /> Login
                  </Link>
                  <Link to="/signup" onClick={() => setMenuOpen(false)} className="flex items-center py-2 px-2 rounded hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400">
                    <UserPlus className="mr-2 h-5 w-5" /> Signup
                  </Link>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </nav>
  );
};

export default Navbar;

// Tailwind custom animations (add to tailwind.config if not present):
// fade-in: { from: { opacity: 0 }, to: { opacity: 1 } }
// slide-down: { from: { transform: 'translateY(-1rem)', opacity: 0 }, to: { transform: 'translateY(0)', opacity: 1 } }

