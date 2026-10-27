// chat-widget.js
// CurePoint Hospital — Floating AI Chat Widget
// Include on any page via: <script src="db.js"></script><script src="chat-widget.js"></script>

(function () {
  // ---------- 1. Inject widget styles ----------
  const style = document.createElement('style');
  style.textContent = `
    /* Floating launcher button */
    #cm-chat-launcher {
      position: fixed;
      bottom: 24px;
      right: 24px;
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: linear-gradient(135deg, #0284c7, #0ea5e9);
      color: white;
      border: none;
      font-size: 28px;
      cursor: pointer;
      box-shadow: 0 8px 24px rgba(2, 132, 199, 0.45);
      z-index: 9998;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    #cm-chat-launcher:hover {
      transform: translateY(-3px) scale(1.05);
      box-shadow: 0 12px 32px rgba(2, 132, 199, 0.55);
    }
    #cm-chat-launcher .cm-pulse {
      position: absolute;
      top: -3px;
      right: -3px;
      width: 14px;
      height: 14px;
      background: #ef4444;
      border-radius: 50%;
      border: 2px solid white;
      animation: cm-pulse 2s infinite;
    }
    @keyframes cm-pulse {
      0%, 100% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.3); opacity: 0.7; }
    }

    /* Side panel */
    #cm-chat-panel {
      position: fixed;
      top: 0;
      right: -440px;
      width: 420px;
      max-width: 95vw;
      height: 100vh;
      background: white;
      box-shadow: -8px 0 32px rgba(0, 0, 0, 0.18);
      z-index: 9999;
      display: flex;
      flex-direction: column;
      transition: right 0.35s cubic-bezier(0.4, 0, 0.2, 1);
      font-family: 'Segoe UI', Tahoma, sans-serif;
    }
    #cm-chat-panel.cm-open {
      right: 0;
    }

    /* Panel header */
    .cm-chat-header {
      background: linear-gradient(135deg, #0284c7, #0ea5e9);
      color: white;
      padding: 18px 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .cm-chat-header-info {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .cm-chat-avatar {
      width: 42px;
      height: 42px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.25);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 22px;
    }
    .cm-chat-title {
      font-size: 15px;
      font-weight: 700;
      margin: 0;
    }
    .cm-chat-subtitle {
      font-size: 11px;
      opacity: 0.9;
      margin: 0;
      display: flex;
      align-items: center;
      gap: 5px;
    }
    .cm-chat-dot {
      width: 7px;
      height: 7px;
      background: #4ade80;
      border-radius: 50%;
    }
    .cm-chat-close {
      background: rgba(255, 255, 255, 0.2);
      border: none;
      color: white;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      cursor: pointer;
      font-size: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .cm-chat-close:hover { background: rgba(255, 255, 255, 0.35); }

    /* Message area */
    .cm-chat-messages {
      flex: 1;
      overflow-y: auto;
      padding: 18px;
      background: #f8fafc;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .cm-msg {
      max-width: 85%;
      padding: 10px 14px;
      border-radius: 14px;
      font-size: 14px;
      line-height: 1.5;
      word-wrap: break-word;
    }
    .cm-msg-bot {
      background: white;
      color: #1e293b;
      border: 1px solid #e2e8f0;
      border-top-left-radius: 4px;
      align-self: flex-start;
    }
    .cm-msg-user {
      background: #0284c7;
      color: white;
      border-top-right-radius: 4px;
      align-self: flex-end;
    }
    .cm-msg strong { font-weight: 700; }

    /* Suggested questions */
    .cm-suggestions {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      padding: 10px 18px 0;
      background: #f8fafc;
    }
    .cm-suggestion {
      background: white;
      border: 1px solid #cbd5e1;
      color: #0284c7;
      padding: 6px 10px;
      border-radius: 20px;
      font-size: 12px;
      cursor: pointer;
      transition: all 0.15s;
    }
    .cm-suggestion:hover { background: #0284c7; color: white; }

    /* Input area */
    .cm-chat-input-wrap {
      padding: 14px;
      background: white;
      border-top: 1px solid #e2e8f0;
      display: flex;
      gap: 8px;
    }
    .cm-chat-input {
      flex: 1;
      padding: 10px 14px;
      border: 1px solid #cbd5e1;
      border-radius: 24px;
      font-size: 14px;
      outline: none;
    }
    .cm-chat-input:focus { border-color: #0284c7; }
    .cm-chat-send {
      background: #0284c7;
      color: white;
      border: none;
      width: 42px;
      height: 42px;
      border-radius: 50%;
      cursor: pointer;
      font-size: 18px;
    }
    .cm-chat-send:hover { background: #0369a1; }

    /* Typing dots */
    .cm-typing {
      display: inline-flex;
      gap: 4px;
      padding: 4px 0;
    }
    .cm-typing span {
      width: 7px;
      height: 7px;
      background: #94a3b8;
      border-radius: 50%;
      animation: cm-bounce 1.3s infinite;
    }
    .cm-typing span:nth-child(2) { animation-delay: 0.15s; }
    .cm-typing span:nth-child(3) { animation-delay: 0.3s; }
    @keyframes cm-bounce {
      0%, 60%, 100% { transform: translateY(0); opacity: 0.6; }
      30% { transform: translateY(-6px); opacity: 1; }
    }

    @media (max-width: 500px) {
      #cm-chat-panel { width: 100vw; right: -100vw; }
    }
  `;
  document.head.appendChild(style);

  // ---------- 2. Build widget DOM ----------
  const launcher = document.createElement('button');
  launcher.id = 'cm-chat-launcher';
  launcher.title = 'Ask AI about reports';
  launcher.innerHTML = `🤖<span class="cm-pulse"></span>`;

  const panel = document.createElement('div');
  panel.id = 'cm-chat-panel';
  panel.innerHTML = `
    <div class="cm-chat-header">
      <div class="cm-chat-header-info">
        <div class="cm-chat-avatar">🤖</div>
        <div>
          <p class="cm-chat-title">Report Assistant</p>
          <p class="cm-chat-subtitle"><span class="cm-chat-dot"></span>Powered by ChatterMate</p>
        </div>
      </div>
      <button class="cm-chat-close" id="cm-chat-close-btn">✕</button>
    </div>

    <div class="cm-chat-messages" id="cm-chat-messages">
      <div class="cm-msg cm-msg-bot">
        👋 Hi! I'm your hospital report assistant. Ask me anything about <strong>patients</strong>, <strong>doctor visits</strong>, <strong>lab tests</strong>, or <strong>payments</strong>.
      </div>
    </div>

    <div class="cm-suggestions" id="cm-suggestions">
      <button class="cm-suggestion">How much did we collect today?</button>
      <button class="cm-suggestion">Which doctor had the most visits this month?</button>
      <button class="cm-suggestion">How many lab tests are pending?</button>
      <button class="cm-suggestion">Who still owes money?</button>
    </div>

    <div class="cm-chat-input-wrap">
      <input type="text" class="cm-chat-input" id="cm-chat-input" placeholder="Ask about patients, visits, tests, money...">
      <button class="cm-chat-send" id="cm-chat-send-btn" title="Send">➤</button>
    </div>
  `;

  document.body.appendChild(launcher);
  document.body.appendChild(panel);

  // ---------- 3. Wire up behavior ----------
  const messagesEl = panel.querySelector('#cm-chat-messages');
  const inputEl = panel.querySelector('#cm-chat-input');
  const sendBtn = panel.querySelector('#cm-chat-send-btn');
  const closeBtn = panel.querySelector('#cm-chat-close-btn');
  const suggestionsEl = panel.querySelector('#cm-suggestions');

  function openPanel() {
    panel.classList.add('cm-open');
    launcher.style.display = 'none';
    setTimeout(() => inputEl.focus(), 300);
  }
  function closePanel() {
    panel.classList.remove('cm-open');
    launcher.style.display = 'flex';
  }

  launcher.addEventListener('click', openPanel);
  closeBtn.addEventListener('click', closePanel);

  // Pull the latest hospital data from localStorage
  function collectReportData() {
    const safeGet = (key) => {
      try { return JSON.parse(localStorage.getItem(key) || '[]'); }
      catch { return []; }
    };
    return {
      patients: safeGet('hp_patients'),
      doctors: safeGet('hp_doctors'),
      visits: safeGet('hp_visits'),
      labTests: safeGet('hp_labTests'),
      payments: safeGet('hp_payments')
    };
  }

  // Convert **bold** markdown into real HTML <strong>
  function renderMarkdown(text) {
    const esc = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    return esc
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br>');
  }

  function addMessage(text, who = 'bot', isHtml = false) {
    const div = document.createElement('div');
    div.className = `cm-msg cm-msg-${who}`;
    div.innerHTML = isHtml ? text : renderMarkdown(text);
    messagesEl.appendChild(div);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return div;
  }

  async function sendQuestion(question) {
    if (!question || !question.trim()) return;
    const q = question.trim();

    addMessage(q, 'user');
    inputEl.value = '';
    suggestionsEl.style.display = 'none';

    const typingEl = addMessage(
      '<div class="cm-typing"><span></span><span></span><span></span></div>',
      'bot', true
    );

    try {
      const res = await fetch('/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q, data: collectReportData() })
      });
      const json = await res.json();
      typingEl.innerHTML = renderMarkdown(json.answer || "I don't know.");
    } catch (err) {
      typingEl.innerHTML = `⚠️ Couldn't reach the server. Is <strong>server.js</strong> running on port 3000?`;
    }
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  sendBtn.addEventListener('click', () => sendQuestion(inputEl.value));
  inputEl.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendQuestion(inputEl.value);
  });
  suggestionsEl.addEventListener('click', (e) => {
    if (e.target.classList.contains('cm-suggestion')) {
      sendQuestion(e.target.textContent);
    }
  });
})();