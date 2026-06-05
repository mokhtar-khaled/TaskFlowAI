# ⚡ TaskFlow AI

A clean, AI-powered task manager built with HTML, CSS, and Vanilla JavaScript. Manage your tasks and use a built-in AI assistant to break down goals, suggest priorities, and auto-create tasks from natural language.

---

## ✨ Features

- **Full Task CRUD** — Create, edit, delete, and complete tasks
- **Priority & Status Tracking** — High / Medium / Low priority + Pending / In Progress / Done
- **Smart Filters** — Filter by All, Today, High Priority, or Completed
- **Progress Tracker** — Visual progress bar with daily stats
- **AI Assistant** — Powered by Groq API (Llama 3.3 70b):
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
git clone https://github.com/mokhtar-khaled/TaskFlowAI.git
cd TaskFlowAI
```

### 2. Set up your Groq API key

The AI assistant requires a free API key from Groq.

1. Get your free API key at [console.groq.com](https://console.groq.com)
2. Open `js/ai.js`
3. Replace the placeholder on line 7:

```js
const GROQ_KEY = 'YOUR_GROQ_KEY_HERE';
```

> **Note:** For a production app, API keys should never be in frontend code. Use a backend proxy (Node.js/Express) to keep your key secure. This setup is for learning and demo purposes.

### 3. Run locally

You need a local server (not just opening `index.html` directly) due to browser security policies.

**Option A — VS Code:**
Install the [Live Server extension](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) and click "Go Live".

**Option B — Node.js:**
```bash
npx serve .
```

**Option C — Python:**
```bash
python -m http.server 8000
```

Then open `http://localhost:5500` (or whichever port) in your browser.

---

## 🗂 Project Structure

```
TaskFlowAI/
├── index.html          ← Main HTML structure
├── css/
│   └── style.css       ← All styles (dark editorial theme)
├── js/
│   ├── app.js          ← Task CRUD, filters, local storage, UI logic
│   └── ai.js           ← Groq API integration, chat UI, task parsing
└── README.md
```

---

## 🤖 How the AI Works

The AI assistant is powered by [Groq](https://groq.com) running the **Llama 3.3 70b** model.

Every time you send a message, the app:
1. Builds a system prompt that includes **all your current tasks** as context
2. Sends your message + conversation history to the Groq API
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
| AI | Groq API (Llama 3.3 70b) |
| Storage | Browser LocalStorage |
| Fonts | Syne + DM Sans (Google Fonts) |

---

## 👤 Author

Built by **Mohamed Mokhtar Khaled** 

- GitHub: [@mokhtar-khaled](https://github.com/mokhtar-khaled)
- LinkedIn: [mohamed-mokhtar-khaled](https://linkedin.com/in/mohamed-mokhtar-khaled)

---

## 📄 License

MIT License — feel free to use and modify for your own projects.