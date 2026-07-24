import React, { useState, useEffect } from 'react';
import AnimatedPage from '../components/AnimatedPage.js';
import { useForm } from 'react-hook-form';
import api from '../services/api.js';
import { useToast } from '../context/ToastContext.js';
import { useAuth } from '../context/AuthContext.js';
import {
  KanbanSquare,
  Plus,
  Trash2,
  Edit2,
  Calendar,
  User,
  Loader2,
  XCircle,
  Clock,
  Sparkles,
} from 'lucide-react';

interface Member {
  id: string;
  firstName: string;
  lastName: string;
  user: {
    role: {
      name: string;
    };
  };
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: 'todo' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  assigneeId: string | null;
  dueDate: string | null;
}

const TasksBoard: React.FC = () => {
  const { showToast } = useToast();
  const { user } = useAuth();
  
  const [tasks, setTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const { register, handleSubmit, reset, setValue } = useForm<{
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high';
    assigneeId: string;
    dueDate: string;
  }>();

  const fetchData = async () => {
    try {
      setLoading(true);
      const [tasksRes, membersRes] = await Promise.all([
        api.get('/tasks'),
        api.get('/members', { params: { limit: 100, page: 1 } }),
      ]);
      setTasks(tasksRes.data?.tasks || []);
      setMembers(membersRes.data?.data || []);
    } catch (err: any) {
      showToast('Failed to load tasks and members.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreateModal = () => {
    setEditingTask(null);
    reset();
    setModalOpen(true);
  };

  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setValue('title', task.title);
    setValue('description', task.description || '');
    setValue('priority', task.priority);
    setValue('assigneeId', task.assigneeId || '');
    setValue('dueDate', task.dueDate || '');
    setModalOpen(true);
  };

  const handleSaveTask = async (data: any) => {
    try {
      const payload = {
        ...data,
        assigneeId: data.assigneeId || null,
        dueDate: data.dueDate || null,
      };

      if (editingTask) {
        // Edit mode
        const res = await api.put(`/tasks/${editingTask.id}`, {
          ...payload,
          status: editingTask.status, // Preserve status on update
        });
        if (res.data?.success) {
          showToast('Task updated successfully.', 'success');
          fetchData();
        }
      } else {
        // Create mode
        const res = await api.post('/tasks', payload);
        if (res.data?.success) {
          showToast('New task added.', 'success');
          fetchData();
        }
      }
      setModalOpen(false);
    } catch (err: any) {
      showToast('Failed to save task.', 'error');
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    try {
      const res = await api.delete(`/tasks/${id}`);
      if (res.data?.success) {
        showToast('Task deleted.', 'success');
        setTasks((prev) => prev.filter((t) => t.id !== id));
      }
    } catch (err: any) {
      showToast('Failed to delete task.', 'error');
    }
  };

  const handleMoveTask = async (taskId: string, newStatus: 'todo' | 'in_progress' | 'completed') => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    try {
      // Optimistic update
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
      );

      await api.put(`/tasks/${taskId}`, {
        title: task.title,
        description: task.description,
        priority: task.priority,
        assigneeId: task.assigneeId,
        dueDate: task.dueDate,
        status: newStatus,
      });
    } catch (err: any) {
      showToast('Failed to update task status.', 'error');
      fetchData(); // Sync on failure
    }
  };

  const getMemberInitialsAndName = (assigneeId: string | null) => {
    if (!assigneeId) return { initials: '?', name: 'Unassigned' };
    if (assigneeId === '__all__') return { initials: 'ALL', name: 'All Members' };
    const member = members.find((m) => m.id === assigneeId);
    if (!member) return { initials: '?', name: 'Unknown Member' };
    return {
      initials: `${member.firstName[0]}${member.lastName[0]}`.toUpperCase(),
      name: `${member.firstName} ${member.lastName}`,
    };
  };

  const columns = [
    { id: 'todo' as const, title: 'To Do', colorClass: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' },
    { id: 'in_progress' as const, title: 'In Progress', colorClass: 'bg-amber-500/10 text-amber-405 border-amber-500/20' },
    { id: 'completed' as const, title: 'Completed', colorClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  ];

  return (
    <AnimatedPage>
      <div className="p-6 max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-850 pb-6">
          <div className="space-y-1">
            <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
              Tasks Board
            </h1>
            <p className="text-sm text-slate-400">
              Sleek club task lists, drag-and-drop workspace tracker, and contributor logs.
            </p>
          </div>
          <button
            onClick={openCreateModal}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-[0_0_20px_rgba(79,70,229,0.35)]"
          >
            <Plus className="h-4 w-4" />
            Create Task
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
            <p className="text-sm text-slate-400">Loading Kanban board...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {columns.map((col) => {
              const colTasks = tasks.filter((t) => t.status === col.id);
              return (
                <div
                  key={col.id}
                  className="glass-panel p-4 rounded-2xl border border-slate-850 bg-slate-950/20 flex flex-col gap-4 min-h-[500px]"
                >
                  <div className="flex justify-between items-center border-b border-slate-850 pb-2.5">
                    <span className="text-xs font-extrabold tracking-wider uppercase text-slate-450">
                      {col.title}
                    </span>
                    <span className="text-[10px] bg-slate-900 border border-slate-800 text-slate-500 px-2 py-0.5 rounded-full font-black">
                      {colTasks.length}
                    </span>
                  </div>

                  <div className="flex-1 space-y-4 overflow-y-auto max-h-[600px] pr-0.5">
                    {colTasks.length === 0 ? (
                      <div className="text-center py-12 text-xs text-slate-500 border border-dashed border-slate-850 rounded-2xl">
                        No tasks in this column.
                      </div>
                    ) : (
                      colTasks.map((task) => {
                        const { initials, name: assigneeName } = getMemberInitialsAndName(task.assigneeId);
                        
                        // Check if task is overdue
                        let isOverdue = false;
                        if (task.dueDate && task.status !== 'completed') {
                          const today = new Date().toISOString().split('T')[0];
                          if (task.dueDate < today) isOverdue = true;
                        }

                        return (
                          <div
                            key={task.id}
                            className="bg-slate-900/60 p-4 rounded-xl border border-slate-850/80 space-y-3 shadow-md hover:border-slate-800 transition-colors"
                          >
                            <div className="flex justify-between items-start gap-2">
                              <span
                                className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded border uppercase tracking-wider ${
                                  task.priority === 'high'
                                    ? 'bg-rose-500/10 text-rose-455 border-rose-500/20'
                                    : task.priority === 'medium'
                                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                    : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                                }`}
                              >
                                {task.priority}
                              </span>

                              <div className="flex gap-1.5">
                                <button
                                  onClick={() => openEditModal(task)}
                                  className="text-slate-500 hover:text-indigo-400 p-0.5 transition-colors cursor-pointer"
                                  title="Edit Task"
                                >
                                  <Edit2 className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteTask(task.id)}
                                  className="text-slate-500 hover:text-rose-450 p-0.5 transition-colors cursor-pointer"
                                  title="Delete Task"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>

                            <h4 className="font-extrabold text-slate-200 text-xs leading-normal">
                              {task.title}
                            </h4>
                            
                            {task.description && (
                              <p className="text-[10px] text-slate-450 leading-relaxed">
                                {task.description}
                              </p>
                            )}

                            <div className="flex justify-between items-center border-t border-slate-850/60 pt-2 text-[9px] text-slate-500">
                              <div
                                className={`flex items-center gap-1 ${
                                  isOverdue ? 'text-rose-450 font-bold' : ''
                                }`}
                                title={task.dueDate ? `Due date: ${task.dueDate}` : 'No due date'}
                              >
                                <Clock className="h-3 w-3" />
                                <span>
                                  {task.dueDate
                                    ? new Date(task.dueDate).toLocaleDateString(undefined, {
                                        month: 'short',
                                        day: 'numeric',
                                      })
                                    : 'No due date'}
                                </span>
                              </div>

                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-slate-400" title={assigneeName}>
                                  {initials}
                                </span>
                                <select
                                  value={task.status}
                                  onChange={(e) =>
                                    handleMoveTask(task.id, e.target.value as any)
                                  }
                                  className="bg-slate-950 border border-slate-800 rounded px-1 py-0.5 text-[9px] text-slate-350 focus:outline-none cursor-pointer"
                                >
                                  <option value="todo">TODO</option>
                                  <option value="in_progress">WORK</option>
                                  <option value="completed">DONE</option>
                                </select>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Task Form Modal */}
        {modalOpen && (
          <div className="fixed inset-0 bg-black/75 flex items-center justify-center p-4 z-50 animate-fadeIn">
            <div className="glass-panel p-6 rounded-2xl border border-slate-800 max-w-md w-full space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-bold text-slate-250">
                  {editingTask ? 'Edit Task' : 'Create Task'}
                </h2>
                <button onClick={() => setModalOpen(false)} className="text-slate-500 hover:text-slate-400 cursor-pointer">
                  <XCircle className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={handleSubmit(handleSaveTask)} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">Task Title</label>
                  <input
                    type="text"
                    required
                    {...register('title')}
                    placeholder="e.g. Design event brochure"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Description</label>
                  <textarea
                    {...register('description')}
                    placeholder="Provide specific notes and items..."
                    rows={3}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-400 mb-1">Priority</label>
                    <select
                      {...register('priority')}
                      defaultValue="medium"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-250 focus:outline-none cursor-pointer"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Due Date</label>
                    <input
                      type="date"
                      {...register('dueDate')}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-200 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Assign Teammate</label>
                  <select
                    {...register('assigneeId')}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-250 focus:outline-none cursor-pointer"
                  >
                    <option value="">Unassigned</option>
                    <option value="__all__">👥 All Members</option>
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.firstName} {m.lastName}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl cursor-pointer"
                >
                  {editingTask ? 'Save Changes' : 'Publish Task'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </AnimatedPage>
  );
};

export default TasksBoard;
