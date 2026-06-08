// ============================================
//   TASKFLOW AI — app.js
//   Task CRUD, LocalStorage, Filters, UI
// ============================================

let tasks = JSON.parse(localStorage.getItem('taskflow_tasks') || '[]');
let goals = JSON.parse(localStorage.getItem('taskflow_goals') || '[]');
let currentFilter = 'all';       // sidebar filter
let currentStatus = 'all';       // tab filter
let editingId = null;
let editingGoalId = null;
let viewingGoalId = null;
const COLOR_MAP = {
  accent: 'var(--accent)',
  blue:   'var(--blue)',
  orange: 'var(--orange)',
  red:    'var(--red)',
  green:  'var(--green)',
};

// ── Helpers ──────────────────────────────────
function saveGoals() { 
  localStorage.setItem('taskflow_goals', JSON.stringify(goals)); 
}

function saveTasks() {
  localStorage.setItem('taskflow_tasks', JSON.stringify(tasks));
}

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function today() {
  return new Date().toISOString().split('T')[0];
}

function isOverdue(dateStr) {
  if (!dateStr) return false;
  return dateStr < today();
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// ── Filtering logic ───────────────────────────

function getFilteredTasks() {
  let filtered = [...tasks];

  // Sidebar filter
  if (currentFilter === 'today') {
    filtered = filtered.filter(t => t.date === today());
  } 
  else if (currentFilter === 'high') {
    filtered = filtered.filter(t => t.priority === 'high');
  } 
  else if (currentFilter === 'done') {
    filtered = filtered.filter(t => t.status === 'done');
  }
  else if (currentFilter.startsWith('goal:')) {
    const gid = currentFilter.replace('goal:', '');
    filtered = filtered.filter(t => t.goalId === gid);
  }

  // Tab filter
  if (currentStatus !== 'all') {
    filtered = filtered.filter(t => t.status === currentStatus);
  }

  return filtered;
}

// ── Render ────────────────────────────────────

function render() {
  renderGoalsNav();
  populateGoalSelect();

  const list = document.getElementById('task-list');
  const empty = document.getElementById('empty-state');
  const filtered = getFilteredTasks();

  list.innerHTML = '';

  // Goal header when filtering by a specific goal
  if (currentFilter.startsWith('goal:')) {
    const gid  = currentFilter.replace('goal:', '');
    const goal = goals.find(g => g.id === gid);
    if (goal) {
      const allGoalTasks = tasks.filter(t => t.goalId === gid);
      const done  = allGoalTasks.filter(t => t.status === 'done').length;
      const total = allGoalTasks.length;
      const pct   = total === 0 ? 0 : Math.round((done / total) * 100);
      const color = COLOR_MAP[goal.color] || 'var(--accent)';

      const header = document.createElement('div');
      header.className = 'goal-list-header';
      header.innerHTML = `
        <div class="goal-list-header-top">
          <span class="goal-dot" style="background:${color}"></span>
          <h2>${escHtml(goal.title)}</h2>
          <button class="task-btn" onclick="openGoalDetail('${goal.id}')" title="View details">↗</button>
        </div>
        ${goal.description ? `<p class="goal-list-desc">${escHtml(goal.description)}</p>` : ''}
        <div class="goal-progress-bar-wrap" style="margin-top:12px;">
          <div class="goal-progress-bar-fill" style="width:${pct}%;background:${color};"></div>
        </div>
        <p class="stats-numbers" style="margin-top:6px;">${done} / ${total} tasks done — ${pct}%</p>
      `;
      list.appendChild(header);
    }
  }

  if (filtered.length === 0) {
    empty.style.display = 'block';
    if (!currentFilter.startsWith('goal:')) list.style.display = 'none';
  } 
  else {
    empty.style.display = 'none';
    list.style.display = 'flex';
    filtered.forEach(task => {
      list.appendChild(createTaskCard(task));
    });
  }

  updateCounts();
  updateProgress();
}

function createTaskCard(task) {
  const card = document.createElement('div');
  card.className = 'task-card' + (task.status === 'done' ? ' done-card' : '');
  card.dataset.id = task.id;

  const overdue = isOverdue(task.date) && task.status !== 'done';
  const goal = task.goalId ? goals.find(g => g.id === task.goalId) : null;
  const goalColor = goal ? (COLOR_MAP[goal.color] || 'var(--accent)') : null;

  card.innerHTML = `
    <button class="task-check ${task.status === 'done' ? 'checked' : ''}" 
            onclick="toggleDone('${task.id}')" title="Mark complete">
      ${task.status === 'done' ? '✓' : ''}
    </button>
    <div class="task-body">
      <div class="task-title-row">
        <span class="task-title">${escHtml(task.title)}</span>
      </div>
      ${task.description ? `<p class="task-desc">${escHtml(task.description)}</p>` : ''}
      <div class="task-meta">
        <span class="badge badge-${task.priority}">${task.priority}</span>
        <span class="badge badge-${task.status}">${task.status.replace('-', ' ')}</span>
        ${task.date ? `<span class="task-date ${overdue ? 'overdue' : ''}">
          ${overdue ? '⚠ ' : ''}${formatDate(task.date)}
        </span>` : ''}
        ${task.category ? `<span class="task-category">${escHtml(task.category)}</span>` : ''}
        ${goal ? `<span class="task-goal-tag" style="border-color:${goalColor};color:${goalColor};">◎ ${escHtml(goal.title)}</span>` : ''}
      </div>
    </div>
    <div class="task-actions">
      <button class="task-btn" onclick="openEdit('${task.id}')" title="Edit">✎</button>
      <button class="task-btn delete" onclick="deleteTask('${task.id}')" title="Delete">✕</button>
    </div>
  `;

  return card;
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function updateCounts() {
  const todayStr = today();
  document.getElementById('count-all').textContent = tasks.length;
  document.getElementById('count-today').textContent = tasks.filter(t => t.date === todayStr).length;
  document.getElementById('count-high').textContent = tasks.filter(t => t.priority === 'high').length;
  document.getElementById('count-done').textContent = tasks.filter(t => t.status === 'done').length;
}

function updateProgress() {
  const total = tasks.length;
  const done = tasks.filter(t => t.status === 'done').length;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  document.getElementById('progress-fill').style.width = pct + '%';
  document.getElementById('done-count').textContent = done;
  document.getElementById('total-count').textContent = total;
}

// ── Task Actions ──────────────────────────────

function toggleDone(id) {
  const task = tasks.find(t => t.id === id);
  if (!task) return;
  task.status = task.status === 'done' ? 'pending' : 'done';
  saveTasks();
  render();
}

function deleteTask(id) {
  tasks = tasks.filter(t => t.id !== id);
  saveTasks();
  render();
}

function openEdit(id) {
  const task = tasks.find(t => t.id === id);
  if (!task) return;
  editingId = id;
  document.getElementById('modal-title').textContent = 'Edit Task';
  document.getElementById('input-title').value = task.title;
  document.getElementById('input-desc').value = task.description || '';
  document.getElementById('input-priority').value = task.priority;
  document.getElementById('input-status').value = task.status;
  document.getElementById('input-date').value = task.date || '';
  document.getElementById('input-category').value = task.category || '';
  openModal();
}

// ── Modal ─────────────────────────────────────

function openModal() {
  document.getElementById('modal-overlay').classList.add('open');
  document.getElementById('input-title').focus();
}

function closeModal() {
  document.getElementById('modal-overlay').classList.remove('open');
  resetForm();
  editingId = null;
}

function resetForm() {
  document.getElementById('modal-title').textContent = 'New Task';
  document.getElementById('input-title').value = '';
  document.getElementById('input-desc').value = '';
  document.getElementById('input-priority').value = 'medium';
  document.getElementById('input-status').value = 'pending';
  document.getElementById('input-date').value = '';
  document.getElementById('input-category').value = '';
}

function saveTask() {
  const title = document.getElementById('input-title').value.trim();
  if (!title) {
    document.getElementById('input-title').focus();
    document.getElementById('input-title').style.borderColor = 'var(--red)';
    setTimeout(() => {
      document.getElementById('input-title').style.borderColor = '';
    }, 1500);
    return;
  }

  const taskData = {
    title,
    description: document.getElementById('input-desc').value.trim(),
    priority: document.getElementById('input-priority').value,
    status: document.getElementById('input-status').value,
    date: document.getElementById('input-date').value,
    category: document.getElementById('input-category').value.trim(),
    goalId:      document.getElementById('input-goal').value || null,
  };

  if (editingId) {
    const idx = tasks.findIndex(t => t.id === editingId);
    tasks[idx] = { ...tasks[idx], ...taskData };
  } else {
    tasks.unshift({ id: genId(), createdAt: Date.now(), ...taskData });
  }

  saveTasks();
  closeModal();
  render();
}

// ── Goals Nav ─────────────────────────────────

function renderGoalsNav() {
  const container = document.getElementById('goals-nav-list');
  container.innerHTML = '';
  goals.forEach(goal => {
    const goalTasks = tasks.filter(t => t.goalId === goal.id);
    const done      = goalTasks.filter(t => t.status === 'done').length;
    const color     = COLOR_MAP[goal.color] || 'var(--accent)';
    const isActive  = currentFilter === `goal:${goal.id}`;

    const btn = document.createElement('button');
    btn.className = 'nav-item' + (isActive ? ' active' : '');
    btn.innerHTML = `
      <span class="goal-dot" style="background:${color}"></span>
      <span class="goal-nav-title">${escHtml(goal.title)}</span>
      <span class="nav-count">${done}/${goalTasks.length}</span>
    `;
    btn.addEventListener('click', () => {
      document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = `goal:${goal.id}`;
      document.getElementById('view-title').textContent = goal.title;
      render();
    });
    container.appendChild(btn);
  });
}

function populateGoalSelect() {
  const sel = document.getElementById('input-goal');
  const cur = sel.value;
  sel.innerHTML = '<option value="">— No goal —</option>';
  goals.forEach(g => {
    const opt = document.createElement('option');
    opt.value = g.id;
    opt.textContent = g.title;
    sel.appendChild(opt);
  });
  if (cur) sel.value = cur;
}

// ── Goal Modal ────────────────────────────────

function openGoalModal(id) {
  if (id) {
    const g = goals.find(g => g.id === id);
    if (!g) return;
    editingGoalId = id;
    document.getElementById('goal-modal-title').textContent = 'Edit Goal';
    document.getElementById('input-goal-title').value       = g.title;
    document.getElementById('input-goal-desc').value        = g.description || '';
    document.getElementById('input-goal-color').value       = g.color || 'accent';
    document.getElementById('input-goal-date').value        = g.date || '';
  } 
  else {
    editingGoalId = null;
    document.getElementById('goal-modal-title').textContent = 'New Goal';
    document.getElementById('input-goal-title').value       = '';
    document.getElementById('input-goal-desc').value        = '';
    document.getElementById('input-goal-color').value       = 'accent';
    document.getElementById('input-goal-date').value        = '';
  }
  document.getElementById('goal-modal-overlay').classList.add('open');
  setTimeout(() => document.getElementById('input-goal-title').focus(), 50);
}

function closeGoalModal() {
  document.getElementById('goal-modal-overlay').classList.remove('open');
  editingGoalId = null;
}

function saveGoal() {
  const title = document.getElementById('input-goal-title').value.trim();
  if (!title) {
    document.getElementById('input-goal-title').style.borderColor = 'var(--red)';
    setTimeout(() => document.getElementById('input-goal-title').style.borderColor = '', 1500);
    return;
  }
  const goalData = {
    title,
    description: document.getElementById('input-goal-desc').value.trim(),
    color:       document.getElementById('input-goal-color').value,
    date:        document.getElementById('input-goal-date').value,
  };
  if (editingGoalId) {
    const idx = goals.findIndex(g => g.id === editingGoalId);
    goals[idx] = { ...goals[idx], ...goalData };
  } 
  else {
    goals.push({ id: genId(), createdAt: Date.now(), ...goalData });
  }
  saveGoals();
  closeGoalModal();
  render();
}

document.getElementById('open-goal-modal').addEventListener('click', () => openGoalModal(null));
document.getElementById('goal-modal-close').addEventListener('click', closeGoalModal);
document.getElementById('goal-modal-cancel').addEventListener('click', closeGoalModal);
document.getElementById('goal-modal-save').addEventListener('click', saveGoal);
document.getElementById('goal-modal-overlay').addEventListener('click', e => {
  if (e.target === document.getElementById('goal-modal-overlay')) closeGoalModal();
});

// ── Goal Detail Modal ─────────────────────────

function openGoalDetail(id) {
  const goal = goals.find(g => g.id === id);
  if (!goal) return;
  viewingGoalId = id;

  const goalTasks = tasks.filter(t => t.goalId === id);
  const done      = goalTasks.filter(t => t.status === 'done').length;
  const pct       = goalTasks.length === 0 ? 0 : Math.round((done / goalTasks.length) * 100);
  const color     = COLOR_MAP[goal.color] || 'var(--accent)';

  document.getElementById('goal-detail-title').textContent = goal.title;
document.getElementById('goal-detail-desc').textContent  = (goal.description ? goal.description + '  ' : '') + (goal.date ? '📅 ' + formatDate(goal.date) : '');
  document.getElementById('goal-detail-bar').style.width      = pct + '%';
  document.getElementById('goal-detail-bar').style.background = color;
  document.getElementById('goal-detail-pct').textContent      = `${done}/${goalTasks.length} — ${pct}%`;

  const container = document.getElementById('goal-detail-tasks');
  container.innerHTML = '';
  if (goalTasks.length === 0) {
    container.innerHTML = '<p style="font-size:13px;color:var(--text-3);text-align:center;padding:24px 0;">No tasks yet — add one below</p>';
  } 
  else {
    goalTasks.forEach(t => {
      const row = document.createElement('div');
      row.className = 'goal-task-row';
      row.innerHTML = `
        <button class="task-check ${t.status === 'done' ? 'checked' : ''}"
                onclick="toggleDone('${t.id}'); openGoalDetail('${id}')">
          ${t.status === 'done' ? '✓' : ''}
        </button>
        <span class="goal-task-title ${t.status === 'done' ? 'done-text' : ''}">${escHtml(t.title)}</span>
        <span class="badge badge-${t.priority}" style="margin-left:auto;">${t.priority}</span>
        <button class="task-btn delete" onclick="deleteTask('${t.id}'); openGoalDetail('${id}')">✕</button>
      `;
      container.appendChild(row);
    });
  }
  document.getElementById('goal-detail-overlay').classList.add('open');
}

document.getElementById('goal-detail-close').addEventListener('click', () => {
  document.getElementById('goal-detail-overlay').classList.remove('open');
  viewingGoalId = null;
});

document.getElementById('goal-detail-edit').addEventListener('click', () => {
  document.getElementById('goal-detail-overlay').classList.remove('open');
  openGoalModal(viewingGoalId);
});

document.getElementById('goal-detail-delete').addEventListener('click', () => {
  if (!confirm('Delete this goal? Tasks will remain but be unlinked from it.')) return;
  tasks.forEach(t => { if (t.goalId === viewingGoalId) t.goalId = null; });
  goals = goals.filter(g => g.id !== viewingGoalId);
  saveTasks(); saveGoals();
  document.getElementById('goal-detail-overlay').classList.remove('open');
  viewingGoalId = null;
  currentFilter = 'all';
  document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
  document.querySelector('[data-filter="all"]').classList.add('active');
  document.getElementById('view-title').textContent = 'All Tasks';
  render();
});

document.getElementById('goal-detail-add-task').addEventListener('click', () => {
  document.getElementById('goal-detail-overlay').classList.remove('open');
  resetForm();
  populateGoalSelect();
  document.getElementById('input-goal').value = viewingGoalId;
  openModal();
});

// ── Sidebar & Tab Filters ─────────────────────

document.querySelectorAll('.nav-item').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.dataset.filter;

    const titles = {
      all: 'All Tasks',
      today: 'Today',
      high: 'High Priority',
      done: 'Completed'
    };
    document.getElementById('view-title').textContent = titles[currentFilter];
    render();
  });
});

