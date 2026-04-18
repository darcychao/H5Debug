# H5 Debug Tool - 项目结构说明

## 完整目录结构

```
H5debug/
│
├── 📂 docs/                           # 项目文档
│   ├── PROJECT_DESIGN.md             # 项目设计文档
│   └── PROJECT_STRUCTURE.md          # 项目结构说明
│
├── 📂 backend/                        # 后端服务
│   ├── 📂 app/                        # 应用主目录
│   │   ├── __init__.py
│   │   ├── main.py                   # FastAPI应用入口
│   │   ├── config.py                 # 配置管理
│   │   ├── database.py               # 数据库初始化
│   │   │
│   │   ├── 📂 models/                # 数据模型
│   │   │   ├── __init__.py
│   │   │   ├── device.py             # 设备模型
│   │   │   ├── testcase.py           # 测试用例模型
│   │   │   ├── step.py               # 操作步骤模型
│   │   │   ├── network.py            # 网络请求模型
│   │   │   ├── javascript.py         # JS模板和重写模型
│   │   │   ├── plugin.py             # 插件模型
│   │   │   ├── report.py             # 报告模型
│   │   │   └── settings.py           # 设置和日志模型
│   │   │
│   │   ├── 📂 services/              # 业务逻辑层
│   │   │   ├── __init__.py
│   │   │   ├── cdp_service.py        # Chrome DevTools Protocol服务
│   │   │   ├── adb_service.py        # ADB设备管理服务
│   │   │   ├── device_service.py     # 设备管理服务
│   │   │   ├── testcase_service.py   # 测试用例服务
│   │   │   ├── executor_service.py   # 用例执行服务
│   │   │   └── report_service.py     # 报告生成服务
│   │   │
│   │   ├── 📂 routers/               # API路由
│   │   │   ├── __init__.py
│   │   │   ├── device.py             # 设备管理路由
│   │   │   ├── element.py           # 元素操作路由
│   │   │   ├── testcase.py          # 用例管理路由
│   │   │   ├── network.py           # 网络调试路由
│   │   │   ├── javascript.py        # JavaScript路由
│   │   │   ├── report.py            # 报告路由
│   │   │   └── logs.py              # 日志路由
│   │   │
│   │   ├── 📂 plugins/               # 插件系统
│   │   │   ├── __init__.py
│   │   │   ├── plugin_manager.py     # 插件管理器
│   │   │   └── example_plugin.py     # 示例插件
│   │   │
│   │   └── 📂 utils/                 # 工具函数
│   │       ├── __init__.py
│   │       ├── logger.py            # 日志工具
│   │       └── helpers.py           # 辅助函数
│   │
│   ├── 📂 templates/                 # JS模板
│   │   └── example_templates.json   # 示例模板
│   │
│   ├── 📂 data/                      # 数据目录（运行时生成）
│   │   └── h5debug.db               # SQLite数据库
│   │
│   ├── 📂 logs/                      # 日志目录（运行时生成）
│   │   └── app.log                  # 应用日志
│   │
│   ├── 📂 reports/                    # 报告目录（运行时生成）
│   │
│   ├── config.yaml                   # YAML配置文件
│   ├── requirements.txt             # Python依赖
│   ├── .env.example                 # 环境变量示例
│   └── run.py                       # 启动脚本
│
├── 📂 frontend/                      # 前端应用
│   ├── 📂 public/                    # 公共资源
│   │   └── vite.svg                 # Logo
│   │
│   ├── 📂 src/                       # 源代码
│   │   ├── main.ts                  # Vue应用入口
│   │   ├── App.vue                  # 根组件
│   │   │
│   │   ├── 📂 api/                  # API调用层
│   │   │   ├── index.ts             # API客户端
│   │   │   ├── device.ts            # 设备API
│   │   │   ├── element.ts           # 元素API
│   │   │   ├── testcase.ts         # 用例API
│   │   │   ├── network.ts          # 网络API
│   │   │   └── javascript.ts       # JavaScript API
│   │   │
│   │   ├── 📂 components/            # 公共组件（预留）
│   │   │
│   │   ├── 📂 views/                # 页面视图
│   │   │   ├── Dashboard.vue       # 首页仪表盘
│   │   │   ├── DeviceList.vue      # 设备列表
│   │   │   ├── ElementPage.vue     # 元素操作
│   │   │   ├── TestcasePage.vue    # 用例管理
│   │   │   ├── TestcaseDetail.vue  # 用例详情
│   │   │   ├── RecordPage.vue      # 录制页面
│   │   │   ├── NetworkPage.vue     # 网络调试
│   │   │   ├── JavaScriptPage.vue # JavaScript执行
│   │   │   ├── ReportPage.vue      # 报告页面
│   │   │   ├── SettingsPage.vue    # 设置页面
│   │   │   └── LogPage.vue         # 日志页面
│   │   │
│   │   ├── 📂 stores/              # Pinia状态管理
│   │   │   ├── index.ts
│   │   │   ├── device.ts          # 设备状态
│   │   │   ├── testcase.ts        # 用例状态
│   │   │   └── settings.ts        # 设置状态
│   │   │
│   │   ├── 📂 types/              # TypeScript类型定义
│   │   │   ├── index.ts
│   │   │   ├── device.ts
│   │   │   ├── element.ts
│   │   │   ├── testcase.ts
│   │   │   └── api.ts
│   │   │
│   │   ├── 📂 router/             # Vue Router配置
│   │   │   └── index.ts
│   │   │
│   │   └── 📂 styles/             # 样式文件
│   │       ├── main.scss          # 主样式
│   │       └── variables.scss     # SCSS变量
│   │
│   ├── index.html                 # HTML模板
│   ├── package.json              # Node依赖
│   ├── vite.config.ts           # Vite配置
│   ├── tsconfig.json            # TypeScript配置
│   ├── tsconfig.node.json       # Node TypeScript配置
│   ├── .env.example             # 环境变量示例
│   └── .gitignore
│
├── 📂 data/                       # 数据目录（运行时生成）
├── 📂 logs/                       # 日志目录（运行时生成）
│
├── 📄 README.md                    # 项目说明文档
├── 📄 PROJECT_DESIGN.md           # 项目设计文档
├── 📄 .gitignore                   # Git忽略规则
├── 📄 install.sh                   # Linux/macOS安装脚本
├── 📄 install.bat                  # Windows安装脚本
├── 📄 start.sh                    # Linux/macOS启动脚本
└── 📄 start.bat                   # Windows启动脚本
```

