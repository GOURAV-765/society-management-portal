import React, { useState } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import {
  LayoutDashboard,
  Users,
  UserPlus,
  LogOut,
  Menu,
  X,
  Building,
  User as UserIcon,
  Shield,
} from 'lucide-react';

const Layout: React.FC = () => {
  const { user, logout, hasPermission } = useAuth();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigationItems = [
    {
      name: 'Dashboard',
      path: '/dashboard',
      icon: LayoutDashboard,
      show: true,
    },
    {
      name: 'Members List',
      path: '/members',
      icon: Users,
      show: hasPermission('member:read'),
    },
    {
      name: 'Add Member',
      path: '/members/add',
      icon: UserPlus,
      show: hasPermission('member:create'),
    },
  ];

  const activeItems = navigationItems.filter((item) => item.show);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const getRoleBadgeColor = (roleName: string) => {
    switch (roleName) {
      case 'Core Admin':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      case 'Core Team Lead':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      default:
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 glass-panel border-r border-slate-800 shrink-0">
        {/* Brand/Logo */}
        <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-800">
          <Building className="h-6 w-6 text-indigo-400" />
          <span className="font-bold text-lg text-gradient leading-none">Society Portal</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1.5">
          {activeItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-indigo-600/90 text-white shadow-lg shadow-indigo-600/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <Icon size={18} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* User profile card & Logout */}
        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 p-2 mb-3 rounded-xl bg-slate-900/50 border border-slate-800/50">
            <div className="h-9 w-9 rounded-lg bg-indigo-950 flex items-center justify-center text-indigo-400 font-semibold border border-indigo-500/20 shrink-0">
              {user?.member?.firstName[0] || user?.email[0].toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-slate-200 truncate">
                {user?.member ? `${user.member.firstName} ${user.member.lastName}` : 'System User'}
              </p>
              <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
            </div>
          </div>

          <button
            onClick={logout}
            className="flex items-center justify-center gap-2.5 w-full px-4 py-2.5 rounded-xl border border-slate-800 text-sm font-medium text-slate-400 hover:text-rose-400 hover:border-rose-500/20 hover:bg-rose-500/5 transition-all duration-200"
          >
            <LogOut size={16} />
            Log Out
          </button>
        </div>
      </aside>

      {/* Mobile Menu Backdrop */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm md:hidden"
          onClick={closeMobileMenu}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 glass-panel border-r border-slate-800 flex flex-col transition-transform duration-300 transform md:hidden ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <Building className="h-5 w-5 text-indigo-400" />
            <span className="font-bold text-base text-gradient">Society Portal</span>
          </div>
          <button
            onClick={toggleMobileMenu}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1.5">
          {activeItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                onClick={closeMobileMenu}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-indigo-600/90 text-white shadow-lg shadow-indigo-600/25'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <Icon size={18} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 p-2 mb-3 rounded-xl bg-slate-900/50 border border-slate-800/50">
            <div className="h-9 w-9 rounded-lg bg-indigo-950 flex items-center justify-center text-indigo-400 font-semibold border border-indigo-500/20 shrink-0">
              {user?.member?.firstName[0] || user?.email[0].toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-slate-200 truncate">
                {user?.member ? `${user.member.firstName} ${user.member.lastName}` : 'System User'}
              </p>
              <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center justify-center gap-2.5 w-full px-4 py-2.5 rounded-xl border border-slate-800 text-sm font-medium text-slate-400 hover:text-rose-400 hover:border-rose-500/20 hover:bg-rose-500/5 transition-all duration-200"
          >
            <LogOut size={16} />
            Log Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        {/* Top Header */}
        <header className="h-16 flex items-center justify-between px-4 md:px-8 border-b border-slate-850 bg-slate-950/60 backdrop-blur-md sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button
              onClick={toggleMobileMenu}
              className="p-2 rounded-xl border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-900 md:hidden"
            >
              <Menu size={20} />
            </button>

            {/* Society Name */}
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-indigo-950 border border-indigo-500/10">
                <Building size={16} className="text-indigo-400" />
              </div>
              <span className="font-semibold text-sm text-slate-200 md:text-base leading-none">
                {user?.societyName}
              </span>
            </div>
          </div>

          {/* User Meta Information */}
          <div className="flex items-center gap-3">
            {user?.role && (
              <span
                className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full border ${getRoleBadgeColor(
                  user.role.name
                )}`}
              >
                <Shield size={12} />
                {user.role.name}
              </span>
            )}

            <Link
              to={user?.member ? `/members/${user.member.id}` : '#'}
              className="h-9 w-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 hover:border-indigo-500 hover:text-white transition-all shrink-0"
              title="View Profile"
            >
              <UserIcon size={16} />
            </Link>
          </div>
        </header>

        {/* Router Outlet for nested page views */}
        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