document.querySelectorAll('.filter-tab').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentStatus = btn.dataset.status;
    render();
  });
});

// ── Modal Events ──────────────────────────────

document.getElementById('open-modal').addEventListener('click', () => {
  resetForm();
  populateGoalSelect();
  // if currently viewing a goal, pre-select it
  if (currentFilter.startsWith('goal:')) {
    const gid = currentFilter.replace('goal:', '');
    document.getElementById('input-goal').value = gid;
  }
  openModal();
});
document.getElementById('modal-close').addEventListener('click', closeModal);
document.getElementById('modal-cancel').addEventListener('click', closeModal);
document.getElementById('modal-save').addEventListener('click', saveTask);

document.getElementById('modal-overlay').addEventListener('click', (e) => {
  if (e.target === document.getElementById('modal-overlay')) closeModal();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') { closeModal(); closeGoalModal(); }
  if (e.key === 'Enter' && document.getElementById('modal-overlay').classList.contains('open')) {
    if (document.activeElement.tagName !== 'TEXTAREA') saveTask();
  }
});

// ── Date header ───────────────────────────────

function setDateHeader() {
  const now = new Date();
  const opts = { weekday: 'long', month: 'long', day: 'numeric' };
  document.getElementById('header-date').textContent = now.toLocaleDateString('en-US', opts);
}

