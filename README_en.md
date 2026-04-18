# H5 Debug Tool - Powerful H5 Page Debugging & Automation Testing Tool

[English](README_en.md) | [中文](README.md)

## 📖 Project Introduction

H5 Debug Tool is a powerful full-stack debugging solution that supports Chrome DevTools Protocol and ADB protocols for H5 page debugging, automated testing, and real device debugging.

### Core Tech Stack

```
Frontend: Vue 3 + TypeScript + Element Plus + Pinia
Backend: Python 3 + FastAPI + SQLAlchemy + Pydantic
Communication: WebSocket + REST API
Database: SQLite3
Debug Protocols: Chrome DevTools Protocol (CDP), ADB
```

## ✨ Core Features

### 🔧 Device Management
- Chrome browser remote debugging support
- Android device ADB connection support
- Multi-device simultaneous management
- Real-time device status monitoring

### 🎯 Element Operations
- Multiple element selectors (ID, Class, Text, Mixed mode)
- Element style viewing and modification
- Click, input, swipe and other operations
- Element waiting and assertions

### 📝 Test Cases
- Visual test case creation
- Operation recording functionality
- Multiple operation type support
- Test case execution and reporting

### 🌐 Network Debugging
- Network request monitoring
- Request/Response detail viewing
- Mock configuration and testing
- Request modification and replay

### 💻 JavaScript
- Online code execution
- Method override functionality
- Code template management
- Real-time execution results

### 📊 Reporting System
- Detailed execution reports
- Screenshot attachments
- Log recording
- HTML/JSON format export

## 🚀 Quick Start

### Environment Requirements

- Python 3.8+
- Node.js 16+
- Chrome browser (with remote debugging enabled)
- Android device (optional)

### Method 1: Use Installation Script (Recommended)

**Linux/macOS:**
```bash
chmod +x install.sh
./install.sh
```

**Windows:**
```cmd
install.bat
```

### Method 2: Manual Installation

**1. Install Backend Dependencies**

```bash
cd backend
pip install -r requirements.txt
```

**2. Install Frontend Dependencies**

```bash
cd frontend
npm install
```

**3. Start Chrome Remote Debugging**

```bash
# macOS
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222

# Linux
google-chrome --remote-debugging-port=9222

# Windows
chrome.exe --remote-debugging-port=9222
```

**4. Start the Application**

**Linux/macOS:**
```bash
chmod +x start.sh
./start.sh
```

**Windows:**
```cmd
start.bat
```

**Or manually start:**

```bash
# Terminal 1: Start backend
cd backend
python run.py

# Terminal 2: Start frontend
cd frontend
npm run dev
```

**5. Access the Application**

Open browser and visit: http://localhost:5173

## 📁 Project Structure

```
H5Debug/
├── backend/                    # Backend service
│   ├── app/
│   │   ├── models/            # Data models
│   │   │   ├── device.py      # Device model
│   │   │   ├── testcase.py    # Test case model
│   │   │   ├── step.py        # Operation step model
│   │   │   ├── network.py     # Network request model
│   │   │   ├── report.py      # Report model
│   │   │   └── settings.py    # Settings model
│   │   ├── services/          # Business logic layer
│   │   │   ├── cdp_service.py     # CDP service
│   │   │   ├── adb_service.py     # ADB service
│   │   │   ├── device_service.py  # Device service
│   │   │   ├── testcase_service.py # Test case service
│   │   │   └── executor_service.py # Executor service
│   │   ├── routers/           # API routes
│   │   │   ├── device.py      # Device routes
│   │   │   ├── element.py     # Element routes
│   │   │   ├── testcase.py    # Test case routes
│   │   │   ├── network.py     # Network routes
│   │   │   ├── javascript.py # JavaScript routes
│   │   │   └── logs.py        # Log routes
│   │   └── utils/             # Utility functions
│   ├── config.yaml            # Configuration file
│   ├── requirements.txt       # Python dependencies
│   └── run.py                 # Startup script
│
├── frontend/                   # Frontend application
│   ├── src/
│   │   ├── api/              # API calls
│   │   ├── views/            # Page components
│   │   ├── stores/           # State management
│   │   ├── types/            # TypeScript types
│   │   └── styles/           # Style files
│   ├── package.json
│   └── vite.config.ts
│
└── docs/                       # Project documentation
    ├── PROJECT_DESIGN.md      # Design documentation
    ├── PROJECT_STRUCTURE.md   # Structure documentation
    ├── QUICK_START.md         # Quick start guide
    └── FEATURES_CHECKLIST.md  # Feature checklist
```

## 🔌 API Endpoints

### Device Management

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/devices` | Get device list |
| POST | `/api/devices` | Create device record |
| PUT | `/api/devices/{id}` | Update device information |
| DELETE | `/api/devices/{id}` | Delete device |
| POST | `/api/devices/connect/cdp` | Connect CDP device |
| POST | `/api/devices/connect/adb` | Connect ADB device |
| POST | `/api/devices/disconnect/{id}` | Disconnect device |
| POST | `/api/devices/set-active/{id}` | Set active device |
| GET | `/api/devices/discover` | Discover available devices |

### Element Operations

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/elements/query` | Query single element |
| POST | `/api/elements/all` | Get all elements |
| GET | `/api/elements/style/{device_id}` | Get element styles |
| PATCH | `/api/elements/style/{device_id}` | Modify element styles |
| POST | `/api/elements/click/{device_id}` | Click element |
| POST | `/api/elements/input/{device_id}` | Input text |

