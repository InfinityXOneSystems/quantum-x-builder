/**
 * Quantum X Builder - Command Center Application
 * Integrates NLC backend, ChatGPT, Gemini, and GitHub mobile
 */

// Configuration
const CONFIG = {
    BACKEND_URL: window.location.hostname === 'localhost' 
        ? 'http://localhost:8787'
        : 'https://quantum-x-builder-backend.example.com', // Update with actual backend URL
    CHATGPT_API_KEY: '', // Set via environment or user input
    GEMINI_API_KEY: '', // Set via environment or user input
    GITHUB_TOKEN: '', // Set via environment or user input
};

// Monaco Editor instance
let editor = null;

// WebSocket connection for real-time updates
let ws = null;

// Command history
const commandHistory = [];
let historyIndex = -1;

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    initializeTabs();
    initializeMonacoEditor();
    initializeCommandInput();
    initializeQuickActions();
    initializeAgentCards();
    initializeWebSocket();
    loadAPIKeys();
    updateMetrics();
    
    // Update metrics every 30 seconds
    setInterval(updateMetrics, 30000);
});

/**
 * Initialize tab switching
 */
function initializeTabs() {
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.dataset.tab;
            
            // Update active tab
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // Update active content
            tabContents.forEach(content => content.classList.remove('active'));
            document.getElementById(`${tabName}-tab`).classList.add('active');
            
            // Resize Monaco editor if switching to editor tab
            if (tabName === 'editor' && editor) {
                editor.layout();
            }
        });
    });
}

/**
 * Initialize Monaco Editor
 */
function initializeMonacoEditor() {
    if (typeof require === 'undefined') {
        console.error('Monaco Editor loader not found');
        return;
    }

    require.config({ paths: { vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs' } });
    
    require(['vs/editor/editor.main'], function () {
        editor = monaco.editor.create(document.getElementById('monaco-editor'), {
            value: `// Quantum X Builder - Code Editor
// Write code, scripts, or configuration here

// Example: Natural Language Command Script
async function runCommand(command) {
    const response = await fetch('${CONFIG.BACKEND_URL}/api/nl/command', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + getAuthToken()
        },
        body: JSON.stringify({ input: command })
    });
    return await response.json();
}

// Try it!
// runCommand('list all agents');
`,
            language: 'javascript',
            theme: 'vs-dark',
            automaticLayout: true,
            minimap: { enabled: true },
            fontSize: 14,
            lineNumbers: 'on',
            renderWhitespace: 'selection',
            scrollBeyondLastLine: false,
        });
    });
}

/**
 * Initialize command input functionality
 */
function initializeCommandInput() {
    const input = document.getElementById('nl-input');
    const sendButton = document.getElementById('send-button');
    
    // Send command on button click
    sendButton.addEventListener('click', () => sendCommand());
    
    // Send command on Enter key
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendCommand();
        }
    });
    
    // Command history navigation
    input.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            navigateHistory('up');
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            navigateHistory('down');
        }
    });
}

/**
 * Navigate command history
 */
function navigateHistory(direction) {
    const input = document.getElementById('nl-input');
    
    if (direction === 'up' && historyIndex < commandHistory.length - 1) {
        historyIndex++;
        input.value = commandHistory[commandHistory.length - 1 - historyIndex];
    } else if (direction === 'down' && historyIndex > 0) {
        historyIndex--;
        input.value = commandHistory[commandHistory.length - 1 - historyIndex];
    } else if (direction === 'down' && historyIndex === 0) {
        historyIndex = -1;
        input.value = '';
    }
}

/**
 * Send natural language command
 */
async function sendCommand() {
    const input = document.getElementById('nl-input');
    const command = input.value.trim();
    
    if (!command) return;
    
    // Add to history
    commandHistory.push(command);
    historyIndex = -1;
    
    // Display user command
    addOutput(command, 'user');
    
    // Clear input and show loading
    input.value = '';
    input.disabled = true;
    
    try {
        // Try NLC backend first
        const response = await sendToNLC(command);
        
        if (response.success) {
            addOutput(response.response, 'system');
        } else {
            // Fallback to AI providers
            const aiResponse = await sendToAI(command);
            addOutput(aiResponse, 'system');
        }
    } catch (error) {
        addOutput(`Error: ${error.message}`, 'error');
    } finally {
        input.disabled = false;
        input.focus();
    }
    
    // Update metrics
    updateMetrics();
}

