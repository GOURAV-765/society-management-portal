// IEEE Club Lead Dashboard - Attendance Logger Logic

import store from './store.js';

let currentFilter = 'all';
let searchQuery = '';

export function initAttendance() {
  const selectMeeting = document.getElementById('select-meeting');
  const btnAddMeeting = document.getElementById('btn-add-meeting');
  const btnMarkPresent = document.getElementById('btn-mark-all-present');
  const btnReset = document.getElementById('btn-reset-attendance');
  const searchInput = document.getElementById('search-attendance');
  const filterPills = document.querySelectorAll('.filter-pill');
  const modalMeeting = document.getElementById('modal-meeting');
  const formMeeting = document.getElementById('form-meeting');
  const btnCancelMeeting = document.getElementById('btn-cancel-meeting');
  const btnCloseMeetingModal = document.getElementById('btn-close-meeting-modal');

  // 1. Listen for meeting changes to re-render the dropdown
  store.subscribe('meetings', (meetings) => {
    renderMeetingDropdown(meetings);
    updateStats();
    renderMembersGrid();
  });

  // 2. Listen for selected meeting updates
  store.subscribe('selectedMeetingId', (meetingId) => {
    if (selectMeeting.value !== meetingId) {
      selectMeeting.value = meetingId || '';
    }
    updateStats();
    renderMembersGrid();
  });

  // 3. Listen for member changes (which affect the grid)
  store.subscribe('members', () => {
    renderMembersGrid();
    updateStats();
  });

  // 4. Listen for attendance changes (trigger recalculation of stats & layout updates)
  store.subscribe('attendance', () => {
    updateStats();
    renderMembersGrid();
  });

  // Setup Event Listeners
  selectMeeting.addEventListener('change', (e) => {
    store.setState('selectedMeetingId', e.target.value);
  });

  btnMarkPresent.addEventListener('click', () => {
    const meetingId = store.getState().selectedMeetingId;
    if (!meetingId) return;
    store.bulkUpdateAttendance(meetingId, 'present');
  });

  btnReset.addEventListener('click', () => {
    const meetingId = store.getState().selectedMeetingId;
    if (!meetingId) return;
    store.bulkUpdateAttendance(meetingId, 'unmarked');
  });

  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value.toLowerCase().trim();
    renderMembersGrid();
  });

  filterPills.forEach(pill => {
    pill.addEventListener('click', (e) => {
      filterPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      currentFilter = pill.getAttribute('data-filter');
      renderMembersGrid();
    });
  });

  // New Meeting Modal Controls
  btnAddMeeting.addEventListener('click', () => {
    modalMeeting.classList.add('active');
    document.getElementById('meeting-date').value = new Date().toISOString().split('T')[0];
    document.getElementById('meeting-title').focus();
  });

  const closeModal = () => {
    modalMeeting.classList.remove('active');
    formMeeting.reset();
  };

  btnCancelMeeting.addEventListener('click', closeModal);
  btnCloseMeetingModal.addEventListener('click', closeModal);

  formMeeting.addEventListener('submit', (e) => {
    e.preventDefault();
    const title = document.getElementById('meeting-title').value.trim();
    const date = document.getElementById('meeting-date').value;
    const description = document.getElementById('meeting-description').value.trim();

    if (title && date) {
      store.addMeeting(title, date, description);
      closeModal();
    }
  });

  // Member Modal Controls
  const btnAddMember = document.getElementById('btn-add-member');
  const modalMember = document.getElementById('modal-member');
  const formMember = document.getElementById('form-member');
  const btnCancelMember = document.getElementById('btn-cancel-member');
  const btnCloseMemberModal = document.getElementById('btn-close-member-modal');
  const btnDeleteMember = document.getElementById('btn-delete-member');
  const memberIdInput = document.getElementById('member-id');
  const memberNameInput = document.getElementById('member-name');
  const memberRoleInput = document.getElementById('member-role');
  const memberEmailInput = document.getElementById('member-email');
  const memberModalTitle = document.getElementById('member-modal-title');
  const btnSubmitMember = document.getElementById('btn-submit-member');

  btnAddMember.addEventListener('click', () => {
    modalMember.classList.add('active');
    memberModalTitle.innerText = 'New Member';
    btnSubmitMember.innerText = 'Add Member';
    btnDeleteMember.style.display = 'none';
    formMember.reset();
    memberIdInput.value = '';
    memberNameInput.focus();
  });

  const closeMemberModal = () => {
    modalMember.classList.remove('active');
    formMember.reset();
    memberIdInput.value = '';
  };

  btnCancelMember.addEventListener('click', closeMemberModal);
  btnCloseMemberModal.addEventListener('click', closeMemberModal);

  formMember.addEventListener('submit', (e) => {
    e.preventDefault();
    const id = memberIdInput.value;
    const name = memberNameInput.value.trim();
    const role = memberRoleInput.value.trim();
    const email = memberEmailInput.value.trim();

    if (name && role && email) {
      if (id) {
        store.updateMember(id, { name, role, email });
      } else {
        store.addMember(name, role, email);
      }
      closeMemberModal();
    }
  });

  btnDeleteMember.addEventListener('click', () => {
    const id = memberIdInput.value;
    if (id) {
      const member = store.getState().members.find(m => m.id === id);
      const name = member ? member.name : 'this member';
      if (confirm(`Are you sure you want to delete ${name}? This will remove their attendance logs and unassign their tasks.`)) {
        store.deleteMember(id);
        closeMemberModal();
      }
    }
  });

  // Initial render runs
  const state = store.getState();
  renderMeetingDropdown(state.meetings);
  if (state.selectedMeetingId) {
    selectMeeting.value = state.selectedMeetingId;
  }
  updateStats();
  renderMembersGrid();
}

