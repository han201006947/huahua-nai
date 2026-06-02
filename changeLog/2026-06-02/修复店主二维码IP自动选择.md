# 修复店主二维码 IP 自动选择

## 问题

旧 `gen-admin-qr` 默认取第一个网卡 IP（常为热点 192.168.137.1 或 VMware），手机扫二维码打不开。

## 改动

- 已用 **192.168.8.93:5173**（WLAN 2）重新生成 `release/店主管理登录二维码.png`
- `generate-admin-login-qr.mjs` 优先选 WLAN/Wi-Fi，跳过 VMware/热点/169.254

## Git

- **是否已提交**：否
- **本地 commit**：—
