import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import api from '../services/api.js';
import { useToast } from '../context/ToastContext.js';
import { useAuth } from '../context/AuthContext.js';
import {
  Calendar,
  Users,
  UserCheck,
  UserX,
  Plus,
  Search,
  Loader2,
  XCircle,
  RefreshCw,
  Edit2,
  CheckCircle,
} from 'lucide-react';

interface Member {
  id: string;
  firstName: string;
  lastName: string;
  unitNumber: string;
  phone: string | null;
  user: {
    email: string;
    role: {
      name: string;
    };
  };
}

interface Meeting {
  id: string;
  title: string;
  date: string;
  description: string | null;
  attendance: AttendanceRecord[];
}

interface AttendanceRecord {
  id: string;
  meetingId: string;
  memberId: string;
  status: 'present' | 'absent' | 'unmarked';
}

const Attendance: React.FC = () => {
  const { showToast } = useToast();
  const { user } = useAuth();
  
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [selectedMeetingId, setSelectedMeetingId] = useState<string>('');
  const [members, setMembers] = useState<Member[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'present' | 'absent' | 'unmarked'>('all');

  const { register, handleSubmit, reset } = useForm<{
    title: string;
    date: string;
    description: string;
  }>();

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      // Fetch meetings
      const meetingsRes = await api.get('/meetings');
      const fetchedMeetings = meetingsRes.data?.meetings || [];
      setMeetings(fetchedMeetings);
      
      if (fetchedMeetings.length > 0) {
        setSelectedMeetingId(fetchedMeetings[0].id);
      }

      // Fetch all members (limit 100 to get a large set)
      const membersRes = await api.get('/members', { params: { limit: 100, page: 1 } });
      setMembers(membersRes.data?.data || []);
    } catch (err: any) {
      showToast('Failed to load initial attendance data.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const handleCreateMeeting = async (data: any) => {
    try {
      const res = await api.post('/meetings', data);
      if (res.data?.success) {
        showToast('New meeting scheduled.', 'success');
        setModalOpen(false);
        reset();
        // Refresh meetings list
        const meetingsRes = await api.get('/meetings');
        const updatedMeetings = meetingsRes.data?.meetings || [];
        setMeetings(updatedMeetings);
        if (res.data.meeting) {
          setSelectedMeetingId(res.data.meeting.id);
        }
      }
    } catch (err: any) {
      showToast('Failed to create meeting.', 'error');
    }
  };

  const handleUpdateStatus = async (memberId: string, status: 'present' | 'absent' | 'unmarked') => {
    if (!selectedMeetingId) return;
    try {
      // Optimistically update UI
      setMeetings((prevMeetings) =>
        prevMeetings.map((meet) => {
          if (meet.id === selectedMeetingId) {
            const updatedAttendance = meet.attendance.map((rec) =>
              rec.memberId === memberId ? { ...rec, status } : rec
            );
            // If the record didn't exist in Prisma initially, we should append it
            const exists = meet.attendance.some((rec) => rec.memberId === memberId);
            if (!exists) {
              updatedAttendance.push({
                id: 'temp',
                meetingId: selectedMeetingId,
                memberId,
                status,
              });
            }
            return { ...meet, attendance: updatedAttendance };
          }
          return meet;
        })
      );

      await api.post('/meetings/attendance', {
        meetingId: selectedMeetingId,
        memberId,
        status,
      });
    } catch (err: any) {
      showToast('Failed to update attendance status.', 'error');
      // Re-fetch to sync state in case of failure
      fetchInitialData();
    }
  };

  const handleBulkUpdate = async (status: 'present' | 'unmarked') => {
    if (!selectedMeetingId) return;
    try {
      const res = await api.post('/meetings/attendance/bulk', {
        meetingId: selectedMeetingId,
        status,
      });
      if (res.data?.success) {
        showToast(`Attendance marked as ${status} for all members.`, 'success');
        setMeetings((prevMeetings) =>
          prevMeetings.map((meet) => {
            if (meet.id === selectedMeetingId) {
              return {
                ...meet,
                attendance: res.data.attendance,
              };
            }
            return meet;
          })
        );
      }
    } catch (err: any) {
      showToast('Failed to perform bulk update.', 'error');
    }
  };

  // Find active meeting details
  const activeMeeting = meetings.find((m) => m.id === selectedMeetingId);
  const attendanceRecords = activeMeeting?.attendance || [];

  // Calculate statistics
  const totalMembers = members.length;
  let presentCount = 0;
  let absentCount = 0;
  let unmarkedCount = 0;

  members.forEach((member) => {
    const record = attendanceRecords.find((r) => r.memberId === member.id);
    const status = record?.status || 'unmarked';
    if (status === 'present') presentCount++;
    else if (status === 'absent') absentCount++;
    else unmarkedCount++;
  });

  const attendanceRate = totalMembers > 0 ? Math.round((presentCount / (presentCount + absentCount || 1)) * 100) : 0;

  // Filter and search logic
  const filteredMembers = members.filter((member) => {
    const record = attendanceRecords.find((r) => r.memberId === member.id);
    const status = record?.status || 'unmarked';

    const fullName = `${member.firstName} ${member.lastName}`.toLowerCase();
    const roleName = member.user?.role?.name?.toLowerCase() || '';
    const email = member.user?.email?.toLowerCase() || '';

    const matchesSearch =
      fullName.includes(searchQuery.toLowerCase()) ||
      roleName.includes(searchQuery.toLowerCase()) ||
      email.includes(searchQuery.toLowerCase());

    const matchesFilter = filter === 'all' || status === filter;

    return matchesSearch && matchesFilter;
  });

  return (
    <div>
      <div className="p-6 max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-850 pb-6">
          <div className="space-y-1">
            <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400">
              Attendance Logger
            </h1>
            <p className="text-sm text-slate-400">
              Log society meetings, verify resident check-ins, and track engagement rate.
            </p>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="bg-indigo-650/20 hover:bg-indigo-600/30 text-indigo-400 border border-indigo-500/25 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Schedule Meeting
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
            <p className="text-sm text-slate-400">Loading attendance module...</p>
          </div>
        ) : (
          <>
            {/* Control Bar */}
            <div className="flex flex-wrap gap-4 items-center justify-between">
              <div className="flex flex-wrap gap-3 items-center">
                <div className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-emerald-400" />
                  <select
                    value={selectedMeetingId}
                    onChange={(e) => setSelectedMeetingId(e.target.value)}
                    className="bg-transparent border-none text-slate-200 text-xs font-semibold focus:outline-none cursor-pointer"
                  >
                    {meetings.length === 0 && <option value="">No meetings scheduled</option>}
                    {meetings.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.title} ({m.date})
                      </option>
                    ))}
                  </select>
                </div>

                {selectedMeetingId && (
                  <>
                    <button
                      onClick={() => handleBulkUpdate('present')}
                      className="bg-slate-900 border border-slate-800 hover:border-slate-700 text-emerald-400 hover:text-emerald-300 text-xs font-bold px-3 py-2 rounded-xl cursor-pointer flex items-center gap-1.5"
                    >
                      <UserCheck className="h-3.5 w-3.5" />
                      Mark All Present
                    </button>
                    <button
                      onClick={() => handleBulkUpdate('unmarked')}
                      className="bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-300 text-xs font-bold px-3 py-2 rounded-xl cursor-pointer flex items-center gap-1.5"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      Reset Attendance
                    </button>
                  </>
                )}
              </div>
            </div>

            {selectedMeetingId ? (
              <>
                {/* Stats Panel */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block">
                      Attendance Rate
                    </span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-extrabold text-slate-100">{attendanceRate}%</span>
                      <span className="text-xs text-slate-500">of logged members</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
                        style={{ width: `${attendanceRate}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex justify-between items-center">
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block">
                        Present
                      </span>
                      <span className="text-3xl font-extrabold text-slate-100">{presentCount}</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-emerald-950/40 text-emerald-400 border border-emerald-900/30">
                      <UserCheck className="h-6 w-6" />
                    </div>
                  </div>

                  <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex justify-between items-center">
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block">
                        Absent
                      </span>
                      <span className="text-3xl font-extrabold text-slate-100">{absentCount}</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-rose-950/40 text-rose-450 border border-rose-900/30">
                      <UserX className="h-6 w-6" />
                    </div>
                  </div>

                  <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex justify-between items-center">
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block">
                        Unmarked
                      </span>
                      <span className="text-3xl font-extrabold text-slate-100">{unmarkedCount}</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-900 text-slate-400 border border-slate-800">
                      <Users className="h-6 w-6" />
                    </div>
                  </div>
                </div>

                {/* Filters & Search */}
                <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-wrap gap-4 justify-between items-center">
                  <div className="relative max-w-md w-full">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search members by name or role..."
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-200 focus:outline-none"
                    />
                  </div>

                  <div className="flex gap-2">
                    {(['all', 'present', 'absent', 'unmarked'] as const).map((opt) => (
                      <button
                        key={opt}
                        onClick={() => setFilter(opt)}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-bold border uppercase tracking-wider transition-colors cursor-pointer ${
                          filter === opt
                            ? 'bg-indigo-650/20 text-indigo-400 border-indigo-550/20'
                            : 'bg-transparent text-slate-400 border-slate-800 hover:text-slate-300'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Members Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredMembers.length === 0 ? (
                    <div className="col-span-full glass-panel p-20 rounded-2xl border border-slate-850 text-center">
                      <Users className="h-8 w-8 text-slate-700 mx-auto mb-4" />
                      <p className="text-sm text-slate-500">No members match the current filter.</p>
                    </div>
                  ) : (
                    filteredMembers.map((member) => {
                      const record = attendanceRecords.find((r) => r.memberId === member.id);
                      const status = record?.status || 'unmarked';
                      const initials = `${member.firstName[0]}${member.lastName[0]}`.toUpperCase();

                      return (
                        <div
                          key={member.id}
                          className={`glass-panel p-5 rounded-2xl border transition-all duration-300 relative flex flex-col justify-between gap-5 ${
                            status === 'present'
                              ? 'border-emerald-500/20 hover:border-emerald-500/30'
                              : status === 'absent'
                              ? 'border-rose-500/20 hover:border-rose-500/30'
                              : 'border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex gap-3">
                            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center font-bold text-white text-sm shrink-0 shadow-md">
                              {initials}
                            </div>
                            <div className="min-w-0">
                              <h3 className="font-extrabold text-slate-200 text-sm truncate">
                                {member.firstName} {member.lastName}
                              </h3>
                              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block truncate">
                                {member.user?.role?.name || 'Resident'}
                              </span>
                              <span className="text-[10px] text-slate-400 truncate block mt-0.5">
                                {member.user?.email}
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-3 bg-slate-900/60 p-1 rounded-xl border border-slate-800/80 text-[10px] font-bold">
                            <button
                              onClick={() => handleUpdateStatus(member.id, 'present')}
                              className={`py-1.5 rounded-lg flex items-center justify-center gap-1 transition-colors cursor-pointer uppercase ${
                                status === 'present'
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/15'
                                  : 'text-slate-400 hover:text-slate-300'
                              }`}
                            >
                              <CheckCircle className="h-3.5 w-3.5" />
                              Present
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(member.id, 'absent')}
                              className={`py-1.5 rounded-lg flex items-center justify-center gap-1 transition-colors cursor-pointer uppercase ${
                                status === 'absent'
                                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/15'
                                  : 'text-slate-400 hover:text-slate-300'
                              }`}
                            >
                              <XCircle className="h-3.5 w-3.5" />
                              Absent
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(member.id, 'unmarked')}
                              className={`py-1.5 rounded-lg flex items-center justify-center gap-1 transition-colors cursor-pointer uppercase ${
                                status === 'unmarked'
                                  ? 'bg-slate-800 text-slate-200 border border-slate-700'
                                  : 'text-slate-400 hover:text-slate-350'
                              }`}
                            >
                              Unmarked
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </>
            ) : (
              <div className="glass-panel p-20 rounded-2xl border border-slate-800 text-center">
                <Calendar className="h-10 w-10 text-slate-750 mx-auto mb-4" />
                <p className="text-sm text-slate-500">No meeting scheduled. Please schedule a meeting above to log attendance.</p>
              </div>
            )}
          </>
        )}

        {/* Schedule Meeting Modal */}
        {modalOpen && (
          <div className="fixed inset-0 bg-black/75 flex items-center justify-center p-4 z-50 animate-fadeIn">
            <div className="glass-panel p-6 rounded-2xl border border-slate-800 max-w-md w-full space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-bold text-slate-250">Schedule New Meeting</h2>
                <button onClick={() => setModalOpen(false)} className="text-slate-500 hover:text-slate-400 cursor-pointer">
                  <XCircle className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={handleSubmit(handleCreateMeeting)} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">Meeting Title</label>
                  <input
                    type="text"
                    required
                    {...register('title')}
                    placeholder="e.g. PCB Design Workshop"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Meeting Date</label>
                  <input
                    type="date"
                    required
                    {...register('date')}
                    defaultValue={new Date().toISOString().split('T')[0]}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Agenda / Description</label>
                  <textarea
                    {...register('description')}
                    placeholder="Brief outline of topics to cover..."
                    rows={4}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none resize-none"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl cursor-pointer"
                >
                  Create Meeting Space
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Attendance;
