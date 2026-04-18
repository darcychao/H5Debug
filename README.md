# H5 Debug Tool - 强大的H5页面调试与自动化测试工具

[English](README_en.md) | 中文

## 📖 项目简介

H5调试工具是一个功能强大的全端调试解决方案，支持Chrome DevTools Protocol和ADB协议，可用于H5页面的调试、自动化测试和真机调试。

### 核心技术栈

```
前端: Vue 3 + TypeScript + Element Plus + Pinia
后端: Python 3 + FastAPI + SQLAlchemy + Pydantic
通信: WebSocket + REST API
数据库: SQLite3
调试协议: Chrome DevTools Protocol (CDP), ADB
```

## ✨ 核心功能

### 🔧 设备管理
- 支持Chrome浏览器远程调试
- 支持Android设备ADB连接
- 多设备同时管理
- 设备状态实时监控

### 🎯 元素操作
- 多种元素选择器（ID、Class、文本、混合模式）
- 元素样式查看与修改
- 点击、输入、滑动等操作
- 元素等待与断言

### 📝 测试用例
- 可视化用例创建
- 操作录制功能
- 多种操作类型支持
- 用例执行与报告生成

### 🌐 网络调试
- 网络请求监控
- 请求/响应详情查看
- Mock配置与测试
- 请求修改与重放

### 💻 JavaScript
- 代码在线执行
- 方法重写功能
- 代码模板管理
- 实时执行结果

### 📊 报告系统
- 详细执行报告
- 截图附件
- 日志记录
- HTML/JSON格式导出

## 🚀 快速开始

### 环境要求

- Python 3.8+
- Node.js 16+
- Chrome浏览器（开启远程调试）
- Android设备（可选）

### 方式一：使用安装脚本（推荐）

**Linux/macOS:**
```bash
chmod +x install.sh
./install.sh
```

**Windows:**
```cmd
install.bat
```

### 方式二：手动安装

**1. 安装后端依赖**

```bash
cd backend
pip install -r requirements.txt
```

**2. 安装前端依赖**

```bash
cd frontend
npm install
```

**3. 启动Chrome远程调试**

```bash
# macOS
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222

# Linux
google-chrome --remote-debugging-port=9222

# Windows
chrome.exe --remote-debugging-port=9222
```

**4. 启动应用**

**Linux/macOS:**
```bash
chmod +x start.sh
./start.sh
```

**Windows:**
```cmd
start.bat
```

**或者手动启动：**

```bash
# 终端1：启动后端
cd backend
python run.py

# 终端2：启动前端
cd frontend
npm run dev
```

**5. 访问应用**

打开浏览器访问: http://localhost:5173

## 📁 项目结构

```
H5Debug/
├── backend/                    # 后端服务
│   ├── app/
│   │   ├── models/            # 数据模型
│   │   │   ├── device.py      # 设备模型
│   │   │   ├── testcase.py    # 测试用例模型
│   │   │   ├── step.py        # 操作步骤模型
│   │   │   ├── network.py     # 网络请求模型
│   │   │   ├── report.py      # 报告模型
│   │   │   └── settings.py    # 设置模型
│   │   ├── services/          # 业务逻辑层
│   │   │   ├── cdp_service.py     # CDP服务
│   │   │   ├── adb_service.py     # ADB服务
│   │   │   ├── device_service.py  # 设备服务
│   │   │   ├── testcase_service.py # 用例服务
│   │   │   └── executor_service.py # 执行器服务
│   │   ├── routers/           # API路由
│   │   │   ├── device.py      # 设备路由
│   │   │   ├── element.py     # 元素路由
│   │   │   ├── testcase.py    # 用例路由
│   │   │   ├── network.py     # 网络路由
│   │   │   ├── javascript.py # JavaScript路由
│   │   │   └── logs.py        # 日志路由
│   │   └── utils/             # 工具函数
│   ├── config.yaml            # 配置文件
│   ├── requirements.txt       # Python依赖
│   └── run.py                 # 启动脚本
│
├── frontend/                   # 前端应用
│   ├── src/
│   │   ├── api/              # API调用
│   │   ├── views/            # 页面组件
│   │   ├── stores/           # 状态管理
│   │   ├── types/            # TypeScript类型
│   │   └── styles/           # 样式文件
│   ├── package.json
│   └── vite.config.ts
│
└── docs/                       # 项目文档
    ├── PROJECT_DESIGN.md      # 设计文档
    ├── PROJECT_STRUCTURE.md   # 结构文档
    ├── QUICK_START.md         # 快速开始
    └── FEATURES_CHECKLIST.md  # 功能清单
```

## 🔌 API接口

### 设备管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/devices` | 获取设备列表 |
| POST | `/api/devices` | 创建设备记录 |
| PUT | `/api/devices/{id}` | 更新设备信息 |
| DELETE | `/api/devices/{id}` | 删除设备 |
| POST | `/api/devices/connect/cdp` | 连接CDP设备 |
| POST | `/api/devices/connect/adb` | 连接ADB设备 |
| POST | `/api/devices/disconnect/{id}` | 断开设备连接 |
| POST | `/api/devices/set-active/{id}` | 设置活动设备 |
| GET | `/api/devices/discover` | 发现可用设备 |

