# H5 Debug Tool - 详细使用指南

## 项目概述

H5调试工具是一个功能强大的全端调试解决方案，基于TypeScript + Python3 + Vue3 + Chrome DevTools Protocol + ADB技术栈开发。主要用于H5页面的调试、测试和自动化操作。

### 技术架构

```
前端: Vue3 + TypeScript + Element Plus + Pinia
后端: Python3 + FastAPI + SQLAlchemy
通信: WebSocket + REST API
数据库: SQLite3
协议: Chrome DevTools Protocol, ADB
```

## 快速开始

### 环境要求

- Python 3.8+
- Node.js 16+
- Chrome浏览器（开启远程调试）
- Android设备（可选，开启USB调试）

### 1. 启动后端服务

```bash
cd backend

# 安装依赖
pip install -r requirements.txt

# 启动服务
python run.py
```

后端服务将运行在 `http://localhost:8000`

### 2. 启动前端服务

```bash
cd frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

前端服务将运行在 `http://localhost:5173`

### 3. 访问应用

打开浏览器访问 `http://localhost:5173`

## 功能模块详解

### 1. 设备管理

#### Chrome设备连接

1. 启动Chrome浏览器并开启远程调试模式：

```bash
# macOS
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222

# Windows
chrome.exe --remote-debugging-port=9222

# Linux
google-chrome --remote-debugging-port=9222
```

2. 在"设备管理"页面，点击"刷新设备"
3. 选择要连接的Chrome实例，点击"连接"

#### Android设备连接

1. 确保设备已开启USB调试
2. 通过USB连接设备，或使用WiFi连接：

```bash
# USB连接
adb devices
adb connect <device_ip>:5555
```

3. 在"设备管理"页面选择Android设备进行连接

### 2. 元素操作

#### 查询元素

1. 进入"元素操作"页面
2. 选择已连接的设备
3. 选择选择器类型（ID/Class/CSS/文本）
4. 输入选择器值，点击"查询元素"

#### 操作元素

- **点击**: 选中元素后点击"点击"按钮
- **输入**: 输入文本内容到元素
- **查看样式**: 获取元素的CSS样式
- **修改样式**: 修改元素的CSS属性

#### 元素搜索

支持通过以下方式搜索元素：
- 标签名
- ID
- ClassName
- 文本内容
- 混合模式（如：`#id .class`）

### 3. 测试用例管理

#### 创建用例

1. 进入"用例管理"页面
2. 点击"新建用例"
3. 填写用例名称、描述、优先级
4. 点击"创建"

#### 添加步骤

支持的操作类型：

| 类型 | 说明 | 必需参数 |
|------|------|---------|
| click | 点击元素 | 选择器 |
| input | 输入文本 | 选择器, 文本内容 |
| swipe | 滑动 | 坐标(x1,y1,x2,y2) |
| wait | 等待元素 | 选择器, 超时时间 |
| screenshot | 截图 | - |
| assert | 断言 | 选择器, 属性, 预期值 |
| navigate | 导航 | URL |
| execute_js | 执行JS | JavaScript代码 |
| adb_tap | ADB点击 | 坐标 |
| adb_swipe | ADB滑动 | 坐标 |
| adb_text | ADB输入 | 文本 |
| branch | 分支 | - |
| loop | 循环 | 循环次数 |

#### 拖拽排序

- 直接拖拽步骤卡片调整顺序
- 拖拽后自动保存

#### 执行用例

1. 点击"执行"按钮
2. 查看实时执行进度
3. 执行完成后查看报告

### 4. 操作录制

#### 开始录制

1. 选择目标测试用例
2. 点击"开始录制"
3. 在设备上进行操作

#### 录制选项

- 点击操作
- 输入操作
- 滑动操作
- 等待操作
- 截图操作

#### 保存录制

1. 点击"停止录制"
2. 点击"保存录制"
3. 步骤将自动添加到选定的测试用例

