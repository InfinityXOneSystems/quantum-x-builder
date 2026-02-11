# Quantum X Builder - Command Center

> Universal Natural Language Interface for GitHub Pages

The Command Center is a powerful, AI-driven interface that enables you to control and monitor the entire Quantum X Builder system using natural language commands from anywhere - desktop, mobile, or GitHub mobile app.

## 🚀 Features

### Natural Language Control
- **Plain English Commands**: Control agents, workflows, and system operations using conversational language
- **AI Integration**: Powered by ChatGPT, Gemini, and custom NLP engine
- **Context Awareness**: Maintains conversation history and understands follow-up commands

### Code Editor
- **Monaco Editor**: Full-featured code editor (same as VS Code)
- **Syntax Highlighting**: Support for JavaScript, TypeScript, Python, YAML, and more
- **Autocomplete**: IntelliSense support for faster coding

### Real-Time Monitoring
- **Live Dashboard**: Monitor active agents, running workflows, and system metrics
- **WebSocket Updates**: Real-time status updates without page refresh
- **Activity Log**: Complete audit trail of all commands and actions

### Mobile-First
- **Progressive Web App**: Install to home screen for app-like experience
- **Offline Support**: Works without internet connection
- **Push Notifications**: Get notified of important events
- **GitHub Mobile Integration**: Control system from GitHub mobile app

### Secure Access
- **Cloudflare Tunnel**: Secure access to local VS Code, Docker, and Ollama
- **Authentication**: Token-based authentication with role-based permissions
- **Audit Logging**: All actions logged for security and compliance
- **Kill Switch**: Emergency shutdown mechanism

## 🎯 Quick Start

### Access Online

Visit: **https://infinityxonesystems.github.io/quantum-x-builder/**

### Run Locally

```bash
cd command-center
python3 -m http.server 8000
# Open http://localhost:8000
```

### Try Your First Command

1. Click in the command input box
2. Type: `help`
3. Press Enter
4. Try more commands like:
   - `list all agents`
   - `show system status`
   - `what workflows are available`

## 📱 Mobile App

### Install as PWA

**iOS (Safari):**
1. Visit the command center
2. Tap the Share button
3. Select "Add to Home Screen"

**Android (Chrome):**
1. Visit the command center
2. Tap the menu (⋮)
3. Select "Add to Home Screen"

### GitHub Mobile Integration

1. Open GitHub mobile app
2. Navigate to repository
3. Open Actions tab
4. Use workflow dispatch to send commands

## 💡 Example Commands

### Agent Management
```
start the evolution agent
stop the autonomous agent
show status of healing agent
list all agents
```

### Workflow Control
```
run fix-all workflow
trigger ultimate-fix-all
show workflow runs
list available workflows
```

### System Information
```
what is the system status
show active agents
how many workflows ran today
show recent activity
```

### Advanced
```
create branch feature/new-ui from main
create PR from feature/new-ui to main
trigger workflow fix-all with ref=main
show organization billing
```

## 🔧 Configuration

### API Keys

Configure optional AI providers for enhanced functionality:

1. Click ⚙️ Settings button
2. Enter your API keys:
   - **ChatGPT**: OpenAI API key
   - **Gemini**: Google AI API key
   - **GitHub**: Personal access token

Keys are stored locally in browser storage.

### Backend Connection

By default, connects to:
- **Production**: `https://quantum-x-builder-backend.example.com`
- **Local**: `http://localhost:8787`

## 🌐 Cloudflare Tunnel

Access local development resources securely:

### Setup

```bash
# Run setup script
./infrastructure/setup-cloudflare-tunnel.sh

# Start tunnel
cloudflared tunnel run quantum-x-builder-tunnel
```

### Available Endpoints

- **Command Center**: https://command.quantum-x-builder.dev
- **API Backend**: https://api.quantum-x-builder.dev
- **VS Code**: https://vscode.quantum-x-builder.dev
- **Docker Registry**: https://docker.quantum-x-builder.dev
- **Ollama API**: https://ollama.quantum-x-builder.dev

## 🔌 API Integration

### REST API

```javascript
// Send natural language command
const response = await fetch('http://localhost:8787/api/nl/command', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    input: 'list all agents'
  })
});

const result = await response.json();
console.log(result);
```

### WebSocket

```javascript
// Connect to real-time updates
const ws = new WebSocket('ws://localhost:8787/ws');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Update:', data);
};
```

### Automation API

```javascript
// Create pull request
await fetch('http://localhost:8787/api/automation/pr/create', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN',
    'X-GitHub-Token': 'YOUR_GITHUB_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    owner: 'InfinityXOneSystems',
    repo: 'quantum-x-builder',
    title: 'New Feature',
    head: 'feature/new-feature',
    base: 'main'
  })
});
```

## 📚 Documentation

- [Complete Guide](../docs/COMMAND_CENTER_GUIDE.md)
- [NLC System](../docs/NLC_USER_GUIDE.md)
- [API Reference](../docs/NLC_ARCHITECTURE.md)
- [Automation APIs](../backend/src/routes/automation.js)

## 🛠️ Development

### Project Structure

```
command-center/
├── public/
│   ├── index.html      # Main UI
│   ├── app.js          # Application logic
│   └── sw.js           # Service Worker (PWA)
└── src/                # Source files (if needed)
```

### Build for Production

```bash
# No build step required - static files only
# Deploy directly to GitHub Pages
```

### Local Development

```bash
# Start local server
cd command-center
python3 -m http.server 8000

# Or use Node.js
npx serve public
```

## 🧪 Testing

### Manual Testing

1. Test natural language commands
2. Verify AI integration (ChatGPT/Gemini)
3. Test real-time WebSocket updates
4. Verify mobile responsiveness
5. Test PWA installation
6. Check offline functionality

### API Testing

```bash
# Test NLC endpoint
curl -X POST http://localhost:8787/api/nl/command \
  -H "Authorization: Bearer test-token" \
  -H "Content-Type: application/json" \
  -d '{"input": "help"}'

# Test automation endpoint
curl -X POST http://localhost:8787/api/automation/branch/create \
  -H "Authorization: Bearer test-token" \
  -H "X-GitHub-Token: YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"owner": "user", "repo": "repo", "branch": "test"}'
```

## 🔒 Security

### Authentication

All API requests require authentication:
- Bearer token in Authorization header
- GitHub token for automation endpoints

### Permissions

Role-based access control:
- **agent:read**: View status
- **agent:execute**: Start/stop agents
- **admin**: Full access

### Safety Features

- Kill switch for emergency shutdown
- Dangerous action detection
- Complete audit logging
- Rate limiting

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Make changes
4. Test thoroughly
5. Submit pull request

## 📄 License

Copyright © 2026 Infinity XOS Systems. All rights reserved.

## 🆘 Support

- [Documentation](https://github.com/InfinityXOneSystems/quantum-x-builder/tree/main/docs)
- [Issues](https://github.com/InfinityXOneSystems/quantum-x-builder/issues)
- [Discussions](https://github.com/InfinityXOneSystems/quantum-x-builder/discussions)