function renderMeetingDropdown(meetings) {
  const selectMeeting = document.getElementById('select-meeting');
  selectMeeting.innerHTML = meetings.map(meet => `
    <option value="${meet.id}">${meet.title} (${meet.date})</option>
  `).join('');
}

function updateStats() {
  const state = store.getState();
  const meetingId = state.selectedMeetingId;
  const members = state.members;
  const attendance = state.attendance[meetingId] || {};

  if (!meetingId || members.length === 0) {
    document.getElementById('meet-stat-rate').innerText = '0%';
    document.getElementById('meet-stat-rate-fill').style.width = '0%';
    document.getElementById('meet-stat-present').innerText = '0';
    document.getElementById('meet-stat-absent').innerText = '0';
    document.getElementById('meet-stat-unmarked').innerText = '0';
    return;
  }

  let present = 0;
  let absent = 0;
  let unmarked = 0;

  members.forEach(member => {
    const status = attendance[member.id] || 'unmarked';
    if (status === 'present') present++;
    else if (status === 'absent') absent++;
    else unmarked++;
  });

  const totalMarked = present + absent;
  const rate = totalMarked > 0 ? Math.round((present / totalMarked) * 100) : 0;

  document.getElementById('meet-stat-rate').innerText = `${rate}%`;
  document.getElementById('meet-stat-rate-fill').style.width = `${rate}%`;
  document.getElementById('meet-stat-present').innerText = present;
  document.getElementById('meet-stat-absent').innerText = absent;
  document.getElementById('meet-stat-unmarked').innerText = unmarked;
}

