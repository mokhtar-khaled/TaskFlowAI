// ============================================
//   TASKFLOW AI — app.js
//   Task CRUD, LocalStorage, Filters, UI
// ============================================

let tasks = JSON.parse(localStorage.getItem('taskflow_tasks') || '[]');
let currentFilter = 'all';       // sidebar filter
let currentStatus = 'all';       // tab filter
let editingId = null;

// ── Helpers ──────────────────────────────────

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
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

// ── Filtering logic ───────────────────────────

function getFilteredTasks() {
  let filtered = [...tasks];

  // Sidebar filter
  if (currentFilter === 'today') {
    filtered = filtered.filter(t => t.date === today());
  } else if (currentFilter === 'high') {
    filtered = filtered.filter(t => t.priority === 'high');
  } else if (currentFilter === 'done') {
    filtered = filtered.filter(t => t.status === 'done');
  }

  // Tab filter
  if (currentStatus !== 'all') {
    filtered = filtered.filter(t => t.status === currentStatus);
  }

  return filtered;
}

// ── Render ────────────────────────────────────

function render() {
  const list = document.getElementById('task-list');
  const empty = document.getElementById('empty-state');
  const filtered = getFilteredTasks();

  list.innerHTML = '';

  if (filtered.length === 0) {
    empty.style.display = 'block';
    list.style.display = 'none';
  } else {
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

document.getElementById('open-modal').addEventListener('click', openModal);
document.getElementById('modal-close').addEventListener('click', closeModal);
document.getElementById('modal-cancel').addEventListener('click', closeModal);
document.getElementById('modal-save').addEventListener('click', saveTask);

document.getElementById('modal-overlay').addEventListener('click', (e) => {
  if (e.target === document.getElementById('modal-overlay')) closeModal();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeModal();
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
