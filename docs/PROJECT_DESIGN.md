# H5 Debug Tool - 项目设计文档

## 1. 项目概述

H5调试工具是一个基于TypeScript + Python3 + Vue3的全端调试解决方案，主要用于调试和测试H5页面。

### 1.1 技术栈

- **后端**: Python 3.x + FastAPI + Chrome DevTools Protocol + ADB工具
- **前端**: Vue 3 + TypeScript + Element Plus + Pinia
- **通信协议**: WebSocket + HTTP/REST API
- **数据库**: SQLite3
- **工具库**: 
  - `websockets` - WebSocket通信
  - `pychrome` - Chrome DevTools Protocol客户端
  - `uiautomator2` / `adbutils` - ADB操作
  - `sqlalchemy` - ORM
  - `pydantic` - 数据验证

### 1.2 项目架构图

```
┌─────────────────────────────────────────────────────────────┐
│                        前端 (Vue3)                          │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐       │
│  │设备管理 │  │元素操作 │  │用例录制 │  │网络调试 │       │
│  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘       │
│       └────────────┼────────────┼────────────┘              │
│                    │      WebSocket/HTTP                    │
└────────────────────┼───────────────────────────────────────┘
                     │
┌────────────────────┼───────────────────────────────────────┐
│                    │      后端 (Python3)                   │
│  ┌─────────────────▼─────────────────┐                     │
│  │         API Routes & Views         │                     │
│  │    (FastAPI + Uvicorn)             │                     │
│  └─────────────────┬─────────────────┘                     │
│                    │                                       │
│  ┌─────────────────┼─────────────────┐                     │
│  │         Business Logic            │                     │
│  │  ┌─────────┐  ┌─────────┐       │                     │
│  │  │CDP模块  │  │ADB模块  │       │                     │
│  │  └─────────┘  └─────────┘       │                     │
│  └───────────────────────────────────┘                     │
│                    │                                       │
│  ┌─────────────────▼─────────────────┐                     │
│  │       Database & Config           │                     │
│  │    (SQLite3 + YAML)               │                     │
│  └───────────────────────────────────┘                     │
└────────────────────────────────────────────────────────────┘
                     │
        ┌────────────┴────────────
        │                         │
┌───────▼───────┐        ┌────────▼──────┐
│ Chrome浏览器   │        │ Android设备   │
│ (CDP连接)     │        │ (ADB连接)     │
└───────────────┘        └───────────────┘
```

## 2. 模块说明

### 2.1 后端模块结构

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                 # 应用入口
│   ├── config.py               # 配置管理
│   ├── database.py             # 数据库初始化
│   ├── models/                 # 数据模型
│   │   ├── __init__.py
│   │   ├── device.py           # 设备模型
│   │   ├── testcase.py         # 测试用例模型
│   │   ├── step.py             # 操作步骤模型
│   │   ├── network.py          # 网络请求模型
│   │   ├── plugin.py           # 插件模型
│   │   └── report.py           # 报告模型
│   ├── services/               # 业务逻辑层
│   │   ├── __init__.py
│   │   ├── cdp_service.py       # Chrome DevTools Protocol服务
│   │   ├── adb_service.py       # ADB设备管理服务
│   │   ├── device_service.py    # 设备管理服务
│   │   ├── testcase_service.py  # 测试用例服务
│   │   ├── executor_service.py  # 用例执行服务
│   │   └── report_service.py    # 报告生成服务
│   ├── routers/                # API路由
│   │   ├── __init__.py
│   │   ├── device.py           # 设备管理路由
│   │   ├── element.py           # 元素操作路由
│   │   ├── testcase.py         # 用例管理路由
│   │   ├── network.py          # 网络调试路由
│   │   ├── javascript.py       # JavaScript执行路由
│   │   └── report.py           # 报告路由
│   ├── plugins/                # 插件系统
│   │   └── plugin_manager.py   # 插件管理器
│   └── utils/                  # 工具函数
│       ├── __init__.py
│       ├── logger.py           # 日志工具
│       └── helpers.py          # 辅助函数
├── requirements.txt            # Python依赖
├── config.yaml                 # 配置文件
└── run.py                      # 启动脚本
```

### 2.2 前端模块结构

```
frontend/
├── src/
│   ├── main.ts
│   ├── App.vue
│   ├── api/                    # API调用
│   │   ├── index.ts
│   │   ├── device.ts
│   │   ├── element.ts
│   │   ├── testcase.ts
│   │   └── network.ts
│   ├── components/             # 公共组件
│   │   ├── DevicePanel.vue     # 设备管理面板
│   │   ├── ElementSelector.vue # 元素选择器
│   │   ├── StepEditor.vue     # 步骤编辑器
│   │   └── CodeEditor.vue      # 代码编辑器
│   ├── views/                  # 页面
│   │   ├── Dashboard.vue       # 首页仪表盘
│   │   ├── DeviceList.vue      # 设备列表
│   │   ├── ElementPage.vue     # 元素操作页面
│   │   ├── TestcasePage.vue    # 用例管理页面
│   │   ├── RecordPage.vue      # 录制页面
│   │   ├── NetworkPage.vue     # 网络调试页面
│   │   ├── JavaScriptPage.vue  # JS执行页面
│   │   ├── ReportPage.vue      # 报告页面
│   │   └── SettingsPage.vue    # 设置页面
│   ├── stores/                 # 状态管理
│   │   ├── device.ts
│   │   ├── testcase.ts
│   │   └── settings.ts
│   ├── types/                  # TypeScript类型定义
│   │   ├── device.ts
│   │   ├── element.ts
│   │   ├── testcase.ts
│   │   └── api.ts
│   ├── utils/                  # 工具函数
│   │   └── helpers.ts
│   └── styles/                 # 样式文件
│       ├── variables.scss
│       └── main.scss
├── public/
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## 3. 核心功能实现