function renderMembersGrid() {
  const gridContainer = document.getElementById('attendance-member-grid');
  const state = store.getState();
  const meetingId = state.selectedMeetingId;
  const members = state.members;
  const attendance = state.attendance[meetingId] || {};

  if (!meetingId) {
    gridContainer.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <div class="empty-state-icon">
          <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
        </div>
        <div class="empty-state-title">No Meeting Selected</div>
        <div class="empty-state-desc">Select or create a meeting to log member attendance details.</div>
      </div>
    `;
    return;
  }

  // Filter members by query and state status filter
  const filteredMembers = members.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchQuery) || 
                          member.role.toLowerCase().includes(searchQuery);
    
    const status = attendance[member.id] || 'unmarked';
    const matchesFilter = currentFilter === 'all' || status === currentFilter;

    return matchesSearch && matchesFilter;
  });

  if (filteredMembers.length === 0) {
    gridContainer.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <div class="empty-state-icon">
          <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
        </div>
        <div class="empty-state-title">No Members Found</div>
        <div class="empty-state-desc">Adjust your search parameters or select a different filter category.</div>
      </div>
    `;
    return;
  }

  gridContainer.innerHTML = filteredMembers.map(member => {
    const status = attendance[member.id] || 'unmarked';
    const initials = member.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    
    return `
      <div class="glass-panel member-card status-${status}" data-id="${member.id}">
        <div class="member-header">
          <div class="member-avatar" style="background-color: ${member.avatarColor}; box-shadow: 0 4px 10px ${member.avatarColor}33">
            ${initials}
          </div>
          <div class="member-info">
            <span class="member-name">${member.name}</span>
            <span class="member-role">${member.role}</span>
            <span class="member-email">${member.email}</span>
          </div>
          <button class="btn-edit-member" data-id="${member.id}" title="Edit Member details" aria-label="Edit Member">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
          </button>
        </div>

        <div class="attendance-toggle">
          <div class="attendance-option present-opt">
            <input type="radio" 
                   id="present-${member.id}" 
                   name="att-${member.id}" 
                   value="present" 
                   ${status === 'present' ? 'checked' : ''}>
            <label class="attendance-label" for="present-${member.id}">Present</label>
          </div>
          
          <div class="attendance-option absent-opt">
            <input type="radio" 
                   id="absent-${member.id}" 
                   name="att-${member.id}" 
                   value="absent" 
                   ${status === 'absent' ? 'checked' : ''}>
            <label class="attendance-label" for="absent-${member.id}">Absent</label>
          </div>

          <div class="attendance-option unmarked-opt">
            <input type="radio" 
                   id="unmarked-${member.id}" 
                   name="att-${member.id}" 
                   value="unmarked" 
                   ${status === 'unmarked' ? 'checked' : ''}>
            <label class="attendance-label" for="unmarked-${member.id}">Unmarked</label>
          </div>
        </div>
      </div>
    `;
  }).join('');

  // Add click/change listener callbacks to inputs in the rendered grid
  gridContainer.querySelectorAll('.attendance-option input[type="radio"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
      const memberId = e.target.id.split('-')[1];
      const newStatus = e.target.value;
      store.updateAttendance(meetingId, memberId, newStatus);
    });
  });

  // Add click listener to edit member buttons
  gridContainer.querySelectorAll('.btn-edit-member').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const memberId = btn.getAttribute('data-id');
      const member = store.getState().members.find(m => m.id === memberId);
      if (member) {
        const modalMember = document.getElementById('modal-member');
        const memberIdInput = document.getElementById('member-id');
        const memberNameInput = document.getElementById('member-name');
        const memberRoleInput = document.getElementById('member-role');
        const memberEmailInput = document.getElementById('member-email');
        const memberModalTitle = document.getElementById('member-modal-title');
        const btnSubmitMember = document.getElementById('btn-submit-member');
        const btnDeleteMember = document.getElementById('btn-delete-member');

        memberIdInput.value = member.id;
        memberNameInput.value = member.name;
        memberRoleInput.value = member.role;
        memberEmailInput.value = member.email;

        memberModalTitle.innerText = 'Edit Member';
        btnSubmitMember.innerText = 'Save Changes';
        btnDeleteMember.style.display = 'block';

        modalMember.classList.add('active');
        memberNameInput.focus();
      }
    });
  });
}
