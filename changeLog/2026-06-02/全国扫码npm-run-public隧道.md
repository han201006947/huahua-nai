# 全国扫码 npm run public（Cloudflare 隧道）

## 改动背景

GitHub/Netlify 在国内受限；用户要求立刻、免费、全国扫码、不限文件大小。新增 Cloudflare Quick Tunnel：本地跑站 + 公网 HTTPS 链接 + 自动生成二维码。

## 涉及文件

- `scripts/public-tunnel.ps1`：构建、本地 serve.py、cloudflared 隧道、写 deploy.config、gen-qr
- `package.json`：新增 `npm run public`

## 行为变化

- `npm run public` → 得到 trycloudflare.com 公网链接与 `release/顾客扫码二维码.png`
- 含全部视频，无上传大小限制
- 需保持脚本窗口与 Python 服务窗口开启；下次运行链接会变
- 长期固定链接仍可用 `npm run deploy`（GitHub 网络通时）

## 验证方式

```bash
npm run public
```

手机用 4G 扫二维码应能打开站点。

## Git 提交

- **是否已提交**：否
- **本地 commit**：—
- **提交说明**：—

## 验证结果

本地测试生成链接示例：`https://xxx.loca.lt/` + `release/顾客扫码二维码.png`
