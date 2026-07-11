// IEEE Club Lead Dashboard - Kanban Board Logic

import store from './store.js';

export function initKanban() {
  const columns = {
    todo: document.getElementById('cards-todo'),
    in_progress: document.getElementById('cards-in-progress'),
    completed: document.getElementById('cards-completed')
  };

  const modalTask = document.getElementById('modal-task');
  const formTask = document.getElementById('form-task');
  const selectAssignee = document.getElementById('task-assignee');
  const btnCancelTask = document.getElementById('btn-cancel-task');
  const btnCloseTaskModal = document.getElementById('btn-close-task-modal');

  // 1. Subscribe to tasks updates
  store.subscribe('tasks', () => {
    renderKanbanBoards();
  });

  // 2. Subscribe to members updates to refresh assignee choices
  store.subscribe('members', (members) => {
    populateAssigneeSelect(members);
    renderKanbanBoards(); // Avatars might need member detail sync
  });

  // Set up Drag and Drop event listeners on Column Wrappers
  document.querySelectorAll('.kanban-column').forEach(column => {
    const container = column.querySelector('.kanban-cards-container');
    const status = column.getAttribute('data-status');

    column.addEventListener('dragover', (e) => {
      e.preventDefault();
      column.classList.add('drag-over');
    });

    column.addEventListener('dragleave', () => {
      column.classList.remove('drag-over');
    });

    column.addEventListener('drop', (e) => {
      e.preventDefault();
      column.classList.remove('drag-over');
      const taskId = e.dataTransfer.getData('text/plain');
      if (taskId) {
        store.moveTask(taskId, status);
      }
    });
  });

  // Task Form & Modal controls
  const closeModal = () => {
    modalTask.classList.remove('active');
    formTask.reset();
    document.getElementById('task-id').value = '';
    document.getElementById('task-modal-title').innerText = 'New Task';
    document.getElementById('btn-submit-task').innerText = 'Create Task';
  };

  btnCancelTask.addEventListener('click', closeModal);
  btnCloseTaskModal.addEventListener('click', closeModal);

  formTask.addEventListener('submit', (e) => {
    e.preventDefault();
    const taskId = document.getElementById('task-id').value;
    const title = document.getElementById('task-title').value.trim();
    const description = document.getElementById('task-description').value.trim();
    const priority = document.getElementById('task-priority').value;
    const assigneeId = document.getElementById('task-assignee').value || null;
    const dueDate = document.getElementById('task-due-date').value;

    if (!title) return;

    if (taskId) {
      // Edit mode
      store.updateTask(taskId, { title, description, priority, assigneeId, dueDate });
    } else {
      // Create mode
      store.addTask(title, description, priority, assigneeId, dueDate);
    }
    
    closeModal();
  });

  // Initialize
  populateAssigneeSelect(store.getState().members);
  renderKanbanBoards();
}

// Populate the select assignee dropdown in the task creation form
function populateAssigneeSelect(members) {
  const selectAssignee = document.getElementById('task-assignee');
  if (!selectAssignee) return;
  selectAssignee.innerHTML = `
    <option value="">Unassigned</option>
    <option value="__all__">👥 All Members</option>
    ${members.map(m => `<option value="${m.id}">${m.name} (${m.role})</option>`).join('')}
  `;
}

