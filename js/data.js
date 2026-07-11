// IEEE Club Lead Dashboard - Seed Data

export const initialMembers = [
  { id: 'm1', name: 'Alex Rivera', role: 'IEEE Chairperson', email: 'alex.rivera@ieee.org', avatarColor: '#6366f1' },
  { id: 'm2', name: 'Priya Sharma', role: 'Vice Chair', email: 'priya.sharma@ieee.org', avatarColor: '#ec4899' },
  { id: 'm3', name: 'Marcus Chen', role: 'Treasurer', email: 'marcus.chen@ieee.org', avatarColor: '#10b981' },
  { id: 'm4', name: 'Elena Rostova', role: 'Webmaster', email: 'elena.r@ieee.org', avatarColor: '#f59e0b' },
  { id: 'm5', name: 'Devon Miller', role: 'Public Relations', email: 'devon.m@ieee.org', avatarColor: '#8b5cf6' },
  { id: 'm6', name: 'Sarah Jenkins', role: 'Technical Lead', email: 'sarah.j@ieee.org', avatarColor: '#06b6d4' },
  { id: 'm7', name: 'Jordan Kross', role: 'Event Coordinator', email: 'jordan.k@ieee.org', avatarColor: '#3b82f6' },
  { id: 'm8', name: 'Aaliyah Jackson', role: 'General Member', email: 'aaliyah.j@ieee.org', avatarColor: '#14b8a6' },
  { id: 'm9', name: 'Yuki Tanaka', role: 'General Member', email: 'yuki.t@ieee.org', avatarColor: '#f43f5e' },
  { id: 'm10', name: 'Carlos Mendez', role: 'General Member', email: 'carlos.m@ieee.org', avatarColor: '#10b981' }
];

export const initialMeetings = [
  { id: 'meet_1', title: 'Fall Semester Kickoff', date: '2026-09-08', description: 'Welcome new members, introduce officers, and outline the semester roadmap.' },
  { id: 'meet_2', title: 'PCB Design Workshop', date: '2026-09-22', description: 'Hands-on training session on KiCad for designing custom printed circuit boards.' },
  { id: 'meet_3', title: 'Robotics Team Synch', date: '2026-10-06', description: 'Reviewing progress on the micromouse project and ordering mechanical parts.' },
  { id: 'meet_4', title: 'Industry Panel Talk', date: '2026-10-20', description: 'Guest speakers from NVIDIA, Google, and Intel sharing career insights.' }
];

export const initialAttendance = {
  'meet_1': {
    'm1': 'present', 'm2': 'present', 'm3': 'present', 'm4': 'present', 'm5': 'present',
    'm6': 'present', 'm7': 'present', 'm8': 'present', 'm9': 'absent', 'm10': 'present'
  },
  'meet_2': {
    'm1': 'present', 'm2': 'present', 'm3': 'absent', 'm4': 'present', 'm5': 'present',
    'm6': 'present', 'm7': 'absent', 'm8': 'present', 'm9': 'present', 'm10': 'present'
  },
  'meet_3': {
    'm1': 'present', 'm2': 'present', 'm3': 'present', 'm4': 'absent', 'm5': 'absent',
    'm6': 'present', 'm7': 'present', 'm8': 'unmarked', 'm9': 'present', 'm10': 'unmarked'
  },
  'meet_4': {
    'm1': 'unmarked', 'm2': 'unmarked', 'm3': 'unmarked', 'm4': 'unmarked', 'm5': 'unmarked',
    'm6': 'unmarked', 'm7': 'unmarked', 'm8': 'unmarked', 'm9': 'unmarked', 'm10': 'unmarked'
  }
};

export const initialTasks = [
  {
    id: 'task_1',
    title: 'Design Kickoff Flyer',
    description: 'Create a social media flyer and printing posters for the Fall Kickoff event.',
    status: 'completed',
    priority: 'high',
    assigneeId: 'm5',
    dueDate: '2026-09-01'
  },
  {
    id: 'task_2',
    title: 'Order KiCad Parts',
    description: 'Purchase soldering kits, microcontrollers, and components for the workshop.',
    status: 'in_progress',
    priority: 'high',
    assigneeId: 'm3',
    dueDate: '2026-09-15'
  },
  {
    id: 'task_3',
    title: 'Deploy Workshop Registration',
    description: 'Add RSVP forms on the IEEE portal for the upcoming PCB workshop.',
    status: 'todo',
    priority: 'medium',
    assigneeId: 'm4',
    dueDate: '2026-09-18'
  },
  {
    id: 'task_4',
    title: 'Book Room for Industry Panel',
    description: 'Reserve the student union grand hall and request projector configurations.',
    status: 'todo',
    priority: 'medium',
    assigneeId: 'm7',
    dueDate: '2026-10-01'
  },
  {
    id: 'task_5',
    title: 'Prepare Slide Deck',
    description: 'Draft slides for introduction of the executive team and budget summary.',
    status: 'completed',
    priority: 'low',
    assigneeId: 'm1',
    dueDate: '2026-09-07'
  },
  {
    id: 'task_6',
    title: 'Email Industry Invitees',
    description: 'Send confirmation emails, parking passes, and schedule details to speakers.',
    status: 'in_progress',
    priority: 'high',
    assigneeId: 'm2',
    dueDate: '2026-10-10'
  }
];

// Initialize seed data if not present in the store
export function initializeSeedData(storeInstance) {
  const currentState = storeInstance.getState();
  
  if (!currentState.members || currentState.members.length === 0) {
    storeInstance.setMembers(initialMembers);
  }
  
  if (!currentState.meetings || currentState.meetings.length === 0) {
    storeInstance.setMeetings(initialMeetings);
  }
  
  // Set attendance seed data only if attendance has not been initialized for any seed meetings
  const attendanceKeys = Object.keys(currentState.attendance || {});
  if (attendanceKeys.length === 0) {
    // Merge or copy seed attendance
    const mergedAttendance = { ...currentState.attendance };
    Object.keys(initialAttendance).forEach(key => {
      mergedAttendance[key] = { ...initialAttendance[key] };
    });
    // For any meeting/member combinations that might be missing, pre-fill as unmarked
    initialMeetings.forEach(meet => {
      if (!mergedAttendance[meet.id]) mergedAttendance[meet.id] = {};
      initialMembers.forEach(mem => {
        if (!mergedAttendance[meet.id][mem.id]) {
          mergedAttendance[meet.id][mem.id] = 'unmarked';
        }
      });
    });
    storeInstance.setState('attendance', mergedAttendance);
  }

  if (!currentState.tasks || currentState.tasks.length === 0) {
    storeInstance.setTasks(initialTasks);
  }
}