### 3.1 设备管理

- 多设备同时连接管理
- 设备信息展示（名称、品牌、分辨率）
- 设备切换功能
- 连接状态检测和心跳保活

### 3.2 元素操作

- CDP获取页面元素
- 元素选择器（ID、ClassName、文本、混合模式）
- 元素样式查看和修改
- 单选/多选元素定位

### 3.3 测试用例

- 操作录制
- 手动创建用例
- 步骤类型：点击、滑动、输入、等待、截图、断言、分支、循环
- 步骤拖拽排序
- 用例保存和执行

### 3.4 网络调试

- CDP网络监控
- 请求/响应记录
- Mock配置
- 请求修改

### 3.5 JavaScript执行

- JS代码执行
- 代码模板管理
- 方法重写功能
- 语法高亮

### 3.6 报告系统

- 执行报告生成
- 截图附件
- 日志记录
- 详细步骤信息

## 4. 数据库设计

### 4.1 主要数据表

1. **devices** - 设备信息表
2. **testcases** - 测试用例表
3. **steps** - 操作步骤表
4. **network_requests** - 网络请求记录表
5. **javascript_templates** - JS模板表
6. **plugins** - 插件表
7. **reports** - 测试报告表
8. **settings** - 配置表

## 5. 配置文件

### 5.1 config.yaml 示例

```yaml
server:
  host: "0.0.0.0"
  port: 8000
  debug: true

database:
  path: "./data/h5debug.db"

adb:
  devices: []
  screenshot_quality: 80

cdp:
  max_reconnect_attempts: 3
  heartbeat_interval: 30

log:
  level: "INFO"
  file: "./logs/app.log"

stream:
  enabled: true
  fps: 30
  quality: 80
```

## 6. API接口设计

### 6.1 设备管理
- `GET /api/devices` - 获取设备列表
- `POST /api/devices/connect` - 连接设备
- `DELETE /api/devices/{id}` - 断开设备

### 6.2 元素操作
- `POST /api/elements/query` - 查询元素
- `GET /api/elements/all` - 获取所有元素
- `PATCH /api/elements/{id}` - 修改元素属性

### 6.3 用例管理
- `GET /api/testcases` - 获取用例列表
- `POST /api/testcases` - 创建用例
- `PUT /api/testcases/{id}` - 更新用例
- `DELETE /api/testcases/{id}` - 删除用例
- `POST /api/testcases/{id}/execute` - 执行用例

### 6.4 网络调试
- `GET /api/network/requests` - 获取请求记录
- `POST /api/network/mock` - 设置Mock

### 6.5 JavaScript
- `POST /api/javascript/execute` - 执行JS
- `GET /api/javascript/templates` - 获取模板
- `POST /api/javascript/override` - 重写方法

## 7. 使用说明

### 7.1 环境要求
- Python 3.8+
- Node.js 16+
- Chrome浏览器（开启远程调试端口）
- Android设备（开启USB调试）

### 7.2 启动步骤

1. 启动后端服务
```bash
cd backend
pip install -r requirements.txt
python run.py
```

2. 启动前端服务
```bash
cd frontend
npm install
npm run dev
```

3. 访问 http://localhost:5173

### 7.3 Chrome远程调试

启动Chrome时添加参数：
```bash
chrome --remote-debugging-port=9222
```

### 7.4 ADB连接

确保设备通过USB连接或通过WiFi连接：
```bash
adb devices
adb connect <device_ip>:5555
```

## 8. 关键实现细节

### 8.1 WebSocket通信
- 实时推送设备状态
- 推流数据传输
- 操作命令下发

### 8.2 元素等待机制
- 使用CDP执行JS检查元素存在
- 超时时间可配置
- 重试机制

### 8.3 输入确认机制
- 输入后再次验证
- 比较实际值和预期值
- 失败重试

### 8.4 断言操作
- 支持多种属性断言
- 灵活的断言配置
- 详细的断言结果

## 9. 扩展性设计

### 9.1 插件系统
- 插件生命周期管理
- 操作前后钩子
- 自定义操作类型

### 9.2 事件系统
- 操作事件记录
- 事件触发器
- 条件执行

## 10. 安全考虑

- 操作日志完整记录
- 敏感信息脱敏
- 权限控制
- 数据加密存储

---

*文档版本: 1.0*
*最后更新: 2026-04-18*