## 模块关系图

```
┌─────────────────────────────────────────────────────────────┐
│                      前端 (Vue3)                            │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│  │Dashboard │ │DeviceList│ │Element   │ │Testcase  │      │
│  │  首页    │ │  设备    │ │ 元素操作  │ │  用例    │      │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘      │
│       │            │            │            │              │
│       └────────────┼────────────┼────────────┘              │
│                    │  Pinia Store │                        │
│                    └──────┬──────┘                          │
│                           │                                 │
│                    ┌──────▼──────┐                         │
│                    │   API Client │                         │
│                    └──────┬──────┘                         │
└───────────────────────────┼─────────────────────────────────┘
                            │ HTTP/WebSocket
┌───────────────────────────┼─────────────────────────────────┐
│                           │      后端 (Python)              │
│                    ┌──────▼──────┐                         │
│                    │  FastAPI    │                         │
│                    │  Routers   │                         │
│                    └──────┬──────┘                         │
│                           │                                 │
│       ┌───────────────────┼───────────────────┐             │
│       │                   │                   │             │
│  ┌────▼────┐        ┌─────▼─────┐       ┌────▼────┐        │
│  │ Device  │        │ Testcase  │       │Network  │        │
│  │ Router  │        │  Router   │       │ Router  │        │
│  └────┬────┘        └─────┬─────┘       └────┬────┘        │
│       │                   │                 │             │
│       └───────────────────┼─────────────────┘             │
│                           │                                 │
│                    ┌──────▼──────┐                         │
│                    │  Services   │                         │
│                    └──────┬──────┘                         │
│                           │                                 │
│   ┌───────────────────────┼───────────────────────┐       │
│   │                       │                       │       │
│ ┌─▼───┐ ┌───────┐  ┌─────▼─────┐  ┌───────┐  ┌──▼──┐    │
│ │ CDP │ │ ADB   │  │ Executor  │  │Report │  │Log  │    │
│ │Service│ │Service│  │  Service  │  │Service│  │Service│   │
│ └──┬──┘ └───┬───┘  └─────┬─────┘  └───────┘  └──┬──┘    │
│    │       │              │                     │        │
│    └───────┴───────────────┴─────────────────────┘        │
│              │                   │                         │
│       ┌──────▼───────────────────▼──────┐                  │
│       │     Chrome DevTools Protocol   │                  │
│       └──────────────┬──────────────────┘                  │
│                      │                                     │
└──────────────────────┼─────────────────────────────────────┘
                       │
        ┌──────────────┴──────────────┐
        │                             │
   ┌────▼─────┐              ┌────────▼──────┐
   │ Chrome   │              │   Android     │
   │ Browser  │              │   Device      │
   │(CDP)     │              │   (ADB)       │
   └──────────┘              └───────────────┘
```

## 数据流向

```
用户操作 → Vue组件 → Pinia Store → API Client → FastAPI Router
                                                      ↓
                                              Business Service
                                                      ↓
                                              Database / CDP / ADB
                                                      ↓
                                              Response / Event
                                                      ↓
                                              Vue组件更新 ← ← ← ←
```

## 技术栈详情

### 后端技术

- **FastAPI**: 现代高性能的Web框架
- **SQLAlchemy**: ORM工具
- **Pydantic**: 数据验证
- **WebSockets**: 实时通信
- **Chrome DevTools Protocol**: 浏览器调试协议
- **ADB**: Android调试桥

### 前端技术

- **Vue 3**: 渐进式JavaScript框架
- **TypeScript**: 类型安全的JavaScript
- **Pinia**: Vue状态管理
- **Element Plus**: UI组件库
- **Vue Router**: 路由管理
- **Vite**: 下一代前端构建工具
- **SCSS**: CSS预处理器

## 文件大小估算

- **后端代码**: ~15,000 行
- **前端代码**: ~8,000 行
- **配置文件**: ~2,000 行
- **文档**: ~5,000 行
- **总计**: ~30,000 行

## 依赖数量

- **Python包**: ~20个核心依赖
- **Node包**: ~30个核心依赖