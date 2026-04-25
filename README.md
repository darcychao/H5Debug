# H5Debug

<p align="center">
  <strong>基于 Electron + CDP 的移动端 H5 调试框架</strong><br>
  <strong>Electron + CDP based mobile H5 debugging framework</strong>
</p>

---

## 🌐 中文

### 概述

H5Debug 是一款基于 Electron 框架的桌面端调试工具，通过 adb/hdc 端口转发与 Chrome DevTools Protocol 连接移动设备，提供推流、自动化调试、安装包管理、网络请求拦截等一站式调试能力。

### 功能特性

| 模块 | 说明 |
|------|------|
| 设备连接 | 支持 adb / hdc 设备发现、连接、端口转发，分开展示，多设备同时连接 |
| 屏幕推流 | 基于 Page.screencastFrame 实时展示设备画面，支持截图与缩放 |
| 模拟操作 | 通过 CDP 发送点击、输入、滚动、缩放事件至终端设备 |
| 网络调试 | 基于 Fetch 域实现请求捕获、拦截、修改、Mock 响应 |
| Console | 执行 JS 表达式，方法覆写并持久化，设备重连自动加载 |
| 安装包管理 | 安装/卸载/清缓存，支持 adb/hdc 双通道 |
| 本地服务调试 | 基于 adb/hdc 反向代理，设备可访问电脑部署的服务 |
| 测试用例引擎 | 可视化设计用例步骤（输入/点击/截图/分支/循环），支持批量多设备并行执行 |
| 用例录制 | 自动捕获操作事件转化为测试步骤 |
| 测试报告 | 生成 HTML 报告，含步骤状态、耗时、失败截图 |
| 插件系统 | 可扩展钩子（beforeStep/afterStep/onInputIntercept），内置验证码插件 |
| 日志模块 | 三源日志（设备/CDP/应用），级别过滤与关键词搜索 |
| 配置管理 | YAML 配置文件，界面修改实时热加载 |

### 技术栈

- **桌面框架**: Electron 28+
- **渲染层**: React 18 + TypeScript
- **UI 风格**: 像素风组件库 + 深浅色主题 + 磨玻璃效果
- **状态管理**: Zustand
- **CDP 通信**: WebSocket (自研客户端)
- **设备通信**: adb / hdc CLI
- **持久化**: sql.js (SQLite) + YAML
- **构建**: Vite + vite-plugin-electron
- **打包**: electron-builder

### 目录结构

```
H5Debug/
├── electron/                  # 主进程
│   ├── main.ts                # 入口，服务初始化与 IPC 注册
│   ├── preload.ts             # contextBridge 安全桥接
│   ├── ipc/                   # IPC Handler (device/cdp/package/testcase/...)
│   ├── services/              # 核心服务
│   │   ├── device/            #   adb/hdc/设备管理/端口转发
│   │   ├── cdp/               #   CDP 客户端/连接池/推流/输入/网络/Runtime/DOM/日志
│   │   ├── package/           #   安装包管理
│   │   ├── testcase/          #   执行引擎/步骤执行器/录制/报告生成
│   │   ├── plugin/            #   插件接口与生命周期
│   │   └── config/            #   YAML 配置管理+热加载
│   ├── db/                    # SQLite 数据层 (用例/网络/覆写/插件)
│   └── plugins/               # 内置插件 (验证码)
├── src/                       # 渲染进程 (React)
│   ├── components/            # 像素风 UI 组件 + 可拖放面板
│   ├── panels/                # 功能面板 (设备/推流/Console/网络/日志/...)
│   ├── stores/                # Zustand 状态管理
│   ├── hooks/                 # IPC/CDP/主题 Hooks
│   ├── layouts/               # 主布局
│   ├── styles/                # 主题 CSS Variables
│   └── utils/                 # 工具函数
├── config/                    # 运行时配置
│   └── app.yaml
└── resources/                 # 静态资源
```

### 快速开始

```bash
# 安装依赖
npm install

# 开发模式
npm run dev

# 构建打包
npm run electron:build
```

### 前置要求

- Node.js 18+
- adb (Android Debug Bridge) — 用于 Android 设备
- hdc (HarmonyOS Device Connector) — 用于鸿蒙设备
- 目标设备需开启 WebView 调试