### 5. 网络调试

#### 启用监控

1. 点击开关启用网络监控
2. 所有网络请求将被记录

#### 查看请求详情

1. 点击请求行查看详细信息
2. 支持查看请求头、请求体、响应头、响应体

#### Mock配置

1. 选择要Mock的请求
2. 配置响应状态码和响应内容
3. 点击"添加Mock规则"

### 6. JavaScript执行

#### 执行JS代码

1. 选择目标设备
2. 输入JavaScript代码
3. 点击"执行"
4. 查看执行结果

#### 使用模板

1. 点击"加载模板"
2. 选择预设模板
3. 根据需要修改代码
4. 执行

#### 方法重写

1. 点击"添加"创建新的重写规则
2. 填写方法名和重写代码
3. 启用开关激活重写
4. 刷新页面后重写生效

### 7. 报告系统

#### 查看报告

1. 进入"报告"页面
2. 查看所有测试报告
3. 点击报告查看详细信息

#### 报告内容

- 执行状态（通过/失败）
- 执行时间
- 通过/失败/跳过步骤数
- 成功率
- 执行日志
- 截图（如有）
- 错误信息

#### 导出报告

支持HTML和JSON格式导出

### 8. 日志系统

#### 查看日志

1. 进入"日志"页面
2. 选择日志级别（DEBUG/INFO/WARNING/ERROR）
3. 查看实时日志

#### 日志内容

- 时间戳
- 日志级别
- 模块名称
- 日志消息
- 设备ID（可选）
- 测试用例ID（可选）

### 9. 系统设置

#### 主题设置

- 深色模式/浅色模式切换

#### 推流设置

- 启用/禁用推流
- 自动录制

#### 执行器配置

- 元素等待超时时间
- 步骤重试次数

## 配置文件说明

### config.yaml 完整配置

```yaml
# 服务配置
server:
  host: "0.0.0.0"        # 服务监听地址
  port: 8000            # 服务监听端口
  debug: false          # 调试模式
  cors_origins:         # 允许的跨域源
    - "http://localhost:5173"

# 数据库配置
database:
  path: "./data/h5debug.db"  # 数据库路径
  auto_backup: true           # 自动备份
  backup_interval: 24         # 备份间隔（小时）

# ADB配置
adb:
  devices: []                # 自动连接的设备
  screenshot_quality: 80     # 截图质量
  auto_connect: true         # 自动连接
  connection_timeout: 10      # 连接超时

# Chrome DevTools Protocol配置
cdp:
  max_reconnect_attempts: 3   # 最大重连次数
  heartbeat_interval: 30      # 心跳间隔（秒）
  connection_timeout: 10       # 连接超时
  default_debug_port: 9222     # 默认调试端口

# 日志配置
log:
  level: "INFO"               # 日志级别
  file: "./logs/app.log"      # 日志文件
  max_file_size: 10           # 单个日志文件大小（MB）
  backup_count: 5             # 保留的日志文件数

# 推流配置
stream:
  enabled: true               # 启用推流
  fps: 30                     # 帧率
  quality: 80                 # 质量
  auto_start: false           # 自动开始

# 执行器配置
executor:
  step_timeout: 30            # 步骤超时
  element_wait_timeout: 10    # 元素等待超时
  max_retries: 3              # 最大重试次数
  retry_interval: 1           # 重试间隔

# 插件配置
plugins:
  directory: "./plugins"      # 插件目录
  auto_load: true             # 自动加载

# 网络调试配置
network:
  enabled: true               # 启用网络监控
  cache_size: 1000           # 缓存大小

# JavaScript配置
javascript:
  enable_override: true       # 启用方法重写
  execution_timeout: 30        # 执行超时

# 报告配置
report:
  output_dir: "./reports"      # 报告输出目录
  include_screenshots: true   # 包含截图
  include_logs: true          # 包含日志
```

