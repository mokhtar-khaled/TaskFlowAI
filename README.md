# ⚡ TaskFlow AI

A clean, AI-powered task manager built with HTML, CSS, and Vanilla JavaScript. Manage your tasks and use a built-in Claude AI assistant to break down goals, suggest priorities, and auto-create tasks from natural language.

![TaskFlow AI Preview](assets/preview.png)

---

## ✨ Features

- **Full Task CRUD** — Create, edit, delete, and complete tasks
- **Priority & Status Tracking** — High / Medium / Low priority + Pending / In Progress / Done
- **Smart Filters** — Filter by All, Today, High Priority, or Completed
- **Progress Tracker** — Visual progress bar with daily stats
- **AI Assistant** — Powered by Claude API:
  - Summarize your current workload
  - Get prioritization advice
  - Break down big goals into tasks
  - Auto-create tasks from conversation
- **Local Storage** — All tasks persist in the browser (no backend needed)
- **Responsive Design** — Works on desktop and mobile

---

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/taskflow-ai.git
cd taskflow-ai
```

### 2. Set up your Claude API key

The AI assistant requires a Claude API key from Anthropic.

1. Get your free API key at [console.anthropic.com](https://console.anthropic.com)
2. Open `js/ai.js`
3. Add your API key to the fetch headers:

```js
headers: {
  'Content-Type': 'application/json',
  'x-api-key': 'YOUR_API_KEY_HERE',        // ← add this line
  'anthropic-version': '2023-06-01',        // ← add this line
  'anthropic-dangerous-direct-browser-access': 'true'  // ← add this line
},
```

> **Note:** For a production app, API keys should never be in frontend code. Use a backend proxy (Node.js/Express) to keep your key secure. This setup is for learning and demo purposes.

### 3. Run locally

You need a local server (not just opening `index.html` directly) due to browser security policies.

**Option A — Node.js:**
```bash
npx serve .
```

**Option B — Python:**
```bash
python -m http.server 8000
```

**Option C — VS Code:**
Install the [Live Server extension](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) and click "Go Live".

Then open `http://localhost:8000` (or whichever port) in your browser.

---

## 🗂 Project Structure

```
taskflow-ai/
├── index.html          ← Main HTML structure
├── css/
│   └── style.css       ← All styles (dark editorial theme)
├── js/
│   ├── app.js          ← Task CRUD, filters, local storage, UI logic
│   └── ai.js           ← Claude API integration, chat UI, task parsing
├── assets/
│   └── (screenshots)
└── README.md
```

---

## 🤖 How the AI Works

The AI assistant is powered by [Claude](https://anthropic.com/claude) via the Anthropic API.

Every time you send a message, the app:
1. Builds a system prompt that includes **all your current tasks** as context
2. Sends your message + conversation history to Claude
3. Parses the response for any `tasks` JSON blocks (for auto-creating tasks)
4. Displays the response in the chat panel

**Auto-task creation example:**
> "Break my goal of launching a website into tasks"

The AI will respond with advice AND automatically add the tasks to your list.

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Structure | HTML5 |
| Styling | CSS3 (Custom Properties, Flexbox, Grid, Animations) |
| Logic | Vanilla JavaScript (ES6+) |
| AI | Claude API (claude-sonnet-4) |
| Storage | Browser LocalStorage |
| Fonts | Syne + DM Sans (Google Fonts) |

---

## 📈 Potential Improvements

- [ ] Backend with Node.js + Express (secure API key)
- [ ] PostgreSQL database for multi-user support
- [ ] User authentication (login / signup)
- [ ] Drag-and-drop task reordering
- [ ] Kanban board view
- [ ] Export tasks to CSV / PDF
- [ ] Email/push notifications for due dates
- [ ] Team collaboration features

---

## 👤 Author

Built by **[Your Name]** as a portfolio project for a Full-Stack Developer internship application.

- GitHub: [@your-username](https://github.com/your-username)
- LinkedIn: [your-linkedin](https://linkedin.com/in/your-linkedin)

---

## 📄 License

MIT License — feel free to use and modify for your own projects.