### 使用流程

1. 启动应用后，左侧设备列表自动发现已连接的 adb/hdc 设备
2. 点击设备旁的 **Connect** 建立连接与端口转发
3. 连接成功后可使用推流、Console、网络调试等所有功能
4. 在 TestCase 面板设计或录制自动化用例
5. 执行用例，查看 HTML 测试报告

### 界面布局

```
┌────────────────────────────────────────────────────────────┐
│  [菜单栏]  主题切换 | 设备状态 | 设置                        │
├──────────┬─────────────────────────────┬───────────────────┤
│          │                             │                   │
│ 设备列表  │       主工作区               │    属性/详情       │
│ + 用例列表│  推流画面 | Console          │  元素选择器        │
│          │  TestCase | Report          │  录制控制          │
│          ├─────────────────────────────┤  设备详情          │
│          │  底部面板 (Tab 切换)         │                   │
│          │  网络 | 日志 | 包管理 | 代理  │                   │
├──────────┴─────────────────────────────┴───────────────────┤
│  状态栏: 连接设备数 | CDP 状态 | 内存占用                       │
└────────────────────────────────────────────────────────────┘
```

- 所有面板边界可拖拽调整大小
- 像素风: 圆角 4px, 1px 边框, 8px padding, 磨玻璃 (backdrop-filter)
- 配色: 黑色/深绿/深黄为主

### 配置说明

编辑 `config/app.yaml` 可修改运行时配置，修改后自动热加载：

```yaml
device:
  adb_path: adb          # adb 可执行文件路径
  hdc_path: hdc          # hdc 可执行文件路径
  cdp_port_range: [9222, 9322]
  auto_connect: true

screencast:
  quality: 80            # 推流质量 1-100
  max_fps: 30
  format: jpeg

network:
  max_record_count: 5000
  auto_enable_intercept: false
```

### 插件开发

实现 `H5DebugPlugin` 接口即可开发插件：

```typescript
interface H5DebugPlugin {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  install(context: PluginContext): void;
  uninstall(): void;
  hooks: {
    beforeStepExecute?(step, context): Promise<TestStep | null>;
    afterStepExecute?(step, result, context): Promise<void>;
    onInputIntercept?(step, inputValue): Promise<string>;
  };
}
```

内置验证码插件示例：用例输入值包含 `{{CAPTCHA}}` 时自动触发替换。

---

## 🇬🇧 English

### Overview

H5Debug is a desktop debugging tool built on Electron. It connects to mobile devices via adb/hdc port forwarding and Chrome DevTools Protocol, providing an all-in-one debugging experience including screen casting, automation, package management, and network interception.

### Features

| Module | Description |
|--------|-------------|
| Device Connection | Discover/connect adb/hdc devices with port forwarding; grouped display; multi-device support |
| Screen Cast | Real-time device screen via Page.screencastFrame; screenshot & zoom support |
| Input Simulation | Send click, type, scroll, and pinch events via CDP |
| Network Debugging | Capture, intercept, modify, and mock network requests via Fetch domain |
| Console | Evaluate JS expressions; override methods with persistence; auto-reload on reconnect |
| Package Manager | Install/uninstall/clear cache via adb/hdc |
| Local Service Debug | Reverse proxy via adb/hdc so device can access local computer services |
| Test Case Engine | Visual step designer (input/click/screenshot/branch/loop); batch parallel execution across devices |
| Case Recording | Auto-capture user interactions as test steps |
| Test Report | Generate HTML reports with step status, duration, and failure screenshots |
| Plugin System | Extensible hooks (beforeStep/afterStep/onInputIntercept); built-in captcha plugin |
| Log Module | Three-source logs (device/CDP/app) with level filtering and keyword search |
| Config Management | YAML config file with hot-reload on change |

### Tech Stack

- **Desktop**: Electron 28+
- **Renderer**: React 18 + TypeScript
- **UI Style**: Pixel-art component library + dark/light themes + glassmorphism
- **State**: Zustand
- **CDP**: WebSocket (custom client)
- **Device**: adb / hdc CLI
- **Persistence**: sql.js (SQLite) + YAML
- **Build**: Vite + vite-plugin-electron
- **Package**: electron-builder