## API接口文档

### 设备管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/devices | 获取设备列表 |
| POST | /api/devices | 创建设备 |
| PUT | /api/devices/{id} | 更新设备 |
| DELETE | /api/devices/{id} | 删除设备 |
| POST | /api/devices/connect/cdp | 连接CDP设备 |
| POST | /api/devices/connect/adb | 连接ADB设备 |
| POST | /api/devices/set-active/{id} | 设置活动设备 |

### 元素操作

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/elements/query | 查询元素 |
| POST | /api/elements/all | 获取所有元素 |
| GET | /api/elements/style | 获取元素样式 |
| PATCH | /api/elements/style | 修改元素样式 |
| POST | /api/elements/click | 点击元素 |
| POST | /api/elements/input | 输入文本 |

### 测试用例

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/testcases | 获取用例列表 |
| POST | /api/testcases | 创建用例 |
| PUT | /api/testcases/{id} | 更新用例 |
| DELETE | /api/testcases/{id} | 删除用例 |
| POST | /api/testcases/{id}/execute | 执行用例 |
| POST | /api/testcases/{id}/steps | 添加步骤 |
| PUT | /api/testcases/steps/{id} | 更新步骤 |
| DELETE | /api/testcases/steps/{id} | 删除步骤 |
| POST | /api/testcases/steps/reorder | 重新排序步骤 |

### 网络调试

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/network/requests | 获取请求列表 |
| POST | /api/network/mock | 设置Mock规则 |
| DELETE | /api/network/mock/{pattern} | 删除Mock规则 |
| POST | /api/network/enable-monitoring | 启用监控 |

### JavaScript

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/javascript/execute | 执行JavaScript |
| GET | /api/javascript/templates | 获取模板 |
| POST | /api/javascript/templates | 创建模板 |
| GET | /api/javascript/overrides | 获取重写规则 |
| POST | /api/javascript/overrides | 创建重写规则 |

## 常见问题

### 1. Chrome设备无法连接

确保Chrome已正确启动并开启远程调试：
```bash
# 检查调试端口
curl http://localhost:9222/json
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

检查CORS配置是否正确，确保后端服务正常运行。

### 4. 元素操作失败

- 确认元素存在且可见
- 检查选择器是否正确
- 增加等待时间

## 开发指南

### 添加新的操作类型

1. 在 `Step` 模型中添加新的步骤类型
2. 在 `executor_service.py` 中实现执行逻辑
3. 在前端添加对应的UI组件

### 添加插件

在 `plugins` 目录创建Python文件：

```python
from app.plugins.plugin_manager import Plugin

class MyPlugin(Plugin):
    def __init__(self):
        super().__init__("my_plugin")
        
    async def on_step_execute(self, step_info):
        # 添加自定义逻辑
        pass
```

## 项目结构

```
H5debug/
├── docs/                 # 文档
├── backend/             # 后端
│   ├── app/
│   │   ├── models/     # 数据模型
│   │   ├── services/    # 业务逻辑
│   │   ├── routers/     # API路由
│   │   ├── plugins/     # 插件系统
│   │   └── utils/       # 工具函数
│   ├── config.yaml      # 配置文件
│   ├── requirements.txt # 依赖
│   └── run.py           # 启动脚本
└── frontend/            # 前端
    ├── src/
    │   ├── api/        # API调用
    │   ├── components/  # 组件
    │   ├── views/       # 页面
    │   ├── stores/      # 状态管理
    │   └── types/       # 类型定义
    └── package.json     # 依赖
```

## 更新日志

### v1.0.0 (2026-04-18)

- 初始版本发布
- 支持Chrome DevTools Protocol
- 支持ADB设备管理
- 测试用例录制和执行
- 网络请求监控和Mock
- JavaScript执行和重写
- 报告生成
- 插件系统

## 许可证

MIT License

## 联系方式

如有问题，请提交Issue或联系开发者。