/**
 * Send command to NLC backend
 */
async function sendToNLC(command) {
    const response = await fetch(`${CONFIG.BACKEND_URL}/api/nl/command`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${getAuthToken()}`,
        },
        body: JSON.stringify({
            input: command,
            sessionId: getSessionId(),
        }),
    });
    
    if (!response.ok) {
        throw new Error(`NLC Backend error: ${response.statusText}`);
    }
    
    return await response.json();
}

/**
 * Send command to AI providers (ChatGPT/Gemini fallback)
 */
async function sendToAI(command) {
    // Try ChatGPT first
    if (CONFIG.CHATGPT_API_KEY) {
        try {
            return await sendToChatGPT(command);
        } catch (error) {
            console.error('ChatGPT error:', error);
        }
    }
    
    // Try Gemini as fallback
    if (CONFIG.GEMINI_API_KEY) {
        try {
            return await sendToGemini(command);
        } catch (error) {
            console.error('Gemini error:', error);
        }
    }
    
    return 'AI providers not configured. Please set API keys.';
}

/**
 * Send command to ChatGPT
 */
async function sendToChatGPT(command) {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${CONFIG.CHATGPT_API_KEY}`,
        },
        body: JSON.stringify({
            model: 'gpt-4',
            messages: [
                {
                    role: 'system',
                    content: 'You are a helpful assistant for the Quantum X Builder system. Help users control autonomous agents, workflows, and system operations using natural language commands.',
                },
                {
                    role: 'user',
                    content: command,
                },
            ],
        }),
    });
    
    const data = await response.json();
    return data.choices[0].message.content;
}

/**
 * Send command to Gemini
 */
async function sendToGemini(command) {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${CONFIG.GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            contents: [{
                parts: [{
                    text: `You are a helpful assistant for the Quantum X Builder system. Help users control autonomous agents, workflows, and system operations using natural language commands.\n\nUser: ${command}\n\nAssistant:`,
                }],
            }],
        }),
    });
    
    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
}

/**
 * Add output to command panel
 */
function addOutput(text, type = 'system') {
    const output = document.getElementById('command-output');
    const line = document.createElement('div');
    line.className = `output-line ${type}`;
    line.textContent = text;
    output.appendChild(line);
    output.scrollTop = output.scrollHeight;
    
    // Add to activity log
    addActivity(text);
}

/**
 * Initialize quick actions
 */
function initializeQuickActions() {
    const quickActions = document.querySelectorAll('.quick-action');
    
    quickActions.forEach(action => {
        action.addEventListener('click', () => {
            const command = action.dataset.cmd;
            document.getElementById('nl-input').value = command;
            sendCommand();
        });
    });
}

/**
 * Initialize agent cards
 */
function initializeAgentCards() {
    const agentCards = document.querySelectorAll('.agent-card');
    const workflowCards = document.querySelectorAll('.workflow-card');
    
    agentCards.forEach(card => {
        card.addEventListener('click', () => {
            const agent = card.dataset.agent;
            document.getElementById('nl-input').value = `show status of ${agent} agent`;
            sendCommand();
        });
    });
    
    workflowCards.forEach(card => {
        card.addEventListener('click', () => {
            const workflow = card.dataset.workflow;
            document.getElementById('nl-input').value = `show status of ${workflow} workflow`;
            sendCommand();
        });
    });
}

/**
 * Initialize WebSocket for real-time updates
 */
function initializeWebSocket() {
    const wsUrl = CONFIG.BACKEND_URL.replace('http', 'ws') + '/ws';
    
    try {
        ws = new WebSocket(wsUrl);
        
        ws.onopen = () => {
            console.log('WebSocket connected');
            addActivity('Real-time connection established');
        };
        
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            handleWebSocketMessage(data);
        };
        
        ws.onerror = (error) => {
            console.error('WebSocket error:', error);
        };
        
        ws.onclose = () => {
            console.log('WebSocket disconnected');
            // Attempt to reconnect after 5 seconds
            setTimeout(initializeWebSocket, 5000);
        };
    } catch (error) {
        console.error('WebSocket initialization failed:', error);
    }
}

/**
 * Handle WebSocket messages
 */
