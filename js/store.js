// IEEE Club Lead Dashboard - State Manager

class Store {
  constructor() {
    this.storageKey = 'ieee_dashboard_state';
    this.listeners = {};
    
    // Default initial state
    this.state = {
      activeTab: 'overview',
      selectedMeetingId: null,
      members: [],
      meetings: [],
      attendance: {}, // { meetingId: { memberId: 'present' | 'absent' | 'unmarked' } }
      tasks: [],
      activities: []
    };

    this.loadState();
  }

  // Load state from localStorage
  loadState() {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        this.state = { ...this.state, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.error('Failed to load state from localStorage', e);
    }
  }

  // Save state to localStorage
  saveState() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.state));
    } catch (e) {
      console.error('Failed to save state to localStorage', e);
    }
  }

  // Subscribe to changes on a specific state key
  subscribe(key, callback) {
    if (!this.listeners[key]) {
      this.listeners[key] = [];
    }
    this.listeners[key].push(callback);
    
    // Return unsubscribe function
    return () => {
      this.listeners[key] = this.listeners[key].filter(cb => cb !== callback);
    };
  }

  // Update a slice of the state and notify listeners
  setState(key, value) {
    if (JSON.stringify(this.state[key]) === JSON.stringify(value)) return;
    
    this.state[key] = value;
    this.saveState();

    // Trigger specific listeners
    if (this.listeners[key]) {
      this.listeners[key].forEach(callback => callback(value));
    }

    // Trigger global listeners
    if (this.listeners['*']) {
      this.listeners['*'].forEach(callback => callback(this.state));
    }
  }

  // Get current state
  getState() {
    return this.state;
  }

  // Log dashboard events
  logActivity(text, type = 'info') {
    const newActivity = {
      id: 'act_' + Date.now(),
      text,
      type,
      time: new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
    };
    const currentActivities = this.state.activities || [];
    const updatedActivities = [newActivity, ...currentActivities].slice(0, 10);
    this.setState('activities', updatedActivities);
  }

  // Helper methods to update state
  setMembers(members) {
    this.setState('members', members);
  }

  setMeetings(meetings) {
    this.setState('meetings', meetings);
    if (meetings.length > 0 && !this.state.selectedMeetingId) {
      this.setState('selectedMeetingId', meetings[0].id);
    }
  }

  setTasks(tasks) {
    this.setState('tasks', tasks);
  }

  // Attendance operations
  updateAttendance(meetingId, memberId, status) {
    const newAttendance = { ...this.state.attendance };
    // Spread the nested object too — a shallow copy would keep the same reference
    // and fool the JSON.stringify equality check in setState, silencing all subscribers.
    newAttendance[meetingId] = { ...(newAttendance[meetingId] || {}) };
    newAttendance[meetingId][memberId] = status;
    this.setState('attendance', newAttendance);
  }

  bulkUpdateAttendance(meetingId, status) {
    const newAttendance = { ...this.state.attendance };
    newAttendance[meetingId] = {};
    this.state.members.forEach(member => {
      newAttendance[meetingId][member.id] = status;
    });
    this.setState('attendance', newAttendance);
    const meeting = this.state.meetings.find(m => m.id === meetingId);
    if (meeting) {
      this.logActivity(`Attendance status for meeting "${meeting.title}" set to ${status}.`, 'success');
    }
  }

  addMeeting(title, date, description) {
    const newMeeting = {
      id: 'meet_' + Date.now(),
      title,
      date: date || new Date().toISOString().split('T')[0],
      description: description || ''
    };
    const updatedMeetings = [...this.state.meetings, newMeeting];
    
    // Initialize empty attendance for this meeting
    const newAttendance = { ...this.state.attendance };
    newAttendance[newMeeting.id] = {};
    this.state.members.forEach(m => {
      newAttendance[newMeeting.id][m.id] = 'unmarked';
    });

    this.setState('attendance', newAttendance);
    this.setMeetings(updatedMeetings);
    this.setState('selectedMeetingId', newMeeting.id);
    this.logActivity(`Created new meeting: "${title}"`, 'info');
  }

  // Kanban operations
  addTask(title, description, priority, assigneeId, dueDate) {
    const newTask = {
      id: 'task_' + Date.now(),
      title,
      description: description || '',
      status: 'todo', // 'todo' | 'in_progress' | 'completed'
      priority: priority || 'medium', // 'low' | 'medium' | 'high'
      assigneeId: assigneeId || null,
      dueDate: dueDate || ''
    };
    this.setTasks([...this.state.tasks, newTask]);
    this.logActivity(`Added task: "${title}" to To-Do column`, 'info');
  }

  updateTask(taskId, updatedFields) {
    const oldTask = this.state.tasks.find(t => t.id === taskId);
    const updatedTasks = this.state.tasks.map(task => {
      if (task.id === taskId) {
        return { ...task, ...updatedFields };
      }
      return task;
    });
    this.setTasks(updatedTasks);
    if (oldTask && updatedFields.title && oldTask.title !== updatedFields.title) {
      this.logActivity(`Renamed task "${oldTask.title}" to "${updatedFields.title}"`, 'warning');
    }
  }

  deleteTask(taskId) {
    const task = this.state.tasks.find(t => t.id === taskId);
    const updatedTasks = this.state.tasks.filter(task => task.id !== taskId);
    this.setTasks(updatedTasks);
    if (task) {
      this.logActivity(`Deleted task: "${task.title}"`, 'danger');
    }
  }

  moveTask(taskId, newStatus) {
    const task = this.state.tasks.find(t => t.id === taskId);
    const statusLabels = { todo: 'To-Do', in_progress: 'In Progress', completed: 'Completed' };
    if (task && task.status !== newStatus) {
      this.updateTask(taskId, { status: newStatus });
      this.logActivity(`Moved task "${task.title}" to ${statusLabels[newStatus]}`, 'success');
    }
  }

  addMember(name, role, email) {
    const newMember = {
      id: 'm_' + Date.now(),
      name,
      role,
      email,
      avatarColor: this.getRandomColor()
    };
    const updatedMembers = [...this.state.members, newMember];
    
    // Also initialize attendance for this member as 'unmarked' for all existing meetings
    const newAttendance = { ...this.state.attendance };
    Object.keys(newAttendance).forEach(meetingId => {
      newAttendance[meetingId][newMember.id] = 'unmarked';
    });
    
    this.setState('attendance', newAttendance);
    this.setMembers(updatedMembers);
    this.logActivity(`Added new member: "${name}"`, 'success');
    return newMember;
  }

  updateMember(memberId, updatedFields) {
    const updatedMembers = this.state.members.map(member => {
      if (member.id === memberId) {
        return { ...member, ...updatedFields };
      }
      return member;
    });
    this.setMembers(updatedMembers);
    this.logActivity(`Updated member info for: "${updatedFields.name || memberId}"`, 'info');
  }

  deleteMember(memberId) {
    const member = this.state.members.find(m => m.id === memberId);
    const updatedMembers = this.state.members.filter(member => member.id !== memberId);
    
    // Clean up attendance references for this member
    const newAttendance = { ...this.state.attendance };
    Object.keys(newAttendance).forEach(meetingId => {
      delete newAttendance[meetingId][memberId];
    });
    
    // Clean up task assignments if the member is deleted
    const updatedTasks = this.state.tasks.map(task => {
      if (task.assigneeId === memberId) {
        return { ...task, assigneeId: null };
      }
      return task;
    });
    
    this.setState('attendance', newAttendance);
    this.setTasks(updatedTasks);
    this.setMembers(updatedMembers);
    
    if (member) {
      this.logActivity(`Deleted member: "${member.name}"`, 'danger');
    }
  }

  getRandomColor() {
    const colors = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#3b82f6', '#14b8a6', '#f43f5e'];
    return colors[Math.floor(Math.random() * colors.length)];
  }
}

// Create and export a single global instance
const store = new Store();
window.store = store; // attach to window for global access in modular files
export default store;
