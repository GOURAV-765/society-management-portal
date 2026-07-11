// IEEE Club Lead Dashboard - Application Controller

import store from './store.js';
import { initializeSeedData } from './data.js';
import { initAttendance } from './attendance.js';
import { initKanban } from './kanban.js';

document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize data store with seed values if empty
  initializeSeedData(store);

  // 2. Initialize feature components
  initAttendance();
  initKanban();

  // 3. Tab Navigation setup
  setupNavigation();

  // 4. Quick Actions mapping
  setupQuickActions();

  // 5. Theme Toggle initialization
  setupThemeToggle();

  // 6. Hook up global state listener for Overview stats & widgets
  store.subscribe('*', (state) => {
    updateOverviewStats(state);
    renderRecentActivities(state.activities || []);
    renderUpcomingMeetingsOverview(state.meetings || []);
  });

  // Trigger initial render of overview components
  const initialState = store.getState();
  updateOverviewStats(initialState);
  renderRecentActivities(initialState.activities || []);
  renderUpcomingMeetingsOverview(initialState.meetings || []);
});

// Setup tab routing
function setupNavigation() {
  const navItems = document.querySelectorAll('.nav-item');
  const tabPanes = document.querySelectorAll('.tab-pane');
  const mainTitle = document.getElementById('main-title');
  const mainSubtitle = document.getElementById('main-subtitle');
  const quickActionText = document.getElementById('quick-action-text');

  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const targetTab = item.getAttribute('data-tab');

      // Update Nav active classes
      navItems.forEach(nav => nav.classList.remove('active'));
      item.classList.add('active');

      // Update Tab Pane visibility
      tabPanes.forEach(pane => pane.classList.remove('active'));
      document.getElementById(`view-${targetTab}`).classList.add('active');

      // Update store activeTab
      store.setState('activeTab', targetTab);

      // Customize Page Headers and Buttons based on active tab
      if (targetTab === 'overview') {
        mainTitle.innerText = 'Dashboard Overview';
        mainSubtitle.innerText = 'Real-time club health, insights and task progress tracker.';
        quickActionText.innerText = 'Create Task';
      } else if (targetTab === 'attendance') {
        mainTitle.innerText = 'Attendance Logger';
        mainSubtitle.innerText = 'Track member participation, analyze engagement metrics, and log meetings.';
        quickActionText.innerText = 'Add Meeting';
      } else if (targetTab === 'tasks') {
        mainTitle.innerText = 'Club Tasks Board';
        mainSubtitle.innerText = 'Interactive Kanban workflow for collaborative project tracking.';
        quickActionText.innerText = 'Create Task';
      }
    });
  });
}

// Map the header quick action button dynamically based on active tab
function setupQuickActions() {
  const btnQuickAction = document.getElementById('btn-quick-action');
  
  btnQuickAction.addEventListener('click', () => {
    const currentTab = store.getState().activeTab;
    
    if (currentTab === 'tasks' || currentTab === 'overview') {
      // Open Create Task modal
      const modalTask = document.getElementById('modal-task');
      if (modalTask) {
        modalTask.classList.add('active');
        document.getElementById('task-title').focus();
      }
    } else if (currentTab === 'attendance') {
      // Open Add Meeting modal
      const modalMeeting = document.getElementById('modal-meeting');
      if (modalMeeting) {
        modalMeeting.classList.add('active');
        document.getElementById('meeting-date').value = new Date().toISOString().split('T')[0];
        document.getElementById('meeting-title').focus();
      }
    }
  });
}

// Light & Dark theme custom color styles
function setupThemeToggle() {
  const btnThemeToggle = document.getElementById('btn-theme-toggle');
  
  // Load saved theme
  const savedTheme = localStorage.getItem('ieee_dashboard_theme') || 'dark';
  if (savedTheme === 'light') {
    document.body.classList.add('light-theme');
    updateThemeToggleIcon(true);
  }

  btnThemeToggle.addEventListener('click', () => {
    const isLight = document.body.classList.toggle('light-theme');
    localStorage.setItem('ieee_dashboard_theme', isLight ? 'light' : 'dark');
    updateThemeToggleIcon(isLight);
    
    // Log theme toggle activity
    store.logActivity(`Switched app interface theme to ${isLight ? 'Light' : 'Dark'} Mode`, 'info');
  });
}

function updateThemeToggleIcon(isLight) {
  const toggleBtn = document.getElementById('btn-theme-toggle');
  if (isLight) {
    // Sun icon for switching back to dark
    toggleBtn.innerHTML = `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></svg>`;
  } else {
    // Moon icon for switching to light
    toggleBtn.innerHTML = `<svg viewBox="0 0 24 24"><path d="M12 3a9 9 0 1 0 9 9 9.75 9.75 0 0 0-.92-4.99 7.5 7.5 0 0 1-7.25-5.22A9.76 9.76 0 0 0 12 3z"></path></svg>`;
  }
}