### Directory Structure

```
H5Debug/
├── electron/                  # Main process
│   ├── main.ts                # Entry, service init & IPC registration
│   ├── preload.ts             # contextBridge security bridge
│   ├── ipc/                   # IPC Handlers (device/cdp/package/testcase/...)
│   ├── services/              # Core services
│   │   ├── device/            #   adb/hdc/device manager/port forward
│   │   ├── cdp/               #   CDP client/pool/screencast/input/network/Runtime/DOM/log
│   │   ├── package/           #   Package manager
│   │   ├── testcase/          #   Engine/step executor/recorder/report generator
│   │   ├── plugin/            #   Plugin interface & lifecycle
│   │   └── config/            #   YAML config manager + hot-reload
│   ├── db/                    # SQLite data layer (testcase/network/override/plugin)
│   └── plugins/               # Built-in plugins (captcha)
├── src/                       # Renderer process (React)
│   ├── components/            # Pixel UI components + draggable panels
│   ├── panels/                # Feature panels (device/screencast/console/network/log/...)
│   ├── stores/                # Zustand state management
│   ├── hooks/                 # IPC/CDP/theme hooks
│   ├── layouts/               # Main layout
│   ├── styles/                # Theme CSS Variables
│   └── utils/                 # Utility functions
├── config/                    # Runtime config
│   └── app.yaml
└── resources/                 # Static assets
```

### Getting Started

```bash
# Install dependencies
npm install

# Development mode
npm run dev

# Build & package
npm run electron:build
```

### Prerequisites

- Node.js 18+
- adb (Android Debug Bridge) — for Android devices
- hdc (HarmonyOS Device Connector) — for HarmonyOS devices
- WebView debugging enabled on target device

### Usage

1. Launch the app — the left panel auto-discovers connected adb/hdc devices
2. Click **Connect** next to a device to establish connection and port forwarding
3. Once connected, all features are available: screencast, console, network debugging, etc.
4. Design or record automation test cases in the TestCase panel
5. Execute cases and view HTML test reports

### UI Layout

```
┌────────────────────────────────────────────────────────────┐
│  [Menu Bar]  Theme Toggle | Device Status | Settings       │
├──────────┬─────────────────────────────┬───────────────────┤
│          │                             │                   │
│ Device   │       Main Workspace        │   Properties /    │
│ List +   │  Screencast | Console       │   Detail Panel    │
│ Case List│  TestCase | Report          │  Element Selector │
│          ├─────────────────────────────┤  Recorder Control │
│          │  Bottom Panel (Tabbed)      │  Device Detail    │
│          │  Network|Log|Pkg|Proxy      │                   │
├──────────┴─────────────────────────────┴───────────────────┤
│  Status Bar: Connected Devices | CDP Status | Memory        │
└────────────────────────────────────────────────────────────┘
```

- All panel borders are resizable via drag
- Pixel-art style: 4px radius, 1px borders, 8px padding, glassmorphism (backdrop-filter)
- Color scheme: black / dark green / dark yellow

### Configuration

Edit `config/app.yaml` for runtime settings. Changes are auto hot-reloaded:

```yaml
device:
  adb_path: adb          # adb executable path
  hdc_path: hdc          # hdc executable path
  cdp_port_range: [9222, 9322]
  auto_connect: true

screencast:
  quality: 80            # Cast quality 1-100
  max_fps: 30
  format: jpeg

network:
  max_record_count: 5000
  auto_enable_intercept: false
```

### Plugin Development

Implement the `H5DebugPlugin` interface:

```typescript
interface H5DebugPlugin {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  install(context: PluginContext): void;
  uninstall(): void;
  hooks: {
    beforeStepExecute?(step, context): Promise<TestStep | null>;
    afterStepExecute?(step, result, context): Promise<void>;
    onInputIntercept?(step, inputValue): Promise<string>;
  };
}
```

Built-in captcha plugin example: when a test step input contains `{{CAPTCHA}}`, the plugin automatically intercepts and replaces the value.

---

## License

ISC
