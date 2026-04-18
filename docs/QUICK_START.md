# 5分钟快速入门

## 第一步：安装依赖

### Linux/macOS
```bash
chmod +x install.sh
./install.sh
```

### Windows
```cmd
install.bat
```

## 第二步：启动Chrome调试

```bash
# macOS
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222

# Linux
google-chrome --remote-debugging-port=9222

# Windows
chrome.exe --remote-debugging-port=9222
```

## 第三步：启动应用

### Linux/macOS
```bash
chmod +x start.sh
./start.sh
```

### Windows
```cmd
start.bat
```

## 第四步：开始使用

1. 打开浏览器访问 `http://localhost:5173`
2. 查看"首页仪表盘"了解整体情况
3. 进入"设备管理"连接Chrome设备
4. 在"元素操作"页面进行元素查询和操作
5. 创建测试用例并录制操作
6. 执行用例生成报告

## 常见操作示例

### 示例1：连接Chrome设备并操作元素

1. 启动Chrome并开启调试模式
2. 访问任意网页（如 https://www.example.com）
3. 在应用中进入"设备管理"
4. 点击"刷新设备"，看到Chrome设备
5. 点击"连接"
6. 进入"元素操作"页面
7. 选择刚连接的设备
8. 输入选择器（如 `#title`）
9. 点击"查询元素"
10. 对元素进行点击、输入等操作

### 示例2：创建并执行测试用例

1. 进入"用例管理"页面
2. 点击"新建用例"
3. 填写名称："示例测试"
4. 进入用例详情页
5. 点击"添加步骤"
6. 选择类型："navigate"，填写URL
7. 继续添加步骤：点击、输入等
8. 点击"执行"按钮
9. 查看执行结果和报告

### 示例3：录制用户操作

1. 选择一个测试用例
2. 进入"录制"页面
3. 选择目标设备
4. 点击"开始录制"
5. 在设备上进行操作
6. 点击"停止录制"
7. 点击"保存录制"
8. 步骤自动添加到用例中

### 示例4：网络请求Mock

1. 进入"网络调试"页面
2. 启用监控
3. 在Chrome中访问网站
4. 观察请求列表
5. 点击请求查看详情
6. 点击"Mock"按钮
7. 修改响应状态和内容
8. 添加Mock规则
9. 刷新页面查看Mock效果

### 示例5：执行JavaScript

1. 进入"JavaScript执行"页面
2. 选择设备
3. 从模板中选择"获取页面标题"
4. 点击"执行"
5. 查看执行结果

## 快速命令参考

### Chrome启动命令

```bash
# 标准模式
chrome --remote-debugging-port=9222

# 无头模式（Linux服务器）
google-chrome --headless --remote-debugging-port=9222

# 指定用户目录
chrome --user-data-dir=/tmp/chrome-debug --remote-debugging-port=9222
```

### ADB命令

```bash
# 查看设备
adb devices

# WiFi连接
adb connect 192.168.1.100:5555

# 截图
adb exec-out screencap -p > screenshot.png

# 安装应用
adb install app.apk

# 卸载应用
adb uninstall com.example.app

# 查看日志
adb logcat
```

## 快捷键

- **Ctrl+C**: 停止服务
- **Ctrl+R**: 刷新页面
- **F12**: 开发者工具

## 故障排查

### 设备无法连接

1. 检查Chrome调试端口是否开启
2. 检查防火墙设置
3. 重启Chrome和ADB

### 操作失败

1. 检查元素选择器是否正确
2. 增加等待时间
3. 查看日志定位问题

### 前端无法连接后端

1. 检查后端是否运行
2. 检查端口配置
3. 查看浏览器控制台错误

## 下一步

- 阅读完整README.md
- 查看API文档：http://localhost:8000/docs
- 查看项目设计文档：docs/PROJECT_DESIGN.md
- 查看功能清单：docs/FEATURES_CHECKLIST.md

---

**开始享受H5调试的便捷吧！** 🚀