// Calculate and render Overview statistics cards
function updateOverviewStats(state) {
  // 1. Members count
  const membersCount = state.members ? state.members.length : 0;
  document.getElementById('stat-members-count').innerText = membersCount;

  // 2. Average Attendance Rate
  let totalPresent = 0;
  let totalMarked = 0;

  if (state.meetings && state.meetings.length > 0 && state.attendance) {
    state.meetings.forEach(meet => {
      const meetAttendance = state.attendance[meet.id] || {};
      state.members.forEach(mem => {
        const status = meetAttendance[mem.id] || 'unmarked';
        if (status === 'present') {
          totalPresent++;
          totalMarked++;
        } else if (status === 'absent') {
          totalMarked++;
        }
      });
    });
  }

  const avgAttendance = totalMarked > 0 ? Math.round((totalPresent / totalMarked) * 100) : 0;
  document.getElementById('stat-attendance-rate').innerText = `${avgAttendance}%`;

  // 3. Pending Tasks
  const pendingTasks = state.tasks ? state.tasks.filter(t => t.status === 'todo' || t.status === 'in_progress').length : 0;
  const totalTasks = state.tasks ? state.tasks.length : 0;
  document.getElementById('stat-tasks-pending').innerText = pendingTasks;
  document.getElementById('stat-tasks-total').innerHTML = `<span>Out of ${totalTasks} total tasks</span>`;

  // 4. Upcoming meetings (date >= today)
  const todayStr = new Date().toISOString().split('T')[0];
  const upcomingMeetings = state.meetings ? state.meetings.filter(m => m.date >= todayStr).length : 0;
  document.getElementById('stat-upcoming-meetings').innerText = upcomingMeetings;
}

// Render dynamic activity list log inside Overview
function renderRecentActivities(activities) {
  const container = document.getElementById('recent-activities');
  if (!container) return;

  if (activities.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="padding: 16px;">
        <div class="empty-state-title" style="font-size: 13px;">No Operations Recorded</div>
        <div class="empty-state-desc" style="font-size: 11px;">Task edits, meeting logs, and movements will show here.</div>
      </div>
    `;
    return;
  }

  const typeConfig = {
    info: { color: 'var(--accent-indigo)', bg: 'rgba(99, 102, 241, 0.1)' },
    success: { color: 'var(--color-present)', bg: 'rgba(16, 185, 129, 0.1)' },
    warning: { color: 'var(--priority-medium)', bg: 'rgba(245, 158, 11, 0.1)' },
    danger: { color: 'var(--color-absent)', bg: 'rgba(244, 63, 94, 0.1)' }
  };

  container.innerHTML = activities.map(act => {
    const config = typeConfig[act.type] || typeConfig.info;
    return `
      <div class="activity-item">
        <div class="activity-badge" style="background-color: ${config.bg}; color: ${config.color}">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
        </div>
        <div class="activity-info">
          <div class="activity-text">${act.text}</div>
          <div class="activity-time">${act.time}</div>
        </div>
      </div>
    `;
  }).join('');
}

// Render upcoming meetings calendar overview
function renderUpcomingMeetingsOverview(meetings) {
  const container = document.getElementById('upcoming-meetings-list');
  if (!container) return;

  const todayStr = new Date().toISOString().split('T')[0];
  const upcoming = meetings
    .filter(m => m.date >= todayStr)
    .sort((a, b) => a.date.localeCompare(b.date));

  if (upcoming.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="padding: 16px;">
        <div class="empty-state-title" style="font-size: 13px;">No Upcoming Meetings</div>
        <div class="empty-state-desc" style="font-size: 11px;">Schedule a new meeting in the Attendance tracker tab.</div>
      </div>
    `;
    return;
  }

  container.innerHTML = upcoming.map(meet => {
    const parts = meet.date.split('-');
    const dateObj = new Date(parts[0], parts[1] - 1, parts[2]);
    const month = dateObj.toLocaleDateString(undefined, { month: 'short' }).toUpperCase();
    const day = dateObj.toLocaleDateString(undefined, { day: 'numeric' });

    return `
      <div class="activity-item" style="cursor: pointer;" data-meet-id="${meet.id}">
        <div class="activity-badge" style="background: linear-gradient(135deg, var(--accent-indigo), var(--accent-purple)); color: white; flex-direction: column; font-size: 9px; font-weight: 800;">
          <span style="font-size: 8px; line-height: 1;">${month}</span>
          <span style="font-size: 15px; font-weight: 800; line-height: 1.1; margin-top: 1px;">${day}</span>
        </div>
        <div class="activity-info">
          <div class="activity-text" style="font-weight: 700;">${meet.title}</div>
          <div class="activity-time" style="display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden;">${meet.description || 'No agenda outlined.'}</div>
        </div>
      </div>
    `;
  }).join('');

  // Add click listener to upcoming meeting items to quick jump to Attendance
  container.querySelectorAll('.activity-item').forEach(item => {
    item.addEventListener('click', () => {
      const meetId = item.getAttribute('data-meet-id');
      store.setState('selectedMeetingId', meetId);
      
      // Navigate to Attendance tab
      const attendanceNav = document.getElementById('nav-attendance');
      if (attendanceNav) attendanceNav.click();
    });
  });
}