// ── Expose for AI module ──────────────────────

window.getTasks = () => tasks;
window.getGoals = () => goals;
window.addTaskFromAI = (taskData) => {
  tasks.unshift({ id: genId(), createdAt: Date.now(), status: 'pending', ...taskData });
  saveTasks();
  render();
};

// ── Seed data if empty ─────────────────────────

function seedIfEmpty() {
  if (tasks.length > 0) return;
  const seed = [
    { title: 'Set up project repository on GitHub', priority: 'high', status: 'done', date: today(), category: 'Dev', description: 'Initialize repo, add README and .gitignore' },
    { title: 'Design landing page wireframe', priority: 'medium', status: 'in-progress', date: today(), category: 'Design', description: '' },
    { title: 'Integrate Claude AI chatbot', priority: 'high', status: 'pending', date: today(), category: 'Dev', description: 'Connect to Claude API and handle conversation state' },
    { title: 'Write project README', priority: 'medium', status: 'pending', date: '', category: 'Docs', description: 'Include setup instructions and feature list' },
    { title: 'Deploy to GitHub Pages', priority: 'low', status: 'pending', date: '', category: 'Dev', description: '' },
  ];
  seed.forEach(t => tasks.unshift({ id: genId(), createdAt: Date.now(), ...t }));
  saveTasks();
}

// ── Init ──────────────────────────────────────

setDateHeader();
seedIfEmpty();
render();
