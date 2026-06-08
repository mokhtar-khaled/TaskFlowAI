// ============================================
//   TASKFLOW AI — ai.js
//   Claude API chatbot with task context
// ============================================

const GROQ_API = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_KEY = 'YOUR_GROQ_KEY_HERE';

let conversationHistory = [];

// ── System prompt ─────────────────────────────

function buildSystemPrompt() {
  const tasks = window.getTasks ? window.getTasks() : [];
  const goals = window.getGoals ? window.getGoals() : [];

  const goalsSummary = goals.length === 0
    ? 'No goals yet.'
    : goals.map(g => {
        const goalTasks = tasks.filter(t => t.goalId === g.id);
        const done = goalTasks.filter(t => t.status === 'done').length;
        const pct  = goalTasks.length === 0 ? 0 : Math.round((done / goalTasks.length) * 100);
        return `- ${g.title} | ${done}/${goalTasks.length} tasks done (${pct}%)${g.description ? ' | ' + g.description : ''}`;
      }).join('\n');
  
  const tasksSummary = tasks.length === 0
    ? 'No tasks yet.'
    : tasks.map(t =>
        `- [${t.status}] ${t.title} | priority: ${t.priority}${t.date ? ' | due: ' + t.date : ''}${t.category ? ' | category: ' + t.category : ''}`
      ).join('\n');

  return `You are a smart, friendly AI assistant inside TaskFlow AI — a personal task manager app.

Your role is to help the user:
1. Break down big goals into smaller, actionable tasks
2. Suggest priorities and what to focus on next
3. Summarize their current workload
4. Give productivity advice
5. Create new tasks (see instructions below)

CURRENT GOALS:
${goalsSummary}

CURRENT TASKS IN THE APP:
${tasksSummary}

CREATING TASKS:
If the user asks you to add or create tasks, respond with a JSON block in this exact format at the END of your message (after your text response):

\`\`\`tasks
[
  {"title": "Task title here", "priority": "high|medium|low", "category": "Category", "description": "Optional description", "date": "YYYY-MM-DD or empty string"}
]
\`\`\`

Only include the JSON block when you are actually creating tasks. Do not include it for analysis or advice responses.

STYLE:
- Be concise and direct. No fluff.
- Use bullet points for lists.
- Be encouraging but honest.
- Under 200 words unless the user asks for detail.`;
}

// ── Send message ──────────────────────────────

async function sendMessage(userText) {
  if (!userText.trim()) return;

  appendMessage('user', userText);
  clearInput();
  hideSuggestions();

  const loadingId = appendLoadingBubble();

  conversationHistory.push({ role: 'user', content: userText });

  try {
    const response = await fetch(GROQ_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 1000,
        messages: [
          { role: 'system', content: buildSystemPrompt() },
          ...conversationHistory
        ]
      })
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error?.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    const fullText = data.choices[0].message.content;

    removeLoadingBubble(loadingId);
    conversationHistory.push({ role: 'assistant', content: fullText });

    // Parse and handle task creation
    const { cleanText, newTasks } = parseTasksFromResponse(fullText);
    appendMessage('bot', cleanText);

    if (newTasks.length > 0) {
      newTasks.forEach(t => window.addTaskFromAI(t));
      appendMessage('bot', `✦ Added ${newTasks.length} task${newTasks.length > 1 ? 's' : ''} to your list!`);
    }

  } catch (err) {
    removeLoadingBubble(loadingId);
    console.error('AI error:', err);

    if (err.message.includes('401') || err.message.includes('403') || err.message.includes('api_key')) {
      appendMessage('bot', '⚠ API key not configured. To enable the AI assistant:\n\n1. Get a free API key at console.anthropic.com\n2. Open js/ai.js\n3. Set your key at the top of the file\n\nSee README.md for full setup instructions.');
    } else if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
      appendMessage('bot', '⚠ Network error. Make sure you\'re running this on a local server (not directly from the file system). Try: npx serve . or python -m http.server');
    } else {
      appendMessage('bot', `⚠ Something went wrong: ${err.message}. Please try again.`);
    }
  }
}

// ── Parse tasks from AI response ──────────────

function parseTasksFromResponse(text) {
  const blockMatch = text.match(/```tasks\s*([\s\S]*?)```/);
  const cleanText = text.replace(/```tasks[\s\S]*?```/g, '').trim();

  let newTasks = [];
  if (blockMatch) {
    try {
      const parsed = JSON.parse(blockMatch[1].trim());
      newTasks = Array.isArray(parsed) ? parsed : [parsed];
    } catch (e) {
      console.warn('Could not parse task JSON from AI response', e);
    }
  }

  return { cleanText, newTasks };
}

// ── UI helpers ────────────────────────────────

function appendMessage(role, text) {
  const container = document.getElementById('ai-messages');
  const div = document.createElement('div');
  div.className = `ai-msg ai-msg--${role === 'user' ? 'user' : 'bot'}`;

  const bubble = document.createElement('div');
  bubble.className = 'ai-bubble';
  bubble.innerHTML = formatBotText(text);

  div.appendChild(bubble);
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
  return div;
}

function formatBotText(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code style="background:var(--bg-4);padding:1px 5px;border-radius:4px;font-size:12px;">$1</code>')
    .replace(/\n/g, '<br>');
}

function appendLoadingBubble() {
  const container = document.getElementById('ai-messages');
  const id = 'loading-' + Date.now();
  const div = document.createElement('div');
  div.className = 'ai-msg ai-msg--bot';
  div.id = id;
  div.innerHTML = `<div class="ai-bubble loading">
    <div class="dot-pulse"></div>
    <div class="dot-pulse"></div>
    <div class="dot-pulse"></div>
  </div>`;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
  return id;
}

function removeLoadingBubble(id) {
  const el = document.getElementById(id);
  if (el) el.remove();
}

function clearInput() {
  document.getElementById('ai-input').value = '';
}

function hideSuggestions() {
  document.getElementById('ai-suggestions').style.display = 'none';
}

// ── Panel open/close ──────────────────────────

function openAIPanel() {
  document.getElementById('ai-panel').classList.add('open');
  document.getElementById('main').classList.add('ai-open');
  document.getElementById('panel-overlay').classList.add('open');
  document.getElementById('ai-input').focus();
}

function closeAIPanel() {
  document.getElementById('ai-panel').classList.remove('open');
  document.querySelector('.main').classList.remove('ai-open');
  document.getElementById('panel-overlay').classList.remove('open');
}

// ── Suggestion chips ──────────────────────────

window.sendSuggestion = function(text) {
  sendMessage(text);
};

// ── Event listeners ───────────────────────────

document.getElementById('ai-toggle').addEventListener('click', openAIPanel);
document.getElementById('ai-close').addEventListener('click', closeAIPanel);
document.getElementById('panel-overlay').addEventListener('click', closeAIPanel);

document.getElementById('ai-send').addEventListener('click', () => {
  const val = document.getElementById('ai-input').value.trim();
  if (val) sendMessage(val);
});

document.getElementById('ai-input').addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    const val = document.getElementById('ai-input').value.trim();
    if (val) sendMessage(val);
  }
});