### 元素操作

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/elements/query` | 查询单个元素 |
| POST | `/api/elements/all` | 获取所有元素 |
| GET | `/api/elements/style/{device_id}` | 获取元素样式 |
| PATCH | `/api/elements/style/{device_id}` | 修改元素样式 |
| POST | `/api/elements/click/{device_id}` | 点击元素 |
| POST | `/api/elements/input/{device_id}` | 输入文本 |

### 测试用例

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/testcases` | 获取用例列表 |
| POST | `/api/testcases` | 创建用例 |
| PUT | `/api/testcases/{id}` | 更新用例 |
| DELETE | `/api/testcases/{id}` | 删除用例 |
| POST | `/api/testcases/{id}/execute` | 执行用例 |
| POST | `/api/testcases/{id}/steps` | 添加步骤 |
| PUT | `/api/testcases/steps/{id}` | 更新步骤 |
| DELETE | `/api/testcases/steps/{id}` | 删除步骤 |
| POST | `/api/testcases/steps/reorder` | 重新排序 |

### 网络调试

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/network/requests` | 获取请求列表 |
| POST | `/api/network/mock` | 添加Mock规则 |
| DELETE | `/api/network/mock/{pattern}` | 删除Mock规则 |
| POST | `/api/network/enable-monitoring` | 启用监控 |
| POST | `/api/network/disable-monitoring` | 禁用监控 |

### JavaScript

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/javascript/execute` | 执行JavaScript代码 |
| GET | `/api/javascript/templates` | 获取模板列表 |
| POST | `/api/javascript/templates` | 创建模板 |
| PUT | `/api/javascript/templates/{id}` | 更新模板 |
| DELETE | `/api/javascript/templates/{id}` | 删除模板 |
| GET | `/api/javascript/overrides` | 获取重写规则 |
| POST | `/api/javascript/overrides` | 创建重写规则 |

### 日志

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/logs` | 获取日志列表 |
| DELETE | `/api/logs` | 清空日志 |
| GET | `/api/settings` | 获取设置 |
| PUT | `/api/settings` | 更新设置 |

## ⚙️ 配置说明

### 配置文件: `backend/config.yaml`

```yaml
server:
  host: "0.0.0.0"              # 服务监听地址
  port: 8000                   # 服务端口
  debug: false                 # 调试模式
  cors_origins:                # CORS配置
    - "http://localhost:5173"

database:
  path: "./data/h5debug.db"   # 数据库路径
  auto_backup: true            # 自动备份
  backup_interval: 24          # 备份间隔（小时）

adb:
  devices: []                  # 自动连接设备
  screenshot_quality: 80       # 截图质量
  auto_connect: true           # 自动连接
  connection_timeout: 10      # 连接超时（秒）

cdp:
  max_reconnect_attempts: 3    # 最大重连次数
  heartbeat_interval: 30        # 心跳间隔（秒）
  connection_timeout: 10       # 连接超时（秒）
  default_debug_port: 9222     # 默认调试端口

log:
  level: "INFO"               # 日志级别
  file: "./logs/app.log"      # 日志文件
  max_file_size: 10           # 单文件大小（MB）
  backup_count: 5              # 保留备份数
  console_output: true         # 控制台输出

stream:
  enabled: true               # 启用推流
  fps: 30                     # 帧率
  quality: 80                 # 质量
  ws_path: "/ws/stream"       # WebSocket路径
  auto_start: false           # 自动开始
```

## 🛠️ 操作类型说明

### 支持的操作类型

| 类型 | 说明 | 参数 |
|------|------|------|
| `click` | 点击元素 | selector |
| `input` | 输入文本 | selector, value |
| `swipe` | 滑动页面 | dx, dy |
| `wait` | 等待元素 | selector, timeout |
| `screenshot` | 页面截图 | - |
| `assert` | 断言检查 | selector, attribute, value |
| `navigate` | 页面导航 | url |
| `execute_js` | 执行JavaScript | code |
| `adb_tap` | ADB点击 | x, y |
| `adb_swipe` | ADB滑动 | x1, y1, x2, y2 |
| `adb_text` | ADB输入 | text |
| `branch` | 条件分支 | condition |
| `loop` | 循环执行 | count, condition |

### 选择器类型

- **ID选择器**: `#element-id`
- **Class选择器**: `.class-name`
- **文本选择器**: `text=按钮文本`
- **CSS选择器**: 标准CSS选择器

## 📚 文档

更多文档请查看 `docs/` 目录：

- [快速开始](docs/QUICK_START.md) - 5分钟快速入门
- [项目设计](docs/PROJECT_DESIGN.md) - 架构设计与技术细节
- [项目结构](docs/PROJECT_STRUCTURE.md) - 目录结构说明
- [功能清单](docs/FEATURES_CHECKLIST.md) - 已实现功能列表

## ❓ 常见问题

### 1. Chrome设备无法连接

```bash
# 检查调试端口
curl http://localhost:9222/json

# 确保Chrome以调试模式启动
chrome --remote-debugging-port=9222
```

### 2. ADB设备未识别

```bash
# 检查设备连接
adb devices

# 重启ADB服务
adb kill-server
adb start-server
```

### 3. 前端无法连接后端

- 检查CORS配置是否正确
- 确保后端服务运行在正确端口
- 查看浏览器控制台错误信息

### 4. 元素操作失败

- 确认元素存在且可见
- 检查选择器是否正确
- 增加等待时间

## 🔮 未来规划

- [ ] 团队协作功能
- [ ] 云端测试服务
- [ ] 更多平台支持
- [ ] AI辅助元素定位
- [ ] 用例版本管理
- [ ] CI/CD集成
- [ ] 性能监控
- [ ] 自动化回归测试

## 📄 许可证

本项目采用 MIT 许可证。

## 🙏 贡献

欢迎提交Issue和Pull Request！

## 📞 联系方式

如有问题，请提交Issue或联系开发者。

---

**开始享受H5调试的便捷吧！** 🚀
