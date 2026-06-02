# 修复启动.bat 连接被拒绝

## 改动背景

用户双击启动.bat 后浏览器 `127.0.0.1:8765` 连接被拒绝。根因：`serve-dist.ps1` 含中文，PowerShell 5.1 解析失败，服务未启动。

## 涉及文件

- `scripts/serve-dist.ps1`：改为英文，修复 HttpListener 启动；LAN 失败时回退 localhost
- `scripts/package-resources/start.bat`：等待端口就绪后再打开浏览器
- `scripts/package-resources/wifi-once.bat`：一次性管理员授权，允许手机同 WiFi 扫码
- `scripts/package-resources/usage.txt`：补充首次 WiFi 说明

## 行为变化

- 启动.bat 可正常打开扫码页
- 手机扫码需先右键「允许手机WiFi.bat」以管理员运行一次

## 验证方式

1. `npm run out`
2. 双击 `release/花花美甲坊/启动.bat`，应打开 scan.html
3. （可选）管理员运行 `允许手机WiFi.bat` 后，手机同 WiFi 可访问

## Git 提交

- **是否已提交**：否
- **本地 commit**：—
- **提交说明**：—
