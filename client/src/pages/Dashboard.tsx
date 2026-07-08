import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext.js';
import api from '../services/api.js';
import {
  Users,
  UserCheck,
  UserX,
  UserPlus,
  ShieldCheck,
  Building,
  ArrowRight,
  TrendingUp,
  Clock,
} from 'lucide-react';

const Dashboard: React.FC = () => {
  const { user, hasPermission } = useAuth();

  // Fetch members to compute metrics (retrieve up to 100 members to compute client-side stats)
  const { data, isLoading, error } = useQuery({
    queryKey: ['members', 'dashboard-stats'],
    queryFn: async () => {
      const response = await api.get('/members', {
        params: { limit: 100, page: 1 },
      });
      return response.data;
    },
  });

  const members = data?.data || [];
  const totalCount = data?.meta?.total || members.length;

  const activeCount = members.filter((m: any) => m.status === 'ACTIVE').length;
  const inactiveCount = members.filter((m: any) => m.status !== 'ACTIVE').length;

  const coreTeamCount = members.filter(
    (m: any) => m.user?.role?.name === 'Core Admin' || m.user?.role?.name === 'Core Team Lead'
  ).length;

  const recentMembers = members.slice(0, 4);

  return (
    <div className="space-y-8 animate-slide-in">
      {/* Welcome Hero Panel */}
      <div className="relative overflow-hidden rounded-2xl border border-indigo-500/20 bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-900 p-6 md:p-8 shadow-xl">
        <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
              <Building size={12} />
              {user?.societyName || 'Greenwood'}
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-100 tracking-tight">
              Hello, {user?.member?.firstName || 'User'}!
            </h1>
            <p className="text-sm md:text-base text-slate-400 max-w-xl">
              Welcome to your Society Management Portal. You are logged in as a{' '}
              <span className="text-indigo-400 font-medium">{user?.role?.name}</span>. Here is the latest overview of your society membership.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {hasPermission('member:create') && (
              <Link
                to="/members/add"
                className="flex items-center gap-2 px-4 py-2.5 bg-indigo-650 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-indigo-650/20 transition-all"
              >
                <UserPlus size={16} />
                Add Member
              </Link>
            )}
            <Link
              to="/members"
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-sm font-semibold transition-all"
            >
              View Members
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="glass-panel p-6 rounded-2xl h-32 animate-pulse space-y-3">
              <div className="h-4 w-2/3 bg-slate-800 rounded"></div>
              <div className="h-8 w-1/3 bg-slate-800 rounded"></div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
          Failed to load dashboard metrics. Please reload the page.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {/* Card 1: Total Members */}
          <div className="glass-panel p-5 rounded-2xl hover:border-slate-700 transition-all duration-200 group relative">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Members</p>
                <h3 className="text-3xl font-extrabold text-slate-100 mt-2">{totalCount}</h3>
              </div>
              <div className="p-3 rounded-xl bg-indigo-950 text-indigo-400 border border-indigo-500/10 group-hover:scale-105 transition-transform duration-200">
                <Users size={20} />
              </div>
            </div>
            <div className="flex items-center gap-1.5 mt-4 text-xs text-indigo-400">
              <TrendingUp size={14} />
              <span>Registered in database</span>
            </div>
          </div>

          {/* Card 2: Active Members */}
          <div className="glass-panel p-5 rounded-2xl hover:border-slate-700 transition-all duration-200 group relative">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Status</p>
                <h3 className="text-3xl font-extrabold text-slate-100 mt-2">{activeCount}</h3>
              </div>
              <div className="p-3 rounded-xl bg-emerald-950 text-emerald-400 border border-emerald-500/10 group-hover:scale-105 transition-transform duration-200">
                <UserCheck size={20} />
              </div>
            </div>
            <div className="flex items-center gap-1.5 mt-4 text-xs text-emerald-400">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              <span>Currently active accounts</span>
            </div>
          </div>

          {/* Card 3: Inactive/Suspended */}
          <div className="glass-panel p-5 rounded-2xl hover:border-slate-700 transition-all duration-200 group relative">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Inactive Status</p>
                <h3 className="text-3xl font-extrabold text-slate-100 mt-2">{inactiveCount}</h3>
              </div>
              <div className="p-3 rounded-xl bg-rose-950 text-rose-400 border border-rose-500/10 group-hover:scale-105 transition-transform duration-200">
                <UserX size={20} />
              </div>
            </div>
            <div className="flex items-center gap-1.5 mt-4 text-xs text-rose-400">
              <span>Suspended or inactive</span>
            </div>
          </div>

          {/* Card 4: Core Team Members */}
          <div className="glass-panel p-5 rounded-2xl hover:border-slate-700 transition-all duration-200 group relative">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Management</p>
                <h3 className="text-3xl font-extrabold text-slate-100 mt-2">{coreTeamCount}</h3>
              </div>
              <div className="p-3 rounded-xl bg-amber-950 text-amber-400 border border-amber-500/10 group-hover:scale-105 transition-transform duration-200">
                <ShieldCheck size={20} />
              </div>
            </div>
            <div className="flex items-center gap-1.5 mt-4 text-xs text-amber-400">
              <span>Admins & Team Leads</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid: Recent Activity & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Members Panel */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-lg font-bold text-slate-200">Recently Registered Members</h2>
            <Link to="/members" className="text-xs font-semibold text-indigo-400 hover:text-indigo-300">
              View All
            </Link>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 animate-pulse">
                  <div className="h-10 w-10 bg-slate-800 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-1/4 bg-slate-800 rounded"></div>
                    <div className="h-2.5 w-1/3 bg-slate-800 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : recentMembers.length === 0 ? (
            <p className="text-sm text-slate-400 py-6 text-center">No members found.</p>
          ) : (
            <div className="divide-y divide-slate-850">
              {recentMembers.map((member: any) => (
                <div key={member.id} className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="h-10 w-10 rounded-full bg-slate-800 flex items-center justify-center font-bold text-indigo-400 border border-slate-700/60 shrink-0">
                      {member.firstName[0]}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-semibold text-slate-250 truncate">
                        {member.firstName} {member.lastName}
                      </h4>
                      <p className="text-xs text-slate-400 truncate">{member.user?.email || 'No email'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`px-2 py-0.5 text-[10px] font-bold rounded border ${
                        member.status === 'ACTIVE'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/10'
                          : 'bg-rose-500/10 text-rose-400 border-rose-500/10'
                      }`}
                    >
                      {member.status}
                    </span>
                    <Link
                      to={`/members/${member.id}`}
                      className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 rounded-lg transition-colors"
                      title="View Profile"
                    >
                      <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions & System Info */}
        <div className="space-y-6">
          <div className="glass-panel p-6 rounded-2xl space-y-4">
            <h2 className="text-base font-bold text-slate-200 border-b border-slate-800 pb-2.5">Portal Quick Access</h2>
            <div className="space-y-2.5">
              <Link
                to={user?.member ? `/members/${user.member.id}` : '#'}
                className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/50 hover:bg-slate-900 border border-slate-850 hover:border-slate-850 transition-all text-sm group"
              >
                <div className="p-2 rounded-lg bg-slate-850 text-indigo-400 group-hover:bg-slate-800 transition-colors">
                  <ShieldCheck size={16} />
                </div>
                <div>
                  <p className="font-semibold text-slate-250">My Profile</p>
                  <p className="text-[10px] text-slate-400">View your assigned privileges</p>
                </div>
              </Link>

              {hasPermission('member:create') && (
                <Link
                  to="/members/add"
                  className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/50 hover:bg-slate-900 border border-slate-850 hover:border-slate-850 transition-all text-sm group"
                >
                  <div className="p-2 rounded-lg bg-slate-850 text-indigo-400 group-hover:bg-slate-800 transition-colors">
                    <UserPlus size={16} />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-250">Add Member Profile</p>
                    <p className="text-[10px] text-slate-400">Register a new resident user</p>
                  </div>
                </Link>
              )}
            </div>
          </div>

          {/* System Environment Info */}
          <div className="glass-panel p-5 rounded-2xl bg-slate-900/30 text-xs text-slate-400 space-y-3">
            <div className="flex items-center gap-2 text-slate-350 font-semibold border-b border-slate-800/80 pb-2">
              <Clock size={14} />
              <span>Session Log Info</span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Active Tenant:</span>
                <span className="font-semibold text-slate-250">{user?.societyName}</span>
              </div>
              <div className="flex justify-between">
                <span>Access Level:</span>
                <span className="font-semibold text-indigo-400">{user?.role?.name}</span>
              </div>
              <div className="flex justify-between">
                <span>Permissions Count:</span>
                <span className="font-semibold text-slate-250">{user?.permissions.length || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