// Render task cards in their respective columns
function renderKanbanBoards() {
  const state = store.getState();
  const tasks = state.tasks;
  const members = state.members;

  // Clear column containers
  const containers = {
    todo: document.getElementById('cards-todo'),
    in_progress: document.getElementById('cards-in-progress'),
    completed: document.getElementById('cards-completed')
  };

  Object.values(containers).forEach(container => {
    if (container) container.innerHTML = '';
  });

  // Update counts
  const counts = { todo: 0, in_progress: 0, completed: 0 };

  tasks.forEach(task => {
    const container = containers[task.status];
    if (!container) return;

    counts[task.status]++;

    const assignee = members.find(m => m.id === task.assigneeId);
    const isAll = task.assigneeId === '__all__';
    const initials = isAll ? 'ALL' : (assignee ? assignee.name.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase() : '?');
    const avatarBg = isAll ? 'linear-gradient(135deg, #6366f1, #ec4899)' : (assignee ? assignee.avatarColor : '#4b5563');
    const avatarTitle = isAll ? 'All Members' : (assignee ? assignee.name + ' - ' + assignee.role : 'Unassigned');
    
    // Check if task is overdue
    let isOverdue = false;
    if (task.dueDate && task.status !== 'completed') {
      const today = new Date().toISOString().split('T')[0];
      if (task.dueDate < today) isOverdue = true;
    }

    const card = document.createElement('div');
    card.className = `task-card`;
    card.setAttribute('draggable', 'true');
    card.setAttribute('data-id', task.id);
    
    card.innerHTML = `
      <div class="task-card-header">
        <span class="task-priority-badge priority-badge-${task.priority}">${task.priority}</span>
        <div class="task-actions-menu">
          <button class="task-mini-btn btn-edit-task" title="Edit Task">
            <svg viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
          </button>
          <button class="task-mini-btn btn-delete-task" title="Delete Task">
            <svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
          </button>
        </div>
      </div>
      <div class="task-title">${escapeHTML(task.title)}</div>
      ${task.description ? `<div class="task-desc">${escapeHTML(task.description)}</div>` : ''}
      
      <div class="task-footer">
        <div class="task-due-date ${isOverdue ? 'overdue' : ''}" title="${isOverdue ? 'Overdue!' : 'Due Date'}">
          <svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
          <span>${task.dueDate ? formatDate(task.dueDate) : 'No due date'}</span>
        </div>
        <div class="task-assignee">
          <div class="assignee-avatar ${isAll ? 'assignee-avatar-all' : ''}" 
               style="background: ${avatarBg}; font-size: ${isAll ? '8px' : ''}" 
               title="${avatarTitle}">
            ${initials}
          </div>
        </div>
      </div>

      <!-- Mobile quick movement buttons -->
      <div class="task-mobile-moves">
        ${task.status !== 'todo' ? `<button class="btn-move" data-move="todo">← To Do</button>` : ''}
        ${task.status !== 'in_progress' ? `<button class="btn-move" data-move="in_progress">⚙️ Work</button>` : ''}
        ${task.status !== 'completed' ? `<button class="btn-move" data-move="completed">Done →</button>` : ''}
      </div>
    `;

    // Hook Drag events on Card
    card.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', task.id);
      card.classList.add('dragging');
    });

    card.addEventListener('dragend', () => {
      card.classList.remove('dragging');
    });

    // Hook Card Edit click
    card.querySelector('.btn-edit-task').addEventListener('click', (e) => {
      e.stopPropagation();
      openEditModal(task);
    });

    // Hook Card Delete click
    card.querySelector('.btn-delete-task').addEventListener('click', (e) => {
      e.stopPropagation();
      if (confirm(`Are you sure you want to delete the task "${task.title}"?`)) {
        store.deleteTask(task.id);
      }
    });

    // Hook Mobile quick moves
    card.querySelectorAll('.btn-move').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const targetStatus = btn.getAttribute('data-move');
        store.moveTask(task.id, targetStatus);
      });
    });

    container.appendChild(card);
  });

  // Display column empty states if no cards
  Object.keys(containers).forEach(status => {
    const container = containers[status];
    if (container && container.children.length === 0) {
      container.innerHTML = `
        <div class="empty-state" style="padding: 24px; min-height: 150px;">
          <div class="empty-state-icon" style="width: 32px; height: 32px;">
            <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>
          </div>
          <div class="empty-state-title" style="font-size: 13px;">No Tasks</div>
          <div class="empty-state-desc" style="font-size: 11px;">Drag tasks here or create new tasks.</div>
        </div>
      `;
    }
  });

  // Update badge headers
  document.getElementById('badge-todo').innerText = counts.todo;
  document.getElementById('badge-in-progress').innerText = counts.in_progress;
  document.getElementById('badge-completed').innerText = counts.completed;
}

// Form editing details injector
function openEditModal(task) {
  const modalTask = document.getElementById('modal-task');
  document.getElementById('task-id').value = task.id;
  document.getElementById('task-title').value = task.title;
  document.getElementById('task-description').value = task.description;
  document.getElementById('task-priority').value = task.priority;
  document.getElementById('task-assignee').value = task.assigneeId || '';
  document.getElementById('task-due-date').value = task.dueDate || '';

  document.getElementById('task-modal-title').innerText = 'Edit Task';
  document.getElementById('btn-submit-task').innerText = 'Save Changes';
  modalTask.classList.add('active');
}

// Utility Helpers
function escapeHTML(str) {
  return str.replace(/[&<>'"]/g, 
    tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag)
  );
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