function handleWebSocketMessage(data) {
    if (data.type === 'agent_status') {
        updateAgentStatus(data);
    } else if (data.type === 'workflow_status') {
        updateWorkflowStatus(data);
    } else if (data.type === 'activity') {
        addActivity(data.message);
    }
}

/**
 * Update system metrics
 */
async function updateMetrics() {
    try {
        // Fetch metrics from backend
        const response = await fetch(`${CONFIG.BACKEND_URL}/api/nl/status`, {
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`,
            },
        });
        
        if (response.ok) {
            const data = await response.json();
            document.getElementById('agents-active').textContent = data.activeAgents || 5;
            document.getElementById('workflows-running').textContent = data.runningWorkflows || 3;
            document.getElementById('commands-today').textContent = data.commandsToday || commandHistory.length;
        }
    } catch (error) {
        console.error('Failed to update metrics:', error);
    }
}

/**
 * Add activity to the activity list
 */
function addActivity(message) {
    const activityList = document.getElementById('activity-list');
    const item = document.createElement('li');
    item.className = 'activity-item';
    
    const now = new Date();
    const timeStr = now.toLocaleTimeString();
    
    item.innerHTML = `
        ${message}
        <div class="activity-time">${timeStr}</div>
    `;
    
    activityList.insertBefore(item, activityList.firstChild);
    
    // Keep only last 10 items
    while (activityList.children.length > 10) {
        activityList.removeChild(activityList.lastChild);
    }
}

/**
 * Get or create session ID
 */
function getSessionId() {
    let sessionId = localStorage.getItem('qxb_session_id');
    if (!sessionId) {
        sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('qxb_session_id', sessionId);
    }
    return sessionId;
}

/**
 * Get auth token
 */
function getAuthToken() {
    let token = localStorage.getItem('qxb_auth_token');
    if (!token) {
        token = 'test-token'; // Default token for development
        localStorage.setItem('qxb_auth_token', token);
    }
    return token;
}

/**
 * Load API keys from localStorage or prompt user
 */
function loadAPIKeys() {
    CONFIG.CHATGPT_API_KEY = localStorage.getItem('chatgpt_api_key') || '';
    CONFIG.GEMINI_API_KEY = localStorage.getItem('gemini_api_key') || '';
    CONFIG.GITHUB_TOKEN = localStorage.getItem('github_token') || '';
    
    // Add settings button to configure keys
    const header = document.querySelector('.header');
    const settingsButton = document.createElement('button');
    settingsButton.textContent = '⚙️ Settings';
    settingsButton.style.cssText = 'background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: white; padding: 0.5rem 1rem; border-radius: 0.5rem; cursor: pointer; margin-left: 1rem;';
    settingsButton.onclick = showSettings;
    header.appendChild(settingsButton);
}

/**
 * Show settings modal for API keys
 */
function showSettings() {
    const chatGptKey = prompt('Enter ChatGPT API Key (optional):', CONFIG.CHATGPT_API_KEY);
    if (chatGptKey !== null) {
        CONFIG.CHATGPT_API_KEY = chatGptKey;
        localStorage.setItem('chatgpt_api_key', chatGptKey);
    }
    
    const geminiKey = prompt('Enter Gemini API Key (optional):', CONFIG.GEMINI_API_KEY);
    if (geminiKey !== null) {
        CONFIG.GEMINI_API_KEY = geminiKey;
        localStorage.setItem('gemini_api_key', geminiKey);
    }
    
    const githubToken = prompt('Enter GitHub Token (optional):', CONFIG.GITHUB_TOKEN);
    if (githubToken !== null) {
        CONFIG.GITHUB_TOKEN = githubToken;
        localStorage.setItem('github_token', githubToken);
    }
}

/**
 * Update agent status display
 */
function updateAgentStatus(data) {
    const card = document.querySelector(`[data-agent="${data.agent}"]`);
    if (card) {
        const statusEl = card.querySelector('.agent-status');
        statusEl.textContent = data.status;
    }
}

/**
 * Update workflow status display
 */
function updateWorkflowStatus(data) {
    const card = document.querySelector(`[data-workflow="${data.workflow}"]`);
    if (card) {
        const statusEl = card.querySelector('.workflow-status');
        statusEl.textContent = data.status;
    }
}

// GitHub Mobile Webhook Handler
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').then(() => {
        console.log('Service Worker registered for GitHub mobile support');
    });
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        sendCommand,
        sendToNLC,
        sendToAI,
    };
}