### Test Cases

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/testcases` | Get test case list |
| POST | `/api/testcases` | Create test case |
| PUT | `/api/testcases/{id}` | Update test case |
| DELETE | `/api/testcases/{id}` | Delete test case |
| POST | `/api/testcases/{id}/execute` | Execute test case |
| POST | `/api/testcases/{id}/steps` | Add step |
| PUT | `/api/testcases/steps/{id}` | Update step |
| DELETE | `/api/testcases/steps/{id}` | Delete step |
| POST | `/api/testcases/steps/reorder` | Reorder steps |

### Network Debugging

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/network/requests` | Get request list |
| POST | `/api/network/mock` | Add mock rule |
| DELETE | `/api/network/mock/{pattern}` | Delete mock rule |
| POST | `/api/network/enable-monitoring` | Enable monitoring |
| POST | `/api/network/disable-monitoring` | Disable monitoring |

### JavaScript

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/javascript/execute` | Execute JavaScript code |
| GET | `/api/javascript/templates` | Get template list |
| POST | `/api/javascript/templates` | Create template |
| PUT | `/api/javascript/templates/{id}` | Update template |
| DELETE | `/api/javascript/templates/{id}` | Delete template |
| GET | `/api/javascript/overrides` | Get override rules |
| POST | `/api/javascript/overrides` | Create override rule |

### Logs

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/logs` | Get log list |
| DELETE | `/api/logs` | Clear logs |
| GET | `/api/settings` | Get settings |
| PUT | `/api/settings` | Update settings |

## ⚙️ Configuration

### Configuration File: `backend/config.yaml`

```yaml
server:
  host: "0.0.0.0"              # Service listening address
  port: 8000                   # Service port
  debug: false                 # Debug mode
  cors_origins:                # CORS configuration
    - "http://localhost:5173"

database:
  path: "./data/h5debug.db"   # Database path
  auto_backup: true            # Auto backup
  backup_interval: 24          # Backup interval (hours)

adb:
  devices: []                  # Auto-connect devices
  screenshot_quality: 80       # Screenshot quality
  auto_connect: true           # Auto connect
  connection_timeout: 10      # Connection timeout (seconds)

cdp:
  max_reconnect_attempts: 3    # Max reconnect attempts
  heartbeat_interval: 30        # Heartbeat interval (seconds)
  connection_timeout: 10       # Connection timeout (seconds)
  default_debug_port: 9222     # Default debug port

log:
  level: "INFO"               # Log level
  file: "./logs/app.log"      # Log file
  max_file_size: 10           # Single file size (MB)
  backup_count: 5              # Backup retention count
  console_output: true         # Console output

stream:
  enabled: true               # Enable streaming
  fps: 30                     # Frame rate
  quality: 80                 # Quality
  ws_path: "/ws/stream"       # WebSocket path
  auto_start: false           # Auto start
```

## 🛠️ Operation Types

### Supported Operation Types

| Type | Description | Parameters |
|------|-------------|------------|
| `click` | Click element | selector |
| `input` | Input text | selector, value |
| `swipe` | Swipe page | dx, dy |
| `wait` | Wait for element | selector, timeout |
| `screenshot` | Page screenshot | - |
| `assert` | Assertion check | selector, attribute, value |
| `navigate` | Page navigation | url |
| `execute_js` | Execute JavaScript | code |
| `adb_tap` | ADB tap | x, y |
| `adb_swipe` | ADB swipe | x1, y1, x2, y2 |
| `adb_text` | ADB input | text |
| `branch` | Conditional branch | condition |
| `loop` | Loop execution | count, condition |

### Selector Types

- **ID Selector**: `#element-id`
- **Class Selector**: `.class-name`
- **Text Selector**: `text=Button Text`
- **CSS Selector**: Standard CSS selectors

## 📚 Documentation

For more documentation, please check the `docs/` directory:

- [Quick Start](docs/QUICK_START.md) - 5-minute quick start guide
- [Project Design](docs/PROJECT_DESIGN.md) - Architecture design and technical details
- [Project Structure](docs/PROJECT_STRUCTURE.md) - Directory structure documentation
- [Feature Checklist](docs/FEATURES_CHECKLIST.md) - Implemented features list

## ❓ FAQ

### 1. Chrome device cannot connect

```bash
# Check debug port
curl http://localhost:9222/json

# Ensure Chrome is started in debug mode
chrome --remote-debugging-port=9222
```

### 2. ADB device not recognized

```bash
# Check device connection
adb devices

# Restart ADB service
adb kill-server
adb start-server
```

### 3. Frontend cannot connect to backend

- Check if CORS configuration is correct
- Ensure backend service is running on the correct port
- Check browser console for error messages

### 4. Element operations failing

- Confirm the element exists and is visible
- Check if the selector is correct
- Increase wait time

## 🔮 Future Roadmap

- [ ] Team collaboration features
- [ ] Cloud testing services
- [ ] More platform support
- [ ] AI-assisted element locating
- [ ] Test case version management
- [ ] CI/CD integration
- [ ] Performance monitoring
- [ ] Automated regression testing

## 📄 License

This project is licensed under the MIT License.

## 🙏 Contributing

Issues and Pull Requests are welcome!

## 📞 Contact

For questions, please submit an Issue or contact the developer.

---

**Start enjoying the convenience of H5 debugging!** 🚀
