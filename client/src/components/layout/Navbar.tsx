import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../i18n/LanguageContext';
import {
  ShieldCheck,
  Menu,
  X,
  MapPin,
  MessageSquare,
  Search,
  User as UserIcon,
  LogOut,
  PlusCircle,
  BarChart3,
  Globe,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'ta' : 'en');
  };

  const navLinks = [
    { path: '/', label: t.navHome, icon: ShieldCheck },
    { path: '/issues', label: t.navIssues, icon: MapPin },
    { path: '/chat', label: t.navChat, icon: MessageSquare },
    { path: '/transparency', label: t.navTransparency, icon: BarChart3 },
    { path: '/track', label: t.navTrack, icon: Search },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-600 flex items-center justify-center text-white shadow-sm">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-lg text-slate-900 tracking-tight flex items-center gap-1.5">
                GovChain
                <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                  Civic Portal
                </span>
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1" aria-label="Main Navigation">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const active = isActive(link.path);
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                    active
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                  }`}
                >
                  <Icon className="w-4 h-4 mr-1.5 opacity-70" />
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Actions & User State */}
          <div className="hidden md:flex items-center space-x-3">
            {/* Language Switcher */}
            <button
              type="button"
              onClick={toggleLanguage}
              className="inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-md border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 transition"
              title="Switch language between English and தமிழ்"
              aria-label="Toggle language"
            >
              <Globe className="w-3.5 h-3.5 mr-1" />
              {language === 'en' ? 'தமிழ்' : 'English'}
            </button>

            {/* Quick Report CTA */}
            <Link
              to="/report"
              className="inline-flex items-center px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 shadow-sm transition"
            >
              <PlusCircle className="w-3.5 h-3.5 mr-1.5" />
              {t.btnReportNow}
            </Link>

            {user ? (
              <div className="flex items-center space-x-2 pl-2 border-l border-slate-200">
                <Link
                  to="/dashboard"
                  className="flex items-center text-sm font-medium text-slate-700 hover:text-blue-600 transition"
                >
                  <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center mr-1.5">
                    <UserIcon className="w-3.5 h-3.5 text-slate-600" />
                  </div>
                  <span className="max-w-[120px] truncate">{user.name}</span>
                  <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 uppercase font-semibold">
                    {user.role}
                  </span>
                </Link>
                <button
                  type="button"
                  onClick={logout}
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-slate-50 transition"
                  title={t.navLogout}
                  aria-label={t.navLogout}
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2 pl-2 border-l border-slate-200">
                <Link
                  to="/login"
                  className="px-3 py-1.5 text-xs font-semibold rounded-md text-slate-700 hover:bg-slate-100 transition"
                >
                  {t.navLogin}
                </Link>
                <Link
                  to="/register"
                  className="px-3 py-1.5 text-xs font-semibold rounded-md border border-slate-300 text-slate-800 hover:bg-slate-50 transition"
                >
                  {t.navRegister}
                </Link>
              </div>
            )}
          </div>

          {/* Mobile hamburger button */}
          <div className="flex md:hidden items-center space-x-2">
            <button
              type="button"
              onClick={toggleLanguage}
              className="px-2 py-1 text-xs font-semibold rounded border border-slate-200 bg-slate-50 text-slate-700"
            >
              {language === 'en' ? 'தமிழ்' : 'EN'}
            </button>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:bg-slate-100"
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 bg-white px-4 pt-2 pb-4 space-y-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium ${
                  isActive(link.path)
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-4 h-4 mr-2 opacity-70" />
                {link.label}
              </Link>
            );
          })}

          <div className="pt-2 border-t border-slate-100 space-y-2">
            <Link
              to="/report"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-center w-full px-4 py-2 text-sm font-semibold rounded-lg bg-blue-600 text-white"
            >
              <PlusCircle className="w-4 h-4 mr-1.5" />
              {t.btnReportNow}
            </Link>

            {user ? (
              <div className="flex items-center justify-between pt-2">
                <Link
                  to="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center text-sm font-medium text-slate-800"
                >
                  <UserIcon className="w-4 h-4 mr-2 text-slate-500" />
                  {user.name} ({user.role})
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="text-xs font-semibold text-rose-600 hover:underline"
                >
                  {t.navLogout}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 pt-2">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center py-2 text-sm font-semibold border border-slate-200 rounded-lg text-slate-700"
                >
                  {t.navLogin}
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center py-2 text-sm font-semibold bg-slate-900 text-white rounded-lg"
                >
                  {t.navRegister}